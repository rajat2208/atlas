"""Hidden Churn Risk detector — Signal Agent v0.

Sends one prompt per account. The static system prompt is cached so subsequent
per-account calls inside a 5-min window pay ~10% of fresh-input cost on it.
"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

from agents.common.data_loader import build_account_bundle
from agents.common.env import DEFAULT_MODEL, get_client

PROMPT_PATH = Path(__file__).parent / "prompts" / "hidden_churn.md"

_JSON_FENCE = re.compile(r"^```(?:json)?\s*|\s*```$", re.MULTILINE)


def _load_prompt() -> str:
    return PROMPT_PATH.read_text(encoding="utf-8")


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


def detect(account_id: str, model: str | None = None) -> dict[str, Any]:
    """Run the Hidden Churn detector against one account.

    Returns a dict with keys: account_id, pattern, detected, confidence,
    evidence, reasoning, _usage (token + cache hit info).
    """
    bundle = build_account_bundle(account_id)
    user_content = (
        "Evaluate this account for Hidden Churn Risk. "
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
                "text": _load_prompt(),
                "cache_control": {"type": "ephemeral"},
            }
        ],
        messages=[{"role": "user", "content": user_content}],
    )

    text_block = next((b for b in response.content if b.type == "text"), None)
    if text_block is None:
        raise RuntimeError(f"No text in response for {account_id}")
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
