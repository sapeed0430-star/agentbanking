# Sub-Agent Reporting QA Status Note - 2026-03-26 (KST)

## Status
Active. This note defines the QA process used to validate sub-agent reports before Team Lead accepts them into the hourly ops record.

## QA Objective
1. Prevent duplicate submissions from being counted as new work.
2. Catch contradictions before they enter the shared status log.
3. Reject claims that do not carry direct evidence.

## Required QA Checks

### 1) Duplicate Detection
Check whether a sub-agent report repeats an already submitted item.

**Duplicate indicators**
- same task ID
- same deliverable title
- same evidence path set
- same conclusion with no new evidence

**QA rule**
- If the content is unchanged, mark it as `DUPLICATE` and do not count it as progress.
- If only formatting changed, require the agent to point to the actual delta.
- If the same evidence is reused for a new claim, treat the claim as unverified until new evidence is attached.

**Report output**
- `duplicate`: yes/no
- `duplicate reason`: task ID, evidence path, or text match
- `action`: ignore, merge, or request correction

### 2) Contradiction Detection
Check whether the new report conflicts with earlier reports or with another agent’s lane.

**Contradiction indicators**
- one report says `PASS` while another report says the same task is still blocked
- evidence date is newer than the claim but the claim outcome is older
- owner assignment differs between related notes
- a deliverable is described as complete in one file and incomplete in another

**QA rule**
- If any contradiction appears, pause acceptance and mark both records for reconciliation.
- The Team Lead must resolve the conflict before the report can be treated as authoritative.

**Report output**
- `contradiction`: yes/no
- `conflict pair`: file A and file B
- `resolution needed`: yes/no

### 3) Missing Evidence Detection
Check whether each material claim has the evidence needed to support it.

**Evidence requirements**
- file path for the artifact
- brief description of what the artifact proves
- date/time when the evidence was produced
- owner of the evidence

**QA rule**
- A claim without evidence is `MISSING EVIDENCE`.
- A claim with an unreadable or empty artifact is also `MISSING EVIDENCE`.
- A claim that depends on screenshots, logs, or command output must include at least one of those artifacts or a clear reason why it is unavailable.

**Report output**
- `missing evidence`: yes/no
- `missing items`: list of file paths or artifact types
- `action`: request evidence, hold report, or escalate

## Intake Workflow
1. Read the new sub-agent report.
2. Compare it against the last accepted report for the same lane and task.
3. Run duplicate detection first.
4. Run contradiction detection second.
5. Run missing evidence detection third.
6. If all three checks pass, mark the report as `QA PASS`.
7. If any check fails, mark the report as `QA HOLD` and send it back to the owner.

## Escalation Rules
1. `DUPLICATE` only: return to the owner if the duplicate is harmless, otherwise ignore it.
2. `CONTRADICTION`: escalate to Team Lead immediately.
3. `MISSING EVIDENCE`: hold the report until the missing artifact is attached.
4. If two or more failures appear together, treat the report as blocked.

## Standard Reporting Line
Every QA result must include:
- report file path
- check result for duplicate detection
- check result for contradiction detection
- check result for missing evidence detection
- final status: `QA PASS` or `QA HOLD`
- next action owner

