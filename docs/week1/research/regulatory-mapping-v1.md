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

## Standards Adoption Table (v1)

| Standard | Decision | Usage in Product | Rationale | Risks | Mitigation |
| --- | --- | --- | --- | --- | --- |
| JCS (RFC 8785) | Adopt | Canonicalize JSON before hashing/signing | Deterministic payloads across runtimes | Cross-language edge cases | Canonicalization test vectors in CI |
| JWS (RFC 7515) | Adopt | Sign receipt payload (`protected`, `payload`, `signature`) | Broad ecosystem support | Weak algorithm usage | Strict allow-list (`EdDSA`, `ES256`) |
| RFC 3161 | Adopt | Trusted timestamp token for issued receipt | Strong time attestation | TSA dependency | Multi-TSA fallback + retry policy |
| Transparency Log (Merkle proof model) | Adopt | Publish receipt digest and include proof bundle | Tamper evidence + third-party verifiability | Log unavailability | Queue + delayed anchoring + proof re-fetch |

## Control Backlog (Week 1)

1. Define record classes and retention matrix by jurisdiction.
2. Define PII classification tags for evidence references.
3. Define legal hold API contract and runbook.
4. Define external auditor export format (JSONL + signature manifest).

## Decisions Pending (Week 2)

1. Shared transparency log vs dedicated tenant log.
2. Primary TSA provider and backup provider.
3. Data residency strategy for KR and EU workloads.
