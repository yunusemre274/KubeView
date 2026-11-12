// Harness-only camera contract. Historical source proof permits old38 only.
export const LEGACY_FOV38_RUN_SHA256 = '12f77e64ecc1ad69ef82f2fd0a00722513509521798eabee271d0efe8dd0cc75';
export function validatedCameraFov(value = 38) {
  if (!['string', 'number'].includes(typeof value) || String(value).trim() === '') throw Error('Invalid camera FOV');
  const fov = Number(value);
  if (!Number.isFinite(fov) || fov <= 0 || fov >= 180) throw Error('Invalid camera FOV');
  return fov;
}
export function reportCameraFov(report) {
  const m = report.manifest;
  if (m.cameraFovOverride === undefined) {
    if (m.cameraFovProtocol === 'legacy-fixed38' && m.cameraFovLegacySourceSHA256 === LEGACY_FOV38_RUN_SHA256) return 38;
    throw Error('Missing explicit camera FOV or proven legacy38 source');
  }
  if (m.cameraFovProtocol !== 'explicit-camera-fov-v1') throw Error('Unknown camera FOV protocol');
  const expected = validatedCameraFov(m.cameraFovOverride);
  for (const run of report.runs || []) {
    if (run.before?.camera?.fov !== expected || run.after?.camera?.fov !== expected) throw Error('Actual camera FOV differs from manifest');
  }
  return expected;
}
export function cameraComparisonReasons(before, after) {
  try { return reportCameraFov(before) === reportCameraFov(after) ? [] : ['manifest camera FOV differs']; }
  catch (error) { return [error.message]; }
}
