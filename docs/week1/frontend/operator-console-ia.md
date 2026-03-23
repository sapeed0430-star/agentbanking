# Operator Console Information Architecture (v1)

## Primary Navigation

1. Overview
2. Verify Run
3. Receipts
4. Audit Reports
5. Evidence Vault
6. Policy Rules
7. Integrations
8. LLM Monitor
9. Billing & Subscription
10. API Security
11. Export Center
12. Settings

## Overview Page Modules

1. Verification throughput (today, 7d, 30d)
2. Pass/warning/fail trend
3. Latest failed receipts
4. Signature and timestamp health
5. Transparency log anchoring status
6. SLA and webhook delivery status

## Verify Run Page Modules

1. Request payload uploader/editor
2. Policy version picker
3. Dry run mode toggle
4. Verification result panel
5. Generated receipt preview

## Receipts Page Modules

1. Filter panel (result, date, agent, policy)
2. Receipt list table (sortable)
3. Bulk export actions
4. Pagination and saved views

## Receipt Detail IA

1. Header: receipt id, status, issued time, policy version
2. Cryptographic proof section
3. Verification findings section
4. Evidence references section
5. Timeline and chain-of-custody section
6. Actions: download JSON, copy verification command, open report

## Launch Operations IA

### Billing & Subscription Management

1. Current plan and environment scope (sandbox/production)
2. Usage meters (verification count, storage, API overage)
3. Invoice history and receipt download
4. Payment method and tax/business profile
5. Seat and role license assignment
6. Upgrade/downgrade and renewal controls
7. Dunning and failed payment alerts

### API Keys & JWKS Visibility

1. API key inventory (name, scope, created at, last used)
2. Key lifecycle actions (create, rotate, revoke, expire)
3. Scoped permissions matrix by endpoint group
4. JWKS viewer (active `kid`, algorithm, status, publish time)
5. Key rotation audit timeline and rollout checklist
6. mTLS/OIDC integration status panel

### Audit Evidence Export Center

1. Export request form (date range, agent, policy, result)
2. Export package profiles (regulator, internal audit, legal)
3. Bundle manifest preview (report, receipt, proof, key state)
4. Job queue and progress tracking
5. Secure delivery channel selector (signed URL/SFTP/API push)
6. Retention expiry and re-export history

## LLM Verification Monitoring IA

1. Model traffic overview by provider/model/version
2. Latency dashboard (p50/p95/p99, timeout rate)
3. Failure reason breakdown (schema mismatch, signature invalid, policy reject, provider error)
4. Cost analytics (cost per verification, daily burn, budget threshold alerts)
5. Drift watch (result delta by policy/model change)
6. Incident timeline with linked receipts and evidence
7. Alert rules (SLO breach, cost spike, failure burst)

## Role-Based Access Notes

1. Operator: run verification, view receipts/reports, monitor LLM performance; no key rotation, billing owner update, retention/legal policy change authority.
2. Compliance: access Export Center, evidence retention, legal hold, audit package generation; read-only for API key lifecycle and billing plan changes.
3. Admin: full control over billing/subscription, API keys, JWKS lifecycle, org-wide settings; approval authority for key revoke, plan downgrade, retention policy change.
