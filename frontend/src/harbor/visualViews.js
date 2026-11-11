// Visual state only: eviction releases presentation state, never Kubernetes
// resources. Entries retain their fleet/slot objects while they are cached.
export const MAX_VISUAL_VIEWS = 64;

/** Cache the latest source generation for a harbor and touch its LRU position.
 * Active/nearby keys are protected from normal eviction. A stale source for the
 * same harbor is invalid even if the caller still lists that old key as pinned.
 * In the defensive all-64-pinned case, a new entry is not retained (null); the
 * caller still owns its live value and no existing pinned view is discarded.
 */
export function cacheVisualView(views, sourceKey, value, harborId, protectedKeys = []) {
  for (const [key, entry] of views) {
    if (key !== sourceKey && entry.harborId === harborId) views.delete(key);
  }
  const entry = { ...value, harborId };
  views.delete(sourceKey);
  views.set(sourceKey, entry);
  const protectedSet = new Set(protectedKeys);
  while (views.size > MAX_VISUAL_VIEWS) {
    let oldest;
    for (const key of views.keys()) {
      if (!protectedSet.has(key)) { oldest = key; break; }
    }
    if (oldest === undefined) {
      views.delete(sourceKey);
      return null;
    }
    views.delete(oldest);
  }
  return views.get(sourceKey) || null;
}

/** Drop records for removed harbors, including obsolete unowned entries. */
export function pruneVisualViews(views, validHarborIds) {
  const valid = new Set(validHarborIds);
  for (const [key, entry] of views) {
    if (!valid.has(entry.harborId)) views.delete(key);
  }
  return views;
}
