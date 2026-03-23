#!/usr/bin/env node
import { generateKeyPairSync } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

function getArg(name, fallback = '') {
  const index = process.argv.findIndex((arg) => arg === `--${name}`);
  if (index >= 0) {
    return process.argv[index + 1] || fallback;
  }
  const withEquals = process.argv.find((arg) => arg.startsWith(`--${name}=`));
  if (withEquals) {
    return withEquals.slice(name.length + 3);
  }
  return fallback;
}

async function main() {
  const privatePath = resolve(getArg('private', '.keys/ed25519-private.pem'));
  const publicPath = resolve(getArg('public', '.keys/ed25519-public.pem'));

  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  const privatePem = privateKey.export({ type: 'pkcs8', format: 'pem' });
  const publicPem = publicKey.export({ type: 'spki', format: 'pem' });

  await mkdir(dirname(privatePath), { recursive: true });
  await mkdir(dirname(publicPath), { recursive: true });
  await writeFile(privatePath, privatePem, { mode: 0o600 });
  await writeFile(publicPath, publicPem, { mode: 0o644 });

  const publicKeyB64 = Buffer.from(publicPem).toString('base64');

  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        private_key_path: privatePath,
        public_key_path: publicPath,
        rekor_public_key_pem_b64: publicKeyB64,
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err.message);
  process.exit(1);
});
