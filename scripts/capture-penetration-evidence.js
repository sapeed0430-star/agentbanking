#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { createAppServer } from '../server.js';

const DEFAULT_AUTH = 'Bearer local-dev-token';
const DEFAULT_OUTPUT_DIR = 'docs/week11/security/evidence';

function parseArgs(argv) {
  const result = { output: '' };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--output' || arg === '-o') {
      result.output = argv[i + 1] || '';
      i += 1;
      continue;
    }
    if (arg.startsWith('--output=')) {
      result.output = arg.slice('--output='.length);
    }
  }
  return result;
}

function fileStamp(date) {
  return date.toISOString().replace(/[:.]/g, '-');
}

async function writeEvidence(path, payload) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

async function requestJson(baseUrl, path, options = {}) {
  const startedAt = Date.now();
  const res = await fetch(`${baseUrl}${path}`, options);
  let body = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return {
    status: res.status,
    ok: res.ok,
    duration_ms: Date.now() - startedAt,
    headers: Object.fromEntries(res.headers.entries()),
    body,
  };
}

async function withServer(factory, fn) {
  const server = factory();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;
  try {
    return await fn({ baseUrl, server });
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

function verifyPayload(prefix, operatorId, requestId = randomUUID()) {
  return {
    request_id: requestId,
    agent_id: prefix,
    operator_id: operatorId,
    policy_version: 'policy-2026.03',
    strategy_hash: 'strategy',
    model_hash: 'model',
    evidence_refs: [
      {
        kind: 'input',
        uri: `https://evidence.agentbanking.dev/${prefix}/${requestId}`,
        digest: { alg: 'sha-256', value: 'a'.repeat(64) },
      },
    ],
  };
}

async function authBoundaryCheck() {
  return withServer(() => createAppServer(), async ({ baseUrl }) => {
    const missing = await requestJson(baseUrl, '/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(verifyPayload('auth-missing', 'operator-1')),
    });

    const forbidden = await requestJson(baseUrl, '/verify', {
      method: 'POST',
      headers: {
        authorization: DEFAULT_AUTH,
        'content-type': 'application/json',
        'x-operator-id': 'operator-other',
      },
      body: JSON.stringify(verifyPayload('auth-forbidden', 'operator-1')),
    });

    return {
      missing,
      forbidden,
      passed: missing.status === 401 && forbidden.status === 403,
    };
  });
}

async function replayCheck() {
  return withServer(() => createAppServer(), async ({ baseUrl }) => {
    const payload = verifyPayload('replay', 'operator-replay');
    const headers = { authorization: DEFAULT_AUTH, 'content-type': 'application/json', 'x-operator-id': payload.operator_id };
    const first = await requestJson(baseUrl, '/verify', { method: 'POST', headers, body: JSON.stringify(payload) });
    const second = await requestJson(baseUrl, '/verify', { method: 'POST', headers, body: JSON.stringify(payload) });

    return {
      first,
      second,
      passed: first.status === 201 && second.status === 409 && second.body?.code === 'REQUEST_REPLAY_DETECTED',
    };
  });
}

async function tamperCheck() {
  return withServer(() => createAppServer(), async ({ baseUrl }) => {
    const payload = verifyPayload('tamper', 'operator-tamper');
    const headers = { authorization: DEFAULT_AUTH, 'content-type': 'application/json', 'x-operator-id': payload.operator_id };
    const created = await requestJson(baseUrl, '/verify', { method: 'POST', headers, body: JSON.stringify(payload) });
    const tampered = {
      receipt: created.body.receipt,
      audit_report: {
        ...created.body.audit_report,
        summary: `${created.body.audit_report.summary} tampered`,
      },
      strict_signature: false,
    };
    const response = await requestJson(baseUrl, '/verify/offline', {
      method: 'POST',
      headers: { authorization: DEFAULT_AUTH, 'content-type': 'application/json' },
      body: JSON.stringify(tampered),
    });

    return {
      created,
      response,
      passed: response.status === 422 && response.body?.code === 'INTEGRITY_CHECK_FAILED',
    };
  });
}

async function proofUnavailableCheck() {
  const unavailableRuntime = {
    signerMode: 'local-ed25519',
    timestampMode: 'rfc3161',
    transparencyMode: 'rekor',
    signer: {
      async signReceipt() {
        const error = new Error('missing_private_key_pem');
        error.stage = 'signer';
        throw error;
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

  return withServer(() => createAppServer({ auditRuntime: unavailableRuntime }), async ({ baseUrl }) => {
    const payload = verifyPayload('proof', 'operator-proof');
    const headers = { authorization: DEFAULT_AUTH, 'content-type': 'application/json', 'x-operator-id': payload.operator_id };
    const response = await requestJson(baseUrl, '/verify', { method: 'POST', headers, body: JSON.stringify(payload) });

    return {
      response,
      passed: response.status === 503 && response.body?.code === 'PROOF_SERVICE_UNAVAILABLE',
    };
  });
}

async function rateLimitCheck() {
  return withServer(() => createAppServer({ rateLimitWindowMs: 60_000, rateLimitMax: 1 }), async ({ baseUrl }) => {
    const headers = { authorization: DEFAULT_AUTH, 'content-type': 'application/json', 'x-operator-id': 'operator-rate-limit' };
    const firstPayload = verifyPayload('rate-1', 'operator-rate-limit');
    const secondPayload = verifyPayload('rate-2', 'operator-rate-limit');
    const first = await requestJson(baseUrl, '/verify', { method: 'POST', headers, body: JSON.stringify(firstPayload) });
    const second = await requestJson(baseUrl, '/verify', { method: 'POST', headers, body: JSON.stringify(secondPayload) });

    return {
      first,
      second,
      passed: first.status === 201 && second.status === 429 && second.body?.code === 'RATE_LIMITED',
    };
  });
}

async function main() {
  const now = new Date();
  const args = parseArgs(process.argv);
  const outputPath = args.output
    ? resolve(process.cwd(), args.output)
    : resolve(process.cwd(), DEFAULT_OUTPUT_DIR, `penetration-check-${fileStamp(now)}.json`);

  const checks = [
    { name: 'auth boundary', ...(await authBoundaryCheck()) },
    { name: 'idempotency/replay', ...(await replayCheck()) },
    { name: 'signature/digest tamper', ...(await tamperCheck()) },
    { name: 'proof adapter fallback/unavailable', ...(await proofUnavailableCheck()) },
    { name: 'rate-limit abuse', ...(await rateLimitCheck()) },
  ];

  const report = {
    evidence_type: 'penetration-checks',
    spec_version: 'W11-PENETRATION-2026-03-29',
    captured_at: now.toISOString(),
    overall: checks.every((check) => check.passed) ? 'PASS' : 'FAIL',
    output_path: outputPath,
    checks,
  };

  await writeEvidence(outputPath, report);
  console.log(JSON.stringify(report, null, 2));

  if (report.overall !== 'PASS') {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
