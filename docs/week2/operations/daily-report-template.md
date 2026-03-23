# Daily Report Template (All Agents)

## 1) Agent Daily Report (Copy/Paste)

```md
# [Agent Name] Daily Report - YYYY-MM-DD (KST)

## Today Focus
- 

## Completed
- 

## In Progress
- 

## Blockers
- 

## Risks
- 

## Needs From Other Agents
- 

## Deliverables Updated (file paths)
- 

## Tomorrow Plan
- 
```

## 1.1 Agent Hourly Checkpoint Template (Copy/Paste)

```md
# [Agent Name] Hourly Checkpoint - YYYY-MM-DD HH:00 (KST)

## Current Task ID
- 

## Evidence Updated (file paths)
- 

## Validation Request To Team Lead
- Requested Verdict: PASS / PARTIAL PASS / BLOCK
- Why this should pass:

## Blockers (if any)
- 

## Proposed Next Task (only after PASS)
- 
```

## 2) Team Lead Aggregation Template

```md
# Team Lead Daily Ops Summary - YYYY-MM-DD (KST)

## KPI Snapshot
- Sprint Completion Rate:
- On-time Delivery Rate:
- PR Review SLA:
- API Contract Drift:
- Verification Success Rate:
- Receipt Integrity Failure Rate:

## Gate Status
- G1 Requirements Freeze:
- G2 Schema/API Freeze:
- G3 Crypto/Integrity Gate:
- G4 UX Gate:
- G5 GTM Gate:
- G6 RC Gate:

## Major Blockers
- 

## Decisions Taken
- 

## Escalations (if any)
- Incident ID / Severity / Owner / Next Update:

## Next-day Priorities
- 
```

## 2.1 Team Lead Hourly Validation Template (Copy/Paste)

```md
# Team Lead Hourly Validation - YYYY-MM-DD HH:00 (KST)

## Agent Verdicts
| Agent | Task ID | Verdict | Next Task Allowed | Notes |
|---|---|---|---|---|
| Research |  | PASS/PARTIAL/BLOCK | Yes/No |  |
| Backend |  | PASS/PARTIAL/BLOCK | Yes/No |  |
| Frontend |  | PASS/PARTIAL/BLOCK | Yes/No |  |
| Design |  | PASS/PARTIAL/BLOCK | Yes/No |  |
| Marketing |  | PASS/PARTIAL/BLOCK | Yes/No |  |

## Blocking Actions
- Owner:
- Due:
- Next update time:
```

## 3) Submission Rule
1. All agents submit hourly checkpoint by `:50` KST.
2. Team Lead publishes hourly validation by `:00` KST.
3. Any Sev-0 or Sev-1 issue bypasses hourly cycle and triggers immediate escalation.
4. Next task execution is blocked unless Team Lead verdict is `PASS` (or scoped `PARTIAL PASS`).

## 4) Team Lead Validation Command
1. Validate today:
   - `make daily-report-check`
2. Validate a specific date:
   - `make daily-report-check DATE=2026-03-23`
