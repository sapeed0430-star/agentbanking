#!/usr/bin/env node
import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { join } from 'node:path';

function getDateArg() {
  const arg = process.argv.find((v) => v.startsWith('--date='));
  if (arg) return arg.split('=')[1];
  return '2026-03-29';
}

async function fileExists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function collectEvidencePaths(content) {
  const paths = [];
  const regex = /`([^`]+)`/g;
  let m;
  while ((m = regex.exec(content)) !== null) {
    const value = m[1].trim();
    if (value.startsWith('docs/') || value.startsWith('scripts/')) {
      paths.push(value);
    }
  }
  return [...new Set(paths)];
}

async function main() {
  const date = getDateArg();
  const root = process.cwd();

  const files = {
    pilot: `docs/week12/operations/pilot-onboarding-checklist-${date}.md`,
    sla: `docs/week12/operations/sla-acceptance-checklist-${date}.md`,
    goNoGo: `docs/week12/operations/ga-go-no-go-package-${date}.md`,
    teamlead: `docs/week12/teamlead/week12-governance-validation-${date}.md`,
    runtimePilotLog: `docs/week12/operations/pilot-day1-execution-log-${date}.md`,
    runtimeSlaLog: `docs/week12/operations/sla-monitoring-daily-${date}.md`,
    issueRegister: `docs/week12/operations/onboarding-issue-register-${date}.md`,
    teamleadRuntime: `docs/week12/teamlead/week12-launch-ops-validation-${date}.md`,
  };

  const errors = [];
  const contents = {};

  for (const [name, relPath] of Object.entries(files)) {
    const abs = join(root, relPath);
    if (!(await fileExists(abs))) {
      errors.push(`missing file: ${relPath}`);
      continue;
    }
    contents[name] = await readFile(abs, 'utf8');
  }

  if (contents.pilot && !contents.pilot.includes('- Verdict: `PASS`')) {
    errors.push(`pilot verdict is not PASS (${files.pilot})`);
  }
  if (contents.sla && !contents.sla.includes('- Verdict: `PASS`')) {
    errors.push(`sla verdict is not PASS (${files.sla})`);
  }
  if (contents.goNoGo && !contents.goNoGo.includes('- Decision: `GO`')) {
    errors.push(`ga go/no-go decision is not GO (${files.goNoGo})`);
  }
  if (contents.teamlead && !contents.teamlead.includes('`UNLOCKED`')) {
    errors.push(`teamlead unlock decision is not UNLOCKED (${files.teamlead})`);
  }
  if (contents.teamlead && !contents.teamlead.includes('- Recommendation: `GO`')) {
    errors.push(`teamlead recommendation is not GO (${files.teamlead})`);
  }
  if (contents.runtimePilotLog && !contents.runtimePilotLog.includes('- Verdict: `PASS`')) {
    errors.push(`pilot day1 execution verdict is not PASS (${files.runtimePilotLog})`);
  }
  if (contents.runtimeSlaLog && !contents.runtimeSlaLog.includes('- Verdict: `PASS`')) {
    errors.push(`sla monitoring daily verdict is not PASS (${files.runtimeSlaLog})`);
  }
  if (contents.teamleadRuntime && !contents.teamleadRuntime.includes('`UNLOCKED`')) {
    errors.push(`teamlead runtime unlock decision is not UNLOCKED (${files.teamleadRuntime})`);
  }
  if (contents.teamleadRuntime && !contents.teamleadRuntime.includes('- Recommendation: `GO`')) {
    errors.push(`teamlead runtime recommendation is not GO (${files.teamleadRuntime})`);
  }

  const evidenceToValidate = [];
  for (const content of Object.values(contents)) {
    evidenceToValidate.push(...collectEvidencePaths(content));
  }

  const uniqueEvidence = [...new Set(evidenceToValidate)];
  for (const relPath of uniqueEvidence) {
    const abs = join(root, relPath);
    if (!(await fileExists(abs))) {
      errors.push(`missing evidence link target: ${relPath}`);
    }
  }

  if (errors.length > 0) {
    console.error('FAIL: week12 readiness check failed');
    for (const err of errors) {
      console.error(`- ${err}`);
    }
    process.exit(1);
  }

  console.log(`PASS: week12 readiness check passed (${date})`);
}

main().catch((err) => {
  console.error(`FAIL: ${err.message}`);
  process.exit(1);
});
