# Launch-Critical Operator Flow Evidence - 2026-03-27

## Purpose
Evidence-first summary for the 2026-03-27 launch gate. This note covers the operator path that must be demoable end to end and aligns with the existing contract docs in [operator-console-ia.md](../../week1/frontend/operator-console-ia.md), [error-code-ui-mapping-contract.md](../../week2/frontend/error-code-ui-mapping-contract.md), [openapi-draft.yaml](../../week1/backend/openapi-draft.yaml), [receipt-1.0.0.schema.json](../../week1/backend/receipt-1.0.0.schema.json), [integrity-failure-decision-matrix.md](../../week2/backend/integrity-failure-decision-matrix.md), and [launch-countdown-2026-04-01.md](../../program/launch-countdown-2026-04-01.md).

## 1) End-to-End Operator Path
1. `Verify Run` starts with a request draft and policy selection.
2. Operator submits `POST /verify`.
3. Success returns `201` with receipt payload; UI moves to `Receipt Ready` and shows receipt id, result, policy version, and proof summary.
4. Operator opens the receipt detail from `GET /receipts/{receiptId}`.
5. Receipt detail exposes proof section, findings, evidence refs, and links to the report via `links.report_url` in the receipt schema.
6. Operator opens the certificate from `GET /certificates/{receiptId}`.
7. Operator can run offline validation with `POST /verify/offline` using the issued receipt/report pair.
8. Offline verify returns `200` on pass or `422` on integrity failure without rerunning the online pipeline.

## 2) Required API Endpoints and UI States
| Endpoint | Expected UI State | Operator Meaning |
|---|---|---|
| `POST /verify` | `Draft`, `Submitting`, `Receipt Ready`, `Integrity Failure`, `Auth Expired`, `Access Denied`, `Duplicate Submission`, `Rate Limited`, `System Error` | Start verification and surface final receipt or failure |
| `GET /receipts/{receiptId}` | `Receipt Detail`, `Missing Receipt`, `Retrieval Error`, `Access Denied` | Inspect issued receipt and linked report |
| `GET /certificates/{receiptId}` | `Certificate Ready`, `Certificate Missing`, `Certificate Error` | Open the derived certificate |
| `POST /verify/offline` | `Offline Verify Ready`, `Offline Pass`, `Offline Failure` | Validate issued receipt/report pair offline |
| `/.well-known/jwks.json` | `Key Visible` / `Key Refresh Failed` | Support signature verification and trust checks |

UI state rules:
- Always show `error_code`, `message`, `severity`, `correlation_id`, and `retryable` for non-2xx responses.
- Copy action for `correlation_id` is mandatory.
- `Retry` appears only when `retryable=true`.
- `Escalate` appears for `severity=high` or `critical`.
- Receipt detail must show `receipt_id`, `report_id`, `verification_result`, `signature`, `timestamp_proof`, `transparency_proof`, `evidence_refs`, and `links`.

## 3) Critical Failure Mapping
| Error code | HTTP | UI response | Required operator action |
|---|---:|---|---|
| `SIGNATURE_VERIFICATION_FAILED` | 422 | `Critical Integrity Failure` with incident styling | Stop, escalate to security/compliance |
| `DIGEST_MISMATCH` | 422 | `Critical Integrity Failure` with hash comparison panel | Stop, verify evidence source hashes |
| `TIMESTAMP_PROOF_INVALID` | 422 | `Integrity Failure` with timestamp diagnostics | Retry only if marked retryable; otherwise escalate |
| `TRANSPARENCY_PROOF_INVALID` | 422 | `Integrity Failure` with proof details panel | Retry anchor check or escalate depending on retryable flag |
| `REQUEST_REPLAY_DETECTED` | 409 | `Duplicate Submission` with existing request link | Open existing result; do not resubmit |
| `PROOF_SERVICE_UNAVAILABLE` | 503 | `Dependency Unavailable` banner | Retry with backoff and surface service status |
| `INTERNAL_ERROR` | 500 | `System Error` fallback state | Preserve draft, copy correlation id, retry once |

Notes:
- The critical severity rules above follow [integrity-failure-decision-matrix.md](../../week2/backend/integrity-failure-decision-matrix.md) and [error-code-ui-mapping-contract.md](../../week2/frontend/error-code-ui-mapping-contract.md).
- `422` responses must render the integrity failure panel without fallback parsing.

## 4) GO / NO-GO Acceptance Checklist
### GO only if all are true
- [ ] Operator can submit `POST /verify` and reach a receipt-ready success state.
- [ ] Receipt detail loads from `GET /receipts/{receiptId}` and shows proof, findings, evidence refs, and report link.
- [ ] Certificate opens from `GET /certificates/{receiptId}`.
- [ ] Offline verify runs from the issued receipt/report pair via `POST /verify/offline`.
- [ ] Each critical failure code above maps to a specific UI state and operator action.
- [ ] Non-2xx states always show `error_code`, `message`, `severity`, `correlation_id`, and `retryable`.
- [ ] `correlation_id` is copyable on every error state.
- [ ] The UI state names match the error mapping contract and receipt IA.

### NO-GO if any are true
- [ ] Any endpoint above is missing from the operator flow.
- [ ] A critical error code has no explicit UI response.
- [ ] Receipt, report, certificate, or offline verify cannot be demonstrated end to end.
- [ ] The UI hides `correlation_id` or omits the retry/escalate action rules.
- [ ] The flow contradicts the backend contract or receipt schema references.

## References
- [operator-console-ia.md](../../week1/frontend/operator-console-ia.md)
- [error-code-ui-mapping-contract.md](../../week2/frontend/error-code-ui-mapping-contract.md)
- [openapi-draft.yaml](../../week1/backend/openapi-draft.yaml)
- [receipt-1.0.0.schema.json](../../week1/backend/receipt-1.0.0.schema.json)
- [integrity-failure-decision-matrix.md](../../week2/backend/integrity-failure-decision-matrix.md)
- [launch-countdown-2026-04-01.md](../../program/launch-countdown-2026-04-01.md)
