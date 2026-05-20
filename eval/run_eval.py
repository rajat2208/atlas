"""CLI entry point for scoring Signal Agent output.

Supports both Tier 1 per-account patterns and Tier 2 portfolio patterns.

Usage:
    # Tier 1 (per-account):
    uv run python eval/run_eval.py --pattern hidden_churn_risk agent_outputs/signal_*.json
    uv run python eval/run_eval.py --pattern expansion_ready agent_outputs/*.json

    # Tier 2 (portfolio):
    uv run python eval/run_eval.py --pattern systemic_product_signal agent_outputs/portfolio_*.json
    uv run python eval/run_eval.py --pattern win_reference_opportunity agent_outputs/portfolio_all_*.json
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from eval.score_signal import score_pattern, score_portfolio_pattern  # noqa: E402

_TIER1_PATTERNS = [
    "hidden_churn_risk",
    "expansion_ready",
    "executive_friction",
    "cross_functional_blind_spot",
]

_TIER2_PATTERNS = [
    "systemic_product_signal",
    "support_load_concentration",
    "feedback_to_roadmap_disconnect",
    "win_reference_opportunity",
]

_ALL_PATTERNS = _TIER1_PATTERNS + _TIER2_PATTERNS


def _merge_tier1(files: list[Path]) -> list[dict]:
    """Concat per-account records, dedupe by account_id preferring detected records."""
    combined: dict[str, dict] = {}
    for f in files:
        for r in json.loads(f.read_text(encoding="utf-8")):
            aid = r.get("account_id")
            if not aid:
                continue
            existing = combined.get(aid)
            if existing is None:
                combined[aid] = r
            elif "detected" in r and "detected" not in existing:
                combined[aid] = r
    return list(combined.values())


def _merge_tier2(files: list[Path]) -> list[dict]:
    """Concat portfolio detection records, dedupe by pattern key."""
    combined: dict[str, dict] = {}
    for f in files:
        for r in json.loads(f.read_text(encoding="utf-8")):
            key = r.get("pattern")
            if not key:
                continue
            existing = combined.get(key)
            if existing is None:
                combined[key] = r
            elif "detected" in r and "detected" not in existing:
                combined[key] = r
    return list(combined.values())


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--pattern",
        choices=_ALL_PATTERNS,
        required=True,
        help="which pattern to score against ground truth",
    )
    parser.add_argument(
        "files", nargs="+", type=Path, help="one or more agent output JSON files"
    )
    args = parser.parse_args()

    for f in args.files:
        if not f.exists():
            print(f"ERROR: {f} does not exist", file=sys.stderr)
            return 2

    if args.pattern in _TIER2_PATTERNS:
        records = _merge_tier2(args.files)
        report = score_portfolio_pattern(args.pattern, records)
        print(json.dumps(report, indent=2))
        detected = report.get("agent_detected")
        correct = report.get("detection_correct")
        f1 = report.get("member_set_f1")
        n = len(report.get("agent_accounts", []))
        print(
            f"\nSummary: detected={detected} correct={correct} "
            f"member_set_f1={f1} ({n} accounts flagged)"
        )
    else:
        records = _merge_tier1(args.files)
        report = score_pattern(args.pattern, records)
        print(json.dumps(report, indent=2))
        p = report["precision"]
        r = report["recall"]
        f1 = report["f1"]
        n = report["evaluated_account_count"]
        print(
            f"\nSummary: {n} accounts evaluated. "
            f"precision={p} recall={r} f1={f1}"
        )

    return 0


if __name__ == "__main__":
    sys.exit(main())
