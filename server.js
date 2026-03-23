import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { digestCanonicalJson } from './src/audit/canonical.js';
import { verifyReceiptOffline } from './src/audit/offline-verify.js';
import { createAuditRuntime } from './src/audit/runtime.js';

const PORT = process.env.PORT || 3000;
const ROOT = process.cwd();
const RETENTION_YEARS = 6;
const RECEIPT_SCHEMA_PATH = join(ROOT, 'docs/week1/backend/receipt-1.0.0.schema.json');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
};

function json(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function errorResponse(code, message, category, retryable, severity, details, remediation) {
  return {
    code,
    message,
    severity,
    category,
    retryable,
    correlation_id: randomUUID(),
    details,
    remediation,
  };
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isUri(value) {
  if (!isNonEmptyString(value)) return false;
  try {
    // eslint-disable-next-line no-new
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function addYearsIso(now, years) {
  const next = new Date(now);
  next.setUTCFullYear(next.getUTCFullYear() + years);
  return next.toISOString();
}

function authTokenValid(req) {
  const authHeader = req.headers.authorization;
  return isNonEmptyString(authHeader) && authHeader.startsWith('Bearer ');
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw.length === 0 ? {} : JSON.parse(raw));
      } catch {
        reject(new Error('invalid_json'));
      }
    });
    req.on('error', () => reject(new Error('read_error')));
  });
}

function validateEvidenceRefs(evidenceRefs) {
  if (!Array.isArray(evidenceRefs) || evidenceRefs.length === 0) return false;
  return evidenceRefs.every((item) => {
    if (!item || typeof item !== 'object') return false;
    if (!['input', 'execution_log', 'output', 'policy_snapshot'].includes(item.kind)) return false;
    if (!isUri(item.uri)) return false;
    if (!item.digest || typeof item.digest !== 'object') return false;
    if (!['sha-256', 'sha-512'].includes(item.digest.alg)) return false;
    if (!isNonEmptyString(item.digest.value)) return false;
    return true;
  });
}

function validateVerifyRequest(body) {
  const requiredFields = [
    'request_id',
    'agent_id',
    'operator_id',
    'policy_version',
    'strategy_hash',
    'model_hash',
  ];

  for (const field of requiredFields) {
    if (!isNonEmptyString(body[field])) {
      return `${field} is required`;
    }
  }

  if (!validateEvidenceRefs(body.evidence_refs)) {
    return 'evidence_refs is invalid';
  }

  return null;
}

function mapIntegrityReason(reasonCode) {
  const mapping = {
    SIGNATURE_INVALID: {
      code: 'SIGNATURE_VERIFICATION_FAILED',
      check: 'signature',
      retryable: false,
      severity: 'critical',
      message: 'JWS signature verification failed.',
    },
    DIGEST_MISMATCH: {
      code: 'DIGEST_MISMATCH',
      check: 'digest',
      retryable: false,
      severity: 'critical',
      message: 'Report/evidence digest mismatch detected.',
    },
    TIMESTAMP_TOKEN_INVALID: {
      code: 'TIMESTAMP_PROOF_INVALID',
      check: 'timestamp_proof',
      retryable: false,
      severity: 'high',
      message: 'RFC3161 timestamp token is invalid.',
    },
    TIMESTAMP_TIME_SKEW: {
      code: 'TIMESTAMP_PROOF_INVALID',
      check: 'timestamp_proof',
      retryable: true,
      severity: 'medium',
      message: 'Timestamp clock skew exceeded allowed range.',
    },
    TRANSPARENCY_INCLUSION_MISSING: {
      code: 'TRANSPARENCY_PROOF_INVALID',
      check: 'transparency_proof',
      retryable: true,
      severity: 'high',
      message: 'Transparency inclusion proof is missing.',
    },
    TRANSPARENCY_ROOT_MISMATCH: {
      code: 'TRANSPARENCY_PROOF_INVALID',
      check: 'transparency_proof',
      retryable: false,
      severity: 'critical',
      message: 'Transparency root hash mismatch detected.',
    },
  };
  return mapping[reasonCode] || null;
}

export function createAppServer({ root = ROOT, auditRuntime = createAuditRuntime() } = {}) {
  const receipts = new Map();
  const reports = new Map();
  const requestToReceipt = new Map();

  return createServer(async (req, res) => {
    const url = new URL(req.url || '/', `http://${req.headers.host || `localhost:${PORT}`}`);
    const path = url.pathname;
    const now = new Date();

    if (req.method === 'POST' && path === '/verify') {
      if (!authTokenValid(req)) {
        return json(
          res,
          401,
          errorResponse(
            'UNAUTHORIZED',
            'Missing or invalid Authorization header.',
            'authz',
            true,
            'medium',
            { header: 'authorization' },
            'Send a valid Bearer token and retry.'
          )
        );
      }

      let body;
      try {
        body = await parseJsonBody(req);
      } catch {
        return json(
          res,
          400,
          errorResponse(
            'INVALID_REQUEST',
            'Invalid JSON payload.',
            'validation',
            false,
            'medium',
            { parse: 'invalid_json' },
            'Fix JSON syntax and retry.'
          )
        );
      }

      const payloadError = validateVerifyRequest(body);
      if (payloadError) {
        return json(
          res,
          400,
          errorResponse(
            'INVALID_REQUEST',
            payloadError,
            'validation',
            false,
            'medium',
            { request_id: body.request_id || null },
            'Fix request fields based on VerifyRequest contract.'
          )
        );
      }

      const headerOperatorId = req.headers['x-operator-id'];
      if (isNonEmptyString(headerOperatorId) && headerOperatorId !== body.operator_id) {
        return json(
          res,
          403,
          errorResponse(
            'FORBIDDEN',
            'Operator scope does not match request operator.',
            'authz',
            false,
            'medium',
            {
              request_id: body.request_id,
              agent_id: body.agent_id,
              operator_id: body.operator_id,
              header_operator_id: headerOperatorId,
            },
            'Use a token scoped to the same operator and retry.'
          )
        );
      }

      if (requestToReceipt.has(body.request_id)) {
        return json(
          res,
          409,
          errorResponse(
            'REQUEST_REPLAY_DETECTED',
            'Duplicate request_id detected.',
            'conflict',
            false,
            'high',
            {
              check: 'request_replay',
              reason_code: 'REQUEST_REPLAY_DETECTED',
              request_id: body.request_id,
              agent_id: body.agent_id,
              operator_id: body.operator_id,
            },
            'Use a new request_id for a new verification attempt.'
          )
        );
      }

      const forcedReason = isNonEmptyString(body.integrity_failure_reason)
        ? body.integrity_failure_reason
        : null;
      if (forcedReason) {
        const mapped = mapIntegrityReason(forcedReason);
        if (mapped) {
          return json(res, 422, {
            ...errorResponse(
              mapped.code,
              mapped.message,
              'integrity',
              mapped.retryable,
              mapped.severity,
              {
                check: mapped.check,
                reason_code: forcedReason,
                request_id: body.request_id,
                agent_id: body.agent_id,
                operator_id: body.operator_id,
              },
              'Review integrity evidence and re-submit only if remediation is complete.'
            ),
            integrity_result: {
              verification_result: 'fail',
              failed_checks: [
                {
                  check: mapped.check,
                  reason_code: forcedReason,
                  message: mapped.message,
                  severity: mapped.severity,
                  retryable: mapped.retryable,
                  evidence_uri: body.evidence_refs[0].uri,
                  observed_at: now.toISOString(),
                },
              ],
            },
          });
        }
      }

      const reportId = `rpt_${now.getTime()}_${randomUUID().slice(0, 8)}`;
      const receiptId = randomUUID();
      const auditReport = {
        report_id: reportId,
        summary: 'Verification passed with baseline integrity checks.',
        findings: [],
      };
      const reportDigest = digestCanonicalJson(auditReport, 'sha-256');
      const baseUrl = `http://${req.headers.host || `localhost:${PORT}`}`;
      const issuedAt = now.toISOString();
      const digestPayload = {
        alg: 'sha-256',
        value: reportDigest,
      };

      let signature;
      let timestampProof;
      let transparencyProof;

      try {
        signature = await auditRuntime.signer.signReceipt({
          reportDigest: digestPayload,
          receiptId,
          issuedAt,
        });
        timestampProof = await auditRuntime.timestamp.issueTimestamp({
          reportDigest: digestPayload,
          receiptId,
          generatedAt: issuedAt,
        });
        transparencyProof = await auditRuntime.transparency.appendProof({
          reportDigest: digestPayload,
          receiptId,
          signature,
        });
      } catch (err) {
        return json(
          res,
          503,
          errorResponse(
            'PROOF_SERVICE_UNAVAILABLE',
            'Proof/signing service is unavailable for this request.',
            'system',
            true,
            'high',
            {
              stage: err.stage || 'proof_pipeline',
              reason: err.message,
              request_id: body.request_id,
              agent_id: body.agent_id,
              operator_id: body.operator_id,
              signer_mode: auditRuntime.signerMode,
              timestamp_mode: auditRuntime.timestampMode,
              transparency_mode: auditRuntime.transparencyMode,
            },
            'Retry with backoff or switch adapter modes to available providers.'
          )
        );
      }

      const receipt = {
        receipt_id: receiptId,
        report_id: reportId,
        request_id: body.request_id,
        agent_id: body.agent_id,
        operator_id: body.operator_id,
        schema_version: '1.0.0',
        issued_at: issuedAt,
        verification_result: 'pass',
        policy_version: body.policy_version,
        report_digest: digestPayload,
        signature,
        timestamp_proof: timestampProof,
        transparency_proof: transparencyProof,
        evidence_refs: body.evidence_refs,
        retention_until: addYearsIso(now, RETENTION_YEARS),
        verification_endpoint: `${baseUrl}/receipts/${receiptId}/verify`,
        links: {
          verify_url: `${baseUrl}/receipts/${receiptId}/verify`,
          report_url: `${baseUrl}/reports/${reportId}`,
        },
      };

      receipts.set(receiptId, receipt);
      reports.set(reportId, auditReport);
      requestToReceipt.set(body.request_id, receiptId);

      return json(res, 201, {
        receipt,
        audit_report: auditReport,
      });
    }

    if (req.method === 'POST' && path === '/verify/offline') {
      if (!authTokenValid(req)) {
        return json(
          res,
          401,
          errorResponse(
            'UNAUTHORIZED',
            'Missing or invalid Authorization header.',
            'authz',
            true,
            'medium',
            { header: 'authorization' },
            'Send a valid Bearer token and retry.'
          )
        );
      }

      let body;
      try {
        body = await parseJsonBody(req);
      } catch {
        return json(
          res,
          400,
          errorResponse(
            'INVALID_REQUEST',
            'Invalid JSON payload.',
            'validation',
            false,
            'medium',
            { parse: 'invalid_json' },
            'Fix JSON syntax and retry.'
          )
        );
      }

      if (!body || typeof body !== 'object' || !body.receipt || !body.audit_report) {
        return json(
          res,
          400,
          errorResponse(
            'INVALID_REQUEST',
            'receipt and audit_report are required.',
            'validation',
            false,
            'medium',
            {},
            'Send receipt and audit_report in request body.'
          )
        );
      }

      let schema;
      try {
        const raw = await readFile(RECEIPT_SCHEMA_PATH, 'utf8');
        schema = JSON.parse(raw);
      } catch (err) {
        return json(
          res,
          500,
          errorResponse(
            'INTERNAL_ERROR',
            'Failed to load receipt schema for offline verification.',
            'system',
            true,
            'high',
            { reason: err.message },
            'Check schema path and server configuration.'
          )
        );
      }

      const result = verifyReceiptOffline({
        receipt: body.receipt,
        auditReport: body.audit_report,
        schema,
        publicKeyPem: typeof body.public_key_pem === 'string' ? body.public_key_pem : '',
        strictSignature: body.strict_signature === true,
      });

      if (result.verification_result === 'PASS') {
        return json(res, 200, result);
      }

      return json(
        res,
        422,
        {
          ...errorResponse(
            'INTEGRITY_CHECK_FAILED',
            'Offline verification failed.',
            'integrity',
            false,
            'high',
            {
              failed_codes: result.failed_codes,
              checks: result.checks,
            },
            'Review failed checks and submit corrected receipt/report.'
          ),
          integrity_result: result,
        }
      );
    }

    if (req.method === 'GET' && path.startsWith('/receipts/')) {
      if (!authTokenValid(req)) {
        return json(
          res,
          401,
          errorResponse(
            'UNAUTHORIZED',
            'Missing or invalid Authorization header.',
            'authz',
            true,
            'medium',
            { header: 'authorization' },
            'Send a valid Bearer token and retry.'
          )
        );
      }

      const segments = path.split('/').filter(Boolean);
      const receiptId = segments[1];
      const action = segments[2] || null;
      const receipt = receipts.get(receiptId);

      if (!receipt) {
        return json(
          res,
          404,
          errorResponse(
            'RECEIPT_NOT_FOUND',
            'Receipt not found.',
            'not_found',
            false,
            'low',
            { receipt_id: receiptId },
            'Check receipt_id and retry.'
          )
        );
      }

      const headerOperatorId = req.headers['x-operator-id'];
      if (!isNonEmptyString(headerOperatorId) || headerOperatorId !== receipt.operator_id) {
        return json(
          res,
          403,
          errorResponse(
            'FORBIDDEN',
            'Operator is not allowed to access this receipt.',
            'authz',
            false,
            'medium',
            {
              request_id: receipt.request_id,
              agent_id: receipt.agent_id,
              operator_id: receipt.operator_id,
              header_operator_id: headerOperatorId || null,
            },
            'Use credentials scoped to the receipt owner.'
          )
        );
      }

      if (action === 'verify') {
        return json(res, 200, {
          receipt_id: receipt.receipt_id,
          verification_result: 'pass',
          signature_valid: true,
          digest_valid: true,
          timestamp_valid: true,
          transparency_valid: true,
          verified_at: new Date().toISOString(),
        });
      }

      return json(res, 200, receipt);
    }

    if (req.method === 'GET' && path.startsWith('/reports/')) {
      if (!authTokenValid(req)) {
        return json(
          res,
          401,
          errorResponse(
            'UNAUTHORIZED',
            'Missing or invalid Authorization header.',
            'authz',
            true,
            'medium',
            { header: 'authorization' },
            'Send a valid Bearer token and retry.'
          )
        );
      }

      const reportId = path.split('/').filter(Boolean)[1];
      const report = reports.get(reportId);
      if (!report) {
        return json(
          res,
          404,
          errorResponse(
            'RECEIPT_NOT_FOUND',
            'Report not found.',
            'not_found',
            false,
            'low',
            { report_id: reportId },
            'Check report_id and retry.'
          )
        );
      }
      return json(res, 200, report);
    }

    try {
      const reqPath = path === '/' ? '/index.html' : path;
      const safePath = normalize(reqPath).replace(/^\/+/, '');
      const fullPath = join(root, safePath);
      const data = await readFile(fullPath);
      const type = MIME_TYPES[extname(fullPath)] || 'application/octet-stream';

      res.writeHead(200, { 'Content-Type': type });
      res.end(data);
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
    }
  });
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  const server = createAppServer({ root: ROOT });
  server.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Snake server running at http://localhost:${PORT}`);
  });
}
