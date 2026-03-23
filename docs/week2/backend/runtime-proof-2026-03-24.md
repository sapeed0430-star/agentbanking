# Runtime Proof Report - 2026-03-24

## Scope
- Goal: capture staging runtime proof with compose-first execution and node fallback.
- Workspace: /Users/myungchoi/Documents/New project
- Validation date: 2026-03-24 (KST)
- Start: 2026-03-24 00:38:16 KST
- End: 2026-03-24 00:38:17 KST
- Executor: Backend/Ops Worker B

## Execution Summary
| Path | Command | Result | Notes |
| --- | --- | --- | --- |
- Compose first attempt | `docker compose -f deploy/docker-compose.staging.yml up -d --build` | FAIL | scripts/capture-runtime-proof.sh: line 157: docker: command not found 
- Node fallback | `PORT=3210 node server.js` | PASS | health=process_up, jwks=200, verify=201

## Endpoint Checks
{
  "key_count": 1,
  "first_kid": "initial-1774280296352-fe6985ad",
  "first_kty": "OKP",
  "first_crv": "Ed25519"
}

{
  "receipt_id": "d1f94b24-72fe-4da9-892f-4d44e4dfe21a",
  "report_id": "rpt_1774280297329_b4ea6e56",
  "verification_result": "pass",
  "has_signature": true,
  "has_timestamp_proof": true,
  "has_transparency_proof": true
}

## PASS / FAIL Criteria
- PASS when compose startup succeeds, container health is healthy, `GET /.well-known/jwks.json` returns `200`, and `POST /verify` returns `201`.
- PARTIAL PASS when compose is unavailable or fails but the node fallback reproduces the same endpoint behavior with `200`/`201` codes.
- FAIL when both compose and fallback cannot complete the health/jwks/verify sequence.

## Failure Cause
- Compose attempt: scripts/capture-runtime-proof.sh: line 157: docker: command not found 
- Fallback path: node fallback succeeded after compose failure

## Next Actions
1. Re-run this report on a host with Docker Compose available if compose-first evidence is required.
2. Preserve the generated request/response artifacts when attaching the runtime proof bundle.
3. If fallback was used, treat the compose runtime proof as pending rather than complete.

## Verdict
- Overall verdict: PARTIAL PASS

## Logs
### Compose Attempt
```text
scripts/capture-runtime-proof.sh: line 157: docker: command not found
```

### Node Fallback
```text
Snake server running at http://localhost:3210
```

### JWKS Response Summary
```json
{
  "key_count": 1,
  "first_kid": "initial-1774280296352-fe6985ad",
  "first_kty": "OKP",
  "first_crv": "Ed25519"
}
```

### Verify Response Summary
```json
{
  "receipt_id": "d1f94b24-72fe-4da9-892f-4d44e4dfe21a",
  "report_id": "rpt_1774280297329_b4ea6e56",
  "verification_result": "pass",
  "has_signature": true,
  "has_timestamp_proof": true,
  "has_transparency_proof": true
}
```
