#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { createAppServer } from '../server.js';

const AUTH_TOKEN = process.env.INTEGRATION_AUTH_TOKEN || 'local-dev-token';
const OPERATOR_ID = process.env.INTEGRATION_OPERATOR_ID || 'operator-integration-gate';

function toFileStamp(date) {
  return date.toISOString().replace(/[:.]/g, '-');
}

function formatMs(value) {
  return Number(value.toFixed(2));
}

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

async function writeEvidence(path, payload) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

async function requestJson(url, options = {}) {
  const started = performance.now();
  const res = await fetch(url, options);
  let body = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return {
    status: res.status,
    ok: res.ok,
    duration_ms: formatMs(performance.now() - started),
    body,
  };
}

async function main() {
  const now = new Date();
  const runId = randomUUID();
  const args = parseArgs(process.argv);
  const defaultOutput = resolve(
    process.cwd(),
    'docs/week2/backend/evidence',
    `integration-gate-${toFileStamp(now)}.json`
  );
  const outputPath = args.output ? resolve(process.cwd(), args.output) : defaultOutput;

  const server = createAppServer();
  await new Promise((resolveStart) => server.listen(0, '127.0.0.1', resolveStart));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  const steps = [];
  let receiptId = '';
  let reportId = '';
  let verifyBody = null;
  let verifyResponse = null;

  try {
    const payload = {
      request_id: `req-int-${runId}`,
      agent_id: 'agent-integration-gate',
      operator_id: OPERATOR_ID,
      policy_version: 'policy-2026.03',
      strategy_hash: `strat-${runId.slice(0, 8)}`,
      model_hash: `model-${runId.slice(0, 8)}`,
      evidence_refs: [
        {
          kind: 'input',
          uri: `https://evidence.agentbanking.dev/integration/${runId}`,
          digest: {
            alg: 'sha-256',
            value: 'a'.repeat(64),
          },
        },
      ],
    };

    verifyResponse = await requestJson(`${baseUrl}/verify`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${AUTH_TOKEN}`,
        'content-type': 'application/json',
        'x-operator-id': OPERATOR_ID,
      },
      body: JSON.stringify(payload),
    });
    steps.push({
      step: 'POST /verify',
      expected_status: 201,
      ...verifyResponse,
    });

    verifyBody = verifyResponse.body;
    receiptId = verifyBody?.receipt?.receipt_id || '';
    reportId = verifyBody?.audit_report?.report_id || '';

    const receiptResponse = await requestJson(`${baseUrl}/receipts/${receiptId}`, {
      headers: {
        authorization: `Bearer ${AUTH_TOKEN}`,
        'x-operator-id': OPERATOR_ID,
      },
    });
    steps.push({
      step: 'GET /receipts/{id}',
      expected_status: 200,
      ...receiptResponse,
    });

    const receiptVerifyResponse = await requestJson(`${baseUrl}/receipts/${receiptId}/verify`, {
      headers: {
        authorization: `Bearer ${AUTH_TOKEN}`,
        'x-operator-id': OPERATOR_ID,
      },
    });
    steps.push({
      step: 'GET /receipts/{id}/verify',
      expected_status: 200,
      ...receiptVerifyResponse,
    });

    const reportResponse = await requestJson(`${baseUrl}/reports/${reportId}`, {
      headers: {
        authorization: `Bearer ${AUTH_TOKEN}`,
      },
    });
    steps.push({
      step: 'GET /reports/{id}',
      expected_status: 200,
      ...reportResponse,
    });

    const certificateResponse = await requestJson(`${baseUrl}/certificates/${receiptId}`, {
      headers: {
        authorization: `Bearer ${AUTH_TOKEN}`,
        'x-operator-id': OPERATOR_ID,
      },
    });
    steps.push({
      step: 'GET /certificates/{receiptId}',
      expected_status: 200,
      ...certificateResponse,
    });

    const offlineResponse = await requestJson(`${baseUrl}/verify/offline`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${AUTH_TOKEN}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        receipt: verifyBody?.receipt,
        audit_report: verifyBody?.audit_report,
        strict_signature: false,
      }),
    });
    steps.push({
      step: 'POST /verify/offline',
      expected_status: 200,
      ...offlineResponse,
    });

    const forbiddenResponse = await requestJson(`${baseUrl}/receipts/${receiptId}`, {
      headers: {
        authorization: `Bearer ${AUTH_TOKEN}`,
        'x-operator-id': 'operator-mismatch',
      },
    });
    steps.push({
      step: 'GET /receipts/{id} forbidden check',
      expected_status: 403,
      ...forbiddenResponse,
    });

    const replayResponse = await requestJson(`${baseUrl}/verify`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${AUTH_TOKEN}`,
        'content-type': 'application/json',
        'x-operator-id': OPERATOR_ID,
      },
      body: JSON.stringify(payload),
    });
    steps.push({
      step: 'POST /verify replay check',
      expected_status: 409,
      ...replayResponse,
    });
  } finally {
    await new Promise((resolveClose) => server.close(resolveClose));
  }

  const failures = steps
    .filter((s) => s.status !== s.expected_status)
    .map((s) => `${s.step}: expected ${s.expected_status}, got ${s.status}`);
  const overall = failures.length === 0 ? 'PASS' : 'FAIL';

  const evidence = {
    evidence_type: 'integration-stability-gate',
    spec_version: 'B-INTEGRATION-2300',
    run_id: runId,
    captured_at: now.toISOString(),
    output_path: outputPath,
    base_url: baseUrl,
    overall,
    key_ids: {
      receipt_id: receiptId || null,
      report_id: reportId || null,
    },
    steps,
    failures,
  };

  await writeEvidence(outputPath, evidence);
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ overall, output_path: outputPath, failures }, null, 2));

  if (overall !== 'PASS') {
    process.exit(1);
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('FAIL:', err.message);
  process.exit(1);
});
