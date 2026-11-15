// Versioned visual preferences. These fields never change Kubernetes state.
export const PREFERENCES_VERSION = 1;
export const PREFERENCES_STORAGE_KEY = "kubeview.preferences.v1";
export const DEFAULT_PREFERENCES = Object.freeze({
  version: PREFERENCES_VERSION,
  patrol: true,
  speed: "normal",
  bob: true,
  sea: true,
  seaStrength: "light",
  sunGlint: true,
  wake: true,
  operations: "full",
  motionPreference: "system",
  paused: false,
  quality: "auto",
  theme: "system",
  contrast: "normal",
});
const choices = {
  speed: ["slow", "normal", "fast"],
  seaStrength: ["calm", "light", "noticeable"],
  operations: ["full", "simple"],
  motionPreference: ["system", "reduced", "full"],
  quality: ["auto", "low", "medium", "high"],
  theme: ["system", "light", "dark"],
  contrast: ["normal", "high"],
};
const booleanKeys = ["patrol", "bob", "sea", "sunGlint", "wake", "paused"];
export function validatePreferences(value) {
  const validated = { ...DEFAULT_PREFERENCES };
  if (!value || typeof value !== "object" || Array.isArray(value))
    return validated;
  if (value.version !== undefined && value.version !== PREFERENCES_VERSION)
    return validated;
  for (const key of booleanKeys)
    if (typeof value[key] === "boolean") validated[key] = value[key];
  for (const [key, allowed] of Object.entries(choices))
    if (allowed.includes(value[key])) validated[key] = value[key];
  return validated;
}
function browserStorage(storage) {
  if (storage !== undefined) return storage;
  return typeof globalThis.localStorage === "undefined"
    ? null
    : globalThis.localStorage;
}
export function loadPreferences(storage) {
  try {
    const source = browserStorage(storage);
    if (!source) return { ...DEFAULT_PREFERENCES };
    const saved = source.getItem(PREFERENCES_STORAGE_KEY);
    if (saved !== null && saved !== undefined)
      return validatePreferences(JSON.parse(saved));
    // Preserve explicit choices from the previous UI; a fresh install follows the OS.
    return validatePreferences({
      theme: source.getItem("kubeview-theme"),
      quality: source.getItem("kubeview-quality"),
    });
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}
export function savePreferences(preferences, storage) {
  try {
    const target = browserStorage(storage);
    if (!target) return false;
    target.setItem(
      PREFERENCES_STORAGE_KEY,
      JSON.stringify(validatePreferences(preferences)),
    );
    return true;
  } catch {
    return false;
  }
}
export function resolvePreferences(preferences, environment = {}) {
  const value = validatePreferences(preferences);
  const reduced =
    value.motionPreference === "reduced" ||
    (value.motionPreference === "system" && environment.systemReduced === true);
  const stopped = reduced || value.paused;
  const availableThreads = Number(environment.hardwareConcurrency),
    availableMemory = Number(environment.deviceMemory),
    viewportWidth = Number(environment.viewportWidth);
  const constrained =
    (availableThreads > 0 && availableThreads <= 4) ||
    (availableMemory > 0 && availableMemory <= 4) ||
    (viewportWidth > 0 && viewportWidth < 768);
  const quality =
    value.quality === "auto" ? (constrained ? "low" : "medium") : value.quality;
  return {
    preferences: value,
    theme:
      value.theme === "system"
        ? environment.systemDark
          ? "dark"
          : "light"
        : value.theme,
    quality,
    contrast: value.contrast,
    motion: {
      patrol: value.patrol && !stopped,
      sea: value.sea && !stopped,
      // Reflection is a surface appearance, not an independent animation clock.
      // With sea/visual motion paused, its last/static surface remains lit.
      sunGlint: value.sunGlint,
      bob: value.bob && value.sea && !stopped,
      wake:
        value.wake &&
        value.patrol &&
        value.sea &&
        !stopped &&
        quality !== "low",
      speed: value.speed,
      speedMultiplier: { slow: 0.65, normal: 1, fast: 1.5 }[value.speed],
      seaStrength: value.seaStrength,
      seaAmplitude:
        stopped || !value.sea
          ? 0
          : { calm: 0.15, light: 0.45, noticeable: 1 }[value.seaStrength],
      operations: stopped || !value.patrol ? "simple" : value.operations,
      reduced,
      paused: value.paused,
    },
  };
}
