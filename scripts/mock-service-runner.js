#!/usr/bin/env node
import { performance } from 'node:perf_hooks';

function percentile(values, p) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[idx];
}

function buildPayload(i) {
  return {
    request_id: `mock-req-${Date.now()}-${i}`,
    agent_id: 'agent-load',
    operator_id: 'operator-load',
    policy_version: 'policy-2026.03',
    strategy_hash: `strat-${i}`,
    model_hash: `model-${i}`,
    evidence_refs: [
      {
        kind: 'input',
        uri: `https://evidence.agentbanking.dev/mock/${i}`,
        digest: {
          alg: 'sha-256',
          value: 'a'.repeat(64),
        },
      },
    ],
  };
}

async function run() {
  const baseUrl = process.env.MOCK_TEST_BASE_URL || 'http://127.0.0.1:3000';
  const total = Number.parseInt(process.env.MOCK_TEST_TOTAL || '50', 10);
  const concurrency = Number.parseInt(process.env.MOCK_TEST_CONCURRENCY || '5', 10);
  const latencies = [];
  const statusCounts = new Map();

  let cursor = 0;
  async function worker() {
    while (cursor < total) {
      const i = cursor;
      cursor += 1;
      const t0 = performance.now();
      const res = await fetch(`${baseUrl}/verify`, {
        method: 'POST',
        headers: {
          authorization: 'Bearer local-dev-token',
          'x-operator-id': 'operator-load',
          'content-type': 'application/json',
        },
        body: JSON.stringify(buildPayload(i)),
      });
      const t1 = performance.now();
      latencies.push(t1 - t0);
      statusCounts.set(res.status, (statusCounts.get(res.status) || 0) + 1);
      await res.arrayBuffer();
    }
  }

  await Promise.all(Array.from({ length: concurrency }).map(() => worker()));
  const statusObj = Object.fromEntries(Array.from(statusCounts.entries()).sort((a, b) => a[0] - b[0]));
  const success = (statusCounts.get(201) || 0) / total;

  const report = {
    base_url: baseUrl,
    total_requests: total,
    concurrency,
    success_rate: Number((success * 100).toFixed(2)),
    latency_ms: {
      p50: Number(percentile(latencies, 50).toFixed(2)),
      p95: Number(percentile(latencies, 95).toFixed(2)),
      p99: Number(percentile(latencies, 99).toFixed(2)),
      max: Number(Math.max(...latencies).toFixed(2)),
    },
    status_counts: statusObj,
    run_at: new Date().toISOString(),
  };

  // eslint-disable-next-line no-console
  console.log(JSON.stringify(report, null, 2));
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(
    JSON.stringify(
      {
        code: 'MOCK_TEST_FAILED',
        message: err.message,
      },
      null,
      2
    )
  );
  process.exit(1);
});
