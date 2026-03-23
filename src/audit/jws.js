import { createPublicKey, verify } from 'node:crypto';

function normalizeInput(input) {
  return Buffer.isBuffer(input) ? input : Buffer.from(input, 'utf8');
}

export function toBase64Url(input) {
  const value = normalizeInput(input).toString('base64');
  return value.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function fromBase64Url(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = `${normalized}${'='.repeat((4 - (normalized.length % 4)) % 4)}`;
  return Buffer.from(padded, 'base64');
}

export function parseCompactJws(compact) {
  if (typeof compact !== 'string') {
    throw new Error('invalid_jws_type');
  }
  const parts = compact.split('.');
  if (parts.length !== 3) {
    throw new Error('invalid_jws_format');
  }
  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const header = JSON.parse(fromBase64Url(encodedHeader).toString('utf8'));
  const payload = JSON.parse(fromBase64Url(encodedPayload).toString('utf8'));
  const signature = fromBase64Url(encodedSignature);
  return {
    encodedHeader,
    encodedPayload,
    encodedSignature,
    signingInput: `${encodedHeader}.${encodedPayload}`,
    header,
    payload,
    signature,
  };
}

export function verifyCompactJwsEd25519(compact, publicKeyPem) {
  const parsed = parseCompactJws(compact);
  const key = createPublicKey(publicKeyPem.replace(/\\n/g, '\n'));
  const ok = verify(null, Buffer.from(parsed.signingInput), key, parsed.signature);
  return {
    valid: ok,
    header: parsed.header,
    payload: parsed.payload,
  };
}
