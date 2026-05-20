"""Generic per-account pattern detector for Signal Agent.

All Tier 1 (account-level) patterns plus Tier 3 (Cross-Functional Blind Spot)
share the same shape: run one prompt per account with that account's evidence
bundle, get back structured JSON with detection + confidence + provenance.
This module is the single implementation.

Tier 2 (portfolio-level) patterns use a different shape — cross-account
aggregation — and live in `agents/signal/portfolio.py` (TBD).
"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

from agents.common.data_loader import build_account_bundle
from agents.common.env import DEFAULT_MODEL, get_client

PROMPTS_DIR = Path(__file__).parent / "prompts"

# Canonical pattern keys (mirror the keys in data/ground_truth.json).
# Order here is the order patterns are introduced in the PRD.
PER_ACCOUNT_PATTERNS: dict[str, Path] = {
    "hidden_churn_risk": PROMPTS_DIR / "hidden_churn.md",
    "expansion_ready": PROMPTS_DIR / "expansion_ready.md",
    "executive_friction": PROMPTS_DIR / "executive_friction.md",
    "cross_functional_blind_spot": PROMPTS_DIR / "cross_functional_blind_spot.md",
}

_JSON_FENCE = re.compile(r"^```(?:json)?\s*|\s*```$", re.MULTILINE)


def _load_prompt(pattern_key: str) -> str:
    try:
        path = PER_ACCOUNT_PATTERNS[pattern_key]
    except KeyError:
        raise ValueError(
            f"Unknown per-account pattern '{pattern_key}'. "
            f"Known: {sorted(PER_ACCOUNT_PATTERNS)}"
        )
    return path.read_text(encoding="utf-8")


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


def detect(
    pattern_key: str, account_id: str, model: str | None = None
) -> dict[str, Any]:
    """Run a per-account detector for one pattern against one account.

    Returns a dict with the schema specified in the prompt: account_id,
    pattern, detected, confidence, evidence, reasoning. Adds `_usage` for
    token + cache hit tracking.
    """
    bundle = build_account_bundle(account_id)
    user_content = (
        f"Evaluate this account for {pattern_key}. "
        "Output only the JSON object specified in your instructions.\n\n"
        f"ACCOUNT BUNDLE:\n{json.dumps(bundle, default=str)}"
    )

    client = get_client()
    response = client.messages.create(
        model=model or DEFAULT_MODEL,
        max_tokens=1500,
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
        raise RuntimeError(f"No text in response for {account_id}/{pattern_key}")
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
