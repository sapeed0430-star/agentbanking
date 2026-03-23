const INTEGRITY_REASON_MAPPING = {
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

class VerifierEngine {
  evaluate({ request, evidenceRecord, observedAt }) {
    const forcedReason = typeof request.integrity_failure_reason === 'string'
      ? request.integrity_failure_reason
      : null;

    if (forcedReason && INTEGRITY_REASON_MAPPING[forcedReason]) {
      const mapped = INTEGRITY_REASON_MAPPING[forcedReason];
      return {
        verification_result: 'fail',
        findings: [
          {
            code: mapped.code,
            severity: mapped.severity,
            message: mapped.message,
          },
        ],
        integrity_failure: {
          ...mapped,
          reason_code: forcedReason,
          observed_at: observedAt,
        },
      };
    }

    const findings = [];
    if (typeof request.policy_version === 'string' && request.policy_version.toLowerCase().includes('draft')) {
      findings.push({
        code: 'POLICY_DRAFT_VERSION',
        severity: 'medium',
        message: 'Policy version is marked as draft; verify release readiness.',
      });
    }

    if (evidenceRecord.evidence_count >= 5) {
      findings.push({
        code: 'EVIDENCE_VOLUME_HIGH',
        severity: 'low',
        message: 'Evidence volume is high; review ingestion/storage budget.',
      });
    }

    return {
      verification_result: findings.length > 0 ? 'warning' : 'pass',
      findings,
      integrity_failure: null,
    };
  }
}

export function createVerifierEngine() {
  return new VerifierEngine();
}
