import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { digestCanonicalJson } from '../src/audit/canonical.js';
import { verifyReceiptOffline } from '../src/audit/offline-verify.js';
import { createSignerAdapter } from '../src/audit/adapters/signer.js';

const receiptSchema = JSON.parse(
  readFileSync(new URL('../docs/week1/backend/receipt-1.0.0.schema.json', import.meta.url), 'utf8')
);

async function buildReceiptAndReport() {
  const auditReport = {
    report_id: `rpt-${Date.now()}`,
    summary: 'offline verify fixture',
    findings: [],
  };
  const digest = digestCanonicalJson(auditReport, 'sha-256');
  const signer = createSignerAdapter({ mode: 'mock', kid: 'mock-ed25519-key' });
  const issuedAt = new Date().toISOString();
  const receiptId = randomUUID();
  const signature = await signer.signReceipt({
    reportDigest: { alg: 'sha-256', value: digest },
    receiptId,
    issuedAt,
  });

  const receipt = {
    receipt_id: receiptId,
    report_id: auditReport.report_id,
    request_id: `req-${Date.now()}`,
    agent_id: 'agent-alpha',
    operator_id: 'operator-001',
    schema_version: '1.0.0',
    issued_at: issuedAt,
    verification_result: 'pass',
    policy_version: 'policy-2026.03',
    report_digest: { alg: 'sha-256', value: digest },
    signature,
    timestamp_proof: {
      tsa_name: 'mock-tsa',
      gen_time: issuedAt,
      token_b64: Buffer.from(`tsa:${receiptId}:${issuedAt}:fixture`).toString('base64'),
    },
    transparency_proof: {
      log_id: 'mock-log',
      entry_id: `entry_${receiptId}`,
      leaf_hash: 'a'.repeat(64),
      root_hash: 'b'.repeat(64),
      tree_size: 1,
      inclusion_proof: ['c'.repeat(64)],
    },
    evidence_refs: [
      {
        kind: 'input',
        uri: 'https://evidence.agentbanking.dev/input/fixture',
        digest: { alg: 'sha-256', value: 'd'.repeat(64) },
      },
    ],
    retention_until: new Date(Date.now() + 3600 * 1000).toISOString(),
    verification_endpoint: `https://api.agentbanking.dev/receipts/${receiptId}/verify`,
    links: {
      verify_url: `https://api.agentbanking.dev/receipts/${receiptId}/verify`,
      report_url: `https://api.agentbanking.dev/reports/${auditReport.report_id}`,
    },
  };

  return { receipt, auditReport };
}

test('offline verify returns PASS for valid fixture', async () => {
  const { receipt, auditReport } = await buildReceiptAndReport();
  const result = verifyReceiptOffline({
    receipt,
    auditReport,
    schema: receiptSchema,
    strictSignature: false,
  });

  assert.equal(result.verification_result, 'PASS');
  assert.equal(result.failed_codes.length, 0);
});

test('offline verify returns FAIL for digest mismatch', async () => {
  const { receipt, auditReport } = await buildReceiptAndReport();
  const tampered = { ...auditReport, summary: 'tampered summary' };
  const result = verifyReceiptOffline({
    receipt,
    auditReport: tampered,
    schema: receiptSchema,
    strictSignature: false,
  });

  assert.equal(result.verification_result, 'FAIL');
  assert.ok(result.failed_codes.includes('DIGEST_MISMATCH'));
});
