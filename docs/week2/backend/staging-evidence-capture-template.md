# Staging Evidence Capture Template (RFC3161 + Rekor)

## 1) Cycle Metadata
- Cycle window (KST):
- Executor:
- Environment:
- Commit SHA:
- Team Lead review time:

## 2) Request Sample
```json
{
  "request_id": "",
  "agent_id": "",
  "operator_id": "",
  "policy_version": "",
  "strategy_hash": "",
  "model_hash": "",
  "evidence_refs": []
}
```

## 3) Success Response Sample (`POST /verify` -> 201)
```json
{
  "receipt": {
    "receipt_id": "",
    "report_id": "",
    "signature": {},
    "timestamp_proof": {},
    "transparency_proof": {}
  },
  "audit_report": {}
}
```

## 4) Offline Verify Output Sample (`verify:offline` -> PASS)
```json
{
  "verification_result": "PASS",
  "failed_codes": [],
  "warnings": [],
  "checks": []
}
```

## 5) Failure Response Sample (`POST /verify` -> 503)
```json
{
  "code": "PROOF_SERVICE_UNAVAILABLE",
  "message": "",
  "correlation_id": "",
  "details": {
    "stage": "",
    "reason": ""
  }
}
```

## 6) Correlation IDs
- Success correlation_id:
- Failure correlation_id:

## 7) Verdict
- Team Lead verdict: PASS / PARTIAL PASS / BLOCK
- Rationale:
- Blocking items (if any):
- Corrective actions:
