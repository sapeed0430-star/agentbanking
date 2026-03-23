import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createAppServer } from '../server.js';
import { digestCanonicalJson } from '../src/audit/canonical.js';
import { validateJsonSchema } from '../src/audit/schema-validator.js';

const AUTH = { authorization: 'Bearer local-dev-token' };
const ADMIN_AUTH = {
  authorization: 'Bearer local-dev-token',
  'x-admin-token': 'local-admin-token',
};
const receiptSchema = JSON.parse(
  readFileSync(new URL('../docs/week1/backend/receipt-1.0.0.schema.json', import.meta.url), 'utf8')
);

function verifyPayload(overrides = {}) {
  return {
    request_id: `req-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    agent_id: 'agent-alpha',
    operator_id: 'operator-001',
    policy_version: 'policy-2026.03',
    strategy_hash: 'strat-hash-001',
    model_hash: 'model-hash-001',
    evidence_refs: [
      {
        kind: 'input',
        uri: 'https://evidence.agentbanking.dev/input/1',
        digest: {
          alg: 'sha-256',
          value: 'a'.repeat(64),
        },
      },
    ],
    ...overrides,
  };
}

async function postVerify(baseUrl, payload, operatorId = payload.operator_id) {
  return fetch(`${baseUrl}/verify`, {
    method: 'POST',
    headers: {
      ...AUTH,
      'content-type': 'application/json',
      'x-operator-id': operatorId,
    },
    body: JSON.stringify(payload),
  });
}

async function postOfflineVerify(baseUrl, payload) {
  return fetch(`${baseUrl}/verify/offline`, {
    method: 'POST',
    headers: {
      ...AUTH,
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

test('POST /verify issues receipt and audit report', async (t) => {
  const server = createAppServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  const payload = verifyPayload();
  const res = await postVerify(baseUrl, payload);
  assert.equal(res.status, 201);

  const body = await res.json();
  assert.equal(body.receipt.schema_version, '1.0.0');
  assert.equal(body.receipt.request_id, payload.request_id);
  assert.equal(body.receipt.operator_id, payload.operator_id);
  assert.equal(body.receipt.verification_result, 'pass');
  assert.ok(body.receipt.retention_until);
  assert.ok(body.receipt.verification_endpoint.includes('/receipts/'));
  assert.equal(body.audit_report.report_id, body.receipt.report_id);
  assert.equal(body.receipt.report_digest.value, digestCanonicalJson(body.audit_report, 'sha-256'));
  assert.equal(body.audit_report.evidence_store.request_id, payload.request_id);
  assert.equal(body.audit_report.evidence_store.evidence_count, 1);

  const schemaResult = validateJsonSchema(receiptSchema, body.receipt);
  assert.equal(schemaResult.valid, true, schemaResult.errors.join('\n'));
});

test('POST /verify returns 409 on duplicate request_id', async (t) => {
  const server = createAppServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  const payload = verifyPayload({ request_id: 'req-replay-001' });
  const first = await postVerify(baseUrl, payload);
  assert.equal(first.status, 201);

  const second = await postVerify(baseUrl, payload);
  assert.equal(second.status, 409);
  const error = await second.json();
  assert.equal(error.code, 'REQUEST_REPLAY_DETECTED');
  assert.equal(error.category, 'conflict');
  assert.equal(error.retryable, false);
  assert.equal(error.details.request_id, 'req-replay-001');
});

test('POST /verify returns 422 integrity failure payload', async (t) => {
  const server = createAppServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  const payload = verifyPayload({ integrity_failure_reason: 'DIGEST_MISMATCH' });
  const res = await postVerify(baseUrl, payload);
  assert.equal(res.status, 422);
  const body = await res.json();

  assert.equal(body.code, 'DIGEST_MISMATCH');
  assert.equal(body.category, 'integrity');
  assert.equal(body.retryable, false);
  assert.equal(body.integrity_result.verification_result, 'fail');
  assert.equal(body.integrity_result.failed_checks[0].reason_code, 'DIGEST_MISMATCH');
});

test('POST /verify returns warning receipt for draft policy version', async (t) => {
  const server = createAppServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  const payload = verifyPayload({
    request_id: 'req-warning-001',
    policy_version: 'draft-2026.03',
  });
  const res = await postVerify(baseUrl, payload);
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.equal(body.receipt.verification_result, 'warning');
  assert.equal(body.audit_report.findings[0].code, 'POLICY_DRAFT_VERSION');
});

test('GET /receipts/{id} returns receipt when operator matches', async (t) => {
  const server = createAppServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  const payload = verifyPayload({ request_id: 'req-get-001' });
  const created = await postVerify(baseUrl, payload);
  assert.equal(created.status, 201);
  const createdBody = await created.json();

  const res = await fetch(`${baseUrl}/receipts/${createdBody.receipt.receipt_id}`, {
    headers: {
      ...AUTH,
      'x-operator-id': payload.operator_id,
    },
  });
  assert.equal(res.status, 200);
  const receipt = await res.json();
  assert.equal(receipt.receipt_id, createdBody.receipt.receipt_id);
});

test('GET /receipts/{id} returns 403 when operator does not match', async (t) => {
  const server = createAppServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  const payload = verifyPayload({ request_id: 'req-forbidden-001' });
  const created = await postVerify(baseUrl, payload);
  assert.equal(created.status, 201);
  const createdBody = await created.json();

  const res = await fetch(`${baseUrl}/receipts/${createdBody.receipt.receipt_id}`, {
    headers: {
      ...AUTH,
      'x-operator-id': 'operator-other',
    },
  });
  assert.equal(res.status, 403);
  const error = await res.json();
  assert.equal(error.code, 'FORBIDDEN');
});

test('POST /verify/offline returns PASS for issued receipt/report', async (t) => {
  const server = createAppServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  const payload = verifyPayload({ request_id: 'req-offline-pass-001' });
  const created = await postVerify(baseUrl, payload);
  assert.equal(created.status, 201);
  const createdBody = await created.json();

  const res = await postOfflineVerify(baseUrl, {
    receipt: createdBody.receipt,
    audit_report: createdBody.audit_report,
    strict_signature: false,
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.verification_result, 'PASS');
});

test('POST /verify/offline returns 422 for tampered audit report', async (t) => {
  const server = createAppServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  const payload = verifyPayload({ request_id: 'req-offline-fail-001' });
  const created = await postVerify(baseUrl, payload);
  assert.equal(created.status, 201);
  const createdBody = await created.json();

  const tamperedReport = {
    ...createdBody.audit_report,
    summary: 'tampered-summary',
  };

  const res = await postOfflineVerify(baseUrl, {
    receipt: createdBody.receipt,
    audit_report: tamperedReport,
    strict_signature: false,
  });
  assert.equal(res.status, 422);
  const body = await res.json();
  assert.equal(body.code, 'INTEGRITY_CHECK_FAILED');
  assert.ok(body.integrity_result.failed_codes.includes('DIGEST_MISMATCH'));
});

test('POST /verify returns 503 when proof adapter is unavailable', async (t) => {
  const unavailableRuntime = {
    signerMode: 'local-ed25519',
    timestampMode: 'rfc3161',
    transparencyMode: 'rekor',
    signer: {
      async signReceipt() {
        const err = new Error('missing_private_key_pem');
        err.stage = 'signer';
        throw err;
      },
    },
    timestamp: {
      async issueTimestamp() {
        throw new Error('should_not_run');
      },
    },
    transparency: {
      async appendProof() {
        throw new Error('should_not_run');
      },
    },
  };
  const server = createAppServer({ auditRuntime: unavailableRuntime });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  const payload = verifyPayload({ request_id: 'req-proof-unavailable-001' });
  const res = await postVerify(baseUrl, payload);
  assert.equal(res.status, 503);
  const error = await res.json();
  assert.equal(error.code, 'PROOF_SERVICE_UNAVAILABLE');
  assert.equal(error.details.stage, 'signer');
  assert.equal(error.details.signer_mode, 'local-ed25519');
});

test('GET /.well-known/jwks.json returns public keys', async (t) => {
  const server = createAppServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  const res = await fetch(`${baseUrl}/.well-known/jwks.json`);
  assert.equal(res.status, 200);
  const jwks = await res.json();
  assert.ok(Array.isArray(jwks.keys));
  assert.ok(jwks.keys.length >= 1);
  assert.equal(jwks.keys[0].kty, 'OKP');
  assert.equal(jwks.keys[0].crv, 'Ed25519');
});

test('admin key rotate and revoke flow', async (t) => {
  const server = createAppServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  const jwksBefore = await fetch(`${baseUrl}/.well-known/jwks.json`);
  const before = await jwksBefore.json();
  const previousKid = before.keys[0].kid;

  const rotate = await fetch(`${baseUrl}/admin/keys/rotate`, {
    method: 'POST',
    headers: ADMIN_AUTH,
  });
  assert.equal(rotate.status, 200);
  const rotateBody = await rotate.json();
  assert.equal(rotateBody.previous_kid, previousKid);
  assert.ok(rotateBody.current_kid);

  const revoke = await fetch(`${baseUrl}/admin/keys/revoke`, {
    method: 'POST',
    headers: {
      ...ADMIN_AUTH,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ kid: previousKid }),
  });
  assert.equal(revoke.status, 200);
  const revokeBody = await revoke.json();
  assert.equal(revokeBody.ok, true);
});

test('GET /certificates/{receiptId} returns certificate for owner', async (t) => {
  const server = createAppServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  const payload = verifyPayload({ request_id: 'req-cert-001' });
  const created = await postVerify(baseUrl, payload);
  assert.equal(created.status, 201);
  const createdBody = await created.json();

  const certRes = await fetch(`${baseUrl}/certificates/${createdBody.receipt.receipt_id}`, {
    headers: {
      ...AUTH,
      'x-operator-id': payload.operator_id,
    },
  });
  assert.equal(certRes.status, 200);
  const cert = await certRes.json();
  assert.equal(cert.credentialSubject.receipt_id, createdBody.receipt.receipt_id);
  assert.equal(cert.credentialSubject.report_id, createdBody.receipt.report_id);
});
