"""Run the Synthesis Agent to produce a Briefing from Signal Agent output.

Takes one or more Signal Agent output files (from run_signal.py and/or
run_portfolio.py) and synthesizes them into ranked insight cards.

Safety: this script MAKES ONE API CALL per run.
Recommended model: claude-opus-4-7 (or latest Opus) for production quality.
Default: ATLAS_DEFAULT_MODEL from .env (Haiku — useful for testing schema only).

Examples:
    # With real signal outputs:
    uv run python scripts/run_synthesis.py agent_outputs/signal_*.json agent_outputs/portfolio_*.json

    # Specify Opus explicitly:
    uv run python scripts/run_synthesis.py --model claude-opus-4-7 agent_outputs/*.json

    # Test with fixtures (no prior signal run needed):
    uv run python scripts/run_synthesis.py --fixtures
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from agents.common.env import DEFAULT_MODEL  # noqa: E402
from agents.synthesis.synthesizer import synthesize  # noqa: E402

OUT_DIR = Path(__file__).resolve().parents[1] / "agent_outputs"
FIXTURES_DIR = Path(__file__).resolve().parents[1] / "tests" / "fixtures"


def _load_files(files: list[Path]) -> list[dict]:
    """Load and merge all detection records from multiple output files."""
    records = []
    for f in files:
        data = json.loads(f.read_text(encoding="utf-8"))
        if isinstance(data, list):
            records.extend(data)
        elif isinstance(data, dict):
            records.append(data)
    return records


def _load_fixtures() -> list[dict]:
    """Load synthetic detection fixtures for testing without a prior signal run."""
    fixture_path = FIXTURES_DIR / "sample_detections.json"
    if not fixture_path.exists():
        print(
            f"ERROR: fixture file not found at {fixture_path}. "
            "Run run_signal.py + run_portfolio.py first, or create the fixture.",
            file=sys.stderr,
        )
        return []
    return json.loads(fixture_path.read_text(encoding="utf-8"))


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "files",
        nargs="*",
        type=Path,
        help="Signal/portfolio output JSON files to synthesize",
    )
    parser.add_argument(
        "--fixtures",
        action="store_true",
        help="use bundled test fixtures instead of real signal files",
    )
    parser.add_argument(
        "--out",
        type=str,
        default=None,
        help="output filename (default: timestamped)",
    )
    parser.add_argument(
        "--model",
        type=str,
        default=None,
        help=(
            "model to use. Recommend claude-opus-4-7 for production quality. "
            "Default: ATLAS_DEFAULT_MODEL from .env"
        ),
    )
    args = parser.parse_args()

    if args.fixtures:
        detections = _load_fixtures()
        if not detections:
            return 2
    elif args.files:
        for f in args.files:
            if not f.exists():
                print(f"ERROR: {f} does not exist", file=sys.stderr)
                return 2
        detections = _load_files(list(args.files))
    else:
        parser.print_help()
        print("\nError: pass input files or --fixtures.")
        return 2

    total = len(detections)
    flagged = sum(1 for d in detections if d.get("detected"))
    print(f"Loaded {total} detection record(s), {flagged} flagged as detected.")

    model = args.model or DEFAULT_MODEL
    print(f"Running Synthesis Agent with {model}")
    print()

    briefing = synthesize(detections, model=model)

    OUT_DIR.mkdir(exist_ok=True)
    out_name = args.out or f"briefing_{int(time.time())}.json"
    out_path = OUT_DIR / out_name
    out_path.write_text(json.dumps(briefing, indent=2), encoding="utf-8")

    cards = briefing.get("cards", [])
    pulse = briefing.get("portfolio_pulse", {})
    u = briefing.get("_usage", {})

    print(f"Briefing: {len(cards)} card(s) generated")
    print()
    for card in cards:
        urgency_marker = {"high": "!", "medium": "~", "low": " "}.get(
            card.get("urgency", ""), "?"
        )
        print(
            f"  [{urgency_marker}] #{card['rank']} {card['title']} "
            f"(conf {card.get('confidence', 0):.2f}, {card.get('urgency', '?')})"
        )

    print()
    print(f"Portfolio pulse: {pulse}")
    print()
    print(f"Wrote briefing to {out_path}")
    print(
        f"Tokens: input={u.get('input_tokens', 0)} output={u.get('output_tokens', 0)} "
        f"cache_read={u.get('cache_read_input_tokens', 0)} "
        f"cache_write={u.get('cache_creation_input_tokens', 0)}"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
