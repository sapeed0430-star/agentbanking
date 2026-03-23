#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { verifyReceiptOffline } from '../src/audit/offline-verify.js';

function getArg(name, fallback = '') {
  const index = process.argv.findIndex((arg) => arg === `--${name}`);
  if (index >= 0) {
    return process.argv[index + 1] || fallback;
  }
  const withEquals = process.argv.find((arg) => arg.startsWith(`--${name}=`));
  if (withEquals) {
    return withEquals.slice(name.length + 3);
  }
  return fallback;
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

function printHelp() {
  // eslint-disable-next-line no-console
  console.log(
    [
      'Usage:',
      '  node scripts/verify-receipt-cli.js --receipt <path> --report <path> [--schema <path>] [--public-key <path>] [--strict-signature]',
      '',
      'Options:',
      '  --receipt           receipt json path (required)',
      '  --report            audit report json path (required)',
      '  --schema            receipt schema path (default: docs/week1/backend/receipt-1.0.0.schema.json)',
      '  --public-key        Ed25519 public key PEM path (optional)',
      '  --strict-signature  fail if public key is not provided',
    ].join('\n')
  );
}

async function readJson(filePath) {
  const raw = await readFile(resolve(filePath), 'utf8');
  return JSON.parse(raw);
}

async function main() {
  if (hasFlag('help') || hasFlag('h')) {
    printHelp();
    process.exit(0);
  }

  const receiptPath = getArg('receipt');
  const reportPath = getArg('report');
  const schemaPath = getArg('schema', 'docs/week1/backend/receipt-1.0.0.schema.json');
  const publicKeyPath = getArg('public-key');
  const strictSignature = hasFlag('strict-signature');

  if (!receiptPath || !reportPath) {
    printHelp();
    process.exit(2);
  }

  const [receipt, auditReport, schema] = await Promise.all([
    readJson(receiptPath),
    readJson(reportPath),
    readJson(schemaPath),
  ]);

  let publicKeyPem = '';
  if (publicKeyPath) {
    publicKeyPem = await readFile(resolve(publicKeyPath), 'utf8');
  }

  const result = verifyReceiptOffline({
    receipt,
    auditReport,
    schema,
    publicKeyPem,
    strictSignature,
  });

  // eslint-disable-next-line no-console
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.verification_result === 'PASS' ? 0 : 1);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(
    JSON.stringify(
      {
        verification_result: 'FAIL',
        code: 'INTERNAL_ERROR',
        message: err.message,
      },
      null,
      2
    )
  );
  process.exit(1);
});
