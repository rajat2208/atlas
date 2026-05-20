# Atlas — Product Requirements Document

**Version:** 0.1 (Demo/Prototype)
**Author:** Rajat Singh
**Status:** Ready for build

---

## Table of Contents

1. Problem Statement & Origin Story
2. Persona & Use Case
3. Product Vision & Wedge
4. Core Functionality
5. The Killer Insight Patterns
6. User Journey
7. Data Model & Sources
8. Architecture & Multi-Agent System
9. Action Framework & Configurable Autonomy
10. Evaluation Framework
11. Design Principles & System
12. Out of Scope / Future State
13. Demo Flow

---

## 1. Problem Statement & Origin Story

### The lived problem

Every month, at large enterprise companies, cross-functional leadership teams gather for a Customer Insights review. The business leader who convenes the meeting — a General Manager or VP who owns a product line — wants one thing: a 30,000-foot view of customer health, product adoption, and field signals across their portfolio. Yet what actually happens is a multi-week prep cycle:

- A central owner (usually from Customer Experience Programs or Customer Success) builds a SharePoint deck.
- Each sister team (Sales, Marketing, Product, Support, CSM) nominates a POC who edits their section.
- POCs spend hours pulling data from their respective systems — Salesforce, Dynamics, Gainsight, Zendesk, Mixpanel, Gong, internal dashboards, customer interview notes — and pasting tables, screenshots, and bullet narratives.
- The resulting deck is a static, fragmented, lossy snapshot — already outdated by the time the meeting starts.
- Decisions made in the meeting take another 2 weeks to translate into action, because each team has to log into their own systems and execute.

The aggregate cost: ~80 hours of senior knowledge worker time per month, per business leader, for a single 60-minute meeting that produces decisions that take 2+ weeks to execute.

### Why this exists

Three failures compound:

1. **Data fragmentation.** Every team uses different systems, with different schemas, different update cadences, and different definitions of "the customer."
2. **No reasoning layer.** Today's tools aggregate data into dashboards, but synthesis happens in human heads. The leader can see 10 charts; they cannot get an *insight* without a human first interpreting them.
3. **Insight-to-action gap.** Even when synthesis happens, executing on it requires logging into another set of systems. The meeting produces decisions; the action requires manual orchestration.

### What's possible now that wasn't before

Three frontier shifts make this problem newly solvable:

- **Agentic retrieval** (vs static RAG) — agents can decompose questions, route to multiple sources, reflect, and synthesize.
- **Multi-agent orchestration** — specialized agents can coordinate on signal detection, synthesis, recommendation, execution, and memory.
- **Configurable autonomy** — agents can take actions across systems with governance proportional to risk.

Atlas exists to capture this opportunity.

---

## 2. Persona & Use Case

### Primary persona: Sarah Simmons

- **Role:** VP & General Manager, Productivity & Collaboration product line
- **Org:** A large enterprise SaaS company (think Microsoft, Salesforce, or ServiceNow scale)
- **Owns:** A productivity & collaboration product line — analogous to a slice of Microsoft 365 (e.g., document collaboration + meetings + workflows). Owns the P&L for this line.
- **Scope:** ~$40M ARR product line, 25 strategic enterprise accounts, with Sales, CS, Marketing, Support, and Product leaders reporting into or tightly aligned with her
- **Authority:** Can direct cross-functional action — reassign account coverage, authorize competitive plays, trigger campaigns, escalate to product, approve expansion motions. This authority is what makes Atlas's action layer meaningful.
- **Years in role:** 8+ in the business; 3+ as GM of this line (knows her customers, her teams, her product deeply)

### Why a GM, not a PM

This distinction matters for the credibility of the entire product. A Sr or Principal Product Manager is an individual contributor — they own features or a product area, but they do not own a portfolio of strategic accounts, do not have cross-functional teams reporting to them, and cannot authorize a CSM reassignment or trigger a marketing campaign. Atlas's action layer (Section 9) only makes sense for someone with real organizational authority and budget.

The lived reality of the cross-functional readout confirms this: the people who *needed* the synthesis were the leaders the cross-functional teams reported *to* — the GMs and VPs. The PMs were contributors who assembled the deck. The consumer was always a business leader. Atlas is built for that consumer.

A GM is the cleanest fit: senior enough to own the outcome and direct action, but scoped to a single product line (25 strategic accounts, $40M ARR) so the demo stays concrete. A CXO would be too broad — a Chief Product Officer owns all products, a Chief Customer Officer owns all customers, and the "25 accounts in one product line" scope would feel too granular for them.

### Sarah's job-to-be-done

Sarah needs continuous cross-functional awareness of how her product line is performing in the field. Specifically:

- Which accounts are healthy, which are at risk, which are expanding
- What her cross-functional teams (Sales, Marketing, CS, Support, Product) are seeing — including signals that don't show up in dashboards
- What her teams should be doing differently this week, this quarter
- What to escalate vs delegate

### Cross-functional contributors

Atlas serves not just Sarah, but the cohort that supports her — the same people who, in the old world, assembled the monthly deck:
- **CS leader** (logs notes, flags risks, tracks renewals)
- **Sales leader** (logs deal context, sales call signals)
- **Product leader** (reads aggregated feedback, prioritizes roadmap)
- **Marketing leader** (identifies expansion stories, case study angles)
- **Support leader** (escalates patterns, tracks ticket velocity)

These contributors both feed Atlas (their notes, their tags, their judgment) and consume it (their slice of the synthesis). Sarah is the primary consumer and the action authority; the contributors are both inputs and secondary consumers.

### Why this persona is the right wedge

Sarah is a business-line leader, not a C-level executive. She owns a *slice* of the business — significant enough to need synthesis and to command action, small enough that she still personally knows her top accounts. This persona is replicated thousands of times across every large enterprise — every GM and product-line VP runs a version of this readout. Solving for Sarah scales to entire organizations.

---

## 3. Product Vision & Wedge

### Vision

**Atlas is the executive intelligence layer for leaders who own portfolios of customers — a continuous, queryable, action-capable awareness system that replaces the monthly readout cycle with living, shared cross-functional context.**

### Wedge

The current paradigm — slide decks built monthly through cross-functional coordination — is a coping mechanism for broken tooling. People build slides because:
- They can't trust the data to be live
- They can't query across systems
- They can't take action from the same surface
- They need a portable artifact to share with executives who won't log in

Atlas's wedge is to **eliminate the slide deck entirely** by making the live surface so trustworthy and so action-capable that the readout becomes a conversation *in the product itself*.

### Positioning vs adjacent tools

- **vs Dynamics 365 Customer Insights / Salesforce Data Cloud / Treasure Data:** Those are CDPs optimized for marketing personalization. Atlas is a reasoning layer for executive synthesis. Different persona, different output, different consumption model.
- **vs Salesforce Agentforce 360:** Agentforce is agentic workflow automation tied to the Salesforce stack. Atlas is multi-source agentic synthesis that lives above any vendor's stack.
- **vs Snowflake / Sigma Computing:** Those are data warehouses + analytics consumption layers. Atlas is opinionated synthesis built specifically for the executive readout use case, not a general-purpose analytics tool.
- **vs Glean:** Glean is enterprise search with chat. Atlas is structured reasoning over customer entities with action capability — not search.

### Why this is a defensible product

Three moats:
1. **Institutional memory.** Atlas builds a long-term model of how each leader makes decisions (what they flag, what they ignore, what they escalate). This compounds with usage and is hard for competitors to replicate.
2. **Cross-system reasoning quality.** Multi-source reasoning with proper provenance is harder than it looks. Schema reconciliation, conflict resolution, and confidence calibration require deliberate engineering.
3. **Platform expansion (Microsoft-specific).** Atlas can anchor expansion of Microsoft's data and agent footprint within customer organizations.

---

## 4. Core Functionality

Atlas is a single product with two modes of consumption that flow seamlessly into each other.

### Mode 1: The Briefing (default state on app open)

When Sarah opens Atlas, she lands on the Briefing — a curated, personalized synthesis of what has changed since her last visit and what needs her attention.

**Components:**
- **What Atlas thinks matters this week.** 3-5 top insights, each tied to a specific account, signal, or pattern. Each insight is a card with synthesis, supporting evidence, confidence level, and recommended action.
- **What your team is seeing.** Aggregated signals from cross-functional contributors (CS notes, sales call summaries, support trends).
- **Portfolio pulse.** A high-level view of the 25 accounts — segmented by Atlas-assigned tags (e.g., "Hidden Churn Risk: 3," "Expansion Ready: 2," "Win/Reference: 3," "Coordination Risk: 2," "Healthy Steady-State: 15"). Portfolio- and organization-level patterns (Systemic Product Signal, Support Load Concentration, Feedback-to-Roadmap Disconnect) surface as their own cross-account insight cards rather than per-account tags.
- **Memory thread.** "Since you last logged in: 3 new patterns detected, 1 action you approved was executed, 2 items you flagged are now resolved."

The Briefing is *not* a static report. Every card is interactive. Every claim is traceable.

### Mode 2: The Query (ask anything, anytime)

At any moment, Sarah can pivot to a conversational interface and ask:
- "Why did Acme's health drop?"
- "Which accounts are showing patterns similar to what we saw with Beta last quarter?"
- "What's the rollup of feedback on the new collaboration feature?"
- "Has anyone on my team flagged Gamma recently?"

The Query mode is the agent at her disposal. It can:
- Reason across all 5 data sources
- Surface evidence with provenance
- Compare across accounts and time periods
- Generate visualizations on the fly
- Hand off to action (see Section 9)

### How they connect

The Briefing and Query are not separate surfaces. They are the same product in different states:
- Click any card in the Briefing → drill into a Query about that account
- Ask a Query that turns out to be widely relevant → Atlas suggests adding it to next week's Briefing
- A pattern detected in Query can be promoted to the Briefing for the rest of Sarah's team

### Proactive Atlas (the colleague layer)

Atlas does not wait for Sarah to open the app. It runs continuously in the background, watching data streams, building patterns, and surfacing what matters. When something crosses a relevance threshold, Atlas reaches out:

- **Teams/Slack messages** for urgent signals ("Hey — Acme's executive sponsor just left the company. Worth a 5-minute review before your 1:1 with Mark tomorrow.")
- **Email digests** for medium-priority pattern summaries
- **In-app notifications** for low-priority changes

Atlas adapts over time. If Sarah ignores notifications about a specific pattern type, Atlas learns to lower its threshold. If she always acts on a specific trigger, Atlas learns to raise its priority.

---

## 5. The Killer Insight Patterns

Atlas surfaces eight insight patterns, organized into three tiers. Each requires reasoning across at least 3 data sources — no single system would catch them. The tiers are deliberate: they ensure Atlas engages every POC in the cross-functional readout, not just the account owners.

- **Tier 1 — Account-level (zoom in):** What's happening with a specific customer. Patterns 1-3.
- **Tier 2 — Portfolio-level (zoom out, function-specific):** Patterns that only emerge across accounts, each speaking to a specific functional leader (Product, Support, Marketing). Patterns 4-7.
- **Tier 3 — Organizational (meta):** Patterns about the organization's own coordination, not the customer. Pattern 8.

**Build vs demo scope:** All eight patterns should be built into the data model and detection logic — they reason over the same data sources, so the incremental cost is low. For the live demo, feature 4-5 prominently (see Section 13). Recommended demo set: Hidden Churn Risk (Tier 1), Systemic Product Signal (Tier 2 / Product), Cross-Functional Blind Spot (Tier 3), and one positive pattern (Expansion-Ready or Win/Reference Opportunity). This set demonstrates zoom-in, zoom-out, and meta range while engaging multiple POCs.

---

### Tier 1 — Account-Level Patterns

### Pattern 1: Hidden Churn Risk

**Signal definition:** An account that looks healthy on the surface (high MRR, no escalations, contract not due for 6+ months) but shows a confluence of weak signals that together predict churn.

**Required data sources to detect:**
- CRM (account status, contract dates, opportunity history)
- Product usage (feature adoption, login frequency, advanced feature use)
- Support tickets (volume, sentiment shift, ticket type changes)
- CS notes (sponsor engagement, QBR cadence, escalation hints)
- Sales/CS calls (tone, language, executive sponsor mentions)

**Example synthesis:**
> "Acme Corp looks healthy on standard health scores. But I'm seeing three weak signals that together suggest hidden churn risk: (1) Core feature usage dropped 40% over the last 60 days, (2) support tickets shifted from 'how do I' questions to 'this is broken' language, (3) the executive sponsor stopped attending QBRs after their team reorg in September. Recommended action: schedule an executive check-in with the new sponsor within 2 weeks. Confidence: 78%."

### Pattern 2: Expansion-Ready

**Signal definition:** An account that has been stable but shows organic growth signals — usage spike, new teams onboarding, advanced-use questions in support.

**Required data sources to detect:**
- Product usage (user count growth, new team activations, advanced feature exploration)
- Support tickets (question sophistication shift)
- CRM (no recent expansion conversations)
- Sales/CS calls (mentions of new use cases, internal champion enthusiasm)

**Example synthesis:**
> "Beta Inc has been stable for 18 months at 200 seats. In the last 45 days: usage tripled, three new teams started logging in (Finance, Legal, Ops), and recent support tickets are advanced-use questions about API rate limits and SSO. They're scaling internally. Recommended action: schedule an expansion conversation now — don't wait for renewal in 9 months. Confidence: 85%."

### Pattern 3: Executive Friction (Stealth Competitive Risk)

**Signal definition:** An account is renewing soon. CRM shows everything on track. But: a new buyer-side champion just joined from a competitor, the prior champion left, and the new sponsor hasn't engaged.

**Required data sources to detect:**
- CRM (renewal dates, opportunity status)
- LinkedIn-equivalent signal layer (new sponsor background — mocked in v1)
- Product usage (sponsor login activity)
- CS notes (sponsor relationship status)
- Sales calls (any mentions of competitive evaluation)

**Example synthesis:**
> "Gamma Corp renews in 4 months. CRM shows everything on track. But: the new VP of Engineering joined three weeks ago from CompetitorX, your prior champion left for another company, and the new sponsor hasn't logged in once. This is a stealth competitive risk. Recommended action: immediate executive outreach + competitive playbook activation. Confidence: 71%."

---

### Tier 2 — Portfolio-Level Patterns (Function-Specific)

These patterns only emerge when Atlas reasons *across* accounts. Each is addressed to a specific functional POC in the cross-functional readout.

### Pattern 4: Systemic Product Signal (for the Product leader)

**Signal definition:** A product issue that is invisible at the single-account level but obvious in aggregate. Individually, a few accounts each filing minor tickets about the same feature looks like noise. Aggregated, it is a systemic product problem.

**Required data sources to detect:**
- Support tickets across all accounts (clustering by feature/topic)
- Product usage (correlating ticket clusters with usage drops on the same feature)
- CRM (to size the ARR exposure of affected accounts)
- CS notes (corroborating qualitative friction)

**Cross-account reasoning required:** This pattern cannot be found by looking at one account. The agent must cluster signals across the portfolio.

**Example synthesis:**
> "7 of your 25 accounts have logged support tickets about the new collaboration feature's sync behavior in the last 45 days — concentrated in accounts with 500+ seats. Individually each looked minor; together this is a systemic issue affecting 28% of the portfolio and ~$14M ARR. Recommended action: escalate to the product team with the affected-account list and severity scoring. Confidence: 82%."

### Pattern 5: Support Load Concentration (for the Support leader)

**Signal definition:** Support effort is rising, but the *nature* of the rise matters. Atlas distinguishes "good" load (growth, expansion, sophistication) from "bad" load (friction, onboarding gaps, churn precursors).

**Required data sources to detect:**
- Support tickets (volume trends, distribution across accounts, ticket category)
- CRM (account tenure, onboarding dates)
- Product usage (whether load correlates with growth or struggle)
- CS notes (sentiment context)

**Cross-account reasoning required:** The agent must analyze the *distribution* of support load, not just the total.

**Example synthesis:**
> "Support ticket volume is up 60% quarter-over-quarter, but it's not evenly distributed — 80% of the increase comes from 4 accounts, all onboarded in the last two quarters. This looks like an onboarding gap, not a product defect. Recommended action: targeted enablement for these 4 accounts before the load compounds. Confidence: 76%."

### Pattern 6: Feedback-to-Roadmap Disconnect (for the Product leader)

**Signal definition:** A mismatch between what customers are demanding (across calls, tickets, and CS notes) and what the product roadmap is investing in. Surfaces both under-served demand and over-invested low-demand features.

**Required data sources to detect:**
- Sales/CS calls (feature requests, mentioned needs)
- Support tickets (feature gaps expressed as friction)
- CS notes (explicit customer asks)
- Roadmap data (a mock roadmap artifact for v1 — see Section 7)

**Cross-account reasoning required:** The agent aggregates demand signals across the portfolio and compares against roadmap investment.

**Example synthesis:**
> "Across the last quarter, 'granular permissions' was the most-requested capability — mentioned in 11 sales/CS calls and 30+ tickets. It is not on the current roadmap. Meanwhile, the 'AI summary' feature consuming significant roadmap investment has been mentioned by only 2 accounts. Recommended action: roadmap review with the Product leader. Confidence: 79%."

### Pattern 7: Win / Reference Opportunity (for the Marketing leader)

**Signal definition:** The positive inverse of churn — accounts that are not just healthy but exemplary, and ripe for case studies, references, or advocacy.

**Required data sources to detect:**
- Product usage (top-decile adoption, sustained engagement)
- CRM (expansion history, healthy contract trajectory)
- Sales/CS calls (sponsor enthusiasm, public praise, advocacy signals)
- CS notes (relationship strength)

**Cross-account reasoning required:** The agent ranks accounts against the portfolio to identify standouts.

**Example synthesis:**
> "Helios Corp has hit top-decile usage, their sponsor publicly praised the product in a recent QBR call, and they've expanded twice in 12 months. They are an ideal reference candidate for the upcoming enterprise campaign. Recommended action: Marketing to initiate a case study conversation. Confidence: 88%."

---

### Tier 3 — Organizational Pattern (Meta)

### Pattern 8: Cross-Functional Blind Spot

**Signal definition:** Atlas detects when different functions hold *contradictory* views of the same account — Sales is optimistic, Support sees escalation, Product sees declining usage. This is a pattern about the organization's own coordination failure, not about the customer directly. It is the exact failure mode the monthly cross-functional readout exists to catch — and Atlas catches it automatically.

**Required data sources to detect:**
- CRM (Sales-logged status, forecast)
- Support tickets (Support's view of the account)
- Product usage (objective engagement reality)
- CS notes (CS's relationship read)
- Sales/CS calls (stated sentiment vs other signals)

**Cross-functional reasoning required:** The agent compares how each function characterizes the same account and flags divergence.

**Example synthesis:**
> "Nimbus Inc is a coordination risk. Sales has marked it 'green' and is forecasting expansion. But Support shows a 3x ticket spike over 60 days, and CS notes flag growing sponsor frustration. Your teams are not aligned on this account. Recommended action: surface Nimbus explicitly in the next cross-functional review so the functions can reconcile their views. Confidence: 74%."

**Why this pattern is special:** It is the hardest for a competitor to replicate (it requires reasoning *about* the data sources' disagreement, not just the data), it is the most novel insight type, and it most directly embodies why the cross-functional readout exists. It is a co-flagship pattern alongside Hidden Churn Risk.

---

## 6. User Journey

### Stage 0: Stage-Setter Entry (Demo Only)

Before the actual product, demo users see a one-screen intro that establishes context:
- Problem framing (the readout prep cycle pain)
- Meet Sarah Simmons (1 paragraph about her role and what she owns)
- "Before Atlas" visual — small graphic showing fragmented systems
- "Enter Atlas" button → transitions to the live product

This panel has a "Demo Context" badge and is not part of the production app.

### Stage 1: Land in the Briefing

Sarah opens Atlas Monday morning. She sees:
- A warm greeting line ("Good morning, Sarah. Here's what changed since Friday.")
- The top insight cards, deliberately spanning the tiers — account-level, portfolio-level, and organizational — each with synthesis + confidence + suggested action
- A portfolio pulse showing the 25 accounts segmented by Atlas tags
- A subtle indicator that Atlas pushed her a Teams notification at 7:14am about Acme

Time to first insight: <3 seconds.

### Stage 2: Drill Into an Insight

Sarah clicks the Hidden Churn Risk card on Acme. She lands on a focused view that shows:
- The full synthesis written as a paragraph (not bullet points)
- A "How I figured this out" expander → shows the agent's reasoning chain (which sub-queries it ran, which sources it hit, how it weighted signals)
- Provenance for every claim — click "support tickets shifted in language" → see the specific tickets with timestamps
- A confidence calibration meter — Sarah can adjust her trust threshold and see how many other accounts would surface
- The recommended action prominently displayed at the bottom

### Stage 3: Ask Follow-Up Questions

Sarah types: "What was the sponsor's last call like?"
- Atlas pulls the most recent sales call summary
- Surfaces a 2-paragraph summary with key quotes and sentiment
- Notes which other team members were on the call
- Offers a follow-up: "Want me to compare this to the call before the reorg?"

Sarah types: "Has this pattern shown up in any other accounts?"
- Atlas runs a similarity search across the portfolio
- Returns 2 other accounts with matching patterns at different stages
- Offers to add this pattern to the Briefing for next week so her CS leader can watch for it

### Stage 4: Take an Action

Sarah clicks "Schedule executive check-in" on the recommended action. Atlas shows:
- The action breakdown: "Atlas will draft an email to Mark (CSM), create a calendar invite proposal, update the CRM record with a risk flag, and notify the account team in Slack."
- An autonomy indicator for each sub-action — drafts require human review, the CRM flag and Slack notification are autonomous.
- A preview of each artifact (email draft, calendar invite, Slack message).
- An "Approve all" button + the ability to edit/reject individual items.

Sarah edits the email slightly, approves all, and the actions fire. Atlas confirms execution with a "Done. I'll follow up with you Friday on outcomes" message.

### Stage 5: Continuous Loop

Throughout the week:
- Atlas continues running in the background
- Notifications appear in Teams when relevant
- Cross-functional contributors log notes that feed Atlas's model
- When Sarah opens Atlas again on Thursday, the Briefing has updated — the Acme pattern is now showing remediation progress, two new patterns surfaced elsewhere, her CS leader added context to one of the cards.

---

## 7. Data Model & Sources

### Scope

- **25 mock enterprise accounts** (named after generic-sounding companies — Acme, Beta, Gamma, Helios, Nimbus, etc.)
- **12 months of synthetic data** across all sources
- **Pattern density (generation guidance, not a fixed spec):** The data must support all eight insight patterns across the three tiers, at a density rich enough for a meaningful demo. The counts below are *approximate generation targets* — the actual numbers are whatever emerges and are recorded in the sealed `ground_truth.json` (see "Data generation principle" below). They are guidance for the data generator, never inputs the agent sees.
  - *Tier 1 (account-level):* roughly 2-4 accounts carrying Hidden Churn Risk, ~2 carrying Expansion-Ready signals, ~1-2 carrying Executive Friction.
  - *Tier 2 (portfolio-level):* a Systemic Product Signal spanning roughly 6-8 accounts (clustered support tickets on one feature), a Support Load Concentration visible in roughly 3-5 recently-onboarded accounts, a Feedback-to-Roadmap Disconnect between aggregated demand and the mock roadmap, and roughly 2-3 accounts qualifying as Win/Reference Opportunities (top-decile health).
  - *Tier 3 (organizational):* roughly 2 accounts carrying a Cross-Functional Blind Spot — deliberate contradiction between Sales-logged optimism and Support/Product/CS reality.
  - Patterns can overlap on the same account (e.g., an account in the Systemic Product Signal cluster may also be a Hidden Churn Risk). The remaining accounts are "noisy normal" — varied health states without flagship patterns.
  - **Important:** Tier 2 and Tier 3 patterns are properties of the *portfolio*, not single accounts. Ground truth for these is defined as a set of accounts plus an aggregate condition (see Section 10). The authoritative record of everything baked in — exact counts, account IDs, pattern types, member sets — is the sealed `ground_truth.json`, never the numbers in this section.

### Entity model

**Account**
- account_id, name, industry, employee_count, ARR, contract_start, contract_end
- assigned_csm, assigned_ae, executive_sponsor
- health_score (computed, not authoritative)
- tags (Atlas-assigned)

**User** (within an account)
- user_id, account_id, name, role, email, last_login_at
- is_executive_sponsor, is_decision_maker

**SupportTicket**
- ticket_id, account_id, created_at, status, severity
- subject, body, sentiment_score, category (auto-classified)

**UsageEvent**
- event_id, account_id, user_id, feature_name, timestamp
- event_type (login, feature_use, api_call), duration_seconds

**CallSummary** (sales/CS calls)
- call_id, account_id, attendees, date, duration
- summary (text), sentiment, key_topics, action_items, competitor_mentions

**CSNote**
- note_id, account_id, author, created_at, category (relationship, risk, opportunity, general)
- content (text), tagged_users

**CrossFunctionalSignal** (logged by team members in Atlas itself)
- signal_id, account_id, contributor_id, created_at, signal_type (risk, opportunity, observation)
- content, evidence_links

**RoadmapItem** (a mock product roadmap — needed for Pattern 6: Feedback-to-Roadmap Disconnect)
- item_id, feature_name, status (planned, in_progress, shipped, backlog)
- target_quarter, investment_level (low, medium, high)
- description

### Data sources strategy

Hybrid approach per earlier decision:
- **CRM data:** Synthetic (HubSpot-like schema). Mock JSON files.
- **Support tickets:** Hybrid. Use real GitHub Issues from a large open-source project as a base (e.g., scrape 500 issues from a popular repo) + synthetically tag them with account_ids to simulate ticket assignment.
- **Product usage:** Synthetic, generated with deliberate patterns embedded.
- **Call summaries:** Synthetic — generated by Claude with explicit pattern injection.
- **CS notes:** Synthetic — generated by Claude.
- **Roadmap:** Synthetic — a small mock roadmap (~15-20 items) generated so that one high-demand feature is deliberately absent and one low-demand feature is deliberately funded, to support Pattern 6.

### Time-series structure

All data spans the same 12-month window. Patterns are baked in with realistic decay/build-up curves:
- *Hidden Churn* accounts show gradual usage decline starting around month 8-10, with lagging support-sentiment shift and sponsor disengagement
- *Expansion-Ready* accounts show usage acceleration and new-team activation starting around month 9-10
- *Executive Friction* accounts show no surface change but recent (month 10-12) sponsor turnover events
- *Systemic Product Signal:* the ~7 affected accounts each begin logging tickets clustered on one feature around month 9-11, with correlated usage dips on that feature
- *Support Load Concentration:* the ~4 affected accounts have contract_start dates in the most recent two quarters and rising ticket volume from onboarding-type questions
- *Feedback-to-Roadmap Disconnect:* aggregated demand for one feature ("granular permissions") builds across calls and tickets through the year while the mock roadmap shows it absent and a low-demand feature funded
- *Win/Reference:* the ~2-3 standout accounts show sustained top-decile usage and positive call sentiment throughout
- *Cross-Functional Blind Spot:* the ~2 affected accounts have Sales-logged "green" status and optimistic forecasts that contradict their support/usage/CS reality

### Data generation principle

The integrity goal: the agent must operate **fully blind**. It should surface whatever patterns the evidence genuinely supports — flagging as many or as few accounts as the data warrants — with no knowledge of how many patterns exist or which accounts carry them. This is what makes the precision/recall measurement in Section 10 an honest signal rather than teaching to the test.

To achieve this:

- **Separate generation from agent design.** Synthetic data is generated by Claude in a *separate session* from agent development. The data generation prompt randomizes pattern timing, signal strength, noise levels, account names, industries, and contextual details.
- **The pattern count is an outcome, not an input.** Data generation ensures a *sufficient density* of patterns for a meaningful demo (so the briefing isn't barren), but the exact number of pattern-bearing accounts is not pre-set as a fixed target. It is whatever emerges from realistic generation — it might be 5, it might be 8.
- **Ground truth is sealed.** After generation, what was actually baked in is recorded in a separate answer-key file (`ground_truth.json`) — the set of pattern-bearing accounts, their pattern types, and the member sets for portfolio- and organization-level patterns.
- **Strict visibility separation.** The agent and its prompts never see `ground_truth.json`. Only the eval harness reads it, and only after the agent has produced its output, to score precision/recall. The agent has no access to the count, the labels, or any signal of how many patterns exist.

This mirrors standard ML evaluation practice: the test set has labels, the model never sees them, and an external scorer compares predictions to labels after the fact.

**Talk-track note (for Chewy):** "The agent runs completely blind. The number of patterns isn't fixed or known to it — it surfaces what the evidence supports. Ground truth lives in a sealed answer key that only the eval harness sees. That's how I get an honest precision/recall measurement instead of teaching to the test."

### Data generation workflow

Data generation is executed as a separate, self-contained task, governed by its own brief:
`data-generation-spec.md`. That spec restates the schemas, the eight patterns, the
randomization requirements, and the `ground_truth.json` structure in full, so the
generation task does not need to read this PRD.

**Required workflow — do this before building any agents:**

1. Open a *new, dedicated Claude Code session* (or separate chat) with no agent-building
   history in context. Isolation is mandatory: the session that places the patterns must
   never be the session that builds the detection agents, or the evaluation is invalidated.
2. Feed that session `data-generation-spec.md` and have it produce the full `data/`
   directory, including the sealed `data/ground_truth.json`.
3. Run the usability checklist at the end of the spec. When it passes, close that session
   and do not reopen it.
4. All subsequent agent-building sessions read from `data/` but are forbidden — by the
   project `CLAUDE.md` — from reading `data/ground_truth.json`. Only the evaluation harness
   reads the answer key.

The schemas in `data-generation-spec.md` are kept identical to the entity model above; the
agents are coded against these exact field names, so the generated data is directly usable
without a transformation step.

---

## 8. Architecture & Multi-Agent System

### Architectural philosophy

Atlas is built as a system of specialized agents that coordinate, not a single monolithic agent. This mirrors the direction of frontier agentic systems (Microsoft Agent Factory, multi-agent orchestration patterns) and avoids the failure mode of one agent trying to do everything.

### The five agents

**1. Signal Agent**
- *Role:* Watches data streams continuously, detects when patterns are emerging.
- *Input:* Raw data from all 5 sources.
- *Output:* Tagged signals with timestamp, account_id, signal_type, raw_evidence.
- *Runs:* Periodically (every N minutes in production; on-demand for the demo).

**2. Synthesis Agent**
- *Role:* Takes signals + context and produces narrative synthesis.
- *Input:* Signals from Signal Agent + historical context from Memory Agent.
- *Output:* Insight cards with synthesis, supporting evidence, provenance, confidence level.
- *Runs:* Triggered by Signal Agent or user query.

**3. Recommendation Agent**
- *Role:* Translates synthesis into recommended actions.
- *Input:* Insight cards + organizational context (Sarah's team structure, past actions).
- *Output:* Recommended actions with autonomy levels, action breakdowns, and predicted outcomes.
- *Runs:* Triggered by Synthesis Agent or user request.

**4. Execution Agent**
- *Role:* Carries out approved actions across systems.
- *Input:* Approved action with parameters.
- *Output:* Action execution + confirmation + outcome tracking.
- *Runs:* On user approval; some autonomous low-risk actions fire independently.

**5. Memory Agent**
- *Role:* Maintains institutional memory — what Sarah has flagged, ignored, acted on, how her judgment has evolved.
- *Input:* All user interactions, all agent outputs, all action outcomes.
- *Output:* Context that other agents use for personalization and calibration.
- *Runs:* Continuously, updated after every meaningful event.

### Agent coordination

A lightweight orchestrator routes between agents. For example, a Briefing build:
1. Signal Agent surfaces 50 raw signals from the past 7 days
2. Memory Agent filters and ranks based on Sarah's historical interest patterns
3. Synthesis Agent groups top signals into 3-5 coherent insights
4. Recommendation Agent attaches actions to each insight
5. Briefing is assembled and rendered

For a Query:
1. User question → Synthesis Agent decomposes into sub-queries
2. Sub-queries hit relevant data sources
3. Synthesis Agent assembles response with provenance
4. If action is implied, Recommendation Agent suggests next steps

### MCP-native design

Atlas is built MCP-native (Model Context Protocol). This means:

**As an MCP server:** Atlas exposes its synthesis capabilities through MCP. Other agents at the customer organization (sales agents, CS agents, marketing agents, Microsoft Copilot) can query Atlas for synthesized customer context without going through a UI.

*Example:* A sales agent preparing for a meeting with Acme can MCP-query Atlas: "What should I know about Acme before this call?" Atlas returns synthesized context with provenance.

**As an MCP client:** Atlas consumes data from source systems via MCP where available. As enterprise systems increasingly expose MCP servers (CRM systems, support platforms, productivity suites), Atlas can plug in without custom integrations.

This is forward-looking architecture, but it's the direction the industry is moving. Building MCP-native from day one is a strong differentiation signal.

### Agentic retrieval pattern

Within each agent, retrieval follows the Foundry IQ-inspired pattern (vendor-neutral implementation):

1. **Plan:** Decompose the question into sub-queries
2. **Search:** Route sub-queries to appropriate data sources in parallel
3. **Rank:** Score results semantically against the original question
4. **Reflect:** Evaluate whether the gathered evidence is sufficient; iterate if not
5. **Synthesize:** Produce final output with provenance

This pattern replaces traditional single-shot RAG and is what makes Atlas capable of multi-source reasoning.

### Tech stack (initial recommendation; subject to decision points)

- **Frontend:** Next.js + Tailwind + shadcn/ui (customized — see Section 11)
- **Backend:** Python + FastAPI for agent orchestration
- **Agent framework:** TBD — likely LangGraph for stateful multi-agent workflows; raw Python + Claude API if LangGraph adds too much complexity. *DECISION POINT during build.*
- **State management:** SQLite for prototype simplicity. *DECISION POINT if scaling is needed.*
- **Model:** Claude (primary) — Opus for reasoning-heavy agents (Synthesis, Recommendation), Sonnet for high-volume agents (Signal, Memory).
- **Vector store:** TBD — may not need one for v1 since data volume is bounded. *DECISION POINT.*
- **Deployment:** Vercel (frontend) + a lightweight backend host (Render or Railway).

---

## 9. Action Framework & Configurable Autonomy

### Action levels (Level 3 vision)

Atlas takes real actions across systems. Actions are not "the agent recommends, the user does the work elsewhere." Actions fire from Atlas itself, with appropriate governance.

### The autonomy spectrum

Each action type has a default autonomy level, configurable per organization, per user, per action:

- **Autonomous:** Atlas executes without human review.
  - *Examples:* Internal Slack messages to the team, CRM field updates (flags, notes), creating internal Jira/ADO tickets, scheduling internal coordination meetings.

- **Human-in-the-loop (review-then-execute):** Atlas drafts; user reviews, edits if needed, approves.
  - *Examples:* Emails to customers, calendar invites with external attendees, draft proposals, marketing campaign triggers.

- **Human-driven (Atlas recommends only):** Atlas surfaces the recommendation; user takes the action manually elsewhere.
  - *Examples:* High-stakes executive escalations, contract negotiations, anything with legal/compliance implications.

### Action types built for the demo

These are the cross-system orchestration actions Atlas can perform:

1. **Schedule executive check-in:** Drafts email to CSM, generates calendar invite with proposed times, drafts internal Slack message to RVP, updates CRM with action_taken flag.
2. **Activate competitive playbook:** Updates Salesforce opportunity with risk flag, reassigns to senior CSM, generates a custom competitive brief, triggers a marketing nurture sequence.
3. **Initiate expansion conversation:** Drafts customer-facing email proposing expansion discussion, generates pricing scenarios based on current usage trajectory, creates a deal record, notifies AE.
4. **Escalate to product:** Creates ADO/Jira ticket with affected accounts, severity score, and recommended scope, tagged with the responsible product lead.
5. **Generate brief:** Produces a one-page summary of an account/pattern for use in a 1:1 or executive review.

### Action UI principles

When Sarah clicks an action:
- She sees a breakdown of every sub-action with its autonomy level
- She sees a preview of every artifact that will be generated
- She can edit, approve, or reject individual sub-actions
- After execution, she gets a confirmation with outcome tracking ("Email sent to Mark. I'll check on response by Friday.")

### Governance & observability (talk-track for Chewy)

In production, this would integrate with Microsoft's Agent 365 governance layer. For the prototype, Atlas exposes:
- An audit log of every action taken
- Confidence scores for every recommendation
- An "explain this action" expander that shows the reasoning chain that led to the action
- Reversibility metadata (which actions can be undone, which cannot)

---

## 10. Evaluation Framework

This section is Atlas's secret weapon. Most vibecoded portfolio projects skip evals; building this in from day one is what separates a portfolio from a product.

### Four evaluation layers

**Layer 1: Retrieval correctness**

*Question:* Did the agent decompose the user's question into sub-queries that hit the *right* data sources?

*Method:* For each test query, define a "must-hit" set of sources and a "nice-to-hit" set. Measure recall against must-hits.

*Example:* Query "Why is Acme's health declining?" must hit CRM + Support + Usage + CS Notes. If the agent only hits CRM and Usage, retrieval failed regardless of final synthesis quality.

*Target:* >90% must-hit recall on a test set of 20 queries.

**Layer 2: Reasoning correctness (the hallucination test)**

*Question:* Did every factual claim in the synthesis trace back to specific data points in the retrieved evidence?

*Method:* For each synthesis output, manually audit every factual claim. Score the percentage that are grounded (traceable) vs invented (hallucinated).

*Target:* 100% grounding on factual claims (note: subjective claims like "this looks like hidden churn" are excluded from grounding — they're synthesis judgments).

**Layer 3: Insight quality (precision & recall on baked-in patterns)**

*Question:* Does the agent surface the *right* insights — the ones that match the patterns we deliberately baked into the data?

This layer is evaluated separately for each tier, because account-level and portfolio-level patterns have different ground-truth structures. In every case, ground truth comes from the sealed `ground_truth.json` produced at data generation (see Section 7) — the agent never sees it; the eval harness reads it only to score, after the agent has produced its output.

*Tier 1 — Account-level patterns:* Ground truth is the set of pattern-bearing accounts recorded in `ground_truth.json` (Hidden Churn, Expansion-Ready, Executive Friction — exact counts are whatever generation produced, not a fixed number). The agent should flag those accounts and not over-flag the noisy-normal accounts.
- **Precision:** Of the accounts the agent flagged, what % carried a real baked-in account-level pattern? Target: >85%.
- **Recall:** Of the account-level pattern accounts in `ground_truth.json`, what % did the agent catch? Target: >90%.
- **Pattern accuracy:** When the agent flagged a real pattern account, did it identify the correct pattern type? Target: >80%.

*Tier 2 — Portfolio-level patterns:* Ground truth is defined in `ground_truth.json` as an *aggregate condition plus a member set* — e.g., "Systemic Product Signal = the cluster of accounts with tickets on feature X." The agent must surface the aggregate insight, not just the individual account signals.
- **Aggregate detection:** Did the agent surface each portfolio-level pattern present in ground truth as a single cross-account insight? Target: all of them.
- **Member-set accuracy:** For each detected portfolio pattern, how well does the agent's identified account set match the ground-truth member set (precision/recall on the member set)? Target: >80% F1.
- **Mis-aggregation check:** Did the agent avoid inventing portfolio patterns that aren't in ground truth? Target: zero false aggregate patterns.

*Tier 3 — Organizational pattern:* Ground truth is the set of accounts with deliberate cross-functional contradiction recorded in `ground_truth.json`.
- **Detection:** Did the agent surface the Cross-Functional Blind Spot for those accounts? Target: catch all of them.
- **Contradiction articulation:** Did the agent correctly name *which* functions disagreed and *how*? Scored qualitatively. Target: clear and correct on both.

**Layer 4: Action correctness**

*Question:* Does the agent recommend the *right* action for the situation?

*Method:* For each baked-in pattern across all three tiers, define the "correct" action class (e.g., Systemic Product Signal → escalate to product with affected-account list; Cross-Functional Blind Spot → surface in cross-functional review). Compare agent recommendations to ground truth. This is more qualitative — score on alignment, not exact match.

*Target:* >80% alignment with expected action class.

### Evaluation surface in the demo

Atlas includes an "Eval Mode" view (for the demo audience, not production users) that shows:
- Live precision/recall on baked-in patterns
- Retrieval recall across recent queries
- Grounding audit results
- Action alignment scores

This view is a talk-track moment with Chewy: "Here's how I measure whether the agent is actually working. I baked specific patterns into specific accounts deliberately and measure precision/recall against ground truth."

### Confidence calibration

Each insight comes with a confidence score (0-100%). Calibration means: when Atlas says "78% confidence," it should be right 78% of the time.

In production, calibration would be measured against outcomes (did the predicted churn actually happen?). For the demo, calibration is measured against the baked-in ground truth (was the pattern actually present?).

Users can adjust their trust threshold. Sarah might set her Briefing to show only insights >75% confidence; her CS leader who wants exploratory signals might set theirs to >50%.

---

## 11. Design Principles & System

### Design philosophy

Atlas's design rejects two failure modes:
1. **Vibecoded aesthetics:** Generic Tailwind defaults, off-the-shelf shadcn themes, emoji as UI, bouncy animations.
2. **Old enterprise aesthetics:** Heavy borders, cramped layouts, dense tables, low-contrast greys, default Material/Bootstrap looks.

### Design language

The reference points:
- **Linear** for ambient elegance, hierarchical density, monochrome with single accent
- **Vercel dashboard** for data-dense executive surfaces
- **Stripe** for numeric polish, table treatments, trend charts
- **Notion** for the conversational/document surface
- **Arc Browser** for delight without gimmickry
- **Raycast** for the keyboard-first command surface (Query mode)

### Color system

- **Base:** Tailwind `zinc` palette (sophisticated cool greys, neither warm nor blue-tinted)
- **Accent:** A single strong color used sparingly — deep teal (`#0F766E` / `teal-700`) or a custom muted blue. *Deliberately avoid Microsoft blue (#0078D4) — too on-the-nose for a Microsoft demo.*
- **Signal colors:**
  - Risk: `red-600` used only for genuine alerts, not decoration
  - Opportunity: `emerald-600` for expansion signals
  - Neutral: `zinc-500` for everything informational

### Typography

- **Primary:** Geist Sans (Vercel's font, free) or Inter as fallback
- **Mono (data, code, timestamps):** Geist Mono or JetBrains Mono
- **Hierarchy:**
  - Display headings: 32px / 600 weight
  - Section headings: 20px / 600 weight
  - Body: 14px / 400 weight, 1.6 line height
  - Small/meta: 12px / 500 weight, uppercase for labels

### Spacing & layout

- **Generous padding:** Default cards have 24px padding, sections have 48px breathing room
- **Grid:** 12-column at desktop, 4-column on tablet
- **Max content width:** 1280px for the main surface; 640px for conversational query
- **Card style:** Subtle border (`zinc-200`), no heavy shadows. Hover state lifts with shadow + slight border emphasis.

### Iconography

- **Library:** Lucide icons (shadcn default) — used sparingly
- **Never use emoji** as functional UI elements
- **Icon size:** 16px for inline, 20px for buttons, 24px for headers

### Motion

- **Use Framer Motion** for transitions
- **Principle:** Motion communicates state change, never decoration
- **Timing:** 150-200ms ease-out for hover states; 300ms ease-in-out for view transitions; subtle entrance fades for new content

### Data visualization

- **Recharts or Tremor** for charts (not Chart.js — too default-looking)
- **Style:** Minimal axes, no gridlines unless required, single accent color per chart, clear labels
- **Sparklines** for inline trend indicators in account rows
- **Avoid pie charts** unless absolutely necessary

### Mode-specific design

**Briefing mode (Bloomberg-density meets Linear elegance):**
- Dense information layout with clear zones
- Multiple cards visible without scrolling
- Quick scanning patterns

**Query mode (Raycast-inspired):**
- Centered input with generous whitespace
- Command-K-like keyboard affordances
- Conversational flow with clear message boundaries
- Animated reasoning trace as agent works

### Critical "don't" list

- ❌ Don't use default shadcn themes — customize
- ❌ Don't use emoji in UI (except in user-generated content)
- ❌ Don't use bouncy/playful animations
- ❌ Don't use rounded-full cards (rounded-lg max, usually rounded-md)
- ❌ Don't use Microsoft blue
- ❌ Don't use Comic Sans (obvious but worth noting)
- ❌ Don't use stock illustrations
- ❌ Don't put more than 3 colors on screen at once (zinc shades count as one)

---

## 12. Out of Scope / Future State

What we're explicitly *not* building in v1, with brief notes on why and what comes next.

**Out of scope for the demo:**

- **Real auth.** No login, no SSO, no user management. Demo opens directly into Sarah's persona.
- **Real data integrations.** No live Salesforce/Zendesk/Mixpanel connections. All data is mocked or hybrid.
- **Mobile responsiveness.** Demo is desktop-first. Mobile is future state.
- **Multi-tenant.** One persona, one organization, one product line. No cross-tenant isolation.
- **Real action execution.** Actions in the demo update mock state. They do not actually fire emails, create CRM records, or post to Slack. The orchestration logic is real; the execution is simulated.
- **Long-term memory persistence.** Memory Agent works within a session but does not persist across long time windows for the demo. In production, this would be a vector store + structured memory database.
- **Confidence calibration learning.** Confidence scores are computed from heuristics in v1, not learned from outcomes. Production would calibrate against actual outcomes.

**Future state (talk about, don't build):**

- Integration with Microsoft Agent Framework + Agent 365
- True multi-tenant deployment with org-specific configuration
- Long-term institutional memory with vector + structured storage
- Predictive modeling (not just pattern detection, but probabilistic forecasts)
- Workflow customization (Sarah-specific automations, team-specific dashboards)
- API for third-party agents to consume Atlas synthesis (MCP server productization)

---

## 13. Demo Flow

### Demo length target: 8-10 minutes of product, 25-30 minutes of conversation

### Demo script

**Minute 0-1: Stage-setter**
- Open the deployed Atlas URL
- Land on the intro panel
- Walk through the problem in 60 seconds
- Click "Enter Atlas"

**Minute 1-3: The Briefing**
- Land in Sarah's Monday morning view
- Point out the proactive notification indicator from Atlas's overnight run
- Walk through the top insight cards — deliberately show the *range*: an account-level card (Hidden Churn on Acme), a portfolio-level card (Systemic Product Signal across ~7 accounts), and the organizational card (Cross-Functional Blind Spot on Nimbus)
- Note the portfolio pulse showing tags
- Talk-track: "Notice these aren't all the same kind of insight. Some are about one customer. Some only exist when you look across the portfolio. One is about my own org's coordination."

**Minute 3-5: Drill into an account-level insight**
- Click the Hidden Churn Risk card on Acme
- Walk through the synthesis
- Open the "How I figured this out" expander → show the reasoning chain
- Demonstrate provenance — click on a claim to see the source

**Minute 5-6: Drill into a portfolio-level insight (engages a different POC)**
- Click the Systemic Product Signal card
- Show how it aggregates ticket clusters across ~7 accounts that look like noise individually
- Talk-track: "This is the insight my Product lead needs — and no single account view would surface it. This is also where the cross-account reasoning matters."

**Minute 6-7: Query Mode**
- Type a follow-up question: "Which other accounts show early signs of the same churn pattern as Acme?"
- Show the multi-source reasoning
- Show a cross-portfolio insight surfacing
- Optionally: show the Cross-Functional Blind Spot via query ("Where are my teams not aligned?") if time allows

**Minute 7-9: Action**
- Click the recommended action
- Walk through the action breakdown
- Show autonomy indicators
- Approve actions, show confirmation
- Point out the memory note ("I'll follow up Friday")

**Minute 9-10: Eval Mode (Chewy-specific moment)**
- Toggle to Eval Mode
- Show precision/recall on baked-in patterns
- Talk-track: "Here's how I measure whether this is actually working"

**Minute 10+: Conversation**
- Transition: "Happy to go deeper on any part of this, or talk about how it'd fit into what your team is working on."
- Be ready for: architecture questions, competitive positioning, "would this work at Microsoft" questions, evaluation questions, failure mode questions.

### Failure modes to honestly surface

If asked: "What does Atlas get wrong?" — have these ready:

1. **Low signal-to-noise scenarios.** When an account has insufficient data across sources, Atlas should explicitly say "low confidence — needs more context" rather than confidently guess. Demo this in Eval Mode by showing a low-confidence insight that Atlas surfaces with appropriate hedging.

2. **Conflicting signals across sources.** If CRM says healthy but support says broken, Atlas should surface both and flag the conflict rather than pick one. Demo this with a specific account.

3. **Outside-of-scope queries.** If Sarah asks "What's the weather in Seattle?" Atlas should decline gracefully rather than hallucinate. This is a small but important moment in the demo if it comes up.

### Backup plan

Pre-record a 3-minute Loom of the full demo. If the live demo has issues (slow API calls, network problems, anything embarrassing), pivot to: "Let me show you a recording I made yesterday — it captures the full flow."

---

## Appendix: Decision Points During Build

Items deliberately left unresolved, to be decided when encountered:

- **Agent framework choice:** LangGraph vs raw Python orchestration
- **Vector store yes/no:** Probably not needed for 25 accounts × 12 months; revisit if data volume grows
- **State management:** SQLite vs Postgres vs in-memory dict
- **Backend hosting:** Render vs Railway vs self-host on Vercel
- **Real-time agent runs vs cached:** For the demo, pre-compute Briefing content. For production, run agents on triggers.
- **How aggressive to be with the proactive Atlas (Teams notifications):** Demo this as a single moment, or thread it throughout?

---

*End of PRD v0.1*
