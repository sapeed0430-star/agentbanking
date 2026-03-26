#!/usr/bin/env node
import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { join } from 'node:path';

const REQUIRED_FILES = [
  'docs/program/launch-countdown-2026-04-01.md',
  'docs/week2/operations/launch-dryrun-2026-03-30.md',
  'docs/week2/backend/evidence/integration-gate-2026-03-29.json',
  'docs/program/launch-evidence-manifest-2026-03-26.json',
  'docs/week2/operations/evidence-integrity-review-2026-03-26.md',
  'scripts/check-openapi-contract.js',
  'scripts/check-evidence-integrity.js',
  'scripts/check-launch-dryrun-report.js',
];

async function exists(path) {
  try {
    await access(path, constants.F_OK | constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

async function checkIntegrationEvidence(root) {
  const path = join(root, 'docs/week2/backend/evidence/integration-gate-2026-03-29.json');
  const raw = await readFile(path, 'utf8');
  const parsed = JSON.parse(raw);
  return parsed.overall === 'PASS';
}

async function checkDryrunReport(root) {
  const path = join(root, 'docs/week2/operations/launch-dryrun-2026-03-30.md');
  const content = await readFile(path, 'utf8');
  return content.includes('- overall: `PASS`');
}

async function main() {
  const root = process.cwd();
  const missing = [];

  for (const rel of REQUIRED_FILES) {
    const full = join(root, rel);
    if (!(await exists(full))) {
      missing.push(rel);
    }
  }

  if (missing.length > 0) {
    // eslint-disable-next-line no-console
    console.error('FAIL: final readiness missing files');
    for (const item of missing) {
      // eslint-disable-next-line no-console
      console.error(`- ${item}`);
    }
    process.exit(1);
  }

  const checks = [];

  const integrationPass = await checkIntegrationEvidence(root);
  checks.push({
    name: 'integration_evidence_overall',
    pass: integrationPass,
  });

  const dryrunPass = await checkDryrunReport(root);
  checks.push({
    name: 'dryrun_report_overall',
    pass: dryrunPass,
  });

  const failed = checks.filter((c) => !c.pass);
  if (failed.length > 0) {
    // eslint-disable-next-line no-console
    console.error('FAIL: final readiness checks failed');
    for (const item of failed) {
      // eslint-disable-next-line no-console
      console.error(`- ${item.name}`);
    }
    process.exit(1);
  }

  // eslint-disable-next-line no-console
  console.log('PASS: final readiness precheck passed.');
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('FAIL:', err.message);
  process.exit(1);
});
