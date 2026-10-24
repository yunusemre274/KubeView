import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_PREFERENCES,
  PREFERENCES_STORAGE_KEY,
  validatePreferences,
  loadPreferences,
  savePreferences,
  resolvePreferences,
} from "../src/world/preferences.js";
const memoryStorage = (initial) => {
  const values = new Map(Object.entries(initial || {}));
  return {
    getItem: (key) => (values.has(key) ? values.get(key) : null),
    setItem: (key, value) => values.set(key, value),
  };
};
test("visual preferences have explicit defaults and reject unknown keys, types and future versions", () => {
  const prefs = validatePreferences({
    patrol: false,
    speed: "fast",
    theme: "dark",
    quality: "high",
    contrast: "high",
    paused: "true",
    bob: 1,
    seaStrength: "storm",
    prototype: "unsafe",
    cluster: "unrelated",
  });
  assert.equal(prefs.patrol, false);
  assert.equal(prefs.speed, "fast");
  assert.equal(prefs.theme, "dark");
  assert.equal(prefs.quality, "high");
  assert.equal(prefs.paused, false);
  assert.equal(prefs.bob, true);
  assert.equal(prefs.seaStrength, "light");
  assert.equal(prefs.cluster, undefined);
  assert.equal(prefs.prototype, undefined);
  assert.deepEqual(
    validatePreferences({ version: 900, patrol: false }),
    DEFAULT_PREFERENCES,
  );
  assert.deepEqual(validatePreferences([]), DEFAULT_PREFERENCES);
});
test("storage round trip is versioned; malformed/unavailable storage never breaks startup", () => {
  const storage = memoryStorage();
  assert.equal(
    savePreferences(
      { ...DEFAULT_PREFERENCES, paused: true, speed: "slow" },
      storage,
    ),
    true,
  );
  const loaded = loadPreferences(storage);
  assert.equal(loaded.version, 1);
  assert.equal(loaded.paused, true);
  assert.equal(loaded.speed, "slow");
  assert.deepEqual(
    loadPreferences(memoryStorage({ [PREFERENCES_STORAGE_KEY]: "{broken" })),
    DEFAULT_PREFERENCES,
  );
  assert.deepEqual(
    loadPreferences({
      getItem() {
        throw new Error("SecurityError");
      },
    }),
    DEFAULT_PREFERENCES,
  );
  assert.equal(
    savePreferences(DEFAULT_PREFERENCES, {
      setItem() {
        throw new Error("QuotaExceeded");
      },
    }),
    false,
  );
  assert.equal(savePreferences(DEFAULT_PREFERENCES, null), false);
  assert.deepEqual(loadPreferences(null), DEFAULT_PREFERENCES);
});
test("legacy explicit theme and quality migrate while new installs follow system defaults", () => {
  assert.equal(loadPreferences(memoryStorage()).theme, "system");
  const loaded = loadPreferences(
    memoryStorage({ "kubeview-theme": "dark", "kubeview-quality": "low" }),
  );
  assert.equal(loaded.theme, "dark");
  assert.equal(loaded.quality, "low");
  assert.equal(loaded.patrol, true);
});
test("OS reduced motion and visual pause disable decoration without overwriting saved choices", () => {
  const original = {
    ...DEFAULT_PREFERENCES,
    patrol: true,
    sea: true,
    speed: "fast",
  };
  const effective = resolvePreferences(original, {
    systemReduced: true,
    systemDark: true,
    hardwareConcurrency: 8,
    viewportWidth: 1440,
  });
  assert.equal(effective.theme, "dark");
  assert.equal(effective.quality, "medium");
  assert.equal(effective.motion.reduced, true);
  assert.equal(effective.motion.patrol, false);
  assert.equal(effective.motion.sea, false);
  assert.equal(effective.motion.bob, false);
  assert.equal(effective.motion.wake, false);
  assert.equal(effective.motion.operations, "simple");
  assert.equal(original.patrol, true);
  assert.equal(original.sea, true);
  assert.equal(
    resolvePreferences(
      { ...original, motionPreference: "full" },
      { systemReduced: true },
    ).motion.patrol,
    true,
  );
  const paused = resolvePreferences({ ...original, paused: true });
  assert.equal(paused.motion.paused, true);
  assert.equal(paused.motion.patrol, false);
  assert.equal(paused.preferences.speed, "fast");
});
test("auto quality responds only to hardware/viewport budget; explicit quality remains authoritative", () => {
  assert.equal(
    resolvePreferences(DEFAULT_PREFERENCES, {
      hardwareConcurrency: 2,
      viewportWidth: 1440,
    }).quality,
    "low",
  );
  assert.equal(
    resolvePreferences(DEFAULT_PREFERENCES, { viewportWidth: 390 }).quality,
    "low",
  );
  assert.equal(
    resolvePreferences(DEFAULT_PREFERENCES, { deviceMemory: 2 }).quality,
    "low",
  );
  assert.equal(
    resolvePreferences(
      { ...DEFAULT_PREFERENCES, quality: "high" },
      { hardwareConcurrency: 2 },
    ).quality,
    "high",
  );
  const p = resolvePreferences({
    ...DEFAULT_PREFERENCES,
    patrol: false,
    sea: false,
  });
  assert.equal(p.motion.wake, false);
  assert.equal(p.motion.seaAmplitude, 0);
  assert.equal(p.preferences.wake, true);
});

test("sea-off, low quality and patrol-off simplify only effective motion", () => {
  const dry = resolvePreferences({ ...DEFAULT_PREFERENCES, sea: false });
  assert.equal(dry.motion.bob, false);
  assert.equal(dry.motion.wake, false);
  assert.equal(dry.preferences.bob, true);
  const low = resolvePreferences({ ...DEFAULT_PREFERENCES, quality: "low" });
  assert.equal(low.motion.wake, false);
  assert.equal(low.preferences.wake, true);
  const stopped = resolvePreferences({
    ...DEFAULT_PREFERENCES,
    paused: true,
    operations: "full",
  });
  assert.equal(stopped.motion.operations, "simple");
  assert.equal(stopped.preferences.operations, "full");
  const docked = resolvePreferences({ ...DEFAULT_PREFERENCES, patrol: false });
  assert.equal(docked.motion.operations, "simple");
  assert.equal(docked.preferences.operations, "full");
});

test("actual light/dark/high-contrast CSS tokens meet text, boundary and focus contrast targets", async () => {
  const { readFile } = await import("node:fs/promises");
  const css = await readFile(
    new URL("../src/index.css", import.meta.url),
    "utf8",
  );
  const luminance = (hex) => {
    const channels = [1, 3, 5]
      .map((index) => parseInt(hex.slice(index, index + 2), 16) / 255)
      .map((value) =>
        value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
      );
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  };
  const contrast = (a, b) =>
    (Math.max(luminance(a), luminance(b)) + 0.05) /
    (Math.min(luminance(a), luminance(b)) + 0.05);
  const blocks = [
    ...css.matchAll(/\/\* NEUMORPHISM:([A-Z-]+) \*\/\s*[^\{]+\{([^}]+)/g),
  ];
  assert.equal(blocks.length, 4);
  for (const [, name, block] of blocks) {
    const colors = Object.fromEntries(
      [...block.matchAll(/(--nm-[a-z-]+):\s*(#[a-fA-F0-9]{6})\s*;/g)].map(
        (match) => [match[1], match[2]],
      ),
    );
    const base = colors["--nm-base"];
    assert.ok(
      contrast(colors["--nm-text"], base) >= 4.5,
      `${name} primary text AA`,
    );
    assert.ok(
      contrast(colors["--nm-muted"], base) >= 4.5,
      `${name} helper text AA`,
    );
    assert.ok(
      contrast(colors["--nm-boundary"], base) >= 3,
      `${name} explicit boundary`,
    );
    assert.ok(
      contrast(colors["--nm-focus"], base) >= 4.5,
      `${name} focus ring`,
    );
    if (colors["--nm-action"])
      assert.ok(
        contrast(colors["--nm-action"], colors["--nm-action-text"]) >= 4.5,
        `${name} action text AA`,
      );
  }
});
