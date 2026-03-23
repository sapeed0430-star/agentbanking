# Team Lead Governance Pack (Week 1)

## 1) Definition of Done (Common)

1. Requirement and acceptance criteria are linked to a backlog item.
2. Security and compliance implications are documented.
3. Code and docs updated together when behavior changes.
4. Unit tests added for new logic and edge cases.
5. API changes include schema and example payload updates.
6. No critical lint/type/build failures in CI.
7. Rollback strategy is documented for production-impacting changes.
8. Reviewer sign-off recorded in pull request.

## 2) Code Review Rules

1. Every PR needs at least one reviewer approval.
2. PR scope should be bounded; avoid unrelated changes.
3. Reviewer checks: correctness, security, observability, operational risk.
4. Sensitive areas (crypto, auth, retention) require domain-owner review.
5. Merge type: squash merge for feature PRs; no direct commits to main.
6. Required PR template sections: context, changes, risk, rollback, test evidence.
7. Blocking comments must be resolved before merge.

## 3) Release Checklist

## Pre-Release

1. Freeze scope and tag release candidate.
2. Confirm migration/backfill impact and rollback plan.
3. Validate API compatibility notes and changelog draft.
4. Verify monitoring dashboards and alert routes.
5. Confirm runbooks for on-call and incident manager.

## During Release

1. Announce deployment window and owners.
2. Execute release runbook steps in order.
3. Monitor error rate, latency, and verification success rate.
4. Keep hotfix branch ready for emergency rollback.

## Post-Release

1. Confirm SLO health for 24 hours.
2. Publish release notes and known issues.
3. Close release ticket with evidence links.
4. Capture retro actions and assign owners.

## 4) Team Operating Cadence

1. Daily async standup by all agent owners.
2. Twice-weekly risk review for security/compliance issues.
3. Weekly demo with cross-functional sign-off.
4. Weekly backlog reprioritization by team lead.

## 5) Git/Release Readiness Checklist (Immediate)

1. Confirm `.gitignore` contains `.DS_Store` and local macOS artifacts are removed.
2. Confirm branch topology: `main`, `develop`, `staging` exist and are clean.
3. Confirm remote is set correctly: `origin=https://github.com/sapeed0430-star/agentbanking.git`.
4. Confirm `main` is pushed with `git push -u origin main`.
5. Push remaining branches with local credentials in hand:
   - `make push-all`
   - If `make push-all` blocks on auth, retry with PAT via interactive prompt.
6. Verify remote branches via `git branch -r`.
7. Close the loop in team note with:
   - push timestamp
   - push result
   - blocked items and owner

## 6) Operational Check Documents

- Origin branch verification checklist: `docs/week1/teamlead/origin-branch-verification-checklist.md`
- Week 2 execution plan: `docs/week2/team2-week-plan.md`
- Week 2 KPI dashboard: `docs/week2/teamlead/kpi-dashboard-spec.md`
- Week 2 RACI and approval gates: `docs/week2/teamlead/raci-approval-gates.md`
- Week 2 escalation SLA: `docs/week2/teamlead/escalation-sla.md`
- Week 2 daily report template: `docs/week2/operations/daily-report-template.md`
- Week 2 agent allocation: `docs/week2/operations/agent-work-allocation-2026-03-23.md`
- 12-week daily tracking plan: `docs/program/12-week-development-plan-daily.md`
- 12-week daily tracking index: `docs/program/daily-tracking-index.md`
- 12-week daily reports folder: `docs/program/daily-tracking/`
- Detailed 4-scope development plan: `docs/program/detailed-plan-product-architecture-integrity-receipt.md`
- Agent ownership reinforcement v2: `docs/program/agent-ownership-plan-v2.md`
