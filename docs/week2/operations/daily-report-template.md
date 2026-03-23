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

## 3) Submission Rule
1. All agents submit by 18:00 KST.
2. Team Lead publishes consolidated summary by 19:00 KST.
3. Any Sev-0 or Sev-1 issue bypasses daily cycle and triggers immediate escalation.

## 4) Team Lead Validation Command
1. Validate today:
   - `make daily-report-check`
2. Validate a specific date:
   - `make daily-report-check DATE=2026-03-23`
