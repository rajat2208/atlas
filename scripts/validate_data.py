"""Run the usability checklist from docs/data-generation-spec.md."""
from __future__ import annotations

import json
from pathlib import Path
from datetime import date

DATA = Path(__file__).resolve().parent.parent / "data"

FILES = [
    "accounts.json", "users.json", "support_tickets.json",
    "usage_events.json", "call_summaries.json", "cs_notes.json",
    "cross_functional_signals.json", "roadmap.json", "ground_truth.json",
]

results: list[tuple[str, bool, str]] = []

def check(name: str, ok: bool, detail: str = "") -> None:
    results.append((name, ok, detail))

# 1. All 9 files emitted and valid JSON
loaded = {}
all_ok = True
for fn in FILES:
    p = DATA / fn
    if not p.exists():
        all_ok = False
        check(f"file exists: {fn}", False)
        continue
    try:
        loaded[fn] = json.loads(p.read_text(encoding="utf-8"))
    except Exception as e:
        all_ok = False
        check(f"valid JSON: {fn}", False, str(e))
check("All 9 files emitted in data/ and valid JSON",
      all_ok and len(loaded) == 9)

accounts = loaded["accounts.json"]
users = loaded["users.json"]
tickets = loaded["support_tickets.json"]
usage = loaded["usage_events.json"]
calls = loaded["call_summaries.json"]
notes = loaded["cs_notes.json"]
signals = loaded["cross_functional_signals.json"]
roadmap = loaded["roadmap.json"]
gt = loaded["ground_truth.json"]

acc_ids = {a["account_id"] for a in accounts}
user_ids = {u["user_id"] for u in users}
user_to_account = {u["user_id"]: u["account_id"] for u in users}

# 2. Every account_id referenced in any file exists in accounts.json
bad = []
for src in (users, tickets, usage, calls, notes, signals):
    for row in src:
        if row.get("account_id") and row["account_id"] not in acc_ids:
            bad.append(row.get("account_id"))
check("Every account_id reference exists in accounts.json",
      not bad, f"unknown refs: {set(bad) if bad else ''}")

# 3. Every user_id referenced exists in users.json; user.account_id valid
bad_uref = []
for src in (usage,):
    for row in src:
        if row.get("user_id") and row["user_id"] not in user_ids:
            bad_uref.append(row["user_id"])
# tagged_users in cs_notes
tagged_bad = []
for n in notes:
    for uid in n.get("tagged_users", []):
        if uid not in user_ids:
            tagged_bad.append(uid)
bad_user_acc = [u["user_id"] for u in users if u["account_id"] not in acc_ids]
check("Every user_id referenced exists; every user.account_id is valid",
      not bad_uref and not tagged_bad and not bad_user_acc,
      f"usage_user_unknown={set(bad_uref)} tagged_unknown={set(tagged_bad)} user_acc_unknown={bad_user_acc}")

# 4. All dates fall within the 12-month window and use a consistent reference date
ref = date.fromisoformat(gt["reference_date"])
start = date(ref.year - 1, ref.month, ref.day)
def parse_date(s: str) -> date:
    return date.fromisoformat(s[:10])

window_ok = True
window_violations = []
def check_window(d: date, src: str):
    global window_ok
    if not (start <= d <= ref):
        window_ok = False
        window_violations.append((src, d.isoformat()))

# accounts: contract_start can predate window (long contracts); contract_end can post-date
# the spec says "dates fall within the 12-month window" — interpret as activity dates.
# We check timestamps on tickets/usage/calls/notes/signals + user last_login.
for u in users: check_window(parse_date(u["last_login_at"]), "users.last_login_at")
for t in tickets: check_window(parse_date(t["created_at"]), "tickets.created_at")
for e in usage: check_window(parse_date(e["timestamp"]), "usage.timestamp")
for c in calls: check_window(parse_date(c["date"]), "calls.date")
for n in notes: check_window(parse_date(n["created_at"]), "cs_notes.created_at")
for s in signals: check_window(parse_date(s["created_at"]), "signals.created_at")
check("All activity dates fall within the 12-month window; reference date consistent",
      window_ok, f"first violations: {window_violations[:5]}")

# 5. Field names match schemas exactly
SCHEMAS = {
    "accounts.json": {"account_id","name","industry","employee_count","arr",
                      "contract_start","contract_end","assigned_csm",
                      "assigned_ae","executive_sponsor","health_score","tags"},
    "users.json": {"user_id","account_id","name","role","email",
                   "last_login_at","is_executive_sponsor","is_decision_maker"},
    "support_tickets.json": {"ticket_id","account_id","created_at","status",
                             "severity","subject","body","sentiment_score","category"},
    "usage_events.json": {"event_id","account_id","user_id","feature_name",
                          "timestamp","event_type","duration_seconds"},
    "call_summaries.json": {"call_id","account_id","attendees","date",
                            "duration_minutes","summary","sentiment",
                            "key_topics","action_items","competitor_mentions"},
    "cs_notes.json": {"note_id","account_id","author","created_at","category",
                      "content","tagged_users"},
    "cross_functional_signals.json": {"signal_id","account_id","contributor_id",
                                      "created_at","signal_type","content",
                                      "evidence_links"},
    "roadmap.json": {"item_id","feature_name","status","target_quarter",
                     "investment_level","description"},
}
schema_ok = True
schema_diffs = []
for fn, expected in SCHEMAS.items():
    sample = loaded[fn][0] if loaded[fn] else {}
    got = set(sample.keys())
    if got != expected:
        schema_ok = False
        schema_diffs.append((fn, expected - got, got - expected))
check("Field names match schemas EXACTLY for every file",
      schema_ok, f"diffs: {schema_diffs}")

# 6. All eight patterns present in ground_truth.json
patterns_present = set()
for p in gt.get("account_level_patterns", []) + \
         gt.get("portfolio_level_patterns", []) + \
         gt.get("organizational_patterns", []):
    patterns_present.add(p["pattern"])
expected_patterns = {
    "hidden_churn_risk", "expansion_ready", "executive_friction",
    "systemic_product_signal", "support_load_concentration",
    "feedback_to_roadmap_disconnect", "win_reference_opportunity",
    "cross_functional_blind_spot",
}
check("All 8 canonical patterns recorded in ground_truth.json",
      patterns_present == expected_patterns,
      f"missing={expected_patterns - patterns_present}")

# 7. "granular permissions" appears in demand signals but NOT in roadmap.json
roadmap_features = {r["feature_name"].lower() for r in roadmap}
gp_in_roadmap = any("granular permissions" in f for f in roadmap_features)
gp_in_tickets = sum(1 for t in tickets if "granular permissions" in t["subject"].lower()
                                       or "granular permissions" in t["body"].lower())
gp_in_calls = sum(1 for c in calls
                  if any("granular permissions" in (k or "").lower() for k in c.get("key_topics", []))
                  or any("granular permissions" in (a or "").lower() for a in c.get("action_items", []))
                  or "granular permissions" in (c.get("summary") or "").lower())
check("'granular permissions' present in demand signals AND absent from roadmap.json",
      (not gp_in_roadmap) and gp_in_tickets > 0 and gp_in_calls > 0,
      f"in_roadmap={gp_in_roadmap}, tickets={gp_in_tickets}, calls={gp_in_calls}")

# 8. ground_truth member sets reference only existing account_ids
gt_refs = set()
for p in gt.get("account_level_patterns", []):
    gt_refs.update(p.get("account_ids", []))
for p in gt.get("portfolio_level_patterns", []):
    gt_refs.update(p.get("member_account_ids", []))
for p in gt.get("organizational_patterns", []):
    gt_refs.update(p.get("account_ids", []))
unknown = gt_refs - acc_ids
check("ground_truth member sets reference only existing account_ids",
      not unknown, f"unknown={unknown}")

# 9. "Noisy normal" accounts have realistic variation, not flat lines
# A normal account is one with no pattern in ground truth (other than incidental
# membership). We compute weekly core-feature event counts per account and check
# coefficient of variation > 0 (proxy: stddev/mean > some threshold).
import statistics
all_pattern_accs = set()
for p in gt.get("account_level_patterns", []):  all_pattern_accs.update(p.get("account_ids", []))
for p in gt.get("portfolio_level_patterns", []):
    all_pattern_accs.update(p.get("member_account_ids", []))
for p in gt.get("organizational_patterns", []): all_pattern_accs.update(p.get("account_ids", []))
normal_accs = acc_ids - all_pattern_accs

# Use usage_events weekly buckets per account (one row per week per feature already).
per_acc_core_dur = {}
for e in usage:
    if e["feature_name"] != "docs": continue
    per_acc_core_dur.setdefault(e["account_id"], []).append(e["duration_seconds"])
flat = []
for aid in normal_accs:
    vals = per_acc_core_dur.get(aid, [])
    if len(vals) < 5:
        continue
    mean = statistics.mean(vals)
    stdev = statistics.pstdev(vals)
    cv = stdev / mean if mean else 0
    if cv < 0.08:   # suspiciously flat
        flat.append((aid, cv))
check("Noisy-normal accounts have realistic variation (not flat lines)",
      not flat, f"flat: {flat[:5]} normal_acc_count={len(normal_accs)}")

# 10. README.md exists with reference date / granularity / feature names
readme = DATA / "README.md"
readme_ok = False
if readme.exists():
    txt = readme.read_text(encoding="utf-8").lower()
    readme_ok = ("reference date" in txt and "granularity" in txt
                 and "docs" in txt and "admin_console" in txt)
check("data/README.md notes reference date, usage-event granularity, and feature names",
      readme_ok)

# 11. ground_truth.json is the ONLY file that reveals pattern placement
# Check no other file contains pattern keys or "ground truth" markers.
PATTERN_TOKENS = ["hidden_churn", "expansion_ready", "executive_friction",
                  "systemic_product_signal", "support_load_concentration",
                  "feedback_to_roadmap_disconnect", "win_reference",
                  "cross_functional_blind_spot"]
leaks = []
for fn in FILES:
    if fn == "ground_truth.json": continue
    text = (DATA / fn).read_text(encoding="utf-8")
    for tok in PATTERN_TOKENS:
        if tok in text:
            leaks.append((fn, tok))
check("ground_truth.json is the ONLY file that reveals pattern placement",
      not leaks, f"leaks={leaks}")

# ---------------------------------------------------------------------------
# Print report
# ---------------------------------------------------------------------------
print()
print("Usability checklist:")
print("=" * 72)
all_pass = True
for name, ok, detail in results:
    status = "PASS" if ok else "FAIL"
    if not ok: all_pass = False
    line = f"[{status}] {name}"
    print(line)
    if detail and not ok:
        print(f"        {detail}")
print("=" * 72)
print(f"OVERALL: {'PASS' if all_pass else 'FAIL'}")
# NOTE: this validator deliberately does NOT print pattern membership or any
# account_id-to-pattern mapping. ground_truth.json is loaded only to verify
# its own structural invariants (all 8 patterns present, member account_ids
# resolve). Revealing placement here would defeat the integrity boundary
# this script is meant to live alongside.
