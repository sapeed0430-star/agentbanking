# 12-Week Development Plan (Daily Tracking Mode)

## Program Window
- Start: 2026-03-23 (Mon, KST)
- End: 2026-06-14 (Sun, KST)
- Tracking policy: no weekly status roll-up as source of truth. Daily reports are the only authoritative progress record.

## Build Scope
1. Audit receipt schema and verification API
2. Cryptographic integrity pipeline and proof artifacts
3. Operator console and evidence-centric UX
4. Compliance mapping and operational governance
5. Pricing/GTM and launch readiness

## Daily Operating Contract
1. All 6 agents run in parallel and submit hourly checkpoint reports (every hour, by `:50` KST).
2. Team Lead must verify and issue one verdict every hour (at `:00` KST):
- `PASS`
- `PARTIAL PASS`
- `BLOCK`
3. Every verdict must include:
- rationale
- blocking items
- corrective actions
- evidence links
4. Agent task progression rule:
- `PASS` required before moving to the next queued task in that agent lane.
- `PARTIAL PASS` allows only team-lead-approved scoped continuation.
- `BLOCK` freezes next-task execution until re-validation.
5. Day is not closed if any hourly verdict is missing.

## Source-of-Truth Documents
1. Daily index:
- `docs/program/daily-tracking-index.md`
2. Daily report files:
- `docs/program/daily-tracking/YYYY-MM-DD.md`
3. Team governance baseline:
- `docs/week1/teamlead/engineering-governance.md`
4. Detailed 4-scope plan:
- `docs/program/detailed-plan-product-architecture-integrity-receipt.md`
5. Agent ownership reinforcement:
- `docs/program/agent-ownership-plan-v2.md`

## Phase Milestones (Reference Only)
- Phase A (2026-03-23 to 2026-04-12): contract freeze and control framework
- Phase B (2026-04-13 to 2026-05-10): implementation and integration hardening
- Phase C (2026-05-11 to 2026-06-14): readiness, launch, and post-launch operations

## Completion Definition
1. All daily reports from 2026-03-23 to 2026-06-14 exist.
2. Every daily report contains Team Lead verdict and evidence links.
3. No unresolved `BLOCK` verdict remains at program close.
