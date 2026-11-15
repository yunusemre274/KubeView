import test from "node:test";
import assert from "node:assert/strict";
import { requiresResourceDraftLoad } from "./formLoading.js";

const resource = { kind: "Deployment", metadata: { uid: "workload" } };
const api = { request() {}, resourcePath() {} };
const requiresLoad = (options = {}) =>
  requiresResourceDraftLoad({
    action: "resources",
    resource,
    api,
    readOnly: false,
    ...options,
  });

test("edit, template resources and Pod resize lock the first render before the fresh GET", () => {
  for (const action of ["edit", "resources", "resize"])
    assert.equal(requiresLoad({ action }), true);
  for (const action of ["create", "scale", "restart", "delete", "drain"])
    assert.equal(requiresLoad({ action }), false);
});
test("readonly, absent API/resource and unsupported Secret paths never wait for a GET that will not run", () => {
  for (const options of [
    { readOnly: true },
    { api: undefined },
    { api: {} },
    { api: { request() {} } },
    { resource: undefined },
    { resource: [] },
    { resource: { kind: "Secret" } },
  ])
    assert.equal(requiresLoad(options), false);
});
test("purposeful Secret edit waits for reveal and does not require a generic resource path", () => {
  const secret = { kind: "Secret", metadata: { uid: "secret" } };
  assert.equal(
    requiresLoad({
      action: "edit",
      resource: secret,
      secretEdit: true,
      api: { request() {} },
    }),
    true,
  );
  assert.equal(
    requiresLoad({ action: "resources", resource: secret, secretEdit: true }),
    false,
  );
  assert.equal(
    requiresLoad({
      action: "edit",
      resource: secret,
      secretEdit: true,
      readOnly: true,
    }),
    false,
  );
});
