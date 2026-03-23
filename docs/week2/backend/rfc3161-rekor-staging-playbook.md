# RFC3161 + Rekor Staging Playbook

## Purpose
Operational guide for validating real adapter paths before production cutover.

## 1) Prerequisites
1. TSA staging endpoint URL
2. TSA trust chain certificate file (`.pem`)
3. Rekor staging base URL
4. Rekor-compatible public key (`AUDIT_REKOR_PUBLIC_KEY_PEM_B64`)
5. Local Ed25519 key pair for signer mode

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

## 3) Execution Sequence
1. Start API server with configured env
2. Submit `POST /verify` with valid payload
3. Confirm `201` and inspect:
- `receipt.signature`
- `receipt.timestamp_proof`
- `receipt.transparency_proof`
4. Run offline verification CLI:
- `npm run verify:offline -- --receipt <file> --report <file> --public-key <pub.pem> --strict-signature`

## 4) Acceptance Criteria
1. `POST /verify` returns `201`
2. Offline verify returns `PASS`
3. Any adapter failure returns `503 PROOF_SERVICE_UNAVAILABLE` with stage details
4. No missing required receipt schema fields

## 5) Failure Triage
1. Stage = `signer`
- Check `AUDIT_SIGNER_PRIVATE_KEY_PEM` and key format
2. Stage = `timestamp`
- Check TSA URL/cert path/network egress/openssl availability
3. Stage = `transparency`
- Check Rekor URL/public key base64/signature compatibility
