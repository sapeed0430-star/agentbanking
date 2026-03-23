import test from 'node:test';
import assert from 'node:assert/strict';
import { createTimestampAdapter } from '../src/audit/adapters/timestamp.js';

test('rfc3161 adapter throws when endpoint is missing', async () => {
  const adapter = createTimestampAdapter({
    mode: 'rfc3161',
    endpoint: '',
  });

  await assert.rejects(
    () =>
      adapter.issueTimestamp({
        reportDigest: { alg: 'sha-256', value: 'a'.repeat(64) },
        receiptId: 'receipt-001',
        generatedAt: new Date().toISOString(),
      }),
    (err) => err.stage === 'timestamp' && err.message.includes('missing_tsa_endpoint')
  );
});
