# Regulatory Mapping v1 + Standards Adoption Table

## Scope
This document maps initial compliance obligations for an autonomous investment agent audit service that issues tamper-evident receipts and audit reports.

## Regulatory Mapping v1

| Jurisdiction | Regulation | Why It Matters | Control Requirements (v1) | Retention Baseline | Owner |
| --- | --- | --- | --- | --- | --- |
| US | SEC Rule 17a-4 | Broker-dealer books and records, immutable storage expectations | WORM-like retention policy, audit trail, exportable records, legal hold process | 6 years (policy configurable) | Compliance + Backend |
| US | FINRA Rule 4511 | Recordkeeping for member firms | Traceable receipt/report history, searchable records, supervisory access | 6 years default when unspecified | Compliance + Ops |
| US | CFTC 1.31 | Electronic records for regulated derivatives entities | Reliable time ordering, non-rewriteable evidence chain, reproducible exports | Per record class, long-term | Compliance |
| EU | GDPR | Personal data in reports/evidence | Data minimization, pseudonymization, DSAR support, retention limits by purpose | Purpose-limited | Security + Data |
| KR | Personal Information Protection Act (PIPA) | Handling personal data in Korea | Consent/legal basis logging, minimization, deletion policy, breach workflow | Policy + legal basis bound | Compliance |
| KR | Electronic Financial Transactions Act (EFTA) | Electronic transaction integrity and incident response | Integrity controls, access logging, incident evidence preservation | Per regulatory class | Security + Ops |

## Implemented Artifact to Regulation Mapping (Field-Level)

| Artifact / Field | Endpoint / Location | Regulatory Control Objective | Regulation Link | Current Status |
| --- | --- | --- | --- | --- |
| `request_id` replay control | `POST /verify` | Prevent duplicate processing and preserve audit integrity | SEC 17a-4, FINRA 4511 | Implemented |
| `integrity_result` failure evidence (`422`) | `POST /verify` | Structured failure trace for supervisory review | FINRA 4511, CFTC 1.31 | Implemented |
| Offline reproducible verification result | `POST /verify/offline` | Independent re-verification path for audit/regulator requests | SEC 17a-4, CFTC 1.31 | Implemented |
| Immutable receipt retrieval by ID | `GET /receipts/{id}` | Record lookup and supervisory access | FINRA 4511 | Implemented |
| `retention_until` | `Receipt` field | Record retention policy traceability | SEC 17a-4, FINRA 4511 | Implemented |
| `verification_endpoint` | `Receipt` field | Verifier endpoint reference for external audit checks | SEC 17a-4 | Implemented |
| `report_digest`, `signature` | `Receipt` field | Tamper detection and signer accountability | CFTC 1.31, EFTA | Implemented (HSM path pending) |
| `timestamp_proof` | `Receipt` field | Trusted event time attestation | CFTC 1.31 | Partial (staging trust-chain validation pending) |
| `transparency_proof` | `Receipt` field | Third-party verifiability and non-repudiation | SEC 17a-4, CFTC 1.31 | Partial (Rekor staging validation pending) |
| `agent_id`, `operator_id`, `correlation_id` | Request/response metadata | Accountability and incident traceability | FINRA 4511, EFTA | Implemented |

## Standards Adoption Status (v1.1)

| Standard | Decision | Implemented Scope | Status | Gap |
| --- | --- | --- | --- | --- |
| JCS (RFC 8785) | Adopt | Deterministic canonical digest path used in receipt/report hashing | Partial | Full RFC 8785 parity test vectors across languages needed |
| JWS (RFC 7515) | Adopt | Compact JWS + Ed25519 local/mock signer path | Partial | HSM/KMS backed production key path pending |
| RFC 3161 | Adopt | TSA adapter path (`application/timestamp-query/reply`) implemented | Partial | Staging endpoint trust-chain validation evidence pending |
| Rekor Transparency Log | Adopt | Rekor entry append + inclusion proof mapping implemented | Partial | Staging proof verification and operational SLO evidence pending |

## Control Backlog (Week 1)

1. Define record classes and retention matrix by jurisdiction.
2. Define PII classification tags for evidence references.
3. Define legal hold API contract and runbook.
4. Define external auditor export format (JSONL + signature manifest).

## Unresolved Regulatory Items (Owner + Due)

| Item | Owner | Due Date (KST) | Notes |
| --- | --- | --- | --- |
| SEC/FINRA record-class retention matrix (field-by-field) finalization | Research + Compliance | 2026-03-25 | Required before G2 freeze sign-off |
| TSA primary/backup provider legal acceptability check | Research + Backend | 2026-03-26 | Must include contract/SLA evidence |
| Rekor public transparency vs tenant-isolated log decision | Research + Team Lead | 2026-03-26 | Include risk acceptance memo |
| KR/EU data residency control mapping for evidence URIs | Research + Security | 2026-03-27 | PII export path and deletion policy alignment |
