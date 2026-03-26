#!/usr/bin/env node
import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { join } from 'node:path';

function getReportArg() {
  const arg = process.argv.find((v) => v.startsWith('--report='));
  if (arg) return arg.split('=')[1];
  return 'docs/week2/operations/launch-dryrun-2026-03-26.md';
}

async function main() {
  const reportRel = getReportArg();
  const reportPath = join(process.cwd(), reportRel);

  try {
    await access(reportPath, constants.F_OK | constants.R_OK);
  } catch {
    // eslint-disable-next-line no-console
    console.error(`FAIL: dryrun report missing -> ${reportRel}`);
    process.exit(1);
  }

  const content = await readFile(reportPath, 'utf8');
  const requiredTokens = [
    '# Launch Dry Run Report',
    '## Execution Summary',
    '| Contract | `npm run check:contract` | PASS |',
    '| Evidence Integrity | `npm run check:evidence` | PASS |',
    '| Integration Stability | `npm run check:integration` | PASS |',
    '| Regression Tests | `npm test` | PASS |',
    '- overall: `PASS`',
  ];

  const missing = requiredTokens.filter((token) => !content.includes(token));
  if (missing.length > 0) {
    // eslint-disable-next-line no-console
    console.error(`FAIL: dryrun report validation failed (${reportRel})`);
    for (const token of missing) {
      // eslint-disable-next-line no-console
      console.error(`- missing token: ${token}`);
    }
    process.exit(1);
  }

  // eslint-disable-next-line no-console
  console.log(`PASS: dryrun report validated (${reportRel})`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('FAIL:', err.message);
  process.exit(1);
});
