# Team Lead KPI Dashboard Spec (Week 2)

## Scope
- Period: 2026-03-23 to 2026-03-27
- Goal: Monitor execution quality of multi-agent delivery for audit receipt launch readiness.

## KPI Table

| KPI | Definition | Target | Data Source | Owner | Cadence | Trigger Action |
|---|---|---|---|---|---|---|
| Sprint Completion Rate | completed tasks / planned tasks | >= 85% | daily report + task board | Team Lead | Daily 18:00 KST | If < 70% for 2 days, re-scope and reassign |
| On-time Delivery Rate | deliverables submitted by deadline / total deliverables | >= 90% | deliverable checklist | Team Lead | Daily | If < 80%, activate blocker review meeting |
| PR Review SLA | median time from PR open to first review | <= 8h | PR metadata | Backend Agent + Team Lead | Daily | If > 12h, assign backup reviewer |
| Reopen Rate | reopened tasks / completed tasks | <= 10% | task board | Team Lead | Daily | If > 15%, strengthen DoD checks |
| API Contract Drift | FE/BE schema mismatches per day | 0 | schema diff log | Backend + Frontend | Daily | Stop merge for affected modules |
| Verification Success Rate | successful `POST /verify` validations / total requests | >= 99.0% | verification logs | Backend Agent | Daily | If < 98.5%, open Sev-1 investigation |
| Receipt Integrity Failure Rate | invalid signature/hash receipts / total receipts | 0 | integrity checker logs | Backend + Research | Daily | Immediate Sev-0 escalation |
| Compliance Risk Closure Time | mean time to close identified compliance risks | <= 48h | risk register | Research Agent | Daily | If > 48h, Team Lead escalates to owner |
| UX Task Acceptance Rate | accepted UI tasks / submitted UI tasks | >= 90% | design review record | Design + Frontend | Daily | If < 80%, run focused design QA |
| ICP/Pricing Validation Coverage | validated hypothesis count / planned count | >= 80% | marketing experiment notes | Marketing Agent | Daily | If < 60%, narrow ICP focus |

## Dashboard View (Minimum)
1. Delivery panel: completion rate, on-time rate, reopen rate
2. Engineering panel: PR SLA, API contract drift, verify success
3. Risk panel: integrity failure, compliance closure time
4. GTM panel: ICP/pricing validation coverage

## Alert Rule
1. Red: KPI below hard threshold for same day
2. Amber: KPI below target but above hard threshold for 2 consecutive days
3. Green: KPI at or above target

## Daily Check Routine
1. 10:00 KST: status sync and blocker capture
2. 14:00 KST: mid-day KPI checkpoint
3. 18:00 KST: end-of-day KPI update and action assignment

