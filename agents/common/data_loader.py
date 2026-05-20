"""Load Atlas's synthetic data and slice it per account.

Agent code uses this module to assemble per-account evidence bundles.
Never reads `data/ground_truth.json` — that file is the eval answer key
and is off-limits to anything under `agents/` and `backend/`.
"""

from __future__ import annotations

import json
from collections import defaultdict
from datetime import datetime, timedelta
from functools import lru_cache
from pathlib import Path
from typing import Any

DATA_DIR = Path(__file__).resolve().parents[2] / "data"
REFERENCE_DATE = datetime(2026, 5, 19)  # per data/README.md

_FORBIDDEN = {"ground_truth.json"}


def _load(name: str) -> list[dict[str, Any]]:
    if name in _FORBIDDEN:
        raise RuntimeError(
            f"{name} is sealed eval ground truth. Agent code must never read it."
        )
    path = DATA_DIR / name
    return json.loads(path.read_text(encoding="utf-8"))


@lru_cache(maxsize=1)
def accounts() -> list[dict[str, Any]]:
    return _load("accounts.json")


@lru_cache(maxsize=1)
def users() -> list[dict[str, Any]]:
    return _load("users.json")


@lru_cache(maxsize=1)
def support_tickets() -> list[dict[str, Any]]:
    return _load("support_tickets.json")


@lru_cache(maxsize=1)
def usage_events() -> list[dict[str, Any]]:
    return _load("usage_events.json")


@lru_cache(maxsize=1)
def call_summaries() -> list[dict[str, Any]]:
    return _load("call_summaries.json")


@lru_cache(maxsize=1)
def cs_notes() -> list[dict[str, Any]]:
    return _load("cs_notes.json")


@lru_cache(maxsize=1)
def cross_functional_signals() -> list[dict[str, Any]]:
    return _load("cross_functional_signals.json")


@lru_cache(maxsize=1)
def roadmap() -> list[dict[str, Any]]:
    return _load("roadmap.json")


def all_account_ids() -> list[str]:
    return [a["account_id"] for a in accounts()]


def get_account(account_id: str) -> dict[str, Any]:
    for a in accounts():
        if a["account_id"] == account_id:
            return a
    raise KeyError(f"Unknown account_id: {account_id}")


def _within(records: list[dict[str, Any]], ts_field: str, days: int) -> list[dict[str, Any]]:
    cutoff = REFERENCE_DATE - timedelta(days=days)
    out = []
    for r in records:
        try:
            ts = datetime.fromisoformat(r[ts_field].replace("Z", "+00:00"))
            if ts.tzinfo is not None:
                ts = ts.replace(tzinfo=None)
        except (KeyError, ValueError):
            continue
        if ts >= cutoff:
            out.append(r)
    return out


def usage_trend(account_id: str, window_days: int = 60) -> list[dict[str, Any]]:
    """For each feature, total duration_seconds in the last `window_days`
    vs the `window_days` immediately before. Lets the model spot decline/growth.
    """
    events = [e for e in usage_events() if e["account_id"] == account_id]
    recent_cutoff = REFERENCE_DATE - timedelta(days=window_days)
    prior_cutoff = REFERENCE_DATE - timedelta(days=window_days * 2)

    buckets: dict[str, dict[str, int]] = defaultdict(lambda: {"recent": 0, "prior": 0})
    for e in events:
        try:
            ts = datetime.fromisoformat(e["timestamp"].replace("Z", "+00:00"))
            if ts.tzinfo is not None:
                ts = ts.replace(tzinfo=None)
        except ValueError:
            continue
        if ts >= recent_cutoff:
            buckets[e["feature_name"]]["recent"] += e.get("duration_seconds", 0)
        elif ts >= prior_cutoff:
            buckets[e["feature_name"]]["prior"] += e.get("duration_seconds", 0)

    rows = []
    for feature, b in sorted(buckets.items()):
        prior = b["prior"]
        recent = b["recent"]
        if prior == 0 and recent == 0:
            continue
        pct = ((recent - prior) / prior * 100) if prior > 0 else None
        rows.append(
            {
                "feature": feature,
                "last_60d_seconds": recent,
                "prior_60d_seconds": prior,
                "pct_change": round(pct, 1) if pct is not None else None,
            }
        )
    return rows


def executive_sponsor(account_id: str) -> dict[str, Any] | None:
    acct = get_account(account_id)
    sponsor_name = acct.get("executive_sponsor")
    if not sponsor_name:
        return None
    for u in users():
        if u["account_id"] == account_id and u["name"] == sponsor_name:
            return {
                "user_id": u["user_id"],
                "name": u["name"],
                "role": u["role"],
                "last_login_at": u["last_login_at"],
                "is_executive_sponsor": u["is_executive_sponsor"],
            }
    return None


def build_account_bundle(account_id: str) -> dict[str, Any]:
    """Compact per-account bundle for Signal Agent pattern detection.

    Token budget target: ~5-8k tokens. Trims to the windows most informative
    for behavior-shift patterns (last 60-180 days, depending on data type).
    """
    acct = get_account(account_id)
    acct_view = {k: acct[k] for k in acct if k != "tags"}

    return {
        "reference_date": REFERENCE_DATE.date().isoformat(),
        "account": acct_view,
        "executive_sponsor": executive_sponsor(account_id),
        "usage_trend_60d_vs_prior": usage_trend(account_id, window_days=60),
        "support_tickets_last_90d": [
            t for t in _within(
                [x for x in support_tickets() if x["account_id"] == account_id],
                "created_at",
                90,
            )
        ],
        "call_summaries_last_180d": [
            c for c in _within(
                [x for x in call_summaries() if x["account_id"] == account_id],
                "date",
                180,
            )
        ],
        "cs_notes_last_180d": [
            n for n in _within(
                [x for x in cs_notes() if x["account_id"] == account_id],
                "created_at",
                180,
            )
        ],
        "cross_functional_signals_last_180d": [
            s for s in _within(
                [x for x in cross_functional_signals() if x["account_id"] == account_id],
                "created_at",
                180,
            )
        ],
    }
