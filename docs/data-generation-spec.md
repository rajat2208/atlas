# Atlas — Data Generation Spec

**Purpose:** This is a self-contained brief for generating Atlas's synthetic dataset.

**CRITICAL — run this in isolation.** This task must be executed in a *separate, dedicated
Claude Code session* (or separate chat) with NO agent-building history in context. The
session that generates this data must never be the session that builds the Atlas agents.
After generation completes, close this session and do not reopen it. This separation is
what makes Atlas's evaluation honest (see "Why isolation matters" below).

This spec is derived from `atlas-prd.md` §5 and §7. If anything here conflicts with the
PRD, the PRD wins — but this file is intended to be complete enough that the generation
session does not need to read the full PRD.

---

## What to produce

Generate the following files in a `data/` directory:

- `data/accounts.json` — 25 accounts
- `data/users.json` — users across all accounts
- `data/support_tickets.json` — support tickets
- `data/usage_events.json` — product usage events
- `data/call_summaries.json` — sales/CS call summaries
- `data/cs_notes.json` — customer success notes
- `data/cross_functional_signals.json` — signals logged by team members
- `data/roadmap.json` — the mock product roadmap
- `data/ground_truth.json` — **THE SEALED ANSWER KEY** (see dedicated section below)

All files are JSON arrays of objects, except `ground_truth.json` (structure specified below).

---

## Why isolation matters

Atlas's credibility rests on an honest evaluation: the agent must surface patterns it was
never told about. If the same model context that placed the patterns also builds the
detection agent, the evaluation is meaningless — the agent effectively has the answer key.

Therefore:
- This generation session decides pattern placement and writes it ONLY to `ground_truth.json`.
- Agent-building sessions may read every file in `data/` EXCEPT `ground_truth.json`.
- Only the evaluation harness reads `ground_truth.json`, and only to score, after the
  agent has produced output.

---

## Domain context

The dataset models 25 strategic enterprise accounts for a productivity & collaboration
product line (think a slice of Microsoft 365 — document collaboration, meetings, workflows).
The persona consuming this data is a VP/GM who owns this product line. Accounts are large
enterprises. Use realistic but clearly fictional company names (Acme, Beta, Helios, Nimbus,
Orbit, Vertex, etc.). Data spans a **12-month window** ending "today" (use a fixed
reference date and keep it consistent across all files).

---

## Schemas (match exactly — the agents depend on these field names)

**Account** — `accounts.json`
- `account_id` (string, e.g. "acc_001")
- `name` (string)
- `industry` (string)
- `employee_count` (integer)
- `arr` (integer, USD)
- `contract_start` (ISO date)
- `contract_end` (ISO date)
- `assigned_csm` (string, person name)
- `assigned_ae` (string, person name)
- `executive_sponsor` (string, person name — references a user)
- `health_score` (integer 0-100 — a naive computed score; deliberately NOT authoritative,
  it should look fine for some accounts that actually have hidden problems)
- `tags` (array of strings — leave empty `[]`; Atlas assigns these at runtime)

**User** — `users.json`
- `user_id` (string)
- `account_id` (string)
- `name` (string)
- `role` (string, e.g. "VP Engineering", "Ops Manager")
- `email` (string)
- `last_login_at` (ISO datetime)
- `is_executive_sponsor` (boolean)
- `is_decision_maker` (boolean)

**SupportTicket** — `support_tickets.json`
- `ticket_id` (string)
- `account_id` (string)
- `created_at` (ISO datetime)
- `status` (one of: open, pending, resolved, closed)
- `severity` (one of: low, medium, high, critical)
- `subject` (string)
- `body` (string — realistic ticket text)
- `sentiment_score` (float -1.0 to 1.0)
- `category` (string, e.g. "how-to", "bug", "feature-request", "onboarding", "billing")

**UsageEvent** — `usage_events.json`
- `event_id` (string)
- `account_id` (string)
- `user_id` (string)
- `feature_name` (string — use a small fixed set of ~8-10 feature names; one of them is
  the "core feature", and one is the feature tied to the Systemic Product Signal)
- `timestamp` (ISO datetime)
- `event_type` (one of: login, feature_use, api_call)
- `duration_seconds` (integer)
- Note: this file will be the largest. It is acceptable to aggregate to a reasonable
  granularity (e.g., daily or weekly per account/feature) rather than emitting millions of
  rows — but keep enough resolution to show 60-day trends. State the granularity you chose
  in a comment field or a short `data/README.md`.

**CallSummary** — `call_summaries.json`
- `call_id` (string)
- `account_id` (string)
- `attendees` (array of strings)
- `date` (ISO date)
- `duration_minutes` (integer)
- `summary` (string — a realistic 1-2 paragraph call summary)
- `sentiment` (one of: positive, neutral, negative, mixed)
- `key_topics` (array of strings)
- `action_items` (array of strings)
- `competitor_mentions` (array of strings — empty if none)

**CSNote** — `cs_notes.json`
- `note_id` (string)
- `account_id` (string)
- `author` (string, person name)
- `created_at` (ISO datetime)
- `category` (one of: relationship, risk, opportunity, general)
- `content` (string — realistic note text)
- `tagged_users` (array of user_ids)

**CrossFunctionalSignal** — `cross_functional_signals.json`
- `signal_id` (string)
- `account_id` (string)
- `contributor_id` (string — a person; can reference a CSM/AE/etc. name or id)
- `created_at` (ISO datetime)
- `signal_type` (one of: risk, opportunity, observation)
- `content` (string)
- `evidence_links` (array of strings — can be placeholder references to other records)

**RoadmapItem** — `roadmap.json`
- `item_id` (string)
- `feature_name` (string)
- `status` (one of: planned, in_progress, shipped, backlog)
- `target_quarter` (string, e.g. "Q3-2026")
- `investment_level` (one of: low, medium, high)
- `description` (string)

---

## The eight patterns to bake in

The dataset must support all eight Atlas insight patterns. Patterns are organized in three
tiers. **The counts below are approximate generation targets, not exact requirements** —
generate realistically; the actual numbers are whatever you produce and must be recorded
in `ground_truth.json`.

### Tier 1 — Account-level patterns

1. **Hidden Churn Risk** (~2-4 accounts) — Account looks healthy on `health_score` and has
   no escalations and a contract not due for 6+ months. But: core-feature usage declines
   gradually starting ~month 8-10; support tickets shift in tone (earlier tickets are
   "how-to", later ones are "bug"/frustrated with lower `sentiment_score`); the executive
   sponsor's `last_login_at` goes stale and CS notes mention reduced sponsor engagement
   (e.g., missed QBRs after a reorg).

2. **Expansion-Ready** (~2 accounts) — Stable account where, starting ~month 9-10, usage
   accelerates, new users from new teams/departments appear (new `user_id`s with roles in
   Finance/Legal/Ops), and recent support tickets are sophisticated ("feature-request",
   advanced how-to about API limits, SSO). No recent expansion conversation in CRM/calls.

3. **Executive Friction** (~1-2 accounts) — Account renewing within ~4 months
   (`contract_end` soon). Surface looks on-track. But: a new decision-maker user joined
   recently (~month 10-12) with a role like "VP Engineering"; the prior executive sponsor's
   record reflects departure; the new sponsor has little/no usage; a call summary or CS
   note hints at a competitor relationship (`competitor_mentions` populated).

### Tier 2 — Portfolio-level patterns (cross-account)

4. **Systemic Product Signal** (~6-8 accounts) — A cluster of accounts, weighted toward
   larger accounts (500+ employees), each begins logging tickets about the SAME specific
   feature (the designated "Systemic Product Signal feature") around month 9-11, with
   correlated usage dips on that feature. Individually each account's tickets look minor;
   in aggregate it is a product problem.

5. **Support Load Concentration** (~3-5 accounts) — A set of accounts with `contract_start`
   in the most recent two quarters, showing rising ticket volume dominated by "onboarding"
   category tickets. This is an onboarding-gap pattern, distinct from a product defect.

6. **Feedback-to-Roadmap Disconnect** (portfolio-wide) — Across many accounts' calls and
   tickets, demand for one specific capability (use **"granular permissions"**) builds
   through the year (mentioned in many `call_summaries` `key_topics`/`action_items` and as
   "feature-request" tickets). In `roadmap.json`, "granular permissions" must be ABSENT.
   Meanwhile a low-demand feature (invent one, e.g. "AI meeting summaries") must appear in
   `roadmap.json` with `investment_level: high` while being mentioned by only ~1-2 accounts.

7. **Win / Reference Opportunity** (~2-3 accounts) — Standout accounts with sustained
   top-decile usage, consistently positive call sentiment, expansion history in CRM, and CS
   notes reflecting strong relationships and sponsor advocacy.

### Tier 3 — Organizational pattern

8. **Cross-Functional Blind Spot** (~2 accounts) — Accounts where the functions DISAGREE.
   Sales-side data is optimistic: positive call sentiment, optimistic action items, a
   healthy CRM posture, possibly an optimistic cross-functional signal of type "opportunity".
   But Support and Product reality contradicts it: a clear ticket-volume spike (e.g., 3x
   over 60 days), declining usage, and CS notes of type "risk" flagging sponsor frustration.
   The contradiction must be genuine and detectable by comparing sources.

### Overlap and noise

- Patterns MAY overlap on the same account (e.g., a Systemic Product Signal account may
  also be a Hidden Churn Risk). Record all applicable patterns per account in ground truth.
- The remaining accounts are **"noisy normal"** — varied, realistic health states with no
  flagship pattern. They must include realistic minor ups and downs so detection is not
  trivial. Avoid making normal accounts suspiciously flat.

---

## Randomization requirements

To keep the dataset honest and non-trivial:

- **Randomly assign** which specific accounts carry which patterns. Do not place patterns
  in account_id order or any guessable arrangement.
- **Randomize** pattern onset timing within the stated month ranges, signal strength
  (some patterns subtle, some pronounced), and noise levels.
- **Randomize** account names, industries, sizes, contract dates, and personnel.
- Vary the magnitude of the "noisy normal" accounts so they are not all identical.
- Do not reveal in any file other than `ground_truth.json` which accounts carry patterns.

---

## ground_truth.json — the sealed answer key

This is the ONLY file that records what was baked in. Structure:

```json
{
  "reference_date": "YYYY-MM-DD",
  "generation_notes": "free-text: granularity choices, anything notable",
  "account_level_patterns": [
    {
      "pattern": "hidden_churn_risk",
      "account_ids": ["acc_007", "acc_014"],
      "per_account_notes": {
        "acc_007": "onset month 9; sponsor disengaged after reorg; subtle",
        "acc_014": "onset month 8; pronounced usage decline"
      }
    }
    // ... expansion_ready, executive_friction
  ],
  "portfolio_level_patterns": [
    {
      "pattern": "systemic_product_signal",
      "feature_name": "the affected feature",
      "member_account_ids": ["acc_002", "acc_005", "..."],
      "aggregate_condition": "tickets on <feature> clustered months 9-11 across these accounts",
      "notes": "..."
    }
    // ... support_load_concentration, feedback_to_roadmap_disconnect, win_reference_opportunity
  ],
  "organizational_patterns": [
    {
      "pattern": "cross_functional_blind_spot",
      "account_ids": ["acc_011", "acc_019"],
      "per_account_notes": {
        "acc_011": "Sales green + positive calls vs 3x ticket spike + risk CS notes"
      }
    }
  ],
  "expected_actions": {
    "acc_007": "schedule executive check-in with new sponsor",
    "systemic_product_signal": "escalate to product with affected-account list + severity"
    // expected action class per pattern instance, for eval Layer 4
  }
}
```

Use the canonical pattern keys: `hidden_churn_risk`, `expansion_ready`,
`executive_friction`, `systemic_product_signal`, `support_load_concentration`,
`feedback_to_roadmap_disconnect`, `win_reference_opportunity`,
`cross_functional_blind_spot`.

---

## Usability checklist (verify before finishing)

- [ ] All 9 files emitted in `data/` and are valid JSON.
- [ ] Every `account_id` referenced in any file exists in `accounts.json`.
- [ ] Every `user_id` referenced exists in `users.json`; every user's `account_id` is valid.
- [ ] All dates fall within the 12-month window and use a consistent reference date.
- [ ] Field names match the schemas above EXACTLY (the agents are coded against them).
- [ ] All eight patterns are present and recorded in `ground_truth.json`.
- [ ] "granular permissions" appears in demand signals but NOT in `roadmap.json`.
- [ ] `ground_truth.json` member sets reference only account_ids that exist.
- [ ] "Noisy normal" accounts have realistic variation, not flat lines.
- [ ] A short `data/README.md` notes the reference date, the usage-event granularity, and
      the canonical feature-name list — so agent-building sessions have what they need.
- [ ] `ground_truth.json` is the ONLY file that reveals pattern placement.

When the checklist passes, the dataset is ready. Close this session.
