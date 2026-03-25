#!/usr/bin/env node
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';

import { digestCanonicalJson } from '../src/audit/canonical.js';
import { createAuditRuntime } from '../src/audit/runtime.js';
import { probeRfc3161Endpoint } from '../src/audit/adapters/timestamp.js';
import { probeRekorEndpoint } from '../src/audit/adapters/transparency.js';

function parseArgs(argv) {
  const result = {
    output: '',
    help: false,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      result.help = true;
      continue;
    }
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

function toIsoFileStamp(date) {
  return date.toISOString().replace(/[:.]/g, '-');
}

function formatDurationMs(value) {
  return Number(value.toFixed(2));
}

function safeString(value) {
  return typeof value === 'string' ? value : '';
}

function summarizeUrl(value) {
  const raw = safeString(value);
  if (!raw) return null;

  try {
    const parsed = new URL(raw);
    return {
      origin: parsed.origin,
      pathname: parsed.pathname,
    };
  } catch {
    return {
      value: '[invalid-url]',
    };
  }
}

function deriveErrorCode(err, stage) {
  const message = safeString(err?.message);

  if (safeString(err?.error_code)) {
    return String(err.error_code).toUpperCase();
  }
  if (safeString(err?.code)) {
    return String(err.code).toUpperCase();
  }
  if (message === 'missing_private_key_pem') return 'MISSING_PRIVATE_KEY_PEM';
  if (message === 'missing_tsa_endpoint') return 'MISSING_TSA_ENDPOINT';
  if (message === 'missing_rekor_base_url') return 'MISSING_REKOR_BASE_URL';
  if (message === 'missing_rekor_public_key') return 'MISSING_REKOR_PUBLIC_KEY';
  if (message.startsWith('tsa_http_')) return `TSA_HTTP_${message.slice('tsa_http_'.length)}`;
  if (message.startsWith('rekor_http_')) return `REKOR_HTTP_${message.slice('rekor_http_'.length)}`;
  if (message.startsWith('openssl_failed:')) return 'OPENSSL_FAILED';
  if (err?.name === 'AbortError' || err?.name === 'TimeoutError') return `${stage.toUpperCase()}_TIMEOUT`;
  return `${stage.toUpperCase()}_ERROR`;
}

function normalizeError(err, stage) {
  return {
    stage: safeString(err?.stage) || stage,
    error_code: safeString(err?.error_code) || deriveErrorCode(err, stage),
    message: safeString(err?.message) || 'unknown_error',
    target: safeString(err?.target) || null,
    phase: safeString(err?.phase) || null,
  };
}

function summarizePreflightChecks(checks) {
  const firstFailure = checks.find((item) => item.status === 'FAIL') || null;
  return {
    status: firstFailure ? 'FAIL' : 'PASS',
    failed_target: firstFailure?.target || null,
    failed_stage: firstFailure?.target || null,
    checks,
  };
}

function buildSkippedStep(stage, reason, extra = {}) {
  return {
    stage,
    status: 'skipped',
    reason,
    ...extra,
  };
}

function printHelp() {
  // eslint-disable-next-line no-console
  console.log(
    [
      'Usage:',
      '  node scripts/capture-live-proof-evidence.js [--output <path>]',
      '',
      'Options:',
      '  --output, -o  evidence json path (default: docs/week2/backend/evidence/live-proof-<timestamp>.json)',
      '  --help, -h    show this help text',
      '',
      'Environment:',
      '  AUDIT_SIGNER_MODE',
      '  AUDIT_SIGNER_KID',
      '  AUDIT_SIGNER_PRIVATE_KEY_PEM',
      '  AUDIT_TIMESTAMP_MODE',
      '  AUDIT_TSA_NAME',
      '  AUDIT_RFC3161_ENDPOINT',
      '  AUDIT_RFC3161_CA_CERT_PATH',
      '  AUDIT_TRANSPARENCY_MODE',
      '  AUDIT_TRANSPARENCY_LOG_ID',
      '  AUDIT_REKOR_BASE_URL',
      '  AUDIT_REKOR_PUBLIC_KEY_PEM_B64',
      '  AUDIT_PROOF_TIMEOUT_MS',
    ].join('\n')
  );
}

async function writeEvidenceFile(outputPath, evidence) {
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
}

async function main() {
  const args = parseArgs(process.argv);

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  const runAt = new Date();
  const runId = randomUUID();
  const runtime = createAuditRuntime();
  const timeoutMs = Number.parseInt(process.env.AUDIT_PROOF_TIMEOUT_MS || '10000', 10);
  const receiptId = `live-proof-${runId}`;
  const issuedAt = runAt.toISOString();

  const sampleRequest = {
    request_id: `req-${runId}`,
    agent_id: 'agent-live-proof',
    operator_id: process.env.AUDIT_OPERATOR_ID || 'operator-live-proof',
    policy_version: process.env.AUDIT_POLICY_VERSION || 'policy-2026.03',
    strategy_hash: `strategy-${runId.slice(0, 8)}`,
    model_hash: `model-${runId.slice(0, 8)}`,
    evidence_refs: [
      {
        kind: 'input',
        uri: `https://evidence.agentbanking.dev/live-proof/${runId}`,
        digest: {
          alg: 'sha-256',
          value: '0'.repeat(64),
        },
      },
    ],
    proof_targets: ['timestamp', 'transparency'],
    run_id: runId,
  };

  const reportDigest = {
    alg: 'sha-256',
    value: digestCanonicalJson(sampleRequest, 'sha-256'),
  };

  const evidenceDir = 'docs/week2/backend/evidence';
  const defaultOutput = resolve(process.cwd(), evidenceDir, `live-proof-${toIsoFileStamp(runAt)}.json`);
  const outputPath = args.output ? resolve(process.cwd(), args.output) : defaultOutput;

  const stepResults = [];
  const outputs = {
    signature: null,
    timestamp_proof: null,
    transparency_proof: null,
  };
  let preflight = {
    status: 'SKIPPED',
    failed_target: null,
    failed_stage: null,
    checks: [],
  };
  let failure = null;

  const signerStartedAt = performance.now();
  try {
    outputs.signature = await runtime.signer.signReceipt({
      reportDigest,
      receiptId,
      issuedAt,
    });
    stepResults.push({
      stage: 'signer',
      status: 'success',
      duration_ms: formatDurationMs(performance.now() - signerStartedAt),
      output: outputs.signature,
    });
  } catch (err) {
    failure = normalizeError(err, 'signer');
    stepResults.push({
      stage: 'signer',
      status: 'failed',
      duration_ms: formatDurationMs(performance.now() - signerStartedAt),
      error: failure,
    });
  }

  if (!failure) {
    const [timestampCheck, transparencyCheck] = await Promise.all([
      probeRfc3161Endpoint({
        endpoint: process.env.AUDIT_RFC3161_ENDPOINT || '',
        timeoutMs,
      }),
      probeRekorEndpoint({
        baseUrl: process.env.AUDIT_REKOR_BASE_URL || '',
        timeoutMs,
      }),
    ]);

    preflight = summarizePreflightChecks([timestampCheck, transparencyCheck]);

    if (preflight.status === 'FAIL') {
      const firstFailure = preflight.checks.find((item) => item.status === 'FAIL');
      failure = {
        stage: 'preflight',
        error_code: firstFailure?.error_code || 'NETWORK_FAIL',
        message: firstFailure?.message || 'preflight_failed',
        target: firstFailure?.target || null,
        phase: firstFailure?.phase || null,
      };
      stepResults.push(buildSkippedStep('timestamp', 'preflight_failed', { target: 'timestamp' }));
      stepResults.push(buildSkippedStep('transparency', 'preflight_failed', { target: 'transparency' }));
    } else {
      const timestampStartedAt = performance.now();
      try {
        outputs.timestamp_proof = await runtime.timestamp.issueTimestamp({
          reportDigest,
          receiptId,
          generatedAt: issuedAt,
        });
        stepResults.push({
          stage: 'timestamp',
          status: 'success',
          duration_ms: formatDurationMs(performance.now() - timestampStartedAt),
          output: outputs.timestamp_proof,
        });
      } catch (err) {
        failure = normalizeError(err, 'timestamp');
        stepResults.push({
          stage: 'timestamp',
          status: 'failed',
          duration_ms: formatDurationMs(performance.now() - timestampStartedAt),
          error: failure,
        });
      }

      if (failure) {
        stepResults.push(buildSkippedStep('transparency', `not_run_after_${failure.stage}_failure`, { target: 'transparency' }));
      } else {
        const transparencyStartedAt = performance.now();
        try {
          outputs.transparency_proof = await runtime.transparency.appendProof({
            receiptId,
            reportDigest,
            signature: outputs.signature,
          });
          stepResults.push({
            stage: 'transparency',
            status: 'success',
            duration_ms: formatDurationMs(performance.now() - transparencyStartedAt),
            output: outputs.transparency_proof,
          });
        } catch (err) {
          failure = normalizeError(err, 'transparency');
          stepResults.push({
            stage: 'transparency',
            status: 'failed',
            duration_ms: formatDurationMs(performance.now() - transparencyStartedAt),
            error: failure,
          });
        }
      }
    }
  }

  const outcome = failure ? 'FAIL' : 'PASS';

  const evidence = {
    evidence_type: 'live-proof-capture',
    spec_version: 'B-LIVE-1100',
    run_id: runId,
    captured_at: issuedAt,
    output_path: outputPath,
    config: {
      signer_mode: runtime.signerMode,
      timestamp_mode: runtime.timestampMode,
      transparency_mode: runtime.transparencyMode,
      proof_timeout_ms: timeoutMs,
      tsa_endpoint: summarizeUrl(process.env.AUDIT_RFC3161_ENDPOINT || ''),
      rekor_base_url: summarizeUrl(process.env.AUDIT_REKOR_BASE_URL || ''),
      rekor_public_key_set: Boolean(process.env.AUDIT_REKOR_PUBLIC_KEY_PEM_B64),
      tsa_ca_cert_path: safeString(process.env.AUDIT_RFC3161_CA_CERT_PATH || ''),
    },
    preflight,
    sample: {
      request: sampleRequest,
      digest: reportDigest,
      receipt_id: receiptId,
      issued_at: issuedAt,
    },
    steps: stepResults,
    artifacts: {
      signature: outputs.signature,
      timestamp_proof: outputs.timestamp_proof,
      transparency_proof: outputs.transparency_proof,
    },
    result: {
      outcome,
      failed_stage: failure?.stage || null,
      error: failure,
    },
  };

  await writeEvidenceFile(outputPath, evidence);

  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        outcome,
        output_path: outputPath,
        failed_stage: failure?.stage || null,
        error_code: failure?.error_code || null,
        message: failure?.message || null,
      },
      null,
      2
    )
  );

  process.exit(outcome === 'PASS' ? 0 : 1);
}

main().catch(async (err) => {
  const failure = normalizeError(err, 'script');
  const runAt = new Date();
  const outputPath = resolve(
    process.cwd(),
    'docs/week2/backend/evidence',
    `live-proof-${toIsoFileStamp(runAt)}.json`
  );

  const evidence = {
    evidence_type: 'live-proof-capture',
    spec_version: 'B-LIVE-1100',
    run_id: randomUUID(),
    captured_at: runAt.toISOString(),
    output_path: outputPath,
    config: {
      signer_mode: process.env.AUDIT_SIGNER_MODE || 'mock',
      timestamp_mode: process.env.AUDIT_TIMESTAMP_MODE || 'mock',
      transparency_mode: process.env.AUDIT_TRANSPARENCY_MODE || 'mock',
      proof_timeout_ms: Number.parseInt(process.env.AUDIT_PROOF_TIMEOUT_MS || '10000', 10),
      tsa_endpoint: summarizeUrl(process.env.AUDIT_RFC3161_ENDPOINT || ''),
      rekor_base_url: summarizeUrl(process.env.AUDIT_REKOR_BASE_URL || ''),
      rekor_public_key_set: Boolean(process.env.AUDIT_REKOR_PUBLIC_KEY_PEM_B64),
      tsa_ca_cert_path: safeString(process.env.AUDIT_RFC3161_CA_CERT_PATH || ''),
    },
    preflight: {
      status: 'SKIPPED',
      failed_target: null,
      failed_stage: null,
      checks: [],
    },
    steps: [
      {
        stage: 'script',
        status: 'failed',
        error: failure,
      },
    ],
    artifacts: {
      signature: null,
      timestamp_proof: null,
      transparency_proof: null,
    },
    result: {
      outcome: 'FAIL',
      failed_stage: failure.stage,
      error: failure,
    },
  };

  try {
    await writeEvidenceFile(outputPath, evidence);
  } catch {
    // If the evidence file cannot be written, preserve the original failure only.
  }

  // eslint-disable-next-line no-console
  console.error(
    JSON.stringify(
      {
        outcome: 'FAIL',
        output_path: outputPath,
        failed_stage: failure.stage,
        error_code: failure.error_code,
        message: failure.message,
      },
      null,
      2
    )
  );
  process.exit(1);
});
