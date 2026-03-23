# Live Proof Automation Runbook

## 1) Goal
`B-LIVE-1100` captures a single end-to-end RFC3161 and Rekor live-proof attempt, writes a JSON evidence bundle, and preserves failure context when the run cannot reach external services.

## 2) What the script does
The automation script:
1. Builds a sample request object.
2. Canonicalizes and digests the sample with `sha-256`.
3. Calls the signer adapter to create a receipt signature.
4. Calls the RFC3161 timestamp adapter.
5. Calls the Rekor transparency adapter.
6. Writes a JSON evidence file even when one of the stages fails.

Script path:
- `scripts/capture-live-proof-evidence.js`

NPM shortcut:
- `npm run live-proof:capture`

## 3) Environment Variables
Required for real live-proof execution:

- `AUDIT_TIMESTAMP_MODE=rfc3161`
- `AUDIT_RFC3161_ENDPOINT=<tsa url>`
- `AUDIT_RFC3161_CA_CERT_PATH=<tsa ca cert pem path>`
- `AUDIT_TRANSPARENCY_MODE=rekor`
- `AUDIT_REKOR_BASE_URL=<rekor base url>`
- `AUDIT_REKOR_PUBLIC_KEY_PEM_B64=<base64 encoded public key pem>`

Recommended for a complete chain:

- `AUDIT_SIGNER_MODE=local-ed25519`
- `AUDIT_SIGNER_PRIVATE_KEY_PEM=<escaped private key pem>`
- `AUDIT_SIGNER_KID=<optional kid>`
- `AUDIT_TSA_NAME=<optional tsa label>`
- `AUDIT_TRANSPARENCY_LOG_ID=<optional log label>`
- `AUDIT_PROOF_TIMEOUT_MS=<timeout in ms, default 10000>`

The script also reads:
- `AUDIT_OPERATOR_ID`
- `AUDIT_POLICY_VERSION`

If the live endpoints are not configured, the script still writes an evidence file with:
- `result.outcome=FAIL`
- `result.failed_stage`
- `result.error.stage`
- `result.error.error_code`
- `result.error.message`

## 4) Output Path
Default evidence path:
- `docs/week2/backend/evidence/live-proof-<timestamp>.json`

The script uses an ISO-8601 UTC timestamp in the filename, so the final suffix looks like:
- `live-proof-2026-03-23T15-14-40-412Z.json`

Use `--output` to override the path:
```bash
npm run live-proof:capture -- --output /tmp/live-proof.json
```

## 5) Evidence JSON Structure
Top-level fields:

```json
{
  "evidence_type": "live-proof-capture",
  "spec_version": "B-LIVE-1100",
  "run_id": "",
  "captured_at": "",
  "output_path": "",
  "config": {},
  "sample": {},
  "steps": [],
  "artifacts": {},
  "result": {}
}
```

Important nested fields:

- `config.signer_mode`
- `config.timestamp_mode`
- `config.transparency_mode`
- `config.tsa_endpoint.origin`
- `config.rekor_base_url.origin`
- `sample.request`
- `sample.digest`
- `artifacts.signature`
- `artifacts.timestamp_proof`
- `artifacts.transparency_proof`
- `result.outcome`
- `result.failed_stage`
- `result.error.stage`
- `result.error.error_code`
- `result.error.message`

## 6) Operational Use
1. Load the required environment variables.
2. Confirm the TSA certificate path exists and the Rekor public key is base64 encoded PEM.
3. Run the script:
```bash
npm run live-proof:capture
```
4. Attach the generated evidence JSON to the weekly backend evidence bundle.
5. If the run fails, inspect `result.failed_stage` first:
- `signer` usually means the local key is missing or malformed.
- `timestamp` usually means TSA endpoint, trust chain, or network access is unavailable.
- `transparency` usually means Rekor URL, public key, or network access is unavailable.

## 7) Local Run Attempt
I attempted one local run in this workspace with the real live-proof modes enabled but without configured TSA/Rekor endpoints.

Command:
```bash
AUDIT_TIMESTAMP_MODE=rfc3161 AUDIT_TRANSPARENCY_MODE=rekor node scripts/capture-live-proof-evidence.js
```

Result:
- The run failed at the `timestamp` stage.
- Error code: `MISSING_TSA_ENDPOINT`
- Message: `missing_tsa_endpoint`
- Evidence file was still written to `docs/week2/backend/evidence/live-proof-2026-03-23T15-14-40-412Z.json`.

This is expected in an unconfigured environment and confirms the script records the failure stage and error details instead of stopping silently.

## 8) Follow-up
When TSA/Rekor staging access is available, rerun the same command with the live env vars populated and replace the failure record with a successful capture.
