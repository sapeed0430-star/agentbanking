# Launch Dry Run Report - 2026-03-26 (KST)

## Run Context
- started_at: 2026-03-26 21:31:12 KST
- report_path: /Users/myungchoi/Documents/New project/docs/week2/operations/launch-dryrun-2026-03-26.md
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
3. Integration:  > agentbanking-audit-workspace@1.0.0 check:integration > node scripts/capture-integration-gate-evidence.js  {   "overall": "PASS",   "output_path": "/Users/myungchoi/Documents/New project/docs/week2/backend/evidence/integration-gate-2026-03-26T12-31-13-112Z.json",   "failures": [] } 
4. Test:  > agentbanking-audit-workspace@1.0.0 test > node --test  ✔ POST /verify issues receipt and audit report (15.943709ms) ✔ POST /verify returns 409 on duplicate request_id (5.449042ms) ✔ POST /verify returns 422 integrity failure payload (1.412875ms) ✔ POST /verify returns warning receipt for draft policy version (1.25825ms) ✔ GET /receipts/{id} returns receipt when operator matches (2.532208ms) ✔ GET /receipts/{id} returns 403 when operator does not match (3.272667ms) ✔ POST /verify/offline returns PASS for issued receipt/report (2.572542ms) ✔ POST /verify/offline returns 422 for tampered audit report (1.725417ms) 

## Follow-up Rule
1. Any non-PASS check keeps launch dry run gate locked.
2. Team Lead must approve only when all checks are PASS.
