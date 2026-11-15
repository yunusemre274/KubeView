import { createHash } from 'node:crypto';
const sha = text => createHash('sha256').update(text).digest('hex');

// A release changes the root package version without changing installed
// dependencies. Ignore ONLY those two metadata fields, never dependency
// versions, integrity, resolution, platform or optional/peer declarations.
export function buildLockIdentity(raw) {
  const lock = JSON.parse(raw);
  delete lock.version;
  if (lock.packages?.['']) delete lock.packages[''].version;
  return { lockSHA256: sha(raw), dependencyGraphSHA256: sha(JSON.stringify(lock)) };
}
