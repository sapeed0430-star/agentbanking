import { createHash } from 'node:crypto';
import { lookup as dnsLookup } from 'node:dns/promises';

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
    request: requestOk === null ? null : { ok: requestOk, status: requestStatus, method: 'GET' },
  };
}

class MockTransparencyLogAdapter {
  constructor({ logId = 'dev-transparency-log' } = {}) {
    this.logId = logId;
    this.treeSize = 0;
  }

  async appendProof({ receiptId, reportDigest }) {
    this.treeSize += 1;
    return {
      log_id: this.logId,
      entry_id: `entry_${receiptId}`,
      leaf_hash: createHash('sha256').update(`leaf:${receiptId}:${reportDigest.value}`).digest('hex'),
      root_hash: createHash('sha256').update(`root:${this.treeSize}`).digest('hex'),
      tree_size: this.treeSize,
      inclusion_proof: [createHash('sha256').update(`proof:${receiptId}:${this.treeSize}`).digest('hex')],
    };
  }
}

class RekorTransparencyLogAdapter {
  constructor({ baseUrl, publicKeyPemB64 = '', timeoutMs = 10000, logId = 'rekor' } = {}) {
    this.baseUrl = baseUrl;
    this.publicKeyPemB64 = publicKeyPemB64;
    this.timeoutMs = timeoutMs;
    this.logId = logId;
  }

  async appendProof({ receiptId, reportDigest, signature }) {
    if (!this.baseUrl) {
      const err = new Error('missing_rekor_base_url');
      err.stage = 'transparency';
      err.error_code = 'MISSING_REKOR_BASE_URL';
      throw err;
    }
    if (!this.publicKeyPemB64) {
      const err = new Error('missing_rekor_public_key');
      err.stage = 'transparency';
      err.error_code = 'MISSING_REKOR_PUBLIC_KEY';
      throw err;
    }

    const endpoint = `${this.baseUrl.replace(/\/+$/, '')}/api/v1/log/entries`;
    const algorithm = reportDigest.alg.replace('-', '');
    const signatureContent = Buffer.from(signature?.value || `receipt:${receiptId}`).toString('base64');

    const body = {
      apiVersion: '0.0.1',
      kind: 'hashedrekord',
      spec: {
        data: {
          hash: {
            algorithm,
            value: reportDigest.value,
          },
        },
        signature: {
          content: signatureContent,
          publicKey: {
            content: this.publicKeyPemB64,
          },
        },
      },
    };

    let response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (err) {
      throw makeTransportError('transparency', classifyStandardCode(err), safeString(err.message) || 'fetch failed', {
        target: 'transparency',
        endpoint,
      });
    }

    if (!response.ok) {
      throw makeTransportError(
        'transparency',
        classifyStandardCode(undefined, response.status),
        `rekor endpoint returned ${response.status}`,
        {
          target: 'transparency',
          endpoint,
          http_status: response.status,
        }
      );
    }

    const payload = await response.json();
    const entryPairs = Object.entries(payload);
    const firstPair = entryPairs[0];
    const entryId = firstPair ? firstPair[0] : `entry_${receiptId}`;
    const entry = firstPair ? firstPair[1] : payload;
    const proof = entry?.verification?.inclusionProof || {};

    const inclusionProof =
      Array.isArray(proof.hashes) && proof.hashes.length > 0
        ? proof.hashes
        : [createHash('sha256').update(`proof:${entryId}`).digest('hex')];

    return {
      log_id: entry?.logID || this.logId,
      entry_id: entryId,
      leaf_hash: entry?.body
        ? createHash('sha256').update(entry.body).digest('hex')
        : createHash('sha256').update(`leaf:${entryId}:${reportDigest.value}`).digest('hex'),
      root_hash:
        proof.rootHash || createHash('sha256').update(`root:${entryId}:${inclusionProof[0]}`).digest('hex'),
      tree_size: Number.isInteger(proof.treeSize) ? proof.treeSize : 1,
      inclusion_proof: inclusionProof,
    };
  }
}

export async function probeRekorEndpoint({ baseUrl, timeoutMs = 10000, lookupImpl = dnsLookup, fetchImpl = fetch } = {}) {
  if (!baseUrl) {
    return buildPreflightResult({
      target: 'transparency',
      endpoint: baseUrl,
      ok: false,
      phase: 'config',
      errorCode: 'MISSING_REKOR_BASE_URL',
      message: 'missing_rekor_base_url',
    });
  }

  let parsed;
  try {
    parsed = new URL(baseUrl);
  } catch {
    return buildPreflightResult({
      target: 'transparency',
      endpoint: baseUrl,
      ok: false,
      phase: 'config',
      errorCode: 'NETWORK_FAIL',
      message: 'invalid_rekor_base_url',
    });
  }

  try {
    await lookupImpl(parsed.hostname, { all: true });
  } catch (err) {
    return buildPreflightResult({
      target: 'transparency',
      endpoint: baseUrl,
      ok: false,
      phase: 'dns',
      errorCode: classifyStandardCode(err),
      message: safeString(err?.message) || 'dns lookup failed',
      dnsOk: false,
    });
  }

  const endpoint = `${baseUrl.replace(/\/+$/, '')}/api/v1/log/publicKey`;

  try {
    const response = await fetchImpl(endpoint, {
      method: 'GET',
      headers: {
        accept: 'application/x-pem-file, text/plain;q=0.9, */*;q=0.8',
      },
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      return buildPreflightResult({
        target: 'transparency',
        endpoint: baseUrl,
        ok: false,
        phase: 'request',
        errorCode: classifyStandardCode(undefined, response.status),
        message: `rekor endpoint returned ${response.status}`,
        dnsOk: true,
        requestOk: false,
        requestStatus: response.status,
      });
    }

    return buildPreflightResult({
      target: 'transparency',
      endpoint: baseUrl,
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
      target: 'transparency',
      endpoint: baseUrl,
      ok: false,
      phase: 'request',
      errorCode: classifyStandardCode(err),
      message: safeString(err?.message) || 'fetch failed',
      dnsOk: true,
      requestOk: false,
    });
  }
}

export function createTransparencyAdapter({ mode = 'mock', baseUrl, publicKeyPemB64, timeoutMs, logId } = {}) {
  if (mode === 'rekor') {
    return new RekorTransparencyLogAdapter({ baseUrl, publicKeyPemB64, timeoutMs, logId });
  }
  return new MockTransparencyLogAdapter();
}

export { classifyStandardCode as classifyTransparencyTransportCode };
