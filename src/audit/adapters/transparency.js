import { createHash } from 'node:crypto';

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
      throw err;
    }
    if (!this.publicKeyPemB64) {
      const err = new Error('missing_rekor_public_key');
      err.stage = 'transparency';
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

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    if (!response.ok) {
      const err = new Error(`rekor_http_${response.status}`);
      err.stage = 'transparency';
      throw err;
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

export function createTransparencyAdapter({ mode = 'mock', baseUrl, publicKeyPemB64, timeoutMs, logId } = {}) {
  if (mode === 'rekor') {
    return new RekorTransparencyLogAdapter({ baseUrl, publicKeyPemB64, timeoutMs, logId });
  }
  return new MockTransparencyLogAdapter();
}
