import { randomUUID } from 'node:crypto';
import { digestCanonicalJson } from './canonical.js';
import { parseCompactJws, verifyCompactJwsEd25519 } from './jws.js';
import { validateJsonSchema } from './schema-validator.js';

function pushCheck(checks, name, ok, code, message, severity = 'high') {
  checks.push({ name, ok, code, severity, message });
}

function hasTransparencyShape(value) {
  if (!value || typeof value !== 'object') return false;
  if (!Array.isArray(value.inclusion_proof) || value.inclusion_proof.length === 0) return false;
  return (
    typeof value.log_id === 'string' &&
    typeof value.entry_id === 'string' &&
    typeof value.leaf_hash === 'string' &&
    typeof value.root_hash === 'string' &&
    Number.isInteger(value.tree_size)
  );
}

export function verifyReceiptOffline({
  receipt,
  auditReport,
  schema,
  publicKeyPem = '',
  strictSignature = false,
}) {
  const checks = [];
  const warnings = [];

  const schemaResult = validateJsonSchema(schema, receipt);
  if (schemaResult.valid) {
    pushCheck(checks, 'schema', true, 'SCHEMA_VALID', 'Receipt schema validation passed.', 'low');
  } else {
    pushCheck(
      checks,
      'schema',
      false,
      'INVALID_REQUEST',
      `Receipt schema validation failed: ${schemaResult.errors.join('; ')}`
    );
  }

  const digestAlg = receipt?.report_digest?.alg || 'sha-256';
  const expectedDigest = receipt?.report_digest?.value || '';
  let recomputedDigest = '';
  try {
    recomputedDigest = digestCanonicalJson(auditReport, digestAlg);
    if (recomputedDigest === expectedDigest) {
      pushCheck(checks, 'digest', true, 'DIGEST_OK', 'Report digest matched receipt digest.', 'low');
    } else {
      pushCheck(checks, 'digest', false, 'DIGEST_MISMATCH', 'Report digest does not match receipt digest.');
    }
  } catch (err) {
    pushCheck(checks, 'digest', false, 'DIGEST_MISMATCH', `Digest verification failed: ${err.message}`);
  }

  try {
    const parsed = parseCompactJws(receipt.signature.value);
    if (parsed.header.alg === 'none') {
      pushCheck(checks, 'signature', false, 'SIGNATURE_VERIFICATION_FAILED', 'alg=none is rejected.');
    } else if (receipt.signature.kid && parsed.header.kid !== receipt.signature.kid) {
      pushCheck(checks, 'signature', false, 'SIGNATURE_VERIFICATION_FAILED', 'JWS kid mismatch.');
    } else if (publicKeyPem) {
      const verified = verifyCompactJwsEd25519(receipt.signature.value, publicKeyPem);
      if (verified.valid) {
        pushCheck(checks, 'signature', true, 'SIGNATURE_OK', 'Signature verified with public key.', 'low');
      } else {
        pushCheck(
          checks,
          'signature',
          false,
          'SIGNATURE_VERIFICATION_FAILED',
          'Signature verification failed with provided public key.'
        );
      }
    } else if (strictSignature) {
      pushCheck(
        checks,
        'signature',
        false,
        'SIGNATURE_VERIFICATION_FAILED',
        'No public key provided in strict mode.'
      );
    } else {
      warnings.push('Signature cryptographic verification skipped (no public key provided).');
      pushCheck(checks, 'signature', true, 'SIGNATURE_SKIPPED', 'Signature format validated (cryptographic verify skipped).', 'medium');
    }
  } catch (err) {
    pushCheck(checks, 'signature', false, 'SIGNATURE_VERIFICATION_FAILED', `Signature parse/verify failed: ${err.message}`);
  }

  const timestampOk =
    typeof receipt?.timestamp_proof?.token_b64 === 'string' &&
    receipt.timestamp_proof.token_b64.length >= 32 &&
    !Number.isNaN(Date.parse(receipt?.timestamp_proof?.gen_time));
  if (timestampOk) {
    pushCheck(checks, 'timestamp_proof', true, 'TIMESTAMP_OK', 'Timestamp proof basic validation passed.', 'low');
  } else {
    pushCheck(checks, 'timestamp_proof', false, 'TIMESTAMP_PROOF_INVALID', 'Timestamp proof validation failed.');
  }

  if (hasTransparencyShape(receipt?.transparency_proof)) {
    pushCheck(
      checks,
      'transparency_proof',
      true,
      'TRANSPARENCY_OK',
      'Transparency proof basic validation passed.',
      'low'
    );
  } else {
    pushCheck(
      checks,
      'transparency_proof',
      false,
      'TRANSPARENCY_PROOF_INVALID',
      'Transparency proof validation failed.'
    );
  }

  const failures = checks.filter((item) => !item.ok);
  return {
    correlation_id: randomUUID(),
    verification_result: failures.length === 0 ? 'PASS' : 'FAIL',
    failed_codes: failures.map((item) => item.code),
    warnings,
    checks,
  };
}
