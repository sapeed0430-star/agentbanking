import { randomUUID } from 'node:crypto';

class CertificateIssuer {
  buildCertificate({ receipt, auditReport, issuedAt, issuerDid = 'did:web:agentbanking.dev' }) {
    return {
      certificate_id: `cert_${randomUUID()}`,
      type: ['VerifiableCredential', 'AuditReceiptCredential'],
      issuer: issuerDid,
      issuanceDate: issuedAt,
      credentialSubject: {
        receipt_id: receipt.receipt_id,
        report_id: receipt.report_id,
        request_id: receipt.request_id,
        agent_id: receipt.agent_id,
        operator_id: receipt.operator_id,
        verification_result: receipt.verification_result,
        report_digest: receipt.report_digest,
        timestamp_proof: receipt.timestamp_proof,
        transparency_proof: receipt.transparency_proof,
        findings_count: Array.isArray(auditReport.findings) ? auditReport.findings.length : 0,
      },
      proof: {
        type: 'DataIntegrityProof',
        created: issuedAt,
        cryptosuite: 'eddsa-jcs-2022',
        verificationMethod: `${issuerDid}#${receipt.signature.kid}`,
        jws: receipt.signature.value,
      },
    };
  }
}

export function createCertificateIssuer() {
  return new CertificateIssuer();
}
