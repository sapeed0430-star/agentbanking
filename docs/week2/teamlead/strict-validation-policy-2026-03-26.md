# Strict Validation Policy - 2026-03-26

## Scope
- Applies to all sub-agent reports and Team Lead approval decisions for Week 2 lanes: Research, Backend, Frontend, Design, Marketing.
- Default stance: reject ambiguity. If evidence, ownership, timing, or cross-doc references are unclear, treat the report as `BLOCK`.

## 1) Evidence Authenticity Checks
1. Evidence must be primary and directly inspectable: command output, generated artifact, trace/log, or linked document.
2. Evidence must be time-bound and attributable: include KST timestamp, author/agent, and execution context when applicable.
3. Evidence must be reproducible or replayable where possible: include command, script, or artifact path.
4. Evidence is invalid if it is only summarized, copied from another report without source, or lacks a verifiable origin.
5. For crypto/integrity claims, require raw proof bundle and verification result; screenshots or paraphrases are not enough.

## 2) Cross-Document Consistency Checks
1. IDs, timestamps, lane names, owners, and verdicts must match across the report, evidence links, and related docs.
2. Acceptance criteria in the report must match the referenced spec, checklist, or gate doc with no contradictory wording.
3. If one doc says `PASS` and another says `PARTIAL` or `BLOCK` for the same task, the stricter verdict wins until reconciled.
4. A report must cite the exact source files used for judgment; missing citations are a consistency failure.
5. Any launch-critical doc update must be reflected in the corresponding status note or approval record in the same cycle.

## 3) Verdict Rules: `PASS` / `PARTIAL` / `BLOCK`
### `PASS`
- All required evidence is present, authentic, and internally consistent.
- All acceptance criteria are explicitly met.
- No unresolved blocker, no missing owner, no missing due time, no unresolved contradiction.
- Team Lead approval is recorded in the same cycle.

### `PARTIAL`
- Evidence is real and useful, but one or more non-critical requirements remain open.
- Missing items must be named precisely with owner and next update time.
- `PARTIAL` never unlocks the next task and never counts as approval.

### `BLOCK`
- Evidence is missing, unverifiable, contradictory, forged, stale, or not tied to the claimed task.
- Any crypto/integrity failure, integrity ambiguity, or launch freeze violation is `BLOCK`.
- Any report without owner, due time, or next update time for a blocker is `BLOCK`.

## 4) Error Taxonomy and Auto-Escalation Thresholds
| Code | Error Type | Default Verdict | Auto-Escalation |
|---|---|---|---|
| E1 | Missing evidence link or missing artifact | `BLOCK` | Immediate Team Lead review |
| E2 | Authenticity failure, forged/unauthenticated proof, or unverifiable origin | `BLOCK` | Sev-0, immediate escalation |
| E3 | Cross-document mismatch in ID, verdict, owner, or timestamp | `BLOCK` | Escalate if repeated once in same lane |
| E4 | Acceptance criteria incomplete but evidence still real | `PARTIAL` | Escalate after 2 consecutive cycles |
| E5 | Late submission after `:50` or late approval after `:00` | `BLOCK` | Escalate if repeated once in 2 hours |
| E6 | Scope drift or unapproved change to launch-critical content | `BLOCK` | Team Lead review required |

- Immediate escalation threshold: any `E2` or any crypto/integrity issue.
- Same-lane threshold: 2 blockers in 1 cycle or 2 consecutive `PARTIAL` results.
- Org-level threshold: any repeated `E3` across lanes in the same cycle.

## 5) Hourly Approval Workflow (`:50` / `:00`)
1. At `:50`, each lane submits its report bundle: verdict request, evidence, blockers, next update time, and cross-doc references.
2. Team Lead reviews between `:50` and `:00` against authenticity and consistency checks.
3. At `:00`, Team Lead records the final verdict for each lane.
4. If approval is not explicitly recorded by `:00`, treat the lane as `BLOCK` for the next task.
5. If a lane is `PARTIAL` or `BLOCK`, the lane stays locked until a new bundle closes the gap in a later cycle.

## 6) 2026-04-01 Launch Freeze Rules
1. On and after `2026-04-01`, launch-critical docs are frozen unless Team Lead approves the change in writing.
2. Frozen docs include acceptance criteria, lane checklists, launch copy, release notes, and integrity/security statements.
3. Only corrective changes that preserve intent and reduce risk may be approved during freeze.
4. Any change to crypto, integrity, signing, timestamping, or verification policy is a hard gate and must be re-reviewed.
5. No-waiver policy: crypto/integrity failures cannot be waived, deferred, or accepted as `PARTIAL`.

## 7) Lane Checklist
| Lane | Required Checks | Hard Block Triggers |
|---|---|---|
| Research | source citations present, policy claim matches source, conclusion tied to evidence | uncited claim, contradictory source, stale or secondary-only evidence |
| Backend | reproducible command/log, runtime proof, contract/API alignment, integrity proof if relevant | missing log, unverifiable runtime, crypto/timestamp failure, contract mismatch |
| Frontend | UI spec or screenshot, component/state mapping, acceptance criteria traceable to source doc | missing artifact, mismatch with IA/spec, unapproved launch-copy change |
| Design | wireframe or mock, spacing/behavior notes, handoff criteria, consistency with brief | missing mock, conflicting component rules, frozen asset changed without approval |
| Marketing | ICP/pricing/message doc, launch claim traceability, approval-linked copy | unsupported claim, launch-copy drift, freeze violation |

## Approval Note
- Team Lead approvals must name the lane, verdict, evidence set, and unresolved risk, if any.
- `PASS` is only valid when the evidence set and approval record point to the same task and same cycle.
