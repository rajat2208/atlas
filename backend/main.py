"""Atlas FastAPI backend — serves pre-computed agent outputs to the frontend.

The demo pattern is pre-compute → serve:
  1. Run run_signal.py + run_portfolio.py to produce agent_outputs/*.json
  2. Run run_synthesis.py to produce agent_outputs/briefing_*.json
  3. This server reads those files and exposes them via REST

No live agent execution happens at request time — responses are fast.

Run:
    cd backend && uvicorn main:app --reload --port 8000
"""

from __future__ import annotations

import json
import sys
from collections import defaultdict
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Make agents/ importable from backend/main.py
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from agents.common.data_loader import accounts, get_account  # noqa: E402

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

ROOT = Path(__file__).resolve().parents[1]
AGENT_OUTPUTS = ROOT / "agent_outputs"

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(title="Atlas", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Output file helpers
# ---------------------------------------------------------------------------


def _latest_file(pattern: str) -> Path | None:
    """Return the most recently modified file matching a glob pattern."""
    files = sorted(AGENT_OUTPUTS.glob(pattern), key=lambda f: f.stat().st_mtime)
    return files[-1] if files else None


def _load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def _all_signal_detections() -> list[dict]:
    """Load and merge all per-account and portfolio detection records."""
    records: list[dict] = []
    for f in AGENT_OUTPUTS.glob("signal_*.json"):
        data = _load_json(f)
        if isinstance(data, list):
            records.extend(data)
    for f in AGENT_OUTPUTS.glob("portfolio_*.json"):
        data = _load_json(f)
        if isinstance(data, list):
            records.extend(data)
    return records


# ---------------------------------------------------------------------------
# Route: health
# ---------------------------------------------------------------------------


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "version": "0.1.0"}


# ---------------------------------------------------------------------------
# Route: briefing
# ---------------------------------------------------------------------------


@app.get("/briefing")
def get_briefing() -> dict:
    """Return the latest synthesized Briefing.

    Falls back to the fixture file if no real briefing has been generated yet.
    """
    # Prefer a real synthesized briefing; fall back to fixture
    latest = _latest_file("briefing_[0-9]*.json")
    if latest is None:
        latest = AGENT_OUTPUTS / "briefing_fixture.json"
    if not latest.exists():
        raise HTTPException(
            status_code=404,
            detail=(
                "No briefing found. Run scripts/run_synthesis.py first, "
                "or ensure agent_outputs/briefing_fixture.json exists."
            ),
        )
    return _load_json(latest)


# ---------------------------------------------------------------------------
# Route: portfolio
# ---------------------------------------------------------------------------

# Pattern → urgency/status bucket for the portfolio pulse tags
_RISK_PATTERNS = {"hidden_churn_risk", "executive_friction", "cross_functional_blind_spot"}
_OPPORTUNITY_PATTERNS = {"expansion_ready", "win_reference_opportunity"}


@app.get("/portfolio")
def get_portfolio() -> dict:
    """Return all accounts with detected pattern tags.

    Falls back to the committed portfolio_fixture.json when no signal outputs
    are present (e.g. on Railway / Vercel without a local agent run).
    """
    all_accounts = accounts()
    detections = _all_signal_detections()

    # No signal data available — serve the pre-built fixture
    if not detections:
        fixture = AGENT_OUTPUTS / "portfolio_fixture.json"
        if fixture.exists():
            return _load_json(fixture)
        raise HTTPException(
            status_code=404,
            detail="No signal data found. Run run_signal.py + run_portfolio.py first.",
        )

    # Build per-account pattern map from detections
    flagged: dict[str, list[str]] = defaultdict(list)
    portfolio_patterns: list[str] = []

    for d in detections:
        if not d.get("detected"):
            continue
        pattern = d.get("pattern", "")
        account_id = d.get("account_id")
        if account_id:
            flagged[account_id].append(pattern)
        else:
            # Portfolio-level pattern — attach to affected accounts
            for aid in d.get("affected_accounts", []):
                flagged[aid].append(pattern)
            portfolio_patterns.append(pattern)

    result = []
    for a in all_accounts:
        aid = a["account_id"]
        patterns = flagged.get(aid, [])

        if any(p in _RISK_PATTERNS for p in patterns):
            status = "at_risk"
        elif any(p in _OPPORTUNITY_PATTERNS for p in patterns):
            status = "opportunity"
        else:
            status = "healthy"

        result.append(
            {
                "account_id": aid,
                "name": a["name"],
                "arr": a["arr"],
                "health_score": a["health_score"],
                "contract_end": a["contract_end"],
                "assigned_csm": a["assigned_csm"],
                "patterns": patterns,
                "status": status,
            }
        )

    counts = {"at_risk": 0, "opportunity": 0, "healthy": 0}
    for r in result:
        counts[r["status"]] += 1

    return {
        "accounts": result,
        "summary": {
            "total": len(result),
            **counts,
            "portfolio_patterns": portfolio_patterns,
        },
    }


# ---------------------------------------------------------------------------
# Route: single account
# ---------------------------------------------------------------------------


@app.get("/accounts/{account_id}")
def get_account_detail(account_id: str) -> dict:
    """Return account details plus all Signal detections for that account."""
    try:
        acct = get_account(account_id)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Account {account_id!r} not found")

    detections = _all_signal_detections()
    account_detections = [
        {k: v for k, v in d.items() if k != "_usage"}
        for d in detections
        if d.get("account_id") == account_id
    ]

    # No signal data — still return account metadata with empty detections
    # so the account detail page renders on Railway/Vercel without local files.
    return {
        "account": {k: v for k, v in acct.items() if k != "tags"},
        "detections": account_detections,
    }


# ---------------------------------------------------------------------------
# Route: eval scores (optional — only available if eval has been run)
# ---------------------------------------------------------------------------


@app.get("/eval")
def get_eval_scores() -> dict:
    """Return the latest eval scores if available."""
    latest = _latest_file("eval_*.json")
    if latest is None:
        return {"status": "not_run", "message": "Run eval/run_eval.py to generate scores."}
    return _load_json(latest)
