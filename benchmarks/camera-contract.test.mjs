import test from 'node:test';
import assert from 'node:assert/strict';
import { validatedCameraFov, reportCameraFov, cameraComparisonReasons, LEGACY_FOV38_RUN_SHA256 } from './camera-contract.mjs';
const report = (fov = 24) => ({ manifest: { cameraFovProtocol: 'explicit-camera-fov-v1', cameraFovOverride: fov }, runs: [{ before: { camera: { fov } }, after: { camera: { fov } } }] });
test('legacy runtime default38 and explicit24 remain distinct finite projections', () => {
  assert.equal(validatedCameraFov(), 38); assert.equal(validatedCameraFov('24'), 24);
  for (const v of [null, true, '', '24junk', NaN, Infinity, 0, -1, 180]) assert.throws(() => validatedCameraFov(v));
  const span = fov => 2 * 100 * Math.tan(fov * Math.PI / 360);
  assert.ok(span(24) < span(38));
});
test('new manifests require actual matching FOV and reject24vs38', () => {
  assert.deepEqual(cameraComparisonReasons(report(), report()), []);
  assert.equal(cameraComparisonReasons(report(24), report(38)).length, 1);
  for (const side of ['before', 'after']) { const bad = report(); bad.runs[0][side].camera.fov = 38; assert.throws(() => reportCameraFov(bad)); }
  assert.throws(() => reportCameraFov({ manifest: {}, runs: [] }));
  const missing = report(); delete missing.runs[0].before.camera.fov; assert.throws(() => reportCameraFov(missing));
});
test('only pinned historical38 source can resolve an omitted legacy field', () => {
  const old = { manifest: { cameraFovProtocol: 'legacy-fixed38', cameraFovLegacySourceSHA256: LEGACY_FOV38_RUN_SHA256 }, runs: [] };
  assert.equal(reportCameraFov(old), 38); assert.deepEqual(cameraComparisonReasons(old, report(38)), []);
  old.manifest.cameraFovLegacySourceSHA256 = 'unknown'; assert.throws(() => reportCameraFov(old));
});
