# Integration Stability Check - 2026-03-26 (KST)

## Goal
Capture launch-critical end-to-end integration evidence for the 2026-03-29 integration stability gate.

## Execution
1. Command:
- `npm run check:integration`
2. Script:
- `scripts/capture-integration-gate-evidence.js`
3. Evidence output:
- `docs/week2/backend/evidence/integration-gate-2026-03-26T12-23-41-643Z.json`

## Result Summary
- Overall verdict: `PASS`
- Run id: `f2c9ff46-4619-4529-a8ce-6fcf2c2ec6d2`
- Receipt id: `9afe939a-99b0-41aa-a0fa-ad48630b9594`
- Report id: `rpt_1774527821657_a99a94b3`

## Step Outcomes
| Step | Expected | Actual | Verdict |
|---|---:|---:|---|
| `POST /verify` | 201 | 201 | PASS |
| `GET /receipts/{id}` | 200 | 200 | PASS |
| `GET /receipts/{id}/verify` | 200 | 200 | PASS |
| `GET /reports/{id}` | 200 | 200 | PASS |
| `GET /certificates/{receiptId}` | 200 | 200 | PASS |
| `POST /verify/offline` | 200 | 200 | PASS |
| `GET /receipts/{id}` (forbidden check) | 403 | 403 | PASS |
| `POST /verify` (replay check) | 409 | 409 | PASS |

## Notes
1. This run verifies both happy path and critical guardrails (forbidden access and replay detection) in one artifact.
2. The evidence JSON is reusable as Team Lead gate input for the 23:00 cycle.
