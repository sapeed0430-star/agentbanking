import { randomUUID } from 'node:crypto';

function cloneEvidenceRefs(evidenceRefs) {
  return evidenceRefs.map((ref, index) => ({
    evidence_id: `ev_${index + 1}_${randomUUID().slice(0, 8)}`,
    kind: ref.kind,
    uri: ref.uri,
    digest: ref.digest,
  }));
}

class InMemoryEvidenceStore {
  constructor() {
    this.requestRecords = new Map();
  }

  recordRequestEvidence({
    requestId,
    agentId,
    operatorId,
    policyVersion,
    payloadDigest,
    evidenceRefs,
    receivedAt,
  }) {
    const record = {
      record_id: `evr_${randomUUID()}`,
      request_id: requestId,
      agent_id: agentId,
      operator_id: operatorId,
      policy_version: policyVersion,
      received_at: receivedAt,
      request_payload_digest: payloadDigest,
      evidence_count: evidenceRefs.length,
      evidence_refs: cloneEvidenceRefs(evidenceRefs),
    };
    this.requestRecords.set(requestId, record);
    return record;
  }

  getByRequestId(requestId) {
    return this.requestRecords.get(requestId) || null;
  }
}

export function createEvidenceStore() {
  return new InMemoryEvidenceStore();
}
