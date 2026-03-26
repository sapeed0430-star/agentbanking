import { readFile } from 'node:fs/promises';
import { access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { join } from 'node:path';

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getDateArg() {
  const arg = process.argv.find((v) => v.startsWith('--date='));
  if (arg) return arg.split('=')[1];
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function extractLatestGate(opsContent) {
  const headingPattern = /## Task Gate Snapshot \((\d{2}):00 KST\)/g;
  const matches = [...opsContent.matchAll(headingPattern)];
  if (matches.length === 0) return null;

  const latest = matches[matches.length - 1];
  const hour = latest[1];
  const startIndex = latest.index;

  let endIndex = opsContent.length;
  const nextHeading = opsContent.indexOf('\n## ', startIndex + 1);
  if (nextHeading !== -1) endIndex = nextHeading;

  const section = opsContent.slice(startIndex, endIndex);
  const rows = section
    .split('\n')
    .filter((line) => line.startsWith('|'))
    .filter((line) => !line.includes('---'))
    .filter((line) => !line.includes('Task ID'));

  const tasks = rows
    .map((row) => row.split('|').map((cell) => cell.trim()).filter(Boolean))
    .filter((cells) => cells.length >= 4)
    .map((cells) => ({
      taskId: cells[0],
      verdict: cells[3],
    }))
    .filter((item) => item.taskId && item.verdict);

  return { hour, tasks };
}

function validateNoPendingTableCells(content) {
  const lines = content.split('\n').filter((line) => line.startsWith('|'));
  const hasPendingCell = lines.some((line) => /\|\s*Pending\s*\|/i.test(line));
  return !hasPendingCell;
}

async function loadIfExists(path) {
  try {
    await access(path, constants.F_OK);
    return await readFile(path, 'utf8');
  } catch {
    return null;
  }
}

async function validateCrossDocumentConsistency(date, missingAccumulator) {
  const base = process.cwd();
  const opsPath = join(base, 'docs/week2/operations', `agent-execution-status-${date}.md`);
  const hourlyPath = join(base, 'docs/week2/teamlead', `hourly-validation-cycle-${date}.md`);
  const summaryPath = join(base, 'docs/week2/teamlead', `teamlead-progress-summary-${date}.md`);

  const [opsContent, hourlyContent, summaryContent] = await Promise.all([
    loadIfExists(opsPath),
    loadIfExists(hourlyPath),
    loadIfExists(summaryPath),
  ]);

  // Skip cross-doc validation when the corresponding operation files don't exist for the date.
  if (!opsContent || !hourlyContent || !summaryContent) {
    return;
  }

  const latestGate = extractLatestGate(opsContent);
  if (!latestGate) {
    missingAccumulator.push('Latest ops gate snapshot');
    return;
  }

  const hourlyCycleToken = `Cycle: ${date} ${latestGate.hour}:00 KST`;
  if (!hourlyContent.includes(hourlyCycleToken)) {
    missingAccumulator.push(`Hourly cycle token (${hourlyCycleToken})`);
  }

  for (const { taskId, verdict } of latestGate.tasks) {
    if (!summaryContent.includes(taskId)) {
      missingAccumulator.push(`Summary task reference (${taskId})`);
      continue;
    }

    const summaryVerdictPattern = new RegExp(
      `\\\`${escapeRegExp(taskId)}\\\`\\s*-\\s*\\\`${escapeRegExp(verdict)}\\\``
    );
    if (!summaryVerdictPattern.test(summaryContent)) {
      missingAccumulator.push(`Summary verdict mismatch (${taskId}:${verdict})`);
    }

    const hourlyVerdictPattern = new RegExp(
      `\\|\\s*${escapeRegExp(taskId)}\\s*\\|[^\\n]*\\|\\s*${escapeRegExp(verdict)}\\s*\\|`
    );
    if (!hourlyVerdictPattern.test(hourlyContent)) {
      missingAccumulator.push(`Hourly verdict mismatch (${taskId}:${verdict})`);
    }
  }
}

async function main() {
  const date = getDateArg();
  const reportPath = join(process.cwd(), 'docs/program/daily-tracking', `${date}.md`);

  try {
    await access(reportPath, constants.F_OK);
  } catch {
    // eslint-disable-next-line no-console
    console.error(`FAIL: report file missing -> ${reportPath}`);
    process.exit(1);
  }

  const content = await readFile(reportPath, 'utf8');
  const checks = [
    ['Agent report table', '## 1) Agent Report Receipt Status'],
    ['Team lead judgment section', '## 2) Team Lead Validation Judgment'],
    ['Verdict field', '- Verdict:'],
    ['Rationale field', '- Rationale:'],
    ['Blocking items field', '- Blocking Items:'],
    ['Corrective actions field', '- Corrective Actions:'],
    ['Evidence links section', '## 3) Evidence Links'],
  ];

  const missing = checks.filter(([, token]) => !content.includes(token)).map(([name]) => name);
  if (!validateNoPendingTableCells(content)) {
    missing.push('Agent report table pending cells');
  }

  await validateCrossDocumentConsistency(date, missing);

  if (missing.length > 0) {
    // eslint-disable-next-line no-console
    console.error(`FAIL: missing sections in ${date}: ${missing.join(', ')}`);
    process.exit(1);
  }

  const pendingVerdict = content.includes('- Verdict: PENDING');
  if (pendingVerdict) {
    // eslint-disable-next-line no-console
    console.error(`FAIL: ${date} still has PENDING verdict`);
    process.exit(1);
  }

  // eslint-disable-next-line no-console
  console.log(`PASS: daily report validated for ${date}`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('FAIL:', err.message);
  process.exit(1);
});
