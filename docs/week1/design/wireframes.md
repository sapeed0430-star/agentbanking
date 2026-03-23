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

### Severity Token Mapping Table (Design -> Frontend)

| Severity | Token Name | Value | Usage |
|---|---|---|---|
| critical | `--sev-critical-text` | `#B42318` | error title, lock label |
| critical | `--sev-critical-surface` | `#FEE4E2` | critical panel background |
| high | `--sev-high-text` | `#B54708` | action-required label |
| high | `--sev-high-surface` | `#FEF0C7` | high severity panel background |
| medium | `--sev-medium-text` | `#B26B00` | checklist warning text |
| medium | `--sev-medium-surface` | `#FFF7E6` | medium severity panel background |
| low | `--sev-low-text` | `#175CD3` | informational text |
| low | `--sev-low-surface` | `#EFF8FF` | low severity panel background |
| common | `--sev-chip-radius` | `999px` | severity chip shape |
| common | `--sev-border` | `1px solid currentColor` | chip/panel emphasis border |

## 5) Mobile 320px Constraints (Receipt Detail + Error Panel)

1. Base container width: `320px` (min target), horizontal padding `12px`, vertical rhythm gap `8px`.
2. Receipt header stacks into 2 rows:
- Row 1: `receipt_id` (ellipsis)
- Row 2: `status`, `issued_at`, `policy_version` as chips/wrap.
3. Typography floor (mobile):
- Heading min size `14px`, line-height `20px`
- Body min size `12px`, line-height `18px`
- Chip label min size `11px`, line-height `16px`
4. Timeline card behavior:
- Full width single column.
- Each event row min height `44px` for touch.
5. Evidence table transforms to drawer cards:
- Default collapsed summary (`kind`, short uri).
- Tap expands drawer to show full digest/remediation links.
6. Error callout panel:
- Sticky bottom sheet style on mobile.
- Height: max `45vh`, internal scroll for long remediation text.
- Panel padding `12px`, row spacing `8px`.
7. Action buttons:
- Vertical stack, full width.
- Min button height `44px`, horizontal padding `12px`, vertical padding `10px`.
- Button-to-button gap `8px`.

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

## 7) Handoff Acceptance Checklist (PASS Criteria)

1. Mobile `320px` 기준 수평 스크롤 없음 (receipt detail + error panel).
2. Severity UI가 토큰 매핑 테이블과 정확히 일치.
3. Error callout에 `error_code`, `severity`, `retryable`, `correlation_id`, `remediation` 표시.
4. 모든 터치 액션 버튼 최소 높이 `44px` 충족.
5. `PASS/PARTIAL/BLOCK` 진행 잠금 규칙이 화면 행동 설명과 일치.
