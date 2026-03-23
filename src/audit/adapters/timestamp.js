import { randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

async function runOpenSsl(args, timeoutMs = 8000) {
  try {
    return await execFileAsync('openssl', args, { timeout: timeoutMs, maxBuffer: 10 * 1024 * 1024 });
  } catch (err) {
    const wrapped = new Error(`openssl_failed:${err.message}`);
    wrapped.stage = 'timestamp';
    throw wrapped;
  }
}

function hashFlagFromDigestAlg(alg) {
  if (alg === 'sha-512') return '-sha512';
  return '-sha256';
}

class MockTimestampAdapter {
  constructor({ tsaName = 'dev-rfc3161-tsa' } = {}) {
    this.tsaName = tsaName;
  }

  async issueTimestamp({ receiptId, generatedAt }) {
    return {
      tsa_name: this.tsaName,
      gen_time: generatedAt,
      token_b64: Buffer.from(`tsa:${receiptId}:${generatedAt}:${randomUUID()}`).toString('base64'),
    };
  }
}

class Rfc3161TimestampAdapter {
  constructor({ endpoint, timeoutMs = 10000, tsaName = 'rfc3161-tsa', caCertPath = '' } = {}) {
    this.endpoint = endpoint;
    this.timeoutMs = timeoutMs;
    this.tsaName = tsaName;
    this.caCertPath = caCertPath;
  }

  async issueTimestamp({ reportDigest, receiptId, generatedAt }) {
    if (!this.endpoint) {
      const err = new Error('missing_tsa_endpoint');
      err.stage = 'timestamp';
      throw err;
    }

    const tempDir = await mkdtemp(join(tmpdir(), 'agentbanking-tsa-'));
    const queryPath = join(tempDir, `${receiptId}.tsq`);
    const replyPath = join(tempDir, `${receiptId}.tsr`);
    const hashFlag = hashFlagFromDigestAlg(reportDigest.alg);

    try {
      await runOpenSsl(['ts', '-query', '-digest', reportDigest.value, hashFlag, '-cert', '-out', queryPath], this.timeoutMs);
      const query = await readFile(queryPath);

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/timestamp-query',
          Accept: 'application/timestamp-reply',
        },
        body: query,
        signal: AbortSignal.timeout(this.timeoutMs),
      });

      if (!response.ok) {
        const err = new Error(`tsa_http_${response.status}`);
        err.stage = 'timestamp';
        throw err;
      }

      const reply = Buffer.from(await response.arrayBuffer());
      await writeFile(replyPath, reply);

      if (this.caCertPath) {
        await runOpenSsl(
          ['ts', '-verify', '-queryfile', queryPath, '-in', replyPath, '-CAfile', this.caCertPath],
          this.timeoutMs
        );
      }

      let genTime = generatedAt;
      try {
        const { stdout } = await runOpenSsl(['ts', '-reply', '-in', replyPath, '-text'], this.timeoutMs);
        const line = stdout
          .split('\n')
          .map((item) => item.trim())
          .find((item) => item.startsWith('Time stamp:'));
        if (line) {
          const raw = line.replace('Time stamp:', '').trim();
          const normalized = new Date(raw);
          if (!Number.isNaN(normalized.getTime())) {
            genTime = normalized.toISOString();
          }
        }
      } catch {
        // keep generatedAt if reply text parse is unavailable
      }

      return {
        tsa_name: this.tsaName,
        gen_time: genTime,
        token_b64: reply.toString('base64'),
      };
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  }
}

export function createTimestampAdapter({ mode = 'mock', endpoint, timeoutMs, tsaName, caCertPath } = {}) {
  if (mode === 'rfc3161') {
    return new Rfc3161TimestampAdapter({ endpoint, timeoutMs, tsaName, caCertPath });
  }
  return new MockTimestampAdapter();
}
