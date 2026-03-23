import { createHash, createPrivateKey, randomUUID, sign } from 'node:crypto';

function toBase64Url(input) {
  const value = Buffer.isBuffer(input) ? input.toString('base64') : Buffer.from(input).toString('base64');
  return value.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function buildSigningInput(header, payload) {
  const encodedHeader = toBase64Url(JSON.stringify(header));
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  return {
    encodedHeader,
    encodedPayload,
    signingInput: `${encodedHeader}.${encodedPayload}`,
  };
}

class MockSignerAdapter {
  constructor({ kid = 'mock-ed25519-key' } = {}) {
    this.kid = kid;
  }

  async signReceipt({ reportDigest, receiptId, issuedAt }) {
    const payload = {
      iss: 'agentbanking-mock-signer',
      aud: 'receipt',
      receipt_id: receiptId,
      digest: reportDigest,
      iat: issuedAt,
      jti: randomUUID(),
    };
    const header = {
      alg: 'EdDSA',
      typ: 'JWT',
      kid: this.kid,
    };
    const { signingInput } = buildSigningInput(header, payload);
    const pseudoSig = createHash('sha256').update(signingInput).digest('hex');
    return {
      format: 'jws-compact',
      alg: 'EdDSA',
      kid: this.kid,
      value: `${signingInput}.${toBase64Url(pseudoSig)}`,
    };
  }
}

class LocalEd25519SignerAdapter {
  constructor({ privateKeyPem, kid = 'local-ed25519-key' } = {}) {
    this.privateKeyPem = privateKeyPem;
    this.kid = kid;
  }

  async signReceipt({ reportDigest, receiptId, issuedAt }) {
    if (!this.privateKeyPem) {
      const err = new Error('missing_private_key_pem');
      err.stage = 'signer';
      throw err;
    }

    const payload = {
      iss: 'agentbanking-local-signer',
      aud: 'receipt',
      receipt_id: receiptId,
      digest: reportDigest,
      iat: issuedAt,
      jti: randomUUID(),
    };
    const header = {
      alg: 'EdDSA',
      typ: 'JWT',
      kid: this.kid,
    };

    const { signingInput } = buildSigningInput(header, payload);
    const privateKey = createPrivateKey(this.privateKeyPem.replace(/\\n/g, '\n'));
    const signature = sign(null, Buffer.from(signingInput), privateKey);
    return {
      format: 'jws-compact',
      alg: 'EdDSA',
      kid: this.kid,
      value: `${signingInput}.${toBase64Url(signature)}`,
    };
  }
}

export function createSignerAdapter({ mode = 'mock', kid, privateKeyPem } = {}) {
  if (mode === 'local-ed25519') {
    return new LocalEd25519SignerAdapter({ kid, privateKeyPem });
  }
  return new MockSignerAdapter({ kid });
}
