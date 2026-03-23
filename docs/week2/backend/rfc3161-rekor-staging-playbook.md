# RFC3161 + Rekor Staging Playbook

## Purpose
Operational guide for validating real adapter paths before production cutover.

## 1) Prerequisites (Pre-check)
1. TSA staging endpoint URL
2. TSA trust chain certificate file (`.pem`)
3. Rekor staging base URL
4. Rekor-compatible public key (`AUDIT_REKOR_PUBLIC_KEY_PEM_B64`)
5. Local Ed25519 key pair for signer mode
6. `openssl` installed and callable from shell
7. API auth token for `POST /verify` and `POST /verify/offline`

## 1.1) One-hour Cycle Timebox (KST)
1. `HH:00-HH:10`: env/credential pre-check
2. `HH:10-HH:35`: online verify + proof artifact validation
3. `HH:35-HH:50`: offline verify + evidence capture
4. `HH:50`: submit evidence bundle to Team Lead
5. `HH+1:00`: Team Lead verdict (`PASS` / `PARTIAL PASS` / `BLOCK`)

## 2) Environment Setup
Use `.env.example` as base and set:
- `AUDIT_SIGNER_MODE=local-ed25519`
- `AUDIT_SIGNER_PRIVATE_KEY_PEM=<escaped pem>`
- `AUDIT_TIMESTAMP_MODE=rfc3161`
- `AUDIT_RFC3161_ENDPOINT=<tsa url>`
- `AUDIT_RFC3161_CA_CERT_PATH=<path to tsa ca cert>`
- `AUDIT_TRANSPARENCY_MODE=rekor`
- `AUDIT_REKOR_BASE_URL=<rekor base url>`
- `AUDIT_REKOR_PUBLIC_KEY_PEM_B64=<base64 pem>`

## 3) Executable Validation Checklist

## 3.1) Pre-check (must pass before execution)
1. Confirm env vars are loaded:
- signer mode = `local-ed25519`
- timestamp mode = `rfc3161`
- transparency mode = `rekor`
2. Confirm files are present:
- private key
- public key
- TSA CA cert
3. Confirm reachability:
- TSA endpoint reachable
- Rekor base URL reachable
4. Confirm server startup:
- API boots without proof adapter init errors

## 3.2) Online Verification Execution
1. Start API server with staging env.
2. Send `POST /verify` with valid payload and auth.
3. Expected success response:
- HTTP `201`
- `receipt.signature` exists
- `receipt.timestamp_proof.token_b64` exists
- `receipt.transparency_proof.entry_id` exists
4. Save response payload to evidence directory.

## 3.3) Offline Verification Execution
1. Extract `receipt` and `audit_report` from online response.
2. Run:
- `npm run verify:offline -- --receipt <receipt.json> --report <report.json> --public-key <pub.pem> --strict-signature`
3. Expected success:
- CLI exit code `0`
- `verification_result=PASS`
4. Save CLI output JSON to evidence directory.

## 3.4) Negative-path Execution (proof failure fallback check)
1. Simulate one proof dependency failure (e.g., invalid TSA endpoint or missing Rekor key).
2. Send `POST /verify`.
3. Expected failure:
- HTTP `503`
- `code=PROOF_SERVICE_UNAVAILABLE`
- `details.stage` populated (`signer|timestamp|transparency`)
4. Save failure response to evidence directory.

## 4) Pass/Fail Criteria
## Pass
1. `POST /verify` success path returns `201` with all three proof artifacts present.
2. Offline verify returns `PASS` in strict signature mode.
3. Negative test returns `503 PROOF_SERVICE_UNAVAILABLE` with valid stage metadata.
4. Evidence package is complete (request/response/correlation/verdict).

## Fail
1. Any missing proof field in `receipt`.
2. Offline verification returns `FAIL`.
3. Failure response misses `details.stage` or `correlation_id`.
4. Evidence package incomplete.

## 5) Evidence Capture
1. Use template:
- `docs/week2/backend/staging-evidence-capture-template.md`
2. Required artifacts:
- request sample JSON
- success response sample JSON
- failure response sample JSON
- offline verify output JSON
- correlation_id list
- final verdict

## 6) Failure Triage
1. Stage = `signer`
- Check `AUDIT_SIGNER_PRIVATE_KEY_PEM` and key format
2. Stage = `timestamp`
- Check TSA URL/cert path/network egress/openssl availability
3. Stage = `transparency`
- Check Rekor URL/public key base64/signature compatibility

## 7) Rollback and Feature-Flag Fallback
1. Immediate rollback rule:
- If proof pipeline error rate exceeds acceptable threshold in staging cycle, revert to mock adapters for continuity.
2. Feature flags (env-based):
- `AUDIT_TIMESTAMP_MODE=mock`
- `AUDIT_TRANSPARENCY_MODE=mock`
- `AUDIT_SIGNER_MODE=mock`
3. Fallback verification:
- Re-run `POST /verify` to confirm service continuity.
- Mark verdict as `PARTIAL PASS` (real proof path not validated).
4. Exit fallback:
- Restore real adapter env settings.
- Re-run full checklist from section 3 before requesting Team Lead `PASS`.
