# Atlas — Project Guide for Claude Code

Atlas is an executive intelligence platform: a continuous, queryable, action-capable
awareness system that synthesizes signals from fragmented enterprise systems into
insights for a business leader who owns a portfolio of customers.

**This is a demo/prototype** built for a portfolio conversation. Optimize for a polished,
defensible, working demo — not production hardening.

## Read first

- `docs/atlas-prd.md` is the full product spec. It is the source of truth for *what*
  Atlas is and does. Read it before implementing a feature. Do not restate it here.
- This file covers *how* to work in this repo. Global coding rules (think before coding,
  simplicity first, surgical changes, goal-driven execution) are in `~/.claude/CLAUDE.md`
  and always apply.

## Tech stack

- Frontend: Next.js + Tailwind + shadcn/ui (customized — see PRD §11 for design tokens)
- Backend: Python + FastAPI for agent orchestration
- Model: Claude — Opus for reasoning-heavy agents (Synthesis, Recommendation),
  Sonnet for high-volume agents (Signal, Memory)
- State: SQLite for the prototype
- Deployment: Vercel (frontend) + lightweight backend host

## Project structure

- `docs/` — PRD and reference docs
- `data/` — synthetic data + the sealed `ground_truth.json` (see below)
- `agents/` — the five agents (Signal, Synthesis, Recommendation, Execution, Memory)
- `backend/` — FastAPI orchestration layer
- `frontend/` — Next.js app
- `eval/` — evaluation harness

## Critical rules for this project

- **The agent must never see `data/ground_truth.json`.** It is the sealed answer key for
  evaluation. Only the eval harness in `eval/` may read it. Never import it, reference it,
  or expose it anywhere in `agents/` or `backend/`. This integrity boundary is essential.
- **Generate synthetic data in a separate session** from agent development. Agent code
  must be written without knowledge of which accounts carry which patterns.
- **Decision points exist** — see PRD Appendix. When you hit one (agent framework,
  vector store, state management, hosting), pause and flag it rather than silently choosing.
- **Design is not an afterthought.** Follow PRD §11 strictly. No default shadcn themes,
  no emoji in UI, no Microsoft blue. The demo's credibility depends on it not looking
  vibecoded.

## Conventions

- Python: type hints throughout, `snake_case`, prefer pure functions for agent logic
- TypeScript/React: functional components, `PascalCase` components, colocate component styles
- Keep agent prompts in dedicated files under `agents/<name>/prompts/`, not inline
- Every insight an agent produces must carry provenance (source references) — this is a
  product requirement, not optional

## Build & run commands

- Frontend dev: `cd frontend && npm run dev`
- Backend dev: `cd backend && uvicorn main:app --reload`
- Run evals: `cd eval && python run_eval.py`
- (Update this section as commands are added.)
