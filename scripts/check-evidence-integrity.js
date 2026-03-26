import { access, readFile, stat } from 'node:fs/promises';
import { constants } from 'node:fs';
import { join } from 'node:path';

const DEFAULT_MANIFEST = 'docs/program/launch-evidence-manifest-2026-03-26.json';
const MAX_STALE_DAYS = 7;

function getManifestArg() {
  const arg = process.argv.find((v) => v.startsWith('--manifest='));
  if (!arg) return DEFAULT_MANIFEST;
  return arg.split('=')[1];
}

function parseDate(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function daysBetween(a, b) {
  const ms = Math.abs(a.getTime() - b.getTime());
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

async function fileExists(path) {
  try {
    await access(path, constants.F_OK | constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const manifestRelPath = getManifestArg();
  const manifestPath = join(process.cwd(), manifestRelPath);
  const today = new Date();
  const errors = [];

  if (!(await fileExists(manifestPath))) {
    // eslint-disable-next-line no-console
    console.error(`FAIL: evidence manifest missing -> ${manifestRelPath}`);
    process.exit(1);
  }

  let manifest;
  try {
    manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`FAIL: invalid JSON manifest (${manifestRelPath}): ${err.message}`);
    process.exit(1);
  }

  if (!Array.isArray(manifest.artifacts) || manifest.artifacts.length === 0) {
    errors.push('manifest.artifacts is missing or empty');
  }

  const seenIds = new Set();
  const seenPaths = new Set();
  for (const item of manifest.artifacts || []) {
    if (!item || typeof item !== 'object') {
      errors.push('artifact item is not an object');
      continue;
    }

    const { id, path, owner_lane: ownerLane, freshness_date: freshnessDate } = item;

    if (typeof id !== 'string' || id.trim() === '') {
      errors.push('artifact.id is required');
    } else if (seenIds.has(id)) {
      errors.push(`duplicate artifact.id detected: ${id}`);
    } else {
      seenIds.add(id);
    }

    if (typeof path !== 'string' || path.trim() === '') {
      errors.push(`artifact.path is required (${id || 'unknown'})`);
    } else if (seenPaths.has(path)) {
      errors.push(`duplicate artifact.path detected: ${path}`);
    } else {
      seenPaths.add(path);
      const fullPath = join(process.cwd(), path);
      if (!(await fileExists(fullPath))) {
        errors.push(`missing artifact file: ${path}`);
      } else {
        const fileStat = await stat(fullPath);
        if (fileStat.size === 0) {
          errors.push(`empty artifact file: ${path}`);
        }
      }
    }

    if (typeof ownerLane !== 'string' || ownerLane.trim() === '') {
      errors.push(`artifact.owner_lane is required (${id || 'unknown'})`);
    }

    const parsedFreshness = parseDate(freshnessDate);
    if (!parsedFreshness) {
      errors.push(`invalid freshness_date: ${id || 'unknown'}`);
    } else {
      const staleDays = daysBetween(parsedFreshness, today);
      if (staleDays > MAX_STALE_DAYS) {
        errors.push(`stale artifact (> ${MAX_STALE_DAYS} days): ${id}`);
      }
    }
  }

  if (errors.length > 0) {
    // eslint-disable-next-line no-console
    console.error(`FAIL: evidence integrity check failed (${manifestRelPath})`);
    for (const err of errors) {
      // eslint-disable-next-line no-console
      console.error(`- ${err}`);
    }
    process.exit(1);
  }

  // eslint-disable-next-line no-console
  console.log(`PASS: evidence integrity check passed (${manifestRelPath}).`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('FAIL:', err.message);
  process.exit(1);
});
