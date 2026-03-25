import { randomUUID } from 'node:crypto';
import { lookup as dnsLookup } from 'node:dns/promises';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const DNS_FAIL_CODES = new Set(['ENOTFOUND', 'EAI_AGAIN', 'EAI_NONAME', 'ENODATA']);
const NETWORK_FAIL_CODES = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'ECONNABORTED',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'EPIPE',
  'ERR_NETWORK',
  'ERR_TLS_CERT_ALTNAME_INVALID',
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
  'DEPTH_ZERO_SELF_SIGNED_CERT',
  'CERT_HAS_EXPIRED',
  'UND_ERR_SOCKET',
]);
const TIMEOUT_CODES = new Set(['ETIMEDOUT', 'UND_ERR_CONNECT_TIMEOUT']);

function safeString(value) {
  return typeof value === 'string' ? value : '';
}

function toUpperCode(value) {
  return safeString(value).toUpperCase();
}

function getCauseCode(err) {
  return toUpperCode(err?.cause?.code || err?.cause?.errno || err?.code || err?.cause?.name);
}

function classifyStandardCode(err, responseStatus) {
  if (Number.isInteger(responseStatus)) {
    if (responseStatus === 401 || responseStatus === 403) return 'AUTH_REQUIRED';
    if (responseStatus === 408) return 'TIMEOUT';
    if (responseStatus >= 200 && responseStatus < 300) return 'PASS';
    return 'HTTP_NON_2XX';
  }

  const code = getCauseCode(err);
  const message = safeString(err?.message).toUpperCase();

  if (err?.name === 'AbortError' || err?.name === 'TimeoutError') return 'TIMEOUT';
  if (TIMEOUT_CODES.has(code) || message.includes('TIMEOUT')) return 'TIMEOUT';
  if (DNS_FAIL_CODES.has(code) || message.includes('ENOTFOUND') || message.includes('EAI_AGAIN')) return 'DNS_FAIL';
  if (
    NETWORK_FAIL_CODES.has(code) ||
    message.includes('ECONN') ||
    message.includes('EHOSTUNREACH') ||
    message.includes('ENETUNREACH') ||
    message.includes('SOCKET') ||
    message.includes('TLS') ||
    message.includes('CERT') ||
    message.includes('NETWORK')
  ) {
    return 'NETWORK_FAIL';
  }

  return 'NETWORK_FAIL';
}

function makeTransportError(stage, errorCode, message, extra = {}) {
  const err = new Error(message);
  err.stage = stage;
  err.error_code = errorCode;
  Object.assign(err, extra);
  return err;
}

function normalizeEndpointSummary(endpoint) {
  if (!endpoint) return null;
  try {
    const parsed = new URL(endpoint);
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

function buildPreflightResult({
  target,
  endpoint,
  ok,
  phase,
  errorCode = null,
  message = null,
  dnsOk = null,
  requestOk = null,
  requestStatus = null,
}) {
  return {
    target,
    endpoint: normalizeEndpointSummary(endpoint),
    status: ok ? 'PASS' : 'FAIL',
    phase,
    error_code: errorCode,
    message,
    dns: dnsOk === null ? null : { ok: dnsOk },
    request: requestOk === null ? null : { ok: requestOk, status: requestStatus, method: 'POST' },
  };
}

function hashFlagFromDigestAlg(alg) {
  if (alg === 'sha-512') return '-sha512';
  return '-sha256';
}

async function runOpenSsl(args, timeoutMs = 8000) {
  try {
    return await execFileAsync('openssl', args, { timeout: timeoutMs, maxBuffer: 10 * 1024 * 1024 });
  } catch (err) {
    const wrapped = new Error(`openssl_failed:${err.message}`);
    wrapped.stage = 'timestamp';
    wrapped.error_code = 'OPENSSL_FAILED';
    throw wrapped;
  }
}

class MockTimestampAdapter {
  constructor({ tsaName = 'dev-rfc3161-tsa' } = {}) {
    this.tsaName = tsaName;
  }

  async issueTimestamp({ receiptId, generatedAt }) {
    return {
      tsa_name: this.tsaName,
      gen_time: generatedAt,
      token_b64: Buffer.from(`tsa:${receiptId}:${generatedAt}:${randomUUID()}`).toString('base64'),
    };
  }
}

class Rfc3161TimestampAdapter {
  constructor({ endpoint, timeoutMs = 10000, tsaName = 'rfc3161-tsa', caCertPath = '' } = {}) {
    this.endpoint = endpoint;
    this.timeoutMs = timeoutMs;
    this.tsaName = tsaName;
    this.caCertPath = caCertPath;
  }

  async issueTimestamp({ reportDigest, receiptId, generatedAt }) {
    if (!this.endpoint) {
      const err = new Error('missing_tsa_endpoint');
      err.stage = 'timestamp';
      err.error_code = 'MISSING_TSA_ENDPOINT';
      throw err;
    }

    const tempDir = await mkdtemp(join(tmpdir(), 'agentbanking-tsa-'));
    const queryPath = join(tempDir, `${receiptId}.tsq`);
    const replyPath = join(tempDir, `${receiptId}.tsr`);
    const hashFlag = hashFlagFromDigestAlg(reportDigest.alg);

    try {
      await runOpenSsl(['ts', '-query', '-digest', reportDigest.value, hashFlag, '-cert', '-out', queryPath], this.timeoutMs);
      const query = await readFile(queryPath);

      let response;
      try {
        response = await fetch(this.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/timestamp-query',
            Accept: 'application/timestamp-reply',
          },
          body: query,
          signal: AbortSignal.timeout(this.timeoutMs),
        });
      } catch (err) {
        throw makeTransportError('timestamp', classifyStandardCode(err), safeString(err.message) || 'fetch failed', {
          target: 'timestamp',
          endpoint: this.endpoint,
        });
      }

      if (!response.ok) {
        throw makeTransportError(
          'timestamp',
          classifyStandardCode(undefined, response.status),
          `tsa endpoint returned ${response.status}`,
          {
            target: 'timestamp',
            endpoint: this.endpoint,
            http_status: response.status,
          }
        );
      }

      const reply = Buffer.from(await response.arrayBuffer());
      await writeFile(replyPath, reply);

      if (this.caCertPath) {
        await runOpenSsl(
          ['ts', '-verify', '-queryfile', queryPath, '-in', replyPath, '-CAfile', this.caCertPath],
          this.timeoutMs
        );
      }

      let genTime = generatedAt;
      try {
        const { stdout } = await runOpenSsl(['ts', '-reply', '-in', replyPath, '-text'], this.timeoutMs);
        const line = stdout
          .split('\n')
          .map((item) => item.trim())
          .find((item) => item.startsWith('Time stamp:'));
        if (line) {
          const raw = line.replace('Time stamp:', '').trim();
          const normalized = new Date(raw);
          if (!Number.isNaN(normalized.getTime())) {
            genTime = normalized.toISOString();
          }
        }
      } catch {
        // keep generatedAt if reply text parse is unavailable
      }

      return {
        tsa_name: this.tsaName,
        gen_time: genTime,
        token_b64: reply.toString('base64'),
      };
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  }
}

export async function probeRfc3161Endpoint({ endpoint, timeoutMs = 10000, lookupImpl = dnsLookup, fetchImpl = fetch } = {}) {
  if (!endpoint) {
    return buildPreflightResult({
      target: 'timestamp',
      endpoint,
      ok: false,
      phase: 'config',
      errorCode: 'MISSING_TSA_ENDPOINT',
      message: 'missing_tsa_endpoint',
    });
  }

  let parsed;
  try {
    parsed = new URL(endpoint);
  } catch {
    return buildPreflightResult({
      target: 'timestamp',
      endpoint,
      ok: false,
      phase: 'config',
      errorCode: 'NETWORK_FAIL',
      message: 'invalid_tsa_endpoint',
    });
  }

  try {
    await lookupImpl(parsed.hostname, { all: true });
  } catch (err) {
    return buildPreflightResult({
      target: 'timestamp',
      endpoint,
      ok: false,
      phase: 'dns',
      errorCode: classifyStandardCode(err),
      message: safeString(err?.message) || 'dns lookup failed',
      dnsOk: false,
    });
  }

  try {
    const response = await fetchImpl(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/timestamp-query',
        Accept: 'application/timestamp-reply',
      },
      body: new Uint8Array(),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      return buildPreflightResult({
        target: 'timestamp',
        endpoint,
        ok: false,
        phase: 'request',
        errorCode: classifyStandardCode(undefined, response.status),
        message: `tsa endpoint returned ${response.status}`,
        dnsOk: true,
        requestOk: false,
        requestStatus: response.status,
      });
    }

    return buildPreflightResult({
      target: 'timestamp',
      endpoint,
      ok: true,
      phase: 'request',
      errorCode: null,
      message: null,
      dnsOk: true,
      requestOk: true,
      requestStatus: response.status,
    });
  } catch (err) {
    return buildPreflightResult({
      target: 'timestamp',
      endpoint,
      ok: false,
      phase: 'request',
      errorCode: classifyStandardCode(err),
      message: safeString(err?.message) || 'fetch failed',
      dnsOk: true,
      requestOk: false,
    });
  }
}

export function createTimestampAdapter({ mode = 'mock', endpoint, timeoutMs, tsaName, caCertPath } = {}) {
  if (mode === 'rfc3161') {
    return new Rfc3161TimestampAdapter({ endpoint, timeoutMs, tsaName, caCertPath });
  }
  return new MockTimestampAdapter();
}

export { classifyStandardCode as classifyTimestampTransportCode };
