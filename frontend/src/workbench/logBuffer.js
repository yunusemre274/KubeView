export const LOG_MAX_BYTES = 1024 * 1024;
export const LOG_MAX_LINE_BYTES = 16 * 1024;
export const LOG_MAX_LINES = 5000;
const encoder = new TextEncoder();
const bytes = (text) => encoder.encode(text).byteLength;
function tail(text, limit) {
  if (text.length * 3 <= limit)
    return { text, bytes: bytes(text), shortened: false };
  // At most limit UTF-16 units are inspected, even for a multi-megabyte line.
  let start = Math.max(0, text.length - limit);
  let value = text.slice(start),
    length = bytes(value);
  while (length > limit) {
    start += Math.max(1, Math.ceil((length - limit) / 3));
    value = text.slice(start);
    length = bytes(value);
  }
  if (
    start &&
    text.charCodeAt(start) >= 0xdc00 &&
    text.charCodeAt(start) <= 0xdfff
  ) {
    value = text.slice(++start);
    length = bytes(value);
  }
  return { text: value, bytes: length, shortened: start > 0 };
}

// Stream history AND the unfinished line are bounded, including long lines with
// no newline. Reading continues: these limits affect only the local log view.
export class LogBuffer {
  constructor() {
    this.lines = [];
    this.head = 0;
    this.discardedLines = 0;
    this.retainedBytes = 0;
    this.partial = "";
    this.partialBytes = 0;
    this.revision = 0;
    this.truncated = false;
  }
  prune() {
    while (
      this.lines.length - this.head + Number(Boolean(this.partial)) >
        LOG_MAX_LINES ||
      this.retainedBytes + this.partialBytes > LOG_MAX_BYTES
    ) {
      if (this.head >= this.lines.length) break;
      this.retainedBytes -= this.lines[this.head].bytes;
      this.lines[this.head++] = null;
      this.discardedLines++;
      this.truncated = true;
    }
    if (this.head > 1024) {
      this.lines = this.lines.slice(this.head);
      this.head = 0;
    }
  }
  append(chunk) {
    let start = 0,
      end;
    while ((end = chunk.indexOf("\n", start)) !== -1) {
      const line = tail(
        this.partial + chunk.slice(start, end),
        LOG_MAX_LINE_BYTES,
      );
      this.truncated ||= line.shortened;
      this.lines.push({ text: line.text, bytes: line.bytes + 1 });
      this.retainedBytes += line.bytes + 1;
      this.partial = "";
      this.partialBytes = 0;
      this.prune();
      start = end + 1;
    }
    if (start < chunk.length) {
      const partial = tail(
        this.partial + chunk.slice(start),
        LOG_MAX_LINE_BYTES,
      );
      this.partial = partial.text;
      this.partialBytes = partial.bytes;
      this.truncated ||= partial.shortened;
      this.prune();
    }
    this.revision++;
  }
  snapshot() {
    const lines = this.lines.slice(this.head).map((l) => l.text);
    if (this.partial) lines.push(this.partial);
    return {
      lines,
      truncated: this.truncated,
      bytes: this.retainedBytes + this.partialBytes,
      firstSequence: this.discardedLines,
    };
  }
}
