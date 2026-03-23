# agentbanking

Autonomous investment agent verification/audit prototype.

## Current backend scope
- `POST /verify`
- `POST /verify/offline`
- `GET /receipts/{receiptId}`
- `GET /receipts/{receiptId}/verify`
- `GET /reports/{reportId}`

## Runtime modes
Copy `.env.example` and configure adapters:
- signer: `AUDIT_SIGNER_MODE=mock|local-ed25519`
- timestamp: `AUDIT_TIMESTAMP_MODE=mock|rfc3161`
- transparency: `AUDIT_TRANSPARENCY_MODE=mock|rekor`

## Local commands
```bash
npm test
npm start
npm run keys:gen
npm run verify:offline -- --receipt <receipt.json> --report <report.json>
npm run mock:test
```

## Make targets
```bash
make keys-gen
make offline-verify RECEIPT=<receipt.json> REPORT=<report.json> PUBKEY=<public.pem>
```

## Offline verification CLI
```bash
node scripts/verify-receipt-cli.js \
  --receipt <receipt.json> \
  --report <audit-report.json> \
  --schema docs/week1/backend/receipt-1.0.0.schema.json \
  --public-key <ed25519-public.pem> \
  --strict-signature
```

Output:
- `verification_result`: `PASS` or `FAIL`
- `failed_codes`: standardized failure codes
- `checks`: per-check detail for schema/digest/signature/timestamp/transparency
