import test from "node:test";
import assert from "node:assert/strict";
import {
  LogBuffer,
  LOG_MAX_BYTES,
  LOG_MAX_LINE_BYTES,
  LOG_MAX_LINES,
} from "./logBuffer.js";
test("chunk boundaries preserve genuine lines and the unfinished tail", () => {
  const buffer = new LogBuffer();
  for (const chunk of ["one\ntw", "o\n\nüç", "\nlast"]) buffer.append(chunk);
  assert.deepEqual(buffer.snapshot().lines, ["one", "two", "", "üç", "last"]);
  assert.equal(buffer.snapshot().truncated, false);
});
test("very long newline-free UTF-8 logs and pending batches have byte bounds", () => {
  const buffer = new LogBuffer(),
    chunk = "🛳️liman".repeat(2000);
  for (let i = 0; i < 1000; i++) {
    buffer.append(chunk + (i % 2 ? "\n" : ""));
    assert.ok(buffer.retainedBytes + buffer.partialBytes <= LOG_MAX_BYTES);
    assert.ok(buffer.partialBytes <= LOG_MAX_LINE_BYTES);
  }
  const view = buffer.snapshot();
  assert.ok(
    new TextEncoder().encode(view.lines.join("\n")).length <= LOG_MAX_BYTES,
  );
  assert.ok(view.truncated);
  assert.ok(view.lines.length <= LOG_MAX_LINES);
  for (const line of view.lines)
    assert.ok(new TextEncoder().encode(line).length <= LOG_MAX_LINE_BYTES);
  assert.ok(!view.lines.some((line) => line.includes("\ufffd")));
});
test("line-count bound includes empty lines and clear instances do not retain history", () => {
  const buffer = new LogBuffer();
  buffer.append("\n".repeat(20000));
  assert.equal(buffer.snapshot().lines.length, LOG_MAX_LINES);
  assert.ok(buffer.snapshot().truncated);
  assert.deepEqual(new LogBuffer().snapshot(), {
    lines: [],
    truncated: false,
    bytes: 0,
    firstSequence: 0,
  });
});
