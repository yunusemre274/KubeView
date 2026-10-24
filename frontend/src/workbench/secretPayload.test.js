import test from "node:test";
import assert from "node:assert/strict";
import {
  secretMetadataOnly,
  secretSafeSubmission,
  validateRevealedSecret,
} from "./secretPayload.js";
const expected = {
  kind: "Secret",
  metadata: {
    uid: "secret-uid",
    name: "qa-content",
    namespace: "qa",
    resourceVersion: "opaque-rv",
  },
  keyNames: ["payload"],
};
const revealed = {
  kind: "Secret",
  apiVersion: "v1",
  metadata: {
    ...expected.metadata,
    annotations: { "last-applied": "private-source" },
  },
  data: { payload: "dummy-base64-value" },
  stringData: { human: "dummy-clear-value" },
};
test("authorized content is accepted only for the same Secret UID/address and a real RV", () => {
  assert.equal(validateRevealedSecret(expected, revealed), revealed);
  assert.throws(
    () => validateRevealedSecret(expected, expected),
    /maskelenmiş/,
  );
  assert.throws(
    () =>
      validateRevealedSecret(expected, {
        ...revealed,
        metadata: { ...revealed.metadata, uid: "new-uid" },
      }),
    /UID/,
  );
});
test("Secret draft values and annotations cannot escape through operation/result metadata", () => {
  const safe = secretSafeSubmission(
    { object: revealed, operation: { id: "operation" } },
    { action: "edit", object: revealed, resource: revealed },
  );
  for (const object of [
    safe.result.object,
    safe.meta.object,
    safe.meta.resource,
  ]) {
    assert.equal(object.data, undefined);
    assert.equal(object.stringData, undefined);
    assert.equal(object.metadata.annotations, undefined);
    assert.equal(object.metadata.uid, expected.metadata.uid);
    assert.equal(object.metadata.resourceVersion, "opaque-rv");
    assert.deepEqual(object.keyNames, ["human", "payload"]);
  }
  assert.equal(
    revealed.data.payload,
    "dummy-base64-value",
    "sanitization never mutates the local draft",
  );
  assert.equal(secretMetadataOnly({ kind: "Pod" }).kind, "Pod");
});
