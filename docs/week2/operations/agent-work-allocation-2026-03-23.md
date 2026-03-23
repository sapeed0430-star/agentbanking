# Agent Work Allocation (2026-03-23 to 2026-03-27, KST)

## Common Rule
1. Parallel execution: all domain agents run simultaneously in 1-hour cycles.
2. Hourly checkpoint: each agent submits by `:50` KST.
3. Team lead validation: verdict by `:00` KST every hour.
4. Progression gate: no agent starts the next task until Team Lead verdict is `PASS` (or scoped `PARTIAL PASS`).
5. `BLOCK` verdict freezes the agent lane until blocker owner and due time are recorded.

## Research Agent
- Mission: regulatory and standards certainty for launch gate
- Tasks:
  - Update regulatory mapping with latest changes and unresolved legal assumptions
  - Produce standards decision log for JCS/JWS/RFC3161/transparency log
  - Deliver risk register v2 with severity tags
- Deadline: 2026-03-25 18:00 KST
- Deliverables:
  - `docs/week1/research/regulatory-mapping-v1.md` (updated)
  - `docs/week2/teamlead/escalation-sla.md` input comments

## Backend Agent
- Mission: verification/receipt contract freeze
- Tasks:
  - Finalize schema fields and validation constraints for `receipt-1.0.0`
  - Refine OpenAPI for `POST /verify`, `GET /receipts/{id}` including error model
  - Define integrity failure handling path and retention policy draft
- Deadline: 2026-03-26 18:00 KST
- Deliverables:
  - `docs/week1/backend/receipt-1.0.0.schema.json` (updated)
  - `docs/week1/backend/openapi-draft.yaml` (updated)

## Frontend Agent
- Mission: operator flow completeness with evidence readability
- Tasks:
  - Upgrade receipt detail mockup to include integrity status, timeline, and filters
  - Draft FE type mapping document from OpenAPI schema
  - Validate responsive behavior for 320px and desktop
- Deadline: 2026-03-26 18:00 KST
- Deliverables:
  - `docs/week1/frontend/receipt-detail-mockup.html` (updated)
  - `docs/week2/operations/daily-report-template.md` feedback note

## Design Agent
- Mission: consistency and review-ready UI language
- Tasks:
  - Convert design tokens into screen-level component rules
  - Deliver updated wireframes for list/detail/escalation modal
  - Run UX review with frontend and document issues
- Deadline: 2026-03-25 18:00 KST
- Deliverables:
  - `docs/week1/design/design-tokens.json` (updated)
  - `docs/week1/design/wireframes.md` (updated)

## Marketing Agent
- Mission: commercial clarity tied to compliance value
- Tasks:
  - Refine ICP segments with priority ranking and buying trigger
  - Produce revised pricing one-pager with CTA by plan
  - Draft launch messaging mapped to trust/compliance outcomes
- Deadline: 2026-03-27 15:00 KST
- Deliverables:
  - `docs/week1/marketing/icp-pricing-onepager.md` (updated)

## Team Lead Agent
- Mission: enforce quality gates and unblock critical path
- Tasks:
  - Monitor KPI dashboard and gate status hourly
  - Run gate approvals G1 to G6 and log decisions
  - Operate escalation workflow and close blockers within SLA
- Deadline: Hourly verdict cycle + daily close by 19:00 KST, final week sign-off 2026-03-27 19:00 KST
- Deliverables:
  - `docs/week2/teamlead/kpi-dashboard-spec.md`
  - `docs/week2/teamlead/raci-approval-gates.md`
  - `docs/week2/teamlead/escalation-sla.md`

## Team Lead Copy/Paste Task Prompts

### Research Agent Prompt
You own Week 2 regulatory certainty. Update regulatory mapping and standards decision log, include unresolved risks with severity and action owner, and submit by 2026-03-25 18:00 KST.

### Backend Agent Prompt
You own Week 2 API and schema freeze. Align `receipt-1.0.0.schema.json` and `openapi-draft.yaml`, define error model and integrity failure behavior, and submit by 2026-03-26 18:00 KST.

### Frontend Agent Prompt
You own Week 2 operator UX readiness. Upgrade receipt detail mockup for evidence-first flow, add responsive checks, and submit by 2026-03-26 18:00 KST.

### Design Agent Prompt
You own Week 2 design consistency. Update tokens and wireframes for list/detail/escalation flows and submit by 2026-03-25 18:00 KST.

### Marketing Agent Prompt
You own Week 2 ICP/pricing clarity. Refine segment priority and pricing CTA narrative and submit by 2026-03-27 15:00 KST.

### Team Lead Agent Prompt
You own Week 2 delivery governance. Track KPIs hourly, execute gates G1-G6, enforce SLA-based escalation, and issue hourly PASS/PARTIAL/BLOCK verdicts. No agent may start next task without your validation pass.
