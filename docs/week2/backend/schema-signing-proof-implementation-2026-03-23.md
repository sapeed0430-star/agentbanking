# Backend Implementation Report (Step 1-3) - 2026-03-23

## Scope Completed
1. Receipt response JSON Schema automatic validation test
2. Ed25519/JWS signer adapter skeleton
3. RFC3161/Rekor adapter real HTTP integration path + offline verify CLI skeleton

## 1) Schema Validation in Tests
- Added a lightweight JSON Schema validator module:
  - `src/audit/schema-validator.js`
- Bound schema validation to API test:
  - `test/auditApi.test.js`
  - `POST /verify` success test now validates `receipt` against:
    - `docs/week1/backend/receipt-1.0.0.schema.json`

## 2) Signer Adapter Skeleton
- Added signer adapter module:
  - `src/audit/adapters/signer.js`
- Supported modes:
  - `mock` (default): deterministic pseudo-signature for development
  - `local-ed25519`: local PEM key based EdDSA JWS signing path
- Runtime mode keys:
  - `AUDIT_SIGNER_MODE`
  - `AUDIT_SIGNER_KID`
  - `AUDIT_SIGNER_PRIVATE_KEY_PEM`

## 3) Timestamp + Transparency Adapter Skeleton
- Added timestamp adapter:
  - `src/audit/adapters/timestamp.js`
  - modes: `mock`, `rfc3161`
  - `rfc3161` mode now:
    - builds RFC3161 query using `openssl ts -query`
    - posts query to TSA endpoint (`application/timestamp-query`)
    - receives token reply (`application/timestamp-reply`)
    - parses timestamp response text when available
- Added transparency adapter:
  - `src/audit/adapters/transparency.js`
  - modes: `mock`, `rekor`
  - `rekor` mode now:
    - posts hashedrekord entry to `POST /api/v1/log/entries`
    - parses inclusion proof/tree metadata into receipt contract
- Added runtime switch composer:
  - `src/audit/runtime.js`
  - mode keys:
    - `AUDIT_TIMESTAMP_MODE`
    - `AUDIT_RFC3161_ENDPOINT`
    - `AUDIT_RFC3161_CA_CERT_PATH`
    - `AUDIT_TRANSPARENCY_MODE`
    - `AUDIT_REKOR_BASE_URL`
    - `AUDIT_REKOR_PUBLIC_KEY_PEM_B64`

## Server Integration
- Updated `server.js` to use runtime adapters for:
  - signature issuance
  - timestamp proof issuance
  - transparency proof issuance
- Added fail-safe mapping:
  - proof pipeline failure -> `503 PROOF_SERVICE_UNAVAILABLE`

## Offline Verify CLI
- Added offline verifier module:
  - `src/audit/offline-verify.js`
- Added CLI entry:
  - `scripts/verify-receipt-cli.js`
  - npm script: `npm run verify:offline`
- CLI verifies:
  - receipt schema
  - digest consistency
  - JWS signature format and optional Ed25519 verification
  - timestamp/transparency proof basic shape checks
- Added offline verification API endpoint:
  - `POST /verify/offline` (same verification core as CLI/module)
- Added local key generation utility:
  - `scripts/generate-ed25519-keypair.js`
- Added staging runbook:
  - `docs/week2/backend/rfc3161-rekor-staging-playbook.md`

## Verification Result
- Test command: `npm test`
- Result: `PASS (19/19)`
- Added proof-unavailable negative test:
  - confirms `503` and detailed stage metadata for operational triage
- Added offline verifier tests:
  - PASS for valid fixture
  - FAIL for digest mismatch
- Added strict Ed25519 verification test:
  - offline verify PASS with generated key pair in strict mode
- Added adapter-focused tests:
  - Rekor response parsing success path
  - Rekor missing public key failure path
  - RFC3161 missing endpoint failure path
- Added offline API tests:
  - `/verify/offline` PASS for issued receipt/report
  - `/verify/offline` 422 for tampered report digest mismatch

## Remaining Work
1. Wire signer to HSM/KMS and key rotation policy.
2. Add end-to-end integration tests with real TSA/Rekor staging endpoints.
3. Expand offline verifier with full RFC3161 token and Rekor inclusion verification.
