# Launch Claim Evidence Traceability

Purpose: block unsupported launch language before publish. Use this sheet to map every external claim to a source, an owner, and an allowed wording boundary.

## Claim Traceability Table

| External launch claim | Evidence source path | Verification owner | Risk level | Allowed wording |
|---|---|---:|---|---|
| Product is available in launch scope | `docs/program/launch-countdown-2026-04-01.md`, `docs/program/daily-tracking/2026-03-26.md` | Team Lead | High | "Available in the current launch scope" |
| Integrates with operator verification workflow | `docs/week3/frontend/launch-critical-operator-flow-2026-03-27.md`, `docs/week1/backend/openapi-draft.yaml` | Backend + Frontend Lead | Medium | "Supports the documented verification workflow" |
| Improves audit preparation efficiency | `docs/week1/marketing/icp-pricing-onepager.md`, `docs/week2/research/launch-cloud-api-llm-payment-korea-2026-03-24.md` | Marketing Lead | Medium | "Designed to reduce manual audit packaging work" |
| Security controls are enforced in runtime | `docs/week2/backend/staging-security-hardening-2026-03-24.md`, `docs/week2/backend/proof-suite-runbook-2026-03-25.md` | Backend Lead | High | "Reviewed against the current security hardening checklist" |
| Enterprise packaging is available | `docs/week1/marketing/icp-pricing-onepager.md` | Marketing Lead | High | "Aligned to the current enterprise packaging criteria" |
| Quick technical onboarding path exists | `README.md`, `docs/week2/backend/docker-runtime-setup-2026-03-24.md` | Backend Lead | Medium | "Can be set up using the documented onboarding flow" |

## Banned Wording

Do not use language that overclaims, guarantees, or implies approvals we do not have.

- Absolute guarantees: `guaranteed`, `always`, `never`, `100%`, `risk-free`
- Compliance promises without written approval: `fully compliant`, `certified`, `audit-proof`, `meets all regulations`
- Security overclaims: `unhackable`, `military-grade`, `bulletproof`, `cannot fail`
- Performance superlatives unless benchmarked and approved: `best`, `fastest`, `world-class`, `industry-leading`
- Availability overclaims: `live everywhere`, `available to all customers`, `instant access`
- Outcome guarantees: `will increase revenue`, `will eliminate errors`, `will save time for every team`

## Team Lead Gate Checklist

- [ ] Every external claim appears in the traceability table.
- [ ] Each claim has a matching evidence source path.
- [ ] Verification owner is named and has reviewed the source.
- [ ] Risk level is set to Low, Medium, or High.
- [ ] Allowed wording is copied into the final draft verbatim or used as a tighter variant.
- [ ] No banned wording appears in headline, subhead, body, CTA, or footnotes.
- [ ] Any compliance, security, legal, or availability claim has explicit written approval.
- [ ] Team Lead signs off before publish.

## Release Rule

If a claim cannot be traced to a source path and owner, remove it from launch copy.
