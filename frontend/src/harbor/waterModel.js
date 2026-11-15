// One deterministic sea model drives both GPU displacement and vessel pose.
// Y is up, ship bow is local +Z. Units are metres, seconds and radians.
export const WATER_WAVES = Object.freeze([
  Object.freeze({
    amplitude: 0.13,
    kx: 0.067,
    kz: 0.029,
    omega: 0.39,
    phase: 0.2,
  }),
  Object.freeze({
    amplitude: 0.065,
    kx: -0.034,
    kz: 0.058,
    omega: 0.31,
    phase: 1.6,
  }),
  Object.freeze({
    amplitude: 0.035,
    kx: 0.091,
    kz: -0.052,
    omega: 0.53,
    phase: -0.7,
  }),
]);
export const WATER_MAX_HEIGHT = WATER_WAVES.reduce(
  (sum, wave) => sum + wave.amplitude,
  0,
);
export const WATER_MAX_SLOPE_X = WATER_WAVES.reduce(
  (sum, wave) => sum + wave.amplitude * Math.abs(wave.kx),
  0,
);
export const WATER_MAX_SLOPE_Z = WATER_WAVES.reduce(
  (sum, wave) => sum + wave.amplitude * Math.abs(wave.kz),
  0,
);
export const WATER_SETTLE_EPSILON = 0.0005;
export const WATER_SETTLE_SECONDS = 0.18;
const finite = (value, fallback = 0) =>
  Number.isFinite(value) ? value : fallback;
export const clampSeaStrength = (value) =>
  Math.max(0, Math.min(1, finite(value)));

/** Relative displacement from sea level; gradients are in world X/Z axes.
 * For a yaw-zero ship rotate X by pitch and Z by roll. For other headings,
 * transform dx/dz into ship-local axes before deriving its pitch and roll.
 * An optional destination object avoids allocations in the render loop.
 */
export function sampleWater(time, x, z, strength = 1, destination = {}) {
  strength = clampSeaStrength(strength);
  let height = 0,
    dx = 0,
    dz = 0;
  if (strength > 0) {
    time = finite(time);
    x = finite(x);
    z = finite(z);
    for (const wave of WATER_WAVES) {
      const phase = wave.kx * x + wave.kz * z - wave.omega * time + wave.phase;
      const derivative = strength * wave.amplitude * Math.cos(phase);
      height += strength * wave.amplitude * Math.sin(phase);
      dx += derivative * wave.kx;
      dz += derivative * wave.kz;
    }
  }
  destination.height = height;
  destination.dx = dx;
  destination.dz = dz;
  destination.pitch = dz === 0 ? 0 : -Math.atan(dz);
  destination.roll = dx === 0 ? 0 : Math.atan(dx);
  return destination;
}

export function createWaterState(initialStrength = 0.45) {
  return { time: 0, strength: clampSeaStrength(initialStrength) };
}

/** Mutates shared state once per visible frame. Caller supplies dt=0 while
 * paused/hidden. Turning sea off freezes phase immediately, then eases its
 * amplitude to zero so vessel pose and rendered water settle together.
 */
export function advanceWaterState(state, dt, targetStrength) {
  dt = Math.min(0.1, Math.max(0, finite(dt)));
  targetStrength = clampSeaStrength(targetStrength);
  if (dt === 0) return state;
  if (targetStrength > 0) state.time += dt;
  const difference = targetStrength - state.strength;
  state.strength =
    Math.abs(difference) < WATER_SETTLE_EPSILON
      ? targetStrength
      : state.strength +
        difference * (1 - Math.exp(-dt / WATER_SETTLE_SECONDS));
  if (Math.abs(state.strength - targetStrength) < WATER_SETTLE_EPSILON)
    state.strength = targetStrength;
  return state;
}

export function waterNeedsFrame(state, targetStrength) {
  const target = clampSeaStrength(targetStrength);
  return (
    target > 0 || Math.abs(state.strength - target) >= WATER_SETTLE_EPSILON
  );
}

const glslNumber = (number) =>
  Number.isInteger(number) ? `${number}.0` : String(number);
// Generated from the exact CPU coefficients, keeping hull and sea phase aligned.
export const WATER_GLSL = `
vec3 harborWave(vec2 p, float seconds, float strength) {
  vec3 wave = vec3(0.0);
  if (strength <= 0.0) return wave;
${WATER_WAVES.map(
  (wave) => `  {
    float phase = ${glslNumber(wave.kx)} * p.x + ${glslNumber(wave.kz)} * p.y - ${glslNumber(wave.omega)} * seconds + ${glslNumber(wave.phase)};
    float derivative = strength * ${glslNumber(wave.amplitude)} * cos(phase);
    wave += vec3(strength * ${glslNumber(wave.amplitude)} * sin(phase), derivative * ${glslNumber(wave.kx)}, derivative * ${glslNumber(wave.kz)});
  }`,
).join("\n")}
  return wave;
}
`;
