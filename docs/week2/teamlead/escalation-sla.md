# Escalation SLA (Week 2 Operations)

## Severity Levels

| Severity | Definition | First Response SLA | Mitigation Start SLA | Update Cadence |
|---|---|---|---|---|
| Sev-0 | Receipt integrity compromise, evidence forgery risk | 15 min | 30 min | every 30 min |
| Sev-1 | Core verify/retrieve API degraded or failing | 30 min | 1 hour | every 1 hour |
| Sev-2 | Non-critical feature issue with workaround | 2 hours | 4 hours | every 4 hours |
| Sev-3 | Minor bug/document mismatch | 1 business day | 2 business days | daily |

## Escalation Chain
1. Detect: any agent opens incident note with severity and impact.
2. Triage: Team Lead confirms severity within 15 minutes.
3. Assign: primary owner and backup owner are assigned immediately.
4. Mitigate: owner executes rollback/fix/runbook.
5. Communicate: Team Lead sends periodic status updates on cadence.
6. Close: incident closed only after validation and action items registered.

## Ownership by Incident Type

| Incident Type | Primary Owner | Backup | Team Lead Action |
|---|---|---|---|
| Signature/hash verification failure | Backend | Research | escalate to Sev-0 by default |
| Regulatory/compliance interpretation conflict | Research | Team Lead | block release gate until resolved |
| UI evidence flow break | Frontend | Design | downgrade only with explicit workaround |
| Pricing/positioning risk in launch content | Marketing | Team Lead | block external publication |

## Mandatory Incident Ticket Fields
1. Incident ID
2. Severity
3. Impact scope
4. Detection time (KST)
5. Owner and backup
6. Mitigation action
7. Current status
8. Next update time
9. Closure evidence
10. Preventive follow-up task

