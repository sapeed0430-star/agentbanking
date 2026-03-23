# Operator Console Information Architecture (v1)

## Primary Navigation

1. Overview
2. Verify Run
3. Receipts
4. Audit Reports
5. Evidence Vault
6. Policy Rules
7. Integrations
8. Billing
9. Settings

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

## Access Model

1. Operator: read/write verify endpoints, read receipts
2. Reviewer: read receipts/reports, comment only
3. Compliance admin: export, retention, legal hold controls
