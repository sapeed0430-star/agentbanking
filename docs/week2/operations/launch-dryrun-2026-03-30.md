# Launch Dry Run Report - 2026-03-26 (KST)

## Run Context
- started_at: 2026-03-26 21:48:07 KST
- report_path: docs/week2/operations/launch-dryrun-2026-03-30.md
- objective: 2026-03-30 Go-Live rehearsal prerequisite verification

## Execution Summary
| Check | Command | Result |
|---|---|---|
| Contract | `npm run check:contract` | PASS |
| Evidence Integrity | `npm run check:evidence` | PASS |
| Integration Stability | `npm run check:integration` | PASS |
| Regression Tests | `npm test` | PASS |

## Final Verdict
- overall: `PASS`

## Key Log Snippets
1. Contract:  > agentbanking-audit-workspace@1.0.0 check:contract > node scripts/check-openapi-contract.js  PASS: OpenAPI contract includes required launch-critical routes and operations. 
2. Evidence:  > agentbanking-audit-workspace@1.0.0 check:evidence > node scripts/check-evidence-integrity.js  PASS: evidence integrity check passed (docs/program/launch-evidence-manifest-2026-03-26.json). 
3. Integration:  > agentbanking-audit-workspace@1.0.0 check:integration > node scripts/capture-integration-gate-evidence.js  {   "overall": "PASS",   "output_path": "/Users/myungchoi/Documents/New project/docs/week2/backend/evidence/integration-gate-2026-03-26T12-48-07-976Z.json",   "failures": [] } 
4. Test:  > agentbanking-audit-workspace@1.0.0 test > node --test  ✔ POST /verify issues receipt and audit report (17.710375ms) ✔ POST /verify returns 409 on duplicate request_id (6.039541ms) ✔ POST /verify returns 422 integrity failure payload (1.502916ms) ✔ POST /verify returns warning receipt for draft policy version (2.018583ms) ✔ GET /receipts/{id} returns receipt when operator matches (4.37075ms) ✔ GET /receipts/{id} returns 403 when operator does not match (3.2915ms) ✔ POST /verify/offline returns PASS for issued receipt/report (5.473792ms) ✔ POST /verify/offline returns 422 for tampered audit report (2.722375ms) 

## Follow-up Rule
1. Any non-PASS check keeps launch dry run gate locked.
2. Team Lead must approve only when all checks are PASS.
