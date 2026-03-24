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

## 7) 12:00 Cycle Run Attempt
I attempted the `B-LIVE-1200` live-proof cycle with real RFC3161 and Rekor endpoints in this workspace. The cycle had one completed failure and one interrupted retry.

### 7.1) Endpoint List
- TSA attempt 1: `https://freetsa.org/tsr`
- TSA attempt 2: `http://timestamp.digicert.com`
- Rekor: `https://rekor.sigstore.dev`

### 7.2) 1st Attempt
Command:
```bash
AUDIT_SIGNER_MODE=local-ed25519 \
AUDIT_TIMESTAMP_MODE=rfc3161 \
AUDIT_RFC3161_ENDPOINT=https://freetsa.org/tsr \
AUDIT_TRANSPARENCY_MODE=rekor \
AUDIT_REKOR_BASE_URL=https://rekor.sigstore.dev \
node scripts/capture-live-proof-evidence.js --output docs/week2/backend/evidence/live-proof-2026-03-23T15-48-08-3NZ.json
```

Result:
- Outcome: `FAIL`
- Failed stage: `timestamp`
- Error code: `TIMESTAMP_ERROR`
- Message: `fetch failed`
- Evidence file: `docs/week2/backend/evidence/live-proof-2026-03-23T15-48-08-3NZ.json`

### 7.3) 2nd Attempt
Command:
```bash
AUDIT_SIGNER_MODE=local-ed25519 \
AUDIT_TIMESTAMP_MODE=rfc3161 \
AUDIT_RFC3161_ENDPOINT=http://timestamp.digicert.com \
AUDIT_TRANSPARENCY_MODE=rekor \
AUDIT_REKOR_BASE_URL=https://rekor.sigstore.dev \
node scripts/capture-live-proof-evidence.js
```

Result:
- Outcome: `INTERRUPTED`
- The retry was started with the DigiCert TSA endpoint, but the run was user-stopped before completion.
- No new evidence file was produced for the interrupted retry.

### 7.4) Evidence Files
- `docs/week2/backend/evidence/live-proof-2026-03-23T15-14-40-412Z.json`
- `docs/week2/backend/evidence/live-proof-2026-03-23T15-48-08-3NZ.json`

## 8) 13:00 Cycle Update
The `B-LIVE-1300` cycle was started to continue the live-proof attempt, but the full end-to-end run is still `PENDING` because the live network path cannot resolve the required external endpoints from this workspace.

### 8.1) Material Preparation
- `PASS`: local Ed25519 keypair generation completed successfully.
- Generated files:
  - `.keys/live-proof-ed25519-private.pem`
  - `.keys/live-proof-ed25519-public.pem`
- Rekor public-key material was also generated from the keypair command as `rekor_public_key_pem_b64`.

### 8.2) DNS / Reachability Probes
Command:
```bash
curl -fsSL --max-time 15 https://rekor.sigstore.dev/api/v1/log/publicKey | sed -n '1,40p'
```
Result:
- `FAIL`
- Error: `curl: (6) Could not resolve host: rekor.sigstore.dev`

Command:
```bash
curl -fsSL --max-time 15 https://freetsa.org/tsr -o /tmp/freetsa-probe.out && echo probe_ok
```
Result:
- `FAIL`
- Error: `curl: (6) Could not resolve host: freetsa.org`

### 8.3) Live Proof Execution Status
- `PENDING`: `npm run live-proof:capture` 본실행 미완료
- Reason: Rekor and Freetsa DNS resolution failed, so endpoint reachability could not be established from the current environment.
- Consequence: no new `B-LIVE-1300` evidence JSON was produced in this turn.

### 8.4) PASS Conditions
To move `B-LIVE-1300` to `PASS`, the workspace still needs:
1. Normal DNS resolution for the live endpoints.
2. Successful reachability to the TSA endpoint and Rekor endpoint from the current network path.
3. A single uninterrupted `npm run live-proof:capture` execution that completes `signer`, `timestamp`, and `transparency` stages.
4. A resulting evidence JSON with `result.outcome=PASS` and populated proof artifacts.

## 9) Follow-up for PASS
To reach `PASS`, the next execution needs all of the following:
1. A reachable TSA endpoint that returns a valid RFC3161 response over the current network path.
2. A working TSA trust chain path in `AUDIT_RFC3161_CA_CERT_PATH` if verification is required.
3. A reachable Rekor endpoint with a valid `AUDIT_REKOR_PUBLIC_KEY_PEM_B64`.
4. One uninterrupted end-to-end run of `node scripts/capture-live-proof-evidence.js` that reaches both `timestamp` and `transparency` success.
5. A resulting evidence JSON with `result.outcome=PASS` and populated `artifacts.timestamp_proof` and `artifacts.transparency_proof`.
