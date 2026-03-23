# Backend Status Report: Error Model and Integrity Failure Handling (2026-03-23)

## Executive Status
- Overall status: `PARTIAL (Draft level)`
- Launch readiness for this scope: `NOT READY`
- Reason: error model is currently generic and integrity failure handling is not yet fully codified in API response contracts.

## Current Defined State (as-is)

### Source 1: `docs/week1/backend/openapi-draft.yaml`
1. `POST /verify`
- Defined responses: `201`, `400`
- Error schema for `400`: `ErrorResponse` (`code`, `message`)

2. `GET /receipts/{receiptId}`
- Defined responses: `200`, `404`
- Error schema for `404`: `ErrorResponse` (`code`, `message`)

3. `ErrorResponse` model
- Required fields: `code`, `message`
- Missing fields: `severity`, `category`, `retryable`, `correlation_id`, `details`, `remediation`

### Source 2: `docs/week1/backend/receipt-1.0.0.schema.json`
1. Integrity-related required fields exist:
- `report_digest`
- `signature`
- `timestamp_proof`
- `transparency_proof`
- `verification_result` (`pass`, `warning`, `fail`)

2. Missing failure semantics:
- No explicit failure reason code enum
- No structured integrity failure object
- No policy on mapping `verification_result=fail` to API error/status behavior

## Gap Analysis

| Area | Current | Gap | Risk |
|---|---|---|---|
| Error taxonomy | `code` + `message` only | No canonical code set | Inconsistent client handling |
| HTTP status coverage | 400/404 only | Missing 401/403/409/422/429/500/503 | Incomplete incident response |
| Integrity fail payload | implicit via `verification_result=fail` | No root-cause structure | Hard to triage and audit |
| Traceability | no correlation field | cannot link logs/tickets reliably | Slow incident investigation |
| Client actionability | no retry/remediation metadata | FE cannot guide operator action | UX confusion and repeat failures |

## Required Next Actions (Immediate)
1. Define canonical `error_code` enum and map each to HTTP status. `DONE (draft applied to OpenAPI)`
2. Extend `ErrorResponse` with:
- `severity`
- `category`
- `retryable`
- `correlation_id`
- `details`
- `remediation`
   `DONE (draft applied to OpenAPI)`
3. Define integrity-specific failure object for `POST /verify` negative outcomes.
   `DONE (IntegrityFailureResponse)`
4. Add response matrix for:
- signature verification fail
- digest mismatch
- timestamp proof invalid
- transparency inclusion proof fail
- duplicate request
   `DONE (matrix doc added)`
5. Align FE state mapping with backend error schema in one contract table.
   `DONE (docs/week2/frontend/error-code-ui-mapping-contract.md)`

## Proposed Status Label for Daily Operations
- `Error Model`: `IN_PROGRESS (v2 draft updated + FE mapping contract added)`
- `Integrity Failure Handling`: `IN_PROGRESS (decision matrix applied)`
- `Gate Impact`: still blocks full pass of `G2 Schema/API Freeze` and `G3 Crypto/Integrity Gate` until runtime implementation validation complete
