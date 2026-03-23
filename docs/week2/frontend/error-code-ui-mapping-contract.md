# FE/BE Error Code Mapping Contract (2026-03-23)

## Purpose
Single source of truth for mapping backend error responses to frontend UI states and operator actions.

## Scope
- Endpoint: `POST /verify`, `GET /receipts/{receiptId}`
- Source contract: `docs/week1/backend/openapi-draft.yaml`

## Global UI Rule
1. Non-2xx response must always render:
- `error_code`
- `message`
- `severity`
- `correlation_id`
- `retryable` badge
2. `correlation_id` is always copyable from the UI.
3. If `retryable=true`, show `Retry` action.
4. If `severity in (high, critical)`, show `Escalate` action.

## Verify API Mapping

| HTTP | error_code | UI State | Operator Action | FE Handling |
|---|---|---|---|---|
| 400 | INVALID_REQUEST | Form Validation Error | Fix payload and resubmit | highlight invalid fields + inline reason |
| 401 | UNAUTHORIZED | Auth Expired | Re-authenticate | show login re-entry CTA |
| 403 | FORBIDDEN | Access Denied | Request proper role/scope | disable submit until scope fixed |
| 409 | DUPLICATE_REQUEST | Duplicate Submission | Open existing request result | show existing request link if present |
| 409 | REQUEST_REPLAY_DETECTED | Replay Blocked | Stop and investigate replay source | lock form + show incident notice |
| 422 | INTEGRITY_CHECK_FAILED | Integrity Failure Summary | Open failed checks detail | render failure matrix panel |
| 422 | SIGNATURE_VERIFICATION_FAILED | Signature Invalid | Escalate to security/compliance | show critical alert theme |
| 422 | DIGEST_MISMATCH | Digest Mismatch | Verify evidence source hashes | show hash mismatch comparison |
| 422 | TIMESTAMP_PROOF_INVALID | Timestamp Invalid | Retry if retryable, else escalate | show timestamp diagnostics |
| 422 | TRANSPARENCY_PROOF_INVALID | Transparency Proof Invalid | Retry anchor check or escalate | show proof validation details |
| 429 | RATE_LIMITED | Rate Limited | Retry after cool-down | countdown timer + retry CTA |
| 500 | INTERNAL_ERROR | System Error | Retry and attach correlation id | preserve payload draft |
| 503 | PROOF_SERVICE_UNAVAILABLE | Dependency Unavailable | Retry with backoff | show dependency status panel |

## Receipt Retrieval Mapping

| HTTP | error_code | UI State | Operator Action | FE Handling |
|---|---|---|---|---|
| 401 | UNAUTHORIZED | Auth Expired | Re-authenticate | redirect/login CTA |
| 403 | FORBIDDEN | Access Denied | Request access grant | hide sensitive receipt fields |
| 404 | RECEIPT_NOT_FOUND | Missing Receipt | Check receipt id or filters | keep search context and suggest nearby ids |
| 429 | RATE_LIMITED | Rate Limited | Retry after cool-down | non-blocking banner + retry |
| 500 | INTERNAL_ERROR | Retrieval Error | Retry and report correlation id | keep current screen state |

## Integrity Failure Panel Contract (for 422)

### Required fields from backend
1. `integrity_result.verification_result` (`fail`)
2. `integrity_result.failed_checks[]` entries:
- `check`
- `reason_code`
- `message`
- `severity`
- `retryable`
- `observed_at`
- `evidence_uri` (optional)

### UI rendering rules
1. Group failed checks by `check`.
2. Sort by severity: `critical > high > medium > low`.
3. Show primary CTA:
- if any `critical`: `Escalate Incident`
- else if all retryable: `Retry Verification`
- otherwise: `Open Investigation`

## Acceptance Criteria (G2/G3 input)
1. Every backend `error_code` enum has exactly one UI state mapping.
2. No unmapped `error_code` is allowed in production.
3. Correlation id copy action exists on all non-2xx states.
4. 422 response renders integrity failure panel without fallback parsing.

