import { createHash } from 'node:crypto';

const HASH_ALGORITHMS = {
  'sha-256': 'sha256',
  'sha-512': 'sha512',
};

function stableSortValue(value) {
  if (Array.isArray(value)) {
    return value.map(stableSortValue);
  }
  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        acc[key] = stableSortValue(value[key]);
        return acc;
      }, {});
  }
  return value;
}

export function canonicalizeJson(value) {
  return JSON.stringify(stableSortValue(value));
}

export function digestCanonicalJson(value, alg = 'sha-256') {
  const hashAlg = HASH_ALGORITHMS[alg];
  if (!hashAlg) {
    throw new Error(`unsupported_digest_alg:${alg}`);
  }
  const canonical = canonicalizeJson(value);
  return createHash(hashAlg).update(canonical).digest('hex');
}
