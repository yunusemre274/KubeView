import test from "node:test";
import assert from "node:assert/strict";
import {
  LogStreamDecoder,
  verifyLogOpening,
  LOG_PROTOCOL,
  MAX_LOG_GUARD_CHARS,
} from "./logProtocol.js";
import {
  LogBuffer,
  LOG_MAX_BYTES,
  LOG_MAX_LINES,
  LOG_MAX_LINE_BYTES,
} from "./logBuffer.js";
const session = "a-real-caller-session";
const marker = (s = session) =>
  `\n\x1eKUBEVIEW_LOG_ERROR:${s}:${JSON.stringify({ error: "Pod UID changed", code: "UID_CHANGED" })}\n`;
test("opening requires expected UID, caller session and explicit guarded protocol", () => {
  const headers = new Headers({
    "X-KubeView-Pod-UID": "old-uid",
    "X-KubeView-Log-Session": session,
    "X-KubeView-Log-Protocol": LOG_PROTOCOL,
  });
  assert.doesNotThrow(() => verifyLogOpening(headers, "old-uid", session));
  assert.throws(
    () => verifyLogOpening(headers, "replacement-uid", session),
    /UID/,
  );
  assert.throws(
    () => verifyLogOpening(headers, "old-uid", "new-session"),
    /oturumu/,
  );
  headers.delete("X-KubeView-Log-Protocol");
  assert.throws(() => verifyLogOpening(headers, "old-uid", session), /oturumu/);
});
test("guard split at every character emits old normal text and one explicit failure, never control marker", () => {
  const value = "old container output\nsecond line" + marker();
  for (let split = 0; split <= value.length; split++) {
    const parser = new LogStreamDecoder(session);
    const a = parser.push(value.slice(0, split)),
      b = parser.push(value.slice(split), true);
    assert.equal(a.text + b.text, "old container output\nsecond line");
    assert.equal(a.error || b.error, "Pod UID changed");
    assert.equal(parser.pending, "");
    assert.deepEqual(parser.push("replacement container output"), {
      text: "",
      error: null,
    });
  }
});
test("guard may arrive in single-byte chunks; a different session marker remains ordinary log text", () => {
  const parser = new LogStreamDecoder(session);
  let text = "",
    error;
  for (const char of "normal" + marker()) {
    const p = parser.push(char);
    text += p.text;
    error ||= p.error;
  }
  assert.equal(text, "normal");
  assert.equal(error, "Pod UID changed");
  const other = new LogStreamDecoder(session),
    value = "application text" + marker("other-session");
  const a = other.push(value),
    b = other.push("", true);
  assert.equal(a.text + b.text, value);
  assert.equal(a.error || b.error, null);
});
test("malformed, truncated and oversized guard details fail closed with bounded retained tail", () => {
  for (const tail of [
    "{bad}\n",
    '{"error":"unfinished"',
    "x".repeat(MAX_LOG_GUARD_CHARS + 1),
  ]) {
    const parser = new LogStreamDecoder(session);
    const r = parser.push(parser.prefix + tail, true);
    assert.ok(r.error);
    assert.equal(parser.pending.length, 0);
    assert.equal(parser.ended, true);
  }
  const normal = new LogStreamDecoder(session);
  normal.push("z".repeat(1024 * 1024));
  assert.ok(normal.pending.length < normal.prefix.length);
});
test("normal UTF-8 text and partial prefix do not change bounded log history/line behavior", () => {
  const parser = new LogStreamDecoder(session),
    history = new LogBuffer();
  for (let i = 0; i < 6000; i++) {
    const r = parser.push("Türkçe çizgi " + i + "\n");
    assert.equal(r.error, null);
    if (r.text) history.append(r.text);
  }
  const huge = parser.push("x".repeat(LOG_MAX_LINE_BYTES * 8));
  history.append(huge.text);
  const last = parser.push("\n", true);
  history.append(last.text);
  const s = history.snapshot();
  assert.ok(s.lines.length <= LOG_MAX_LINES);
  assert.ok(s.bytes <= LOG_MAX_BYTES);
  assert.ok(s.truncated);
  assert.ok(
    s.lines.every(
      (line) => new TextEncoder().encode(line).byteLength <= LOG_MAX_LINE_BYTES,
    ),
  );
  const tail = new LogStreamDecoder(session);
  const a = tail.push("a\n\x1eKUB"),
    b = tail.push("", true);
  assert.equal(a.text + b.text, "a\n\x1eKUB");
});
