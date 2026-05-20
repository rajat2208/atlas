"""Run the Signal Agent's per-account detectors against one or more accounts.

Safety: this script MAKES API CALLS that consume Anthropic credits.
You must explicitly name accounts or pass --all. There is no implicit default.
You must specify which pattern to detect via --pattern.

Examples:
    uv run python scripts/run_signal.py --list
    uv run python scripts/run_signal.py --pattern hidden_churn_risk acc_001 acc_005
    uv run python scripts/run_signal.py --pattern expansion_ready --all
    uv run python scripts/run_signal.py --pattern executive_friction --all
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

# Project is configured as a uv workspace (pyproject `package = false`), so the
# `agents/` directory isn't auto-installed into the venv. Prepend the repo root
# to sys.path so scripts/ can import top-level packages.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from agents.common.data_loader import all_account_ids  # noqa: E402
from agents.common.env import DEFAULT_MODEL  # noqa: E402
from agents.signal.detector import PER_ACCOUNT_PATTERNS, detect  # noqa: E402

OUT_DIR = Path(__file__).resolve().parents[1] / "agent_outputs"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "accounts", nargs="*", help="account_ids to score (e.g. acc_001 acc_002)"
    )
    parser.add_argument(
        "--pattern",
        choices=sorted(PER_ACCOUNT_PATTERNS),
        required=False,
        help="which pattern to detect (required unless --list)",
    )
    parser.add_argument(
        "--all", action="store_true", help="score every account (25 API calls)"
    )
    parser.add_argument(
        "--list", action="store_true", help="list account_ids and exit (no API calls)"
    )
    parser.add_argument(
        "--out", type=str, default=None, help="output filename (default: timestamped)"
    )
    parser.add_argument(
        "--model",
        type=str,
        default=None,
        help="override model (e.g. claude-sonnet-4-6). Default: ATLAS_DEFAULT_MODEL from .env",
    )
    args = parser.parse_args()

    if args.list:
        for a in all_account_ids():
            print(a)
        return 0

    if not args.pattern:
        parser.print_help()
        print(
            "\nError: --pattern is required. "
            f"Choose one of: {sorted(PER_ACCOUNT_PATTERNS)}"
        )
        return 2

    if args.all:
        targets = all_account_ids()
    elif args.accounts:
        targets = args.accounts
    else:
        parser.print_help()
        print("\nError: must pass account_ids or --all (this avoids accidental full runs).")
        return 2

    OUT_DIR.mkdir(exist_ok=True)
    out_name = args.out or f"signal_{args.pattern}_{int(time.time())}.json"
    out_path = OUT_DIR / out_name

    model = args.model or DEFAULT_MODEL
    print(f"Running [{args.pattern}] detector on {len(targets)} account(s) with {model}")
    print(f"Output -> {out_path}")
    print()

    results = []
    total_in = total_out = total_cache_read = total_cache_write = 0
    for i, account_id in enumerate(targets, 1):
        print(f"[{i}/{len(targets)}] {account_id} ... ", end="", flush=True)
        try:
            r = detect(args.pattern, account_id, model=model)
        except Exception as e:
            print(f"ERROR: {e}")
            results.append({"account_id": account_id, "error": str(e)})
            continue
        u = r.get("_usage", {})
        total_in += u.get("input_tokens", 0)
        total_out += u.get("output_tokens", 0)
        total_cache_read += u.get("cache_read_input_tokens", 0)
        total_cache_write += u.get("cache_creation_input_tokens", 0)
        verdict = "FLAG" if r.get("detected") else "ok"
        print(f"{verdict} (conf {r.get('confidence', 0):.2f})")
        results.append(r)

    out_path.write_text(json.dumps(results, indent=2), encoding="utf-8")
    print()
    print(f"Wrote {len(results)} result(s) to {out_path}")
    print(
        f"Tokens: input={total_in} output={total_out} "
        f"cache_read={total_cache_read} cache_write={total_cache_write}"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
