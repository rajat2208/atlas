"""The ONLY module in the repository permitted to read `data/ground_truth.json`.

If you find yourself wanting to read that file anywhere under `agents/` or
`backend/`, stop — that breaks the evaluation-integrity boundary. See
`docs/atlas-prd.md` §7 and the repo `CLAUDE.md`.
"""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

GROUND_TRUTH_PATH = (
    Path(__file__).resolve().parents[1] / "data" / "ground_truth.json"
)


@lru_cache(maxsize=1)
def load_ground_truth() -> dict[str, Any]:
    if not GROUND_TRUTH_PATH.exists():
        raise FileNotFoundError(
            f"ground_truth.json missing at {GROUND_TRUTH_PATH}. "
            "Regenerate via the isolated data-generation session if needed."
        )
    return json.loads(GROUND_TRUTH_PATH.read_text(encoding="utf-8"))


def account_level_pattern_accounts(pattern_key: str) -> set[str]:
    """Return the set of account_ids ground-truthed for a Tier 1 pattern."""
    gt = load_ground_truth()
    for entry in gt.get("account_level_patterns", []):
        if entry.get("pattern") == pattern_key:
            return set(entry.get("account_ids", []))
    return set()


def organizational_pattern_accounts(pattern_key: str) -> set[str]:
    """Return account_ids for a Tier 3 (organizational) pattern."""
    gt = load_ground_truth()
    for entry in gt.get("organizational_patterns", []):
        if entry.get("pattern") == pattern_key:
            return set(entry.get("account_ids", []))
    return set()


def portfolio_pattern(pattern_key: str) -> dict[str, Any] | None:
    """Return the full Tier 2 (portfolio-level) ground truth entry, or None."""
    gt = load_ground_truth()
    for entry in gt.get("portfolio_level_patterns", []):
        if entry.get("pattern") == pattern_key:
            return entry
    return None
