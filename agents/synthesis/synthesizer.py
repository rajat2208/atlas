"""Synthesis Agent — turns Signal Agent detections into Briefing insight cards.

Takes the full set of Signal Agent detections (Tier 1 per-account and Tier 2
portfolio), enriches them with account metadata, and calls the model once to
produce a ranked Briefing of 3-5 insight cards written in Atlas's voice.

This is the Opus-class reasoning layer. The model's job is not detection
(Signal Agent did that) but narrative synthesis: selecting what matters most,
ranking by urgency, and writing the insight in plain executive language.
"""

from __future__ import annotations

import json
import re
from collections import Counter
from pathlib import Path
from typing import Any

from agents.common.data_loader import accounts
from agents.common.env import DEFAULT_MODEL, get_client

_PROMPT_PATH = Path(__file__).parent / "prompts" / "synthesize_briefing.md"

_JSON_FENCE = re.compile(r"^```(?:json)?\s*|\s*```$", re.MULTILINE)

# Minimum confidence for a Tier 1/3 (per-account) detection to be surfaced.
# Signal Agent over-flags: TPs consistently score ≥0.75 while most FPs score
# below this threshold. Tier 2 portfolio patterns are excluded — they have no
# per-account confidence score.
_CONFIDENCE_THRESHOLD = 0.75

# Tier assignment by pattern key
_PATTERN_TIERS: dict[str, int] = {
    "hidden_churn_risk": 1,
    "expansion_ready": 1,
    "executive_friction": 1,
    "cross_functional_blind_spot": 3,
    "systemic_product_signal": 2,
    "support_load_concentration": 2,
    "feedback_to_roadmap_disconnect": 2,
    "win_reference_opportunity": 2,
}


def _extract_json(text: str) -> dict[str, Any]:
    stripped = _JSON_FENCE.sub("", text).strip()
    try:
        return json.loads(stripped)
    except json.JSONDecodeError:
        start = stripped.find("{")
        end = stripped.rfind("}")
        if start >= 0 and end > start:
            return json.loads(stripped[start : end + 1])
        raise


def _account_lookup() -> dict[str, dict[str, Any]]:
    """Return account metadata keyed by account_id."""
    return {a["account_id"]: a for a in accounts()}


def _enrich(detections: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Add account names, ARR, contract_end to per-account detections.

    Portfolio detections (no account_id) get affected_account_names resolved.
    Filters to detected=True records only.
    """
    lookup = _account_lookup()
    enriched = []

    for d in detections:
        if not d.get("detected"):
            continue

        pattern = d.get("pattern", "")
        tier = _PATTERN_TIERS.get(pattern, 1)

        # Gate: skip low-confidence per-account detections before synthesis.
        if tier in (1, 3) and d.get("confidence", 0) < _CONFIDENCE_THRESHOLD:
            continue
        d = dict(d)  # shallow copy — don't mutate caller's data
        d["tier"] = tier

        if tier in (1, 3):
            # Per-account: enrich with account metadata
            account_id = d.get("account_id")
            acct = lookup.get(account_id, {})
            d["account_name"] = acct.get("name", account_id)
            d["arr"] = acct.get("arr", 0)
            d["contract_end"] = acct.get("contract_end", "")
            d["assigned_csm"] = acct.get("assigned_csm", "")
        else:
            # Portfolio: resolve affected_account names
            affected = d.get("affected_accounts", [])
            d["affected_account_details"] = [
                {
                    "id": aid,
                    "name": lookup.get(aid, {}).get("name", aid),
                    "arr": lookup.get(aid, {}).get("arr", 0),
                }
                for aid in affected
            ]
            d["total_arr_affected"] = sum(
                lookup.get(aid, {}).get("arr", 0) for aid in affected
            )

        enriched.append(d)

    return enriched


def _portfolio_pulse(all_detections: list[dict[str, Any]]) -> dict[str, Any]:
    """Count detected patterns for the portfolio pulse widget.

    Counts per-account Tier 1/3 patterns; also notes which Tier 2 patterns fired.
    """
    lookup = _account_lookup()
    total_accounts = len(lookup)

    flagged_per_account: dict[str, set[str]] = {}
    tier2_detected: list[str] = []

    for d in all_detections:
        pattern = d.get("pattern", "")
        tier = _PATTERN_TIERS.get(pattern, 1)

        if not d.get("detected"):
            continue

        # Mirror the same confidence gate used in _enrich so pulse counts
        # match the cards shown in the briefing.
        if tier in (1, 3) and d.get("confidence", 0) < _CONFIDENCE_THRESHOLD:
            continue

        if tier in (1, 3):
            aid = d.get("account_id")
            if aid:
                flagged_per_account.setdefault(aid, set()).add(pattern)
        else:
            tier2_detected.append(pattern)

    pattern_counts = Counter(
        p for patterns in flagged_per_account.values() for p in patterns
    )
    flagged_count = len(flagged_per_account)

    return {
        "total_accounts": total_accounts,
        "accounts_with_patterns": flagged_count,
        "healthy_accounts": total_accounts - flagged_count,
        "per_pattern_counts": dict(pattern_counts),
        "portfolio_patterns_detected": tier2_detected,
    }


def synthesize(
    all_detections: list[dict[str, Any]],
    model: str | None = None,
) -> dict[str, Any]:
    """Synthesize Signal Agent detections into a Briefing.

    Args:
        all_detections: All Signal Agent output records — both per-account
            (from run_signal.py) and portfolio (from run_portfolio.py).
            Records with detected=False are filtered out before synthesis.
        model: Override the model. Defaults to ATLAS_DEFAULT_MODEL.
            Use Opus for production quality; Sonnet for testing.

    Returns:
        A dict with `briefing_date`, `card_count`, `cards`, `portfolio_pulse`,
        and `_usage`.
    """
    enriched = _enrich(all_detections)
    pulse = _portfolio_pulse(all_detections)

    if not enriched:
        return {
            "briefing_date": None,
            "card_count": 0,
            "cards": [],
            "portfolio_pulse": pulse,
            "_usage": {},
        }

    # Build the user-turn bundle. Strip _usage from each detection (internal).
    clean_detections = [
        {k: v for k, v in d.items() if k != "_usage"} for d in enriched
    ]

    reference_date = next(
        (d.get("reference_date") for d in all_detections if d.get("reference_date")),
        "unknown",
    )

    user_content = (
        "Produce the Atlas Briefing for today. "
        "Select the 3-5 most important detections, rank them, and write the insight cards. "
        "Output only the JSON object specified in your instructions.\n\n"
        f"SIGNAL DETECTIONS ({len(clean_detections)} detected patterns):\n"
        f"{json.dumps(clean_detections, default=str)}"
    )

    prompt = _PROMPT_PATH.read_text(encoding="utf-8")
    client = get_client()
    response = client.messages.create(
        model=model or DEFAULT_MODEL,
        max_tokens=4000,
        system=[
            {
                "type": "text",
                "text": prompt,
                "cache_control": {"type": "ephemeral"},
            }
        ],
        messages=[{"role": "user", "content": user_content}],
    )

    text_block = next((b for b in response.content if b.type == "text"), None)
    if text_block is None:
        raise RuntimeError("No text in Synthesis Agent response")

    briefing = _extract_json(text_block.text)
    briefing["portfolio_pulse"] = pulse

    usage = response.usage
    briefing["_usage"] = {
        "input_tokens": usage.input_tokens,
        "output_tokens": usage.output_tokens,
        "cache_creation_input_tokens": getattr(usage, "cache_creation_input_tokens", 0),
        "cache_read_input_tokens": getattr(usage, "cache_read_input_tokens", 0),
        "model": response.model,
    }

    return briefing
