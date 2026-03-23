import { createSignerAdapter } from './adapters/signer.js';
import { createTimestampAdapter } from './adapters/timestamp.js';
import { createTransparencyAdapter } from './adapters/transparency.js';

export function createAuditRuntime() {
  const signerMode = process.env.AUDIT_SIGNER_MODE || 'mock';
  const timestampMode = process.env.AUDIT_TIMESTAMP_MODE || 'mock';
  const transparencyMode = process.env.AUDIT_TRANSPARENCY_MODE || 'mock';
  const timeoutMs = Number.parseInt(process.env.AUDIT_PROOF_TIMEOUT_MS || '10000', 10);

  return {
    signerMode,
    timestampMode,
    transparencyMode,
    signer: createSignerAdapter({
      mode: signerMode,
      kid: process.env.AUDIT_SIGNER_KID || 'dev-ed25519-key-2026q1',
      privateKeyPem: process.env.AUDIT_SIGNER_PRIVATE_KEY_PEM || '',
    }),
    timestamp: createTimestampAdapter({
      mode: timestampMode,
      endpoint: process.env.AUDIT_RFC3161_ENDPOINT || '',
      timeoutMs,
      tsaName: process.env.AUDIT_TSA_NAME || 'rfc3161-tsa',
      caCertPath: process.env.AUDIT_RFC3161_CA_CERT_PATH || '',
    }),
    transparency: createTransparencyAdapter({
      mode: transparencyMode,
      baseUrl: process.env.AUDIT_REKOR_BASE_URL || '',
      publicKeyPemB64: process.env.AUDIT_REKOR_PUBLIC_KEY_PEM_B64 || '',
      timeoutMs,
      logId: process.env.AUDIT_TRANSPARENCY_LOG_ID || 'rekor',
    }),
  };
}
