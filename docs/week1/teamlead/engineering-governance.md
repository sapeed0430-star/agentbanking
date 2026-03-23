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
