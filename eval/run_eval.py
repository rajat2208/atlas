"""CLI entry point for scoring Signal Agent output.

Usage:
    uv run python eval/run_eval.py agent_outputs/smoke_test.json
    uv run python eval/run_eval.py agent_outputs/*.json   # merges multiple files
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

# uv workspace mode — make sibling packages importable from this script.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from eval.score_signal import score_hidden_churn  # noqa: E402


def _merge(files: list[Path]) -> list[dict]:
    """Concat agent output records across files, dedupe by account_id
    preferring records with `detected` over error-only records.
    """
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


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "files", nargs="+", type=Path, help="one or more agent output JSON files"
    )
    args = parser.parse_args()

    for f in args.files:
        if not f.exists():
            print(f"ERROR: {f} does not exist", file=sys.stderr)
            return 2

    merged = _merge(args.files)
    report = score_hidden_churn(merged)

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
