import { readFile } from 'node:fs/promises';
import { access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { join } from 'node:path';

function getDateArg() {
  const arg = process.argv.find((v) => v.startsWith('--date='));
  if (arg) return arg.split('=')[1];
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
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

