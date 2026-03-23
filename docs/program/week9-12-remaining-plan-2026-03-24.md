# Week 9-12 Remaining Plan (Execution Start) - 2026-03-24

## 1) Remaining Scope Summary
## Week 9
1. Key management hardening:
- JWKS publish endpoint
- key rotation/revocation operational controls
2. Certificate delivery path:
- receipt-linked certificate retrieval path

## Week 10
1. Reliability/operations:
- recovery drill runbook
- proof pipeline fallback drill evidence
2. Observability:
- verification success/error dashboards and alert thresholds

## Week 11
1. Security/performance validation:
- penetration-test checklist execution
- load/perf mock test baseline and target checks

## Week 12
1. Pilot readiness:
- pilot onboarding checklist
- SLA acceptance checklist
- GA go/no-go decision package

## 2) What Started Now
1. Implemented (done):
- `GET /.well-known/jwks.json`
- `POST /admin/keys/rotate`
- `POST /admin/keys/revoke`
- `GET /certificates/{receiptId}`

2. Added simulation asset (done):
- `npm run mock:test` (service mock test script)

## 3) Service Mock Test ETA
1. First executable mock test run:
- target: within 1-2 days (after staging env variables are set)
2. Stable mock test report cycle (3 repeat runs):
- target: additional 2-3 days
3. Total estimated lead time to mock-test sign-off:
- about 4-5 working days from now

## 4) Remaining Risks Before Week 12 Close
1. TSA/Rekor real trust-material staging evidence is still required.
2. HSM/KMS-backed production key path is still required.
3. Offline verifier needs deeper RFC3161/Rekor cryptographic proof validation.

## 5) Immediate Next Queue (Auto-Execution)
1. Add OpenAPI alignment for JWKS/Certificate/admin key ops.
2. Run mock test against running server and capture baseline metrics.
3. Produce week10 operations drill artifacts and evidence links.
