import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { join } from 'node:path';

const REQUIRED_PATHS = [
  '/.well-known/jwks.json',
  '/verify',
  '/verify/offline',
  '/receipts/{receiptId}',
  '/receipts/{receiptId}/verify',
  '/certificates/{receiptId}',
  '/reports/{reportId}',
  '/admin/keys/rotate',
  '/admin/keys/revoke',
];

const REQUIRED_OPERATIONS = [
  'getJwks',
  'createVerification',
  'verifyReceiptOffline',
  'getReceiptById',
  'verifyReceiptById',
  'getCertificateByReceiptId',
  'getReportById',
  'rotateSigningKey',
  'revokeSigningKey',
];

async function readSpec() {
  const specPath = join(process.cwd(), 'docs/week1/backend/openapi-draft.yaml');
  await access(specPath, constants.F_OK);
  return { specPath, content: await readFile(specPath, 'utf8') };
}

function hasPath(content, pathKey) {
  return new RegExp(`^\\s{2}${pathKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:\\s*$`, 'm').test(
    content
  );
}

function hasOperation(content, operationId) {
  return new RegExp(`^\\s*operationId:\\s*${operationId}\\s*$`, 'm').test(content);
}

async function main() {
  let spec;
  try {
    spec = await readSpec();
  } catch {
    // eslint-disable-next-line no-console
    console.error('FAIL: missing OpenAPI draft at docs/week1/backend/openapi-draft.yaml');
    process.exit(1);
  }

  const missingPaths = REQUIRED_PATHS.filter((pathKey) => !hasPath(spec.content, pathKey));
  const missingOps = REQUIRED_OPERATIONS.filter((op) => !hasOperation(spec.content, op));

  if (missingPaths.length > 0 || missingOps.length > 0) {
    // eslint-disable-next-line no-console
    console.error(`FAIL: OpenAPI contract readiness check failed (${spec.specPath})`);
    if (missingPaths.length > 0) {
      // eslint-disable-next-line no-console
      console.error(`- Missing paths: ${missingPaths.join(', ')}`);
    }
    if (missingOps.length > 0) {
      // eslint-disable-next-line no-console
      console.error(`- Missing operationId: ${missingOps.join(', ')}`);
    }
    process.exit(1);
  }

  // eslint-disable-next-line no-console
  console.log('PASS: OpenAPI contract includes required launch-critical routes and operations.');
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('FAIL:', err.message);
  process.exit(1);
});
