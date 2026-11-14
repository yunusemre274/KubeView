export const LOG_CHUNK_LINES = 32;

// Stable stream ordinals keep unchanged text nodes intact as the bounded head
// advances. This changes only presentation; all retained lines remain available.
export function buildLogView(lines, firstSequence = 0, search = "", previous) {
  const needle = search.toLocaleLowerCase("tr-TR");
  const visible = [],
    groups = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (needle && !line.toLocaleLowerCase("tr-TR").includes(needle)) continue;
    visible.push(line);
    const key = Math.floor((firstSequence + i) / LOG_CHUNK_LINES);
    let group = groups.at(-1);
    if (!group || group.key !== key) {
      group = { key, lines: [] };
      groups.push(group);
    }
    group.lines.push(line);
  }
  const text = visible.join("\n");
  // Repeated identical lines need no DOM work even when their ordinals advance.
  if (previous?.text === text && previous.visible.length === visible.length)
    return previous;
  return {
    visible,
    text,
    chunks: groups.map((group, i) => ({
      key: group.key,
      text: group.lines.join("\n") + (i < groups.length - 1 ? "\n" : ""),
    })),
  };
}
