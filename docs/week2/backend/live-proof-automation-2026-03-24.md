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

## 10) 14:00 Cycle Result
The `B-LIVE-1400` live-proof retry was treated as `BLOCK` because DNS resolution for both required external endpoints failed before the capture script could complete a live proof run.

### 10.1) DNS / Reachability Probes
Command:
```bash
node -e "import dns from 'node:dns/promises'; try { const r=await dns.lookup('rekor.sigstore.dev',{all:true}); console.log(JSON.stringify(r,null,2)); } catch (e) { console.error(e.code || e.message); process.exit(1); }"
curl -fsS --max-time 12 https://rekor.sigstore.dev/api/v1/log/publicKey
node -e "import dns from 'node:dns/promises'; try { const r=await dns.lookup('freetsa.org',{all:true}); console.log(JSON.stringify(r,null,2)); } catch (e) { console.error(e.code || e.message); process.exit(1); }"
curl -fsS --max-time 12 https://freetsa.org/tsr
```
Result:
- `rekor.sigstore.dev` DNS probe: `ENOTFOUND`
- `rekor.sigstore.dev` HTTP probe: `curl: (6) Could not resolve host: rekor.sigstore.dev`
- `freetsa.org` DNS probe: `ENOTFOUND`
- `freetsa.org` HTTP probe: `curl: (6) Could not resolve host: freetsa.org`

### 10.2) Evidence Status
- No new evidence JSON was generated for the `B-LIVE-1400` retry.
- Existing evidence files remain:
  - `docs/week2/backend/evidence/live-proof-2026-03-23T15-14-40-412Z.json`
  - `docs/week2/backend/evidence/live-proof-2026-03-23T15-48-08-3NZ.json`

### 10.3) Current Verdict
- `BLOCK`
- Reason: the current environment cannot resolve `rekor.sigstore.dev` or `freetsa.org`, so endpoint reachability is not established and `node scripts/capture-live-proof-evidence.js` cannot complete the timestamp and transparency stages.
- Consequence: no `PASS` evidence bundle exists yet for `B-LIVE-1400`.

## 11) 15:00 Cycle Preflight Matrix
The `B-LIVE-1500` worker path uses a preflight gate before the live RFC3161 and Rekor stages. The gate classifies the first failure with a standard code so the evidence bundle can distinguish endpoint reachability from protocol or auth issues.

### 11.1) Execution Example
```bash
AUDIT_SIGNER_MODE=local-ed25519 \
AUDIT_SIGNER_PRIVATE_KEY_PEM="$(cat .keys/live-proof-ed25519-private.pem)" \
AUDIT_TIMESTAMP_MODE=rfc3161 \
AUDIT_RFC3161_ENDPOINT=https://freetsa.org/tsr \
AUDIT_TRANSPARENCY_MODE=rekor \
AUDIT_REKOR_BASE_URL=https://rekor.sigstore.dev \
AUDIT_REKOR_PUBLIC_KEY_PEM_B64="$(cat .keys/live-proof-ed25519-public.pem | base64 | tr -d '\n')" \
npm run live-proof:capture -- --output docs/week2/backend/evidence/live-proof-<timestamp>.json
```

### 11.2) Evidence Additions
The evidence JSON now includes:
- `preflight.status`
- `preflight.failed_target`
- `preflight.failed_stage`
- `preflight.checks[]`

Each preflight check reports:
- `target`: `timestamp` or `transparency`
- `phase`: `config`, `dns`, or `request`
- `error_code`: one of the standard codes below when the check fails
- `request.status`: the HTTP status when a response is received

### 11.3) Standard Error Codes
- `DNS_FAIL`: hostname resolution failed
- `NETWORK_FAIL`: socket/connect/TLS failure
- `HTTP_NON_2XX`: live endpoint responded but was not successful
- `AUTH_REQUIRED`: endpoint returned `401` or `403`
- `TIMEOUT`: lookup or request timed out

### 11.4) Status Judgment
- `PASS`: signer, preflight, timestamp, and transparency all succeed
- `FAIL` with `failed_stage=preflight`: a preflight check failed before the live calls
- `FAIL` with `failed_stage=timestamp`: RFC3161 request failed after preflight passed
- `FAIL` with `failed_stage=transparency`: Rekor request failed after preflight passed
- `FAIL` with `error_code=DNS_FAIL|NETWORK_FAIL|HTTP_NON_2XX|AUTH_REQUIRED|TIMEOUT`: the evidence bundle should be read as a live integration failure, not a local signer failure

### 11.5) Log Reading Rules
- Check `preflight.checks[0]` for the TSA path first.
- Check `preflight.checks[1]` for the Rekor path second.
- If `preflight.status=FAIL`, the live stages are skipped on purpose so the evidence keeps the first failing condition.

## 12) 2026-03-25 PASS Update
The latest live-proof capture completed with end-to-end `PASS`.

### 12.1) PASS Evidence
- `docs/week2/backend/evidence/live-proof-2026-03-25T12-45-21-514Z.json`

### 12.2) Stage Results
- `result.outcome=PASS`
- `preflight.status=PASS`
- `steps[1].stage=timestamp`, `steps[1].status=success`
- `steps[2].stage=transparency`, `steps[2].status=success`

### 12.3) Failure Cause Clarification
Previous `transparency` failures were caused by using the wrong key material for `AUDIT_REKOR_PUBLIC_KEY_PEM_B64`.
- Wrong input: Rekor log public key (`/api/v1/log/publicKey`)
- Correct input: signer public key (`.keys/live-proof-ed25519-public.pem`) encoded in base64

### 12.4) Correct Execution Example
```bash
AUDIT_SIGNER_MODE=local-ed25519 \
AUDIT_SIGNER_PRIVATE_KEY_PEM="$(cat .keys/live-proof-ed25519-private.pem)" \
AUDIT_TIMESTAMP_MODE=rfc3161 \
AUDIT_RFC3161_ENDPOINT=https://freetsa.org/tsr \
AUDIT_TRANSPARENCY_MODE=rekor \
AUDIT_REKOR_BASE_URL=https://rekor.sigstore.dev \
AUDIT_REKOR_PUBLIC_KEY_PEM_B64="$(cat .keys/live-proof-ed25519-public.pem | base64 | tr -d '\n')" \
npm run live-proof:capture -- --output docs/week2/backend/evidence/live-proof-2026-03-25T12-45-21-514Z.json
```
