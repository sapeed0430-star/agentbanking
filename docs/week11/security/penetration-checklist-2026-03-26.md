# Penetration Checklist - 2026-03-26

## Gate Verdict
- Verdict: `BLOCK`

## Evidence
- `docs/week11/backend/evidence/mock-load-baseline-2026-03-26.json`
- `docs/week11/backend/mock-load-baseline-2026-03-26.md`

## Available Measured Values (From Evidence)
| Metric | Value |
|---|---|
| `success_rate` | `100` |
| `latency_ms.p50` | `1.74` |
| `latency_ms.p95` | `16.8` |
| `latency_ms.p99` | `17.4` |
| `latency_ms.max` | `44.02` |
| `status_counts` | `{"201":100}` |
| `run_at` | `2026-03-26T15:33:30.001Z` |

## Penetration Checklist (PASS/BLOCK)
| Check Item | Status | Evidence-backed Note |
|---|---|---|
| Auth boundary checks | `BLOCK` | Current evidence includes successful `201` responses only and does not include unauthorized/forbidden boundary test results. |
| Idempotency/replay checks | `BLOCK` | No replay attempt artifact or duplicate-request idempotency result is present in current evidence. |
| Signature/digest tamper checks | `BLOCK` | No tampered payload/signature mismatch verification artifact is present in current evidence. |
| Proof adapter fallback checks | `BLOCK` | No adapter fallback execution artifact is present in current evidence. |
| Rate-limit abuse checks | `BLOCK` | No high-rate abuse scenario artifact or `429`/limit-handling result is present in current evidence. |

## Blocking Condition
- `BLOCK`: Required penetration evidence for the checklist items above is not present in current artifacts.
