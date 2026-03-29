# Penetration Checklist - 2026-03-29

## Gate Verdict
- Verdict: `PASS`

## Evidence
- [penetration-check-2026-03-29.json](/Users/myungchoi/Documents/문서%20-%20MyungChoi의%20MacBook%C2%A0Pro/New%20project/docs/week11/security/evidence/penetration-check-2026-03-29.json)

## Evidence Snapshot
| Field | Value |
|---|---|
| `evidence_type` | `penetration-checks` |
| `spec_version` | `W11-PENETRATION-2026-03-29` |
| `captured_at` | `2026-03-29T06:17:26.596Z` |
| `overall` | `PASS` |

## Penetration Checklist (PASS/BLOCK)
| Check Item | Status | Exact observed status codes | Evidence-backed note |
|---|---|---|---|
| Auth boundary | `PASS` | `401`, `403` | Evidence shows missing auth returned `401` with `UNAUTHORIZED`, and forbidden scope mismatch returned `403` with `FORBIDDEN`. See [penetration-check-2026-03-29.json](/Users/myungchoi/Documents/문서%20-%20MyungChoi의%20MacBook%C2%A0Pro/New%20project/docs/week11/security/evidence/penetration-check-2026-03-29.json). |
| Idempotency/replay | `PASS` | `201`, `409` | Evidence shows the first request returned `201`, and the duplicate request returned `409` with `REQUEST_REPLAY_DETECTED`. See [penetration-check-2026-03-29.json](/Users/myungchoi/Documents/문서%20-%20MyungChoi의%20MacBook%C2%A0Pro/New%20project/docs/week11/security/evidence/penetration-check-2026-03-29.json). |
| Signature/digest tamper | `PASS` | `201`, `422` | Evidence shows the created receipt returned `201`, and the tamper/integrity response returned `422` with `INTEGRITY_CHECK_FAILED` and `DIGEST_MISMATCH`. See [penetration-check-2026-03-29.json](/Users/myungchoi/Documents/문서%20-%20MyungChoi의%20MacBook%C2%A0Pro/New%20project/docs/week11/security/evidence/penetration-check-2026-03-29.json). |
| Proof adapter fallback/unavailable | `PASS` | `503` | Evidence shows the proof/signing service returned `503` with `PROOF_SERVICE_UNAVAILABLE` and `missing_private_key_pem` at the signer stage. See [penetration-check-2026-03-29.json](/Users/myungchoi/Documents/문서%20-%20MyungChoi의%20MacBook%C2%A0Pro/New%20project/docs/week11/security/evidence/penetration-check-2026-03-29.json). |
| Rate-limit abuse | `PASS` | `201`, `429` | Evidence shows the first request returned `201`, and the follow-up request returned `429` with `RATE_LIMITED` plus `Retry-After: 60`. See [penetration-check-2026-03-29.json](/Users/myungchoi/Documents/문서%20-%20MyungChoi의%20MacBook%C2%A0Pro/New%20project/docs/week11/security/evidence/penetration-check-2026-03-29.json). |

## Blocking Condition
- None recorded in the 2026-03-29 evidence artifact. The captured checks all returned `PASS` in the source JSON.
