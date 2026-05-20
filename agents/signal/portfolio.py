"""Portfolio-level (Tier 2) pattern detectors for Signal Agent.

Tier 2 patterns are cross-account: they only emerge when you aggregate
evidence across the full portfolio. Python does the aggregation; the model
interprets the pre-computed evidence bundle and decides if the pattern is
present and which accounts are affected.

Each detector makes a single API call (one bundle → one model response),
unlike Tier 1 which loops per account.
"""

from __future__ import annotations

import json
import re
from collections import Counter, defaultdict
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

from agents.common.data_loader import (
    REFERENCE_DATE,
    accounts,
    all_account_ids,
    call_summaries,
    cs_notes,
    executive_sponsor,
    roadmap,
    support_tickets,
    usage_trend,
    users,
)
from agents.common.env import DEFAULT_MODEL, get_client

PROMPTS_DIR = Path(__file__).parent / "prompts"

PORTFOLIO_PATTERNS: dict[str, Path] = {
    "systemic_product_signal": PROMPTS_DIR / "systemic_product_signal.md",
    "support_load_concentration": PROMPTS_DIR / "support_load_concentration.md",
    "feedback_to_roadmap_disconnect": PROMPTS_DIR / "feedback_to_roadmap_disconnect.md",
    "win_reference_opportunity": PROMPTS_DIR / "win_reference_opportunity.md",
}

_JSON_FENCE = re.compile(r"^```(?:json)?\s*|\s*```$", re.MULTILINE)


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


def _load_prompt(pattern_key: str) -> str:
    try:
        path = PORTFOLIO_PATTERNS[pattern_key]
    except KeyError:
        raise ValueError(
            f"Unknown portfolio pattern '{pattern_key}'. "
            f"Known: {sorted(PORTFOLIO_PATTERNS)}"
        )
    return path.read_text(encoding="utf-8")


def _ts(val: str) -> datetime:
    """Parse ISO timestamp, strip timezone for naive comparison."""
    return datetime.fromisoformat(val.replace("Z", "+00:00")).replace(tzinfo=None)


# ---------------------------------------------------------------------------
# Bundle builders — one per pattern
# ---------------------------------------------------------------------------


def _build_systemic_bundle() -> dict[str, Any]:
    """All recent tickets + per-feature usage summary across the portfolio."""
    cutoff = REFERENCE_DATE - timedelta(days=90)
    recent_tickets = []
    for t in support_tickets():
        try:
            if _ts(t["created_at"]) >= cutoff:
                recent_tickets.append(
                    {
                        "account_id": t["account_id"],
                        "ticket_id": t["ticket_id"],
                        "subject": t["subject"],
                        "category": t["category"],
                        "sentiment_score": t["sentiment_score"],
                        "created_at": t["created_at"][:10],
                    }
                )
        except (KeyError, ValueError):
            continue

    # Per-feature: how many accounts are declining and by how much
    feature_data: dict[str, dict[str, Any]] = {}
    for account_id in all_account_ids():
        for row in usage_trend(account_id):
            feat = row["feature"]
            if feat not in feature_data:
                feature_data[feat] = {"declining_accounts": [], "pct_changes": []}
            pct = row.get("pct_change")
            if pct is not None:
                feature_data[feat]["pct_changes"].append(pct)
                if pct < -20:
                    feature_data[feat]["declining_accounts"].append(account_id)

    feature_trends = []
    for feat, data in sorted(feature_data.items()):
        pct_changes = data["pct_changes"]
        avg = sum(pct_changes) / len(pct_changes) if pct_changes else 0.0
        feature_trends.append(
            {
                "feature": feat,
                "accounts_with_significant_decline": sorted(data["declining_accounts"]),
                "decline_count": len(data["declining_accounts"]),
                "portfolio_avg_pct_change": round(avg, 1),
            }
        )
    feature_trends.sort(key=lambda x: x["decline_count"], reverse=True)

    return {
        "reference_date": REFERENCE_DATE.date().isoformat(),
        "recent_tickets_last_90d": recent_tickets,
        "recent_ticket_count": len(recent_tickets),
        "feature_usage_portfolio_summary": feature_trends,
    }


def _build_concentration_bundle() -> dict[str, Any]:
    """Per-account support load relative to account age and user count."""
    user_count: Counter[str] = Counter(u["account_id"] for u in users())

    cutoff = REFERENCE_DATE - timedelta(days=90)
    ticket_count_90d: Counter[str] = Counter(
        t["account_id"]
        for t in support_tickets()
        if _ts(t["created_at"]) >= cutoff
    )

    summaries = []
    for a in accounts():
        aid = a["account_id"]
        age_days = (REFERENCE_DATE - datetime.fromisoformat(a["contract_start"])).days
        u_count = user_count.get(aid, 1)
        t_count = ticket_count_90d.get(aid, 0)
        # Tickets per user over the 90-day window (or shorter if newer)
        effective_days = min(age_days, 90)
        rate = round(t_count / u_count, 2) if u_count > 0 else 0.0
        summaries.append(
            {
                "account_id": aid,
                "contract_start": a["contract_start"],
                "age_days": age_days,
                "user_count": u_count,
                "tickets_last_90d": t_count,
                "tickets_per_user_last_90d": rate,
            }
        )

    summaries.sort(key=lambda x: x["age_days"])  # newest first for the model

    rates = [s["tickets_per_user_last_90d"] for s in summaries]
    portfolio_avg = round(sum(rates) / len(rates), 2) if rates else 0.0

    return {
        "reference_date": REFERENCE_DATE.date().isoformat(),
        "portfolio_avg_tickets_per_user_last_90d": portfolio_avg,
        "account_support_load": summaries,
    }


def _build_roadmap_bundle() -> dict[str, Any]:
    """Feature demand aggregated from calls and tickets vs. current roadmap."""
    cutoff = REFERENCE_DATE - timedelta(days=180)

    # Topic frequency from recent calls
    topic_counts: Counter[str] = Counter()
    for c in call_summaries():
        try:
            if _ts(c["date"]) >= cutoff:
                for topic in c.get("key_topics", []):
                    topic_counts[topic] += 1
        except (KeyError, ValueError):
            continue

    # Feature-request tickets (last 180 days)
    fr_tickets = []
    for t in support_tickets():
        try:
            if _ts(t["created_at"]) >= cutoff and t["category"] == "feature-request":
                fr_tickets.append(
                    {
                        "ticket_id": t["ticket_id"],
                        "account_id": t["account_id"],
                        "subject": t["subject"],
                    }
                )
        except (KeyError, ValueError):
            continue

    return {
        "reference_date": REFERENCE_DATE.date().isoformat(),
        "call_topic_demand_last_180d": [
            {"topic": t, "mention_count": c}
            for t, c in topic_counts.most_common(40)
        ],
        "feature_request_tickets_last_180d": fr_tickets,
        "feature_request_ticket_count": len(fr_tickets),
        "roadmap": roadmap(),
    }


def _build_reference_bundle() -> dict[str, Any]:
    """Per-account composite profile for identifying reference/win candidates."""
    cutoff = REFERENCE_DATE - timedelta(days=180)
    SENTIMENT_MAP = {"positive": 1, "neutral": 0, "negative": -1}

    calls_by_account: dict[str, list] = defaultdict(list)
    for c in call_summaries():
        calls_by_account[c["account_id"]].append(c)

    notes_by_account: dict[str, list] = defaultdict(list)
    for n in cs_notes():
        notes_by_account[n["account_id"]].append(n)

    profiles = []
    for a in accounts():
        aid = a["account_id"]

        recent_calls = [
            c for c in calls_by_account[aid]
            if _ts(c["date"]) >= cutoff
        ]
        sentiments = [SENTIMENT_MAP.get(c["sentiment"], 0) for c in recent_calls]
        avg_sentiment = round(sum(sentiments) / len(sentiments), 2) if sentiments else 0.0

        recent_notes = [
            n for n in notes_by_account[aid]
            if _ts(n["created_at"]) >= cutoff
        ]
        note_categories = dict(Counter(n["category"] for n in recent_notes))

        trend = usage_trend(aid)
        pct_changes = [r["pct_change"] for r in trend if r.get("pct_change") is not None]
        avg_usage_pct = round(sum(pct_changes) / len(pct_changes), 1) if pct_changes else 0.0

        sponsor = executive_sponsor(aid)
        sponsor_info = (
            {"name": sponsor["name"], "last_login_at": sponsor["last_login_at"]}
            if sponsor
            else None
        )

        # Pull advocacy-flavoured call topics and action items
        advocacy_signals = []
        for c in sorted(recent_calls, key=lambda x: x["date"], reverse=True)[:5]:
            for t in c.get("key_topics", []):
                if any(kw in t.lower() for kw in ["reference", "case study", "advocacy", "champion", "expansion", "strategic"]):
                    advocacy_signals.append({"call_id": c["call_id"], "topic": t})

        profiles.append(
            {
                "account_id": aid,
                "name": a["name"],
                "arr": a["arr"],
                "age_days": (REFERENCE_DATE - datetime.fromisoformat(a["contract_start"])).days,
                "avg_call_sentiment_180d": avg_sentiment,
                "call_count_180d": len(recent_calls),
                "avg_usage_trend_pct_change": avg_usage_pct,
                "cs_note_categories_180d": note_categories,
                "executive_sponsor": sponsor_info,
                "advocacy_signals": advocacy_signals,
            }
        )

    profiles.sort(key=lambda x: x["arr"], reverse=True)

    return {
        "reference_date": REFERENCE_DATE.date().isoformat(),
        "account_reference_profiles": profiles,
    }


_BUNDLE_BUILDERS = {
    "systemic_product_signal": _build_systemic_bundle,
    "support_load_concentration": _build_concentration_bundle,
    "feedback_to_roadmap_disconnect": _build_roadmap_bundle,
    "win_reference_opportunity": _build_reference_bundle,
}


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------


def detect_portfolio(
    pattern_key: str, model: str | None = None
) -> dict[str, Any]:
    """Run a portfolio-level detector for one pattern.

    Returns a dict with: pattern, detected, confidence, affected_accounts,
    evidence, reasoning, recommended_action, _usage.
    """
    bundle = _BUNDLE_BUILDERS[pattern_key]()
    user_content = (
        f"Evaluate the portfolio for {pattern_key}. "
        "Output only the JSON object specified in your instructions.\n\n"
        f"PORTFOLIO BUNDLE:\n{json.dumps(bundle, default=str)}"
    )

    client = get_client()
    response = client.messages.create(
        model=model or DEFAULT_MODEL,
        max_tokens=2000,
        system=[
            {
                "type": "text",
                "text": _load_prompt(pattern_key),
                "cache_control": {"type": "ephemeral"},
            }
        ],
        messages=[{"role": "user", "content": user_content}],
    )

    text_block = next((b for b in response.content if b.type == "text"), None)
    if text_block is None:
        raise RuntimeError(f"No text in response for portfolio/{pattern_key}")
    parsed = _extract_json(text_block.text)

    usage = response.usage
    parsed["_usage"] = {
        "input_tokens": usage.input_tokens,
        "output_tokens": usage.output_tokens,
        "cache_creation_input_tokens": getattr(usage, "cache_creation_input_tokens", 0),
        "cache_read_input_tokens": getattr(usage, "cache_read_input_tokens", 0),
        "model": response.model,
    }
    return parsed
