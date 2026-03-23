import { generateKeyPairSync, randomUUID } from 'node:crypto';

function nowIso() {
  return new Date().toISOString();
}

function generateEd25519Key(kidPrefix = 'ed25519') {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  const kid = `${kidPrefix}-${Date.now()}-${randomUUID().slice(0, 8)}`;
  const publicJwk = publicKey.export({ format: 'jwk' });
  return {
    kid,
    created_at: nowIso(),
    status: 'active',
    algorithm: 'EdDSA',
    private_key: privateKey,
    public_jwk: {
      ...publicJwk,
      kid,
      use: 'sig',
      alg: 'EdDSA',
    },
  };
}

class InMemoryKeyManager {
  constructor() {
    const initial = generateEd25519Key('initial');
    this.currentKid = initial.kid;
    this.keys = new Map([[initial.kid, initial]]);
  }

  getCurrent() {
    return this.keys.get(this.currentKid);
  }

  getJwks() {
    const keys = Array.from(this.keys.values())
      .filter((key) => key.status !== 'revoked')
      .map((key) => key.public_jwk);
    return {
      keys,
    };
  }

  rotate() {
    const current = this.getCurrent();
    if (current) {
      current.status = 'rotated';
      current.rotated_at = nowIso();
    }
    const next = generateEd25519Key('rot');
    this.currentKid = next.kid;
    this.keys.set(next.kid, next);
    return {
      previous_kid: current?.kid || null,
      current_kid: next.kid,
      rotated_at: nowIso(),
    };
  }

  revoke(kid) {
    const target = this.keys.get(kid);
    if (!target) {
      return {
        ok: false,
        reason: 'key_not_found',
      };
    }
    if (target.kid === this.currentKid) {
      return {
        ok: false,
        reason: 'cannot_revoke_current_key',
      };
    }
    target.status = 'revoked';
    target.revoked_at = nowIso();
    return {
      ok: true,
      kid,
      revoked_at: target.revoked_at,
    };
  }
}

export function createKeyManager() {
  return new InMemoryKeyManager();
}
