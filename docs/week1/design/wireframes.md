# Core 3 Wireframes (Low-Fidelity)

## 1) Overview Dashboard

```
+--------------------------------------------------------------------------------+
| Top Bar: Env | Search | Notifications | User                                  |
+----------------------+---------------------------------------------------------+
| Left Nav             | KPIs: Throughput | Pass Rate | Fail Rate | SLA        |
| - Overview           +---------------------------------------------------------+
| - Verify Run         | Trend Chart (7d)                                           |
| - Receipts           +----------------------------+----------------------------+
| - Audit Reports      | Latest Failed Receipts     | Log Anchor Health         |
| - Evidence Vault     +----------------------------+----------------------------+
| - Policy Rules       | Pending Actions / Escalations                               |
+----------------------+---------------------------------------------------------+
```

## 2) Verify Run Screen

```
+--------------------------------------------------------------------------------+
| Verify Run                                                                     |
+--------------------------------------------------------------------------------+
| Input Panel                     | Policy & Runtime                             |
| - Request JSON editor/upload    | - Policy version selector                    |
| - Evidence refs                 | - Dry run toggle                             |
| - Agent metadata                | - Risk profile                                |
+---------------------------------+----------------------------------------------+
| Verify Action Button                                                         |
+--------------------------------------------------------------------------------+
| Result Panel: pass/warning/fail + generated receipt preview                  |
+--------------------------------------------------------------------------------+
```

## 3) Receipt Detail Screen

```
+--------------------------------------------------------------------------------+
| Receipt Header: receipt_id | status | issued_at | policy_version              |
+-------------------------------+-----------------------------------------------+
| Verification Summary          | Proof Timeline                                |
| - Agent/operator              | - verify executed                             |
| - Report digest               | - signature created                           |
| - Signature metadata          | - timestamp attached                          |
| - Findings summary            | - transparency anchor complete                |
+-------------------------------+-----------------------------------------------+
| Evidence Table: kind | uri | digest                                            |
+--------------------------------------------------------------------------------+
| Actions: Download JSON | Copy Verify Command | Open Audit Report               |
+--------------------------------------------------------------------------------+
```

## Layout Notes

1. Desktop: 12-column grid, sidebar fixed.
2. Tablet/mobile: collapse sidebar to top drawer.
3. Keep proof timeline and actions visible without scrolling too deep.
