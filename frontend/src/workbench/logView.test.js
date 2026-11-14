import test from "node:test";
import assert from "node:assert/strict";
import { buildLogView, LOG_CHUNK_LINES } from "./logView.js";
import { LogBuffer, LOG_MAX_LINES } from "./logBuffer.js";
test("chunk text exactly preserves Unicode, blank lines and Turkish filtering", () => {
  const lines = Array.from({ length: 97 }, (_, i) =>
    i % 7 ? "İş yükü " + i : "",
  );
  for (const search of ["", "iş", "YÜKÜ", "not found"]) {
    const view = buildLogView(lines, 19, search);
    const expected = lines.filter((line) =>
      line
        .toLocaleLowerCase("tr-TR")
        .includes(search.toLocaleLowerCase("tr-TR")),
    );
    assert.deepEqual(view.visible, expected);
    assert.equal(view.text, expected.join("\n"));
    assert.equal(view.chunks.map((c) => c.text).join(""), view.text);
  }
});
test("only head and tail chunks change when two rows roll out of a full history", () => {
  const lines = Array.from({ length: 5000 }, (_, i) => "real line " + i);
  const before = buildLogView(lines),
    after = buildLogView(
      [...lines.slice(2), "real line 5000", "real line 5001"],
      2,
    );
  const old = new Map(before.chunks.map((c) => [c.key, c.text]));
  assert.ok(after.chunks.filter((c) => old.get(c.key) !== c.text).length <= 2);
  assert.ok(
    after.chunks.length <= Math.ceil(LOG_MAX_LINES / LOG_CHUNK_LINES) + 1,
  );
});
test("identical content reuses the rendered view despite advancing ordinals", () => {
  const lines = Array(63).fill("x".repeat(16384));
  const before = buildLogView(lines);
  assert.equal(buildLogView([...lines], 300, "", before), before);
});
test("line sequence survives physical compaction, byte pruning and partial completion", () => {
  const b = new LogBuffer();
  b.append(Array.from({ length: 7100 }, (_, i) => i + "\n").join(""));
  assert.equal(b.snapshot().firstSequence, 2100);
  assert.equal(b.snapshot().lines[0], "2100");
  const partial = new LogBuffer();
  partial.append("one\npar");
  partial.append("tial\n");
  assert.equal(partial.snapshot().firstSequence, 0);
  assert.deepEqual(partial.snapshot().lines, ["one", "partial"]);
  const bytes = new LogBuffer();
  bytes.append(("x".repeat(16384) + "\n").repeat(100));
  assert.equal(
    bytes.snapshot().firstSequence,
    100 - bytes.snapshot().lines.length,
  );
});
