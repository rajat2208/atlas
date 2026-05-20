"""Run the Signal Agent's portfolio-level (Tier 2) detectors.

Each pattern makes ONE API call against the aggregated portfolio — no
per-account loop. Results are written as a JSON array (one item per pattern
run) compatible with the eval harness.

Safety: this script MAKES API CALLS that consume Anthropic credits.

Examples:
    uv run python scripts/run_portfolio.py --list
    uv run python scripts/run_portfolio.py --pattern systemic_product_signal
    uv run python scripts/run_portfolio.py --all
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from agents.common.env import DEFAULT_MODEL  # noqa: E402
from agents.signal.portfolio import PORTFOLIO_PATTERNS, detect_portfolio  # noqa: E402

OUT_DIR = Path(__file__).resolve().parents[1] / "agent_outputs"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--pattern",
        choices=sorted(PORTFOLIO_PATTERNS),
        default=None,
        help="which portfolio pattern to detect",
    )
    parser.add_argument(
        "--all", action="store_true", help="run all 4 portfolio patterns (4 API calls)"
    )
    parser.add_argument(
        "--list", action="store_true", help="list available patterns and exit"
    )
    parser.add_argument(
        "--out", type=str, default=None, help="output filename (default: timestamped)"
    )
    parser.add_argument(
        "--model",
        type=str,
        default=None,
        help="override model. Default: ATLAS_DEFAULT_MODEL from .env",
    )
    args = parser.parse_args()

    if args.list:
        for p in sorted(PORTFOLIO_PATTERNS):
            print(p)
        return 0

    if args.all:
        targets = sorted(PORTFOLIO_PATTERNS)
    elif args.pattern:
        targets = [args.pattern]
    else:
        parser.print_help()
        print("\nError: pass --pattern <key> or --all.")
        return 2

    OUT_DIR.mkdir(exist_ok=True)
    label = "all" if args.all else targets[0]
    out_name = args.out or f"portfolio_{label}_{int(time.time())}.json"
    out_path = OUT_DIR / out_name

    model = args.model or DEFAULT_MODEL
    print(f"Running {len(targets)} portfolio pattern(s) with {model}")
    print(f"Output -> {out_path}")
    print()

    results = []
    total_in = total_out = total_cache_read = total_cache_write = 0
    for i, pattern_key in enumerate(targets, 1):
        print(f"[{i}/{len(targets)}] {pattern_key} ... ", end="", flush=True)
        try:
            r = detect_portfolio(pattern_key, model=model)
        except Exception as e:
            print(f"ERROR: {e}")
            results.append({"pattern": pattern_key, "error": str(e)})
            continue
        u = r.get("_usage", {})
        total_in += u.get("input_tokens", 0)
        total_out += u.get("output_tokens", 0)
        total_cache_read += u.get("cache_read_input_tokens", 0)
        total_cache_write += u.get("cache_creation_input_tokens", 0)
        verdict = "FLAG" if r.get("detected") else "ok"
        n_accounts = len(r.get("affected_accounts", []))
        print(f"{verdict} (conf {r.get('confidence', 0):.2f}, {n_accounts} accounts)")
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
