import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyTimestampTransportCode,
  createTimestampAdapter,
  probeRfc3161Endpoint,
} from '../src/audit/adapters/timestamp.js';

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
    (err) => err.stage === 'timestamp' && err.error_code === 'MISSING_TSA_ENDPOINT' && err.message.includes('missing_tsa_endpoint')
  );
});

test('timestamp probe classifies DNS and auth failures with standard codes', async () => {
  const dnsFailure = await probeRfc3161Endpoint({
    endpoint: 'https://freetsa.org/tsr',
    lookupImpl: async () => {
      const err = new Error('getaddrinfo ENOTFOUND freetsa.org');
      err.code = 'ENOTFOUND';
      throw err;
    },
    fetchImpl: async () => {
      throw new Error('should not be called');
    },
  });

  assert.equal(dnsFailure.status, 'FAIL');
  assert.equal(dnsFailure.phase, 'dns');
  assert.equal(dnsFailure.error_code, 'DNS_FAIL');

  const authRequired = await probeRfc3161Endpoint({
    endpoint: 'https://freetsa.org/tsr',
    lookupImpl: async () => ({ address: '127.0.0.1', family: 4 }),
    fetchImpl: async () => ({ ok: false, status: 401 }),
  });

  assert.equal(authRequired.status, 'FAIL');
  assert.equal(authRequired.phase, 'request');
  assert.equal(authRequired.error_code, 'AUTH_REQUIRED');
});

test('timestamp transport classifier normalizes timeout and network errors', () => {
  assert.equal(classifyTimestampTransportCode({ name: 'TimeoutError' }), 'TIMEOUT');
  assert.equal(classifyTimestampTransportCode({ cause: { code: 'ECONNREFUSED' } }), 'NETWORK_FAIL');
});
