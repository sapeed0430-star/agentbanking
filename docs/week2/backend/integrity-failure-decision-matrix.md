# Integrity Failure Decision Matrix (Backend v1, 2026-03-23)

## Purpose
Define deterministic backend behavior for integrity-related failures in `POST /verify`.

## Decision Matrix

| Check Area | Failure Signal | Error Code | HTTP | Retryable | Severity | Backend Action | Receipt Issuance |
|---|---|---|---|---|---|---|---|
| Signature | JWS signature verification failed | `SIGNATURE_VERIFICATION_FAILED` | 422 | false | critical | reject verification, emit incident log | no |
| Digest | report/evidence digest mismatch | `DIGEST_MISMATCH` | 422 | false | critical | reject verification, freeze request for review | no |
| Timestamp | RFC3161 token invalid | `TIMESTAMP_PROOF_INVALID` | 422 | false | high | reject verification, mark proof invalid | no |
| Timestamp | allowed clock skew exceeded | `TIMESTAMP_PROOF_INVALID` | 422 | true | medium | reject current attempt, allow resubmit | no |
| Transparency | inclusion proof missing | `TRANSPARENCY_PROOF_INVALID` | 422 | true | high | reject current attempt, retry log inclusion check | no |
| Transparency | root hash mismatch | `TRANSPARENCY_PROOF_INVALID` | 422 | false | critical | reject verification, open Sev-0 | no |
| Replay | duplicated `request_id`/idempotency key | `REQUEST_REPLAY_DETECTED` | 409 | false | high | return existing state, block duplicate processing | no |
| AuthN | missing/invalid token | `UNAUTHORIZED` | 401 | true | medium | deny request before verification pipeline | no |
| AuthZ | operator-agent scope mismatch | `FORBIDDEN` | 403 | false | medium | deny request before verification pipeline | no |
| Rate limit | throttle exceeded | `RATE_LIMITED` | 429 | true | low | defer processing window | no |
| System | internal pipeline exception | `INTERNAL_ERROR` | 500 | true | high | fail safely and capture correlation id | no |
| Dependency | TSA/transparency backend unavailable | `PROOF_SERVICE_UNAVAILABLE` | 503 | true | high | fail fast, retry with backoff | no |

## Response Contract Rule
1. Any integrity check failure must return `422` with `IntegrityFailureResponse`.
2. `correlation_id` is mandatory for all non-2xx responses.
3. `details` must include machine-readable keys:
- `check`
- `reason_code`
- `request_id`
- `agent_id`
- `operator_id`
4. `remediation` should provide operator-action guidance text.

## Observability Rule
1. Log level:
- `critical` -> error + incident event
- `high` -> error
- `medium` -> warn
- `low` -> info/warn
2. Metrics:
- `verify_integrity_fail_total{reason_code=...}`
- `verify_error_total{code=...}`
- `verify_retryable_error_total`

