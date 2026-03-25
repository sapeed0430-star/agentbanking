import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import {
  classifyTransparencyTransportCode,
  createTransparencyAdapter,
  probeRekorEndpoint,
} from '../src/audit/adapters/transparency.js';

function startMockRekorServer(handler) {
  return new Promise((resolve) => {
    const server = createServer(handler);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, port });
    });
  });
}

test('rekor adapter parses log entry response with rekord payload for jws signatures', async (t) => {
  const { server, port } = await startMockRekorServer(async (req, res) => {
    if (req.method === 'POST' && req.url === '/api/v1/log/entries') {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      assert.equal(body.kind, 'rekord');
      assert.equal(typeof body.spec?.data?.content, 'string');
      assert.equal(typeof body.spec?.signature?.content, 'string');

      const payload = {
        entry123: {
          logID: 'rekor-test-log',
          body: Buffer.from('rekor-entry-body').toString('base64'),
          verification: {
            inclusionProof: {
              rootHash: 'f'.repeat(64),
              treeSize: 7,
              hashes: ['a'.repeat(64), 'b'.repeat(64)],
            },
          },
        },
      };
      res.writeHead(201, { 'content-type': 'application/json' });
      res.end(JSON.stringify(payload));
      return;
    }
    res.writeHead(404);
    res.end();
  });
  t.after(() => server.close());

  const adapter = createTransparencyAdapter({
    mode: 'rekor',
    baseUrl: `http://127.0.0.1:${port}`,
    publicKeyPemB64: Buffer.from('-----BEGIN PUBLIC KEY-----\nMIIBfake\n-----END PUBLIC KEY-----').toString(
      'base64'
    ),
  });

  const proof = await adapter.appendProof({
    receiptId: 'receipt-001',
    reportDigest: { alg: 'sha-256', value: 'c'.repeat(64) },
    signature: { value: 'header.payload.signature' },
  });

  assert.equal(proof.log_id, 'rekor-test-log');
  assert.equal(proof.entry_id, 'entry123');
  assert.equal(proof.tree_size, 7);
  assert.equal(proof.inclusion_proof.length, 2);
  assert.equal(proof.root_hash, 'f'.repeat(64));
});

test('rekor adapter uses hashedrekord fallback for opaque signatures', async (t) => {
  const { server, port } = await startMockRekorServer(async (req, res) => {
    if (req.method === 'POST' && req.url === '/api/v1/log/entries') {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      assert.equal(body.kind, 'hashedrekord');
      assert.equal(body.spec?.data?.hash?.algorithm, 'sha256');
      assert.equal(body.spec?.data?.hash?.value, 'd'.repeat(64));

      const payload = {
        entry456: {
          logID: 'rekor-test-log',
          body: Buffer.from('rekor-entry-body').toString('base64'),
          verification: {
            inclusionProof: {
              rootHash: 'e'.repeat(64),
              treeSize: 9,
              hashes: ['c'.repeat(64)],
            },
          },
        },
      };
      res.writeHead(201, { 'content-type': 'application/json' });
      res.end(JSON.stringify(payload));
      return;
    }
    res.writeHead(404);
    res.end();
  });
  t.after(() => server.close());

  const adapter = createTransparencyAdapter({
    mode: 'rekor',
    baseUrl: `http://127.0.0.1:${port}`,
    publicKeyPemB64: Buffer.from('-----BEGIN PUBLIC KEY-----\nMIIBfallback\n-----END PUBLIC KEY-----').toString(
      'base64'
    ),
  });

  const proof = await adapter.appendProof({
    receiptId: 'receipt-opaque',
    reportDigest: { alg: 'sha-256', value: 'd'.repeat(64) },
    signature: { value: 'opaque-signature' },
  });

  assert.equal(proof.entry_id, 'entry456');
  assert.equal(proof.tree_size, 9);
  assert.equal(proof.root_hash, 'e'.repeat(64));
});

test('rekor adapter throws when public key is missing', async () => {
  const adapter = createTransparencyAdapter({
    mode: 'rekor',
    baseUrl: 'http://127.0.0.1:3001',
    publicKeyPemB64: '',
  });

  await assert.rejects(
    () =>
      adapter.appendProof({
        receiptId: 'receipt-001',
        reportDigest: { alg: 'sha-256', value: 'c'.repeat(64) },
        signature: { value: 'header.payload.signature' },
      }),
    (err) =>
      err.stage === 'transparency' &&
      err.error_code === 'MISSING_REKOR_PUBLIC_KEY' &&
      err.message.includes('missing_rekor_public_key')
  );
});

test('rekor probe classifies DNS, HTTP, and timeout failures with standard codes', async () => {
  const dnsFailure = await probeRekorEndpoint({
    baseUrl: 'https://rekor.sigstore.dev',
    lookupImpl: async () => {
      const err = new Error('getaddrinfo ENOTFOUND rekor.sigstore.dev');
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

  const authRequired = await probeRekorEndpoint({
    baseUrl: 'https://rekor.sigstore.dev',
    lookupImpl: async () => ({ address: '127.0.0.1', family: 4 }),
    fetchImpl: async () => ({ ok: false, status: 403 }),
  });

  assert.equal(authRequired.status, 'FAIL');
  assert.equal(authRequired.phase, 'request');
  assert.equal(authRequired.error_code, 'AUTH_REQUIRED');

  assert.equal(classifyTransparencyTransportCode({ name: 'TimeoutError' }), 'TIMEOUT');
  assert.equal(classifyTransparencyTransportCode({ cause: { code: 'ECONNRESET' } }), 'NETWORK_FAIL');
});
