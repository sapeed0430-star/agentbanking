# RACI and Approval Gates (Week 2)

## Roles
- `R`: Responsible (executes)
- `A`: Accountable (final owner)
- `C`: Consulted (input required)
- `I`: Informed (must be notified)

## RACI Matrix

| Workstream | Research | Backend | Frontend | Design | Marketing | Team Lead |
|---|---|---|---|---|---|---|
| Regulatory mapping update | R | I | I | I | C | A |
| Receipt schema/API alignment | C | R | C | I | I | A |
| Signature/timestamp policy | R | R | I | I | I | A |
| Operator console IA/screens | C | C | R | R | I | A |
| Pricing one-pager refinement | C | I | I | C | R | A |
| Release readiness decision | C | C | C | C | C | A |

## Approval Gates

| Gate | Mandatory Inputs | Required Approvers | Pass Criteria | Block Condition |
|---|---|---|---|---|
| G1 Requirements Freeze | updated backlog, acceptance criteria, risks | Team Lead | scope and owner fixed | owner or due date missing |
| G2 Schema/API Freeze | `receipt-1.0.0.schema.json`, `openapi-draft.yaml` | Team Lead + Backend | no FE/BE contract mismatch | unresolved schema mismatch |
| G3 Crypto/Integrity Gate | JCS/JWS/timestamp policy doc | Team Lead + Research + Backend | integrity checks reproducible | unverifiable signature path |
| G4 UX Gate | IA + receipt detail flow | Team Lead + Frontend + Design | critical user path complete | missing receipt evidence path |
| G5 GTM Gate | ICP and pricing one-pager update | Team Lead + Marketing | pricing and ICP message aligned | no target segment clarity |
| G6 Release Candidate Gate | checklist, rollback plan, KPI snapshot | Team Lead | all critical checks green | any Sev-0/Sev-1 open |

## Decision Policy
1. Any gate failure blocks merge to `staging` and `main`.
2. Team Lead can grant temporary waiver only with written risk acceptance.
3. Waiver expires in 72 hours and must be closed by follow-up action.

