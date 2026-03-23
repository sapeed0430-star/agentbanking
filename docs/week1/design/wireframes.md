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

## 4) Integrity Escalation Flow (Severity Explicit)

```
[verify/offline result]
        |
        v
+--------------------------+
| Severity Classifier      |
| critical/high/medium/low|
+--------------------------+
        |
        +--> critical: red banner + incident modal + lane lock (BLOCK)
        +--> high: orange banner + required owner assignment + retry decision
        +--> medium: yellow callout + remediation checklist
        +--> low: blue info note + optional follow-up
```

### Severity-to-UI Contract
1. `critical`
- Color: `#B42318` (text), `#FEE4E2` (surface)
- Behavior: force incident callout open, "Next Task Disabled" label shown.
2. `high`
- Color: `#B54708` (text), `#FEF0C7` (surface)
- Behavior: action required before approval (`owner`, `due`, `retryable` decision).
3. `medium`
- Color: `#B26B00` (text), `#FFF7E6` (surface)
- Behavior: checklist completion required, lane may continue only with partial pass.
4. `low`
- Color: `#175CD3` (text), `#EFF8FF` (surface)
- Behavior: informational only, no hard lane block.

## 5) Mobile 320px Constraints (Receipt Detail + Error Panel)

1. Base container width: `320px` (min target), horizontal padding `12px`.
2. Receipt header stacks into 2 rows:
- Row 1: `receipt_id` (ellipsis)
- Row 2: `status`, `issued_at`, `policy_version` as chips/wrap.
3. Timeline card behavior:
- Full width single column.
- Each event row min height `44px` for touch.
4. Evidence table transforms to drawer cards:
- Default collapsed summary (`kind`, short uri).
- Tap expands drawer to show full digest/remediation links.
5. Error callout panel:
- Sticky bottom sheet style on mobile.
- Height: max `45vh`, internal scroll for long remediation text.
6. Action buttons:
- Vertical stack, min button height `44px`, full width.

## 6) Component Behavior Notes

### Proof Timeline
1. States: `pending`, `success`, `failed`.
2. Failed step click opens right-side detail (desktop) or bottom sheet (mobile).
3. Timeline auto-scrolls to first failed node on load.

### Evidence Drawer
1. Default collapsed to reduce cognitive load.
2. Shows digest compare status badge: `match` / `mismatch`.
3. If mismatch, show linked remediation and correlation_id reference.

### Error Callout
1. Required fields: `error_code`, `severity`, `retryable`, `correlation_id`, `remediation`.
2. Copy interactions:
- Copy correlation_id
- Copy cURL/verify command
3. Progression lock indicator:
- If severity `critical` or verdict `BLOCK`, show `Next Task Locked` strip.

## Layout Notes

1. Desktop: 12-column grid, sidebar fixed.
2. Tablet/mobile: collapse sidebar to top drawer.
3. Keep proof timeline and actions visible without scrolling too deep.
