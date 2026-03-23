function addYearsIso(nowIso, years) {
  const next = new Date(nowIso);
  next.setUTCFullYear(next.getUTCFullYear() + years);
  return next.toISOString();
}

class ReceiptIssuer {
  constructor({ retentionYears = 6 } = {}) {
    this.retentionYears = retentionYears;
  }

  buildAuditReport({ reportId, request, issuedAt, verification, evidenceRecord }) {
    const summary =
      verification.verification_result === 'pass'
        ? 'Verification passed with deterministic checks.'
        : verification.verification_result === 'warning'
          ? 'Verification completed with warnings.'
          : 'Verification failed due to integrity findings.';

    return {
      report_id: reportId,
      summary,
      findings: verification.findings,
      request_context: {
        request_id: request.request_id,
        agent_id: request.agent_id,
        operator_id: request.operator_id,
        policy_version: request.policy_version,
        issued_at: issuedAt,
      },
      evidence_store: {
        record_id: evidenceRecord.record_id,
        request_id: evidenceRecord.request_id,
        evidence_count: evidenceRecord.evidence_count,
        request_payload_digest: evidenceRecord.request_payload_digest,
      },
    };
  }

  buildReceipt({
    receiptId,
    reportId,
    request,
    baseUrl,
    issuedAt,
    reportDigest,
    verificationResult,
    signature,
    timestampProof,
    transparencyProof,
    evidenceRefs,
  }) {
    return {
      receipt_id: receiptId,
      report_id: reportId,
      request_id: request.request_id,
      agent_id: request.agent_id,
      operator_id: request.operator_id,
      schema_version: '1.0.0',
      issued_at: issuedAt,
      verification_result: verificationResult,
      policy_version: request.policy_version,
      report_digest: reportDigest,
      signature,
      timestamp_proof: timestampProof,
      transparency_proof: transparencyProof,
      evidence_refs: evidenceRefs,
      retention_until: addYearsIso(issuedAt, this.retentionYears),
      verification_endpoint: `${baseUrl}/receipts/${receiptId}/verify`,
      links: {
        verify_url: `${baseUrl}/receipts/${receiptId}/verify`,
        report_url: `${baseUrl}/reports/${reportId}`,
      },
    };
  }
}

export function createReceiptIssuer({ retentionYears } = {}) {
  return new ReceiptIssuer({ retentionYears });
}
