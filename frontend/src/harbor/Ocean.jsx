import React, { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { HARBOR_DIMENSIONS as D } from "../constants/dimensions.js";
import { WATER_GLSL, clampSeaStrength } from "./waterModel.js";

const SEA_LEVEL = -0.1;
const NO_RAYCAST = () => null;
const profile = (quality) =>
  quality === "low" ? 48 : quality === "high" ? 128 : 88;

// Dense vertices stay around the actual harbor. Two wide outer rings reach the
// horizon without tessellating a 20-km plane or allocating vertices every frame.
export function createWaterGeometry(quality = "medium", bounds = {}) {
  const segments = profile(quality),
    centerZ = ((bounds.maxZ || 100) - 92) / 2;
  const halfX = 620,
    halfZ = Math.max(620, ((bounds.maxZ || 100) + 92) / 2 + 420);
  const axis = (half) => [
    -10000,
    -half - 500,
    ...Array.from(
      { length: segments + 1 },
      (_, index) => -half + (index * half * 2) / segments,
    ),
    half + 500,
    10000,
  ];
  const xs = axis(halfX),
    zs = axis(halfZ),
    positions = [],
    normals = [],
    uvs = [],
    indices = [];
  for (let zi = 0; zi < zs.length; zi++)
    for (let xi = 0; xi < xs.length; xi++) {
      positions.push(xs[xi], SEA_LEVEL, zs[zi] + centerZ);
      normals.push(0, 1, 0);
      uvs.push((xs[xi] + 10000) / 20000, (zs[zi] + 10000) / 20000);
    }
  for (let zi = 0; zi < zs.length - 1; zi++)
    for (let xi = 0; xi < xs.length - 1; xi++) {
      const a = zi * xs.length + xi,
        b = a + 1,
        c = a + xs.length,
        d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  geometry.userData.waterGrid = { segments, centerZ, halfX, halfZ };
  return geometry;
}

// Original seamless slope/height field. Generate once, then let two mipmapped
// GPU samples supply the fine ripples. No external image, readback or per-frame
// CPU surface updates are needed. Periodic gradient fields keep the tile seam
// continuous and break up the parallel bands of a sum-of-sines surface.
export function createWaterSurfaceTexture() {
  const size = 256, heights = new Float32Array(size * size);
  const data = new Uint8Array(size * size * 4);
  const gradientField = (columns, rows, seed) => {
    const gradients = new Float32Array(columns * rows * 2);
    for (let y = 0; y < rows; y++) for (let x = 0; x < columns; x++) {
      const n = Math.sin(x * 127.1 + y * 311.7 + seed * 17.23) * 43758.5453;
      const angle = (n - Math.floor(n)) * Math.PI * 2;
      const index = (y * columns + x) * 2;
      gradients[index] = Math.cos(angle); gradients[index + 1] = Math.sin(angle);
    }
    return (u, v) => {
      const px = u * columns, py = v * rows, ix = Math.floor(px), iy = Math.floor(py);
      const fx = px - ix, fy = py - iy;
      const sx = fx * fx * fx * (fx * (fx * 6 - 15) + 10);
      const sy = fy * fy * fy * (fy * (fy * 6 - 15) + 10);
      const dot = (x, y) => {
        const index = (((iy + y) % rows + rows) % rows * columns + ((ix + x) % columns + columns) % columns) * 2;
        return gradients[index] * (fx - x) + gradients[index + 1] * (fy - y);
      };
      const a = dot(0, 0), b = dot(1, 0), c = dot(0, 1), d = dot(1, 1);
      return (a + (b - a) * sx) * (1 - sy) + (c + (d - c) * sx) * sy;
    };
  };
  const broad = gradientField(7, 21, 3), fine = gradientField(19, 47, 7);
  const warp = gradientField(3, 4, 11);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const u = x / size, v = y / size, bend = warp(u, v) * 0.08;
    heights[y * size + x] = broad(u + bend, v - bend * 0.4) * 1.7 + fine(u, v) * 0.55;
  }
  const encode = (value) => Math.round(Math.max(0, Math.min(1, value)) * 255);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = (y * size + x) * 4;
    const dx = heights[y * size + (x + 1) % size] - heights[y * size + (x + size - 1) % size];
    const dz = heights[((y + 1) % size) * size + x] - heights[((y + size - 1) % size) * size + x];
    data[i] = encode(0.5 + dx * 1.8);
    data[i + 1] = encode(0.5 + dz * 1.8);
    data[i + 2] = encode(0.5 + heights[y * size + x] * 0.22);
    data[i + 3] = 255;
  }
  const texture = new THREE.DataTexture(data, size, size);
  texture.name = "KubeView original seamless water slopes";
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

const RIPPLE_GLSL = `
vec3 harborRipples(vec2 position, float seconds) {
  vec2 uv = position * 0.009 + vec2(0.0022, -0.0014) * seconds;
  vec3 first = texture2D(uWaterSurface, uv).rgb * 2.0 - 1.0;
  if (uWaterDetail < 0.7) return first;
  mat2 rotation = mat2(0.80, -0.60, 0.60, 0.80);
  vec2 secondUV = rotation * position * 0.015 + vec2(-0.0016, -0.0019) * seconds;
  vec3 second = texture2D(uWaterSurface, secondUV).rgb * 2.0 - 1.0;
  second.xy = mat2(0.80, 0.60, -0.60, 0.80) * second.xy;
  vec3 ripples = first * 0.68 + second * 0.32;
  if (uWaterDetail > 1.2) {
    vec3 fine = texture2D(uWaterSurface, position * 0.029 + vec2(0.0010, 0.0014) * seconds).rgb * 2.0 - 1.0;
    ripples = ripples * 0.90 + fine * 0.10;
  }
  return ripples;
}
`;

export function createOceanResources(quality = "medium", bounds) {
  const geometry = createWaterGeometry(quality, bounds);
  const surface = createWaterSurfaceTexture();
  const uniforms = {
    uWaterTime: { value: 0 },
    uWaterStrength: { value: 0 },
    uWaterDetail: { value: quality === "low" ? 0.6 : quality === "high" ? 1.4 : 1 },
    uWaterSurface: { value: surface },
    uSunGlint: { value: 1 },
  };
  const material = new THREE.MeshStandardMaterial({
    color: "#1a6274",
    roughness: 0.24,
    metalness: 0.02,
  });
  material.name = "KubeView calm harbor water";
  material.extensions = { ...material.extensions, derivatives: true };
  material.userData.oceanUniforms = uniforms;
  material.customProgramCacheKey = () => "kubeview-sunlit-harbor-water-v2.2";
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader =
      `uniform float uWaterTime;\nuniform float uWaterStrength;\nvarying vec3 vOceanWorld;\n${WATER_GLSL}\n` +
      shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      `
      #include <begin_vertex>
      vec2 seaCoordinates = (modelMatrix * vec4(position, 1.0)).xz;
      transformed.y += harborWave(seaCoordinates, uWaterTime, uWaterStrength).x;
      vOceanWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;
    `,
    );
    shader.fragmentShader =
      `uniform float uWaterTime;\nuniform float uWaterStrength;\nuniform float uWaterDetail;\nuniform sampler2D uWaterSurface;\nuniform float uSunGlint;\nvarying vec3 vOceanWorld;\n${WATER_GLSL}\n${RIPPLE_GLSL}\n` +
      shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <normal_fragment_maps>",
      `
      #include <normal_fragment_maps>
      vec3 macroWave = harborWave(vOceanWorld.xz, uWaterTime, uWaterStrength);
      vec2 footprint = fwidth(vOceanWorld.xz);
      float detailFade = 1.0 / (1.0 + dot(footprint, footprint) * 0.008);
      vec3 surfaceRipples = harborRipples(vOceanWorld.xz, uWaterTime);
      vec2 ripple = surfaceRipples.xy * (0.18 + 0.11 * uWaterStrength) * detailFade;
      vec3 surfaceNormal = normalize(vec3(-macroWave.y - ripple.x, 1.0, -macroWave.z - ripple.y));
      normal = normalize(mat3(viewMatrix) * surfaceNormal);
    `,
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <opaque_fragment>",
      `
      vec3 worldView = inverseTransformDirection(normalize(vViewPosition), viewMatrix);
      vec3 reflectedSkyDirection = reflect(-worldView, surfaceNormal);
      float skyHeight = clamp(reflectedSkyDirection.y, 0.0, 1.0);
      vec3 quietSky = mix(vec3(0.16, 0.27, 0.30), vec3(0.29, 0.43, 0.48), skyHeight);
      float waterFresnel = 0.045 + 0.955 * pow(1.0 - clamp(dot(surfaceNormal, worldView), 0.0, 1.0), 5.0);
      // Keep the standard shadowed diffuse lighting but replace its broad
      // plastic-looking hotspot with water's broken directional sun reflection.
      // The separate setting actually removes the specular contribution.
      outgoingLight = max(vec3(0.0), outgoingLight - totalSpecular);
      outgoingLight *= 0.84 + surfaceRipples.z * 0.25 * detailFade;
      outgoingLight = mix(outgoingLight, quietSky, waterFresnel * 0.74);
      if (uSunGlint > 0.5) {
        vec3 sunDirection = normalize(vec3(-1.10, 0.72, -0.28));
        vec3 sunHalf = normalize(sunDirection + worldView);
        float sunAngle = max(dot(surfaceNormal, sunHalf), 0.0);
        float brokenGlint = pow(sunAngle, 1100.0) * 0.54;
        float softSheen = pow(sunAngle, 80.0) * 0.022;
        outgoingLight += vec3(1.0, 0.90, 0.72) * (brokenGlint + softSheen) * detailFade;
      }
      #include <opaque_fragment>
    `,
    );
  };
  return {
    geometry,
    material,
    uniforms,
    dispose() {
      geometry.dispose();
      material.dispose();
      surface.dispose();
    },
  };
}

// Preference changes update uniforms on the existing material; they must not
// rebuild geometry, reset the sea phase, or recompile a shader while sailing.
export function updateOceanUniforms(resources, time, strength, sunGlint = true) {
  const uniforms = resources.uniforms;
  uniforms.uWaterTime.value = time;
  uniforms.uWaterStrength.value = strength;
  uniforms.uSunGlint.value = sunGlint === false ? 0 : 1;
}

/** Purely visual sea. SceneClock alone advances shared waterState; no timers,
 * invalidations, React state updates or CPU vertex writes are hidden here.
 */
export default function Ocean({
  motion = {},
  clock,
  waterState,
  quality = "medium",
  bounds,
}) {
  const resources = useMemo(
    () => createOceanResources(quality, bounds),
    [quality, bounds?.maxZ],
  );
  const fallbackTime = useRef(0);
  useEffect(() => () => resources.dispose(), [resources]);
  useFrame(() => {
    const state = waterState?.current;
    if (!state && motion.sea && !motion.reduced && !motion.paused)
      fallbackTime.current = clock?.current || 0;
    const time = state ? state.time : fallbackTime.current;
    const strength = state
      ? state.strength
      : motion.sea
        ? clampSeaStrength(motion.seaAmplitude ?? motion.seaStrength ?? 0.45)
        : 0;
    updateOceanUniforms(resources, time, strength, motion.sunGlint);
  });
  return (
    <mesh
      name="harbor:ocean"
      geometry={resources.geometry}
      material={resources.material}
      receiveShadow
      raycast={NO_RAYCAST}
      dispose={null}
      userData={{ water: "Analitik dalga · görsel su yüzeyi" }}
    />
  );
}

function createWakeGeometry() {
  const positions = [],
    uvs = [],
    lanes = [],
    indices = [];
  const stern = -D.SHIP_LENGTH / 2 + 1.5,
    rows = 18;
  for (const side of [-1, 0, 1]) {
    const offset = positions.length / 3;
    for (let row = 0; row <= rows; row++) {
      const along = row / rows,
        center = side * (D.SHIP_WIDTH * 0.29 + along * 9.5),
        width = side === 0 ? 1.2 + along * 3.8 : 0.65 + along * 2.0;
      for (const edge of [-1, 1]) {
        positions.push(
          center + edge * width,
          SEA_LEVEL + 0.016,
          stern - along * 34,
        );
        uvs.push((edge + 1) / 2, along);
        lanes.push(side);
      }
    }
    for (let row = 0; row < rows; row++) {
      const a = offset + row * 2;
      indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute("wakeLane", new THREE.Float32BufferAttribute(lanes, 1));
  geometry.setIndex(indices);
  return geometry;
}

export function createWakeResources() {
  const geometry = createWakeGeometry();
  const uniforms = {
    uTime: { value: 0 },
    uOpacity: { value: 0 },
    uWaterTime: { value: 0 },
    uWaterStrength: { value: 0 },
  };
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms,
    side: THREE.DoubleSide,
    forceSinglePass: true,
    vertexShader: `uniform float uWaterTime; uniform float uWaterStrength; attribute float wakeLane; varying vec2 vUv; varying float vLane; ${WATER_GLSL} void main() { vUv = uv; vLane = wakeLane; vec3 displaced = position; vec2 worldXZ = (modelMatrix * vec4(position, 1.0)).xz; displaced.y += harborWave(worldXZ, uWaterTime, uWaterStrength).x; gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0); }`,
    fragmentShader: `
    uniform float uTime; uniform float uOpacity; varying vec2 vUv; varying float vLane;
    float wakeHash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }
    float wakeNoise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(mix(wakeHash(i), wakeHash(i + vec2(1.0, 0.0)), f.x), mix(wakeHash(i + vec2(0.0, 1.0)), wakeHash(i + vec2(1.0)), f.x), f.y);
    }
    void main() {
      float flow = vUv.y * 28.0 - uTime * 1.7;
      float noise = wakeNoise(vec2(vUv.x * 9.0 + vLane * 12.0, flow));
      float turbulence = wakeNoise(vec2(vUv.x * 21.0, flow * 2.3 + 11.7));
      float width = vUv.x + (noise - 0.5) * 0.16;
      float edge = smoothstep(0.0, 0.28, width) * (1.0 - smoothstep(0.72, 1.0, width));
      float age = smoothstep(0.0, 0.055, vUv.y) * pow(1.0 - vUv.y, 1.15);
      float crests = 0.5 + 0.5 * sin(vUv.y * 91.0 - uTime * 2.2 + noise * 7.0 + vUv.x * 9.0);
      float foam = smoothstep(0.26, 0.80, noise * 0.65 + turbulence * 0.35 + crests * 0.28);
      float propeller = 1.0 - abs(vLane);
      float opacity = edge * age * (0.22 + foam * 0.78) * mix(1.0, 0.65, propeller) * uOpacity;
      gl_FragColor = vec4(mix(vec3(0.48, 0.72, 0.75), vec3(0.92, 0.97, 0.92), foam), opacity);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `,
  });
  material.name = "KubeView turbulent vessel wake";
  return {
    geometry,
    material,
    uniforms,
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}

// Place this beside (not inside) the vessel's bob/pitch group, with the same X/Z
// and yaw. Wake is a motion cue only, never represented as Kubernetes traffic.
export function ShipWake({
  motion = {},
  clock,
  waterState,
  speed = 0,
  visible = true,
}) {
  const mesh = useRef();
  const resources = useMemo(createWakeResources, []);
  useEffect(() => () => resources.dispose(), [resources]);
  useFrame(() => {
    const velocity = typeof speed === "number" ? speed : speed?.current || 0;
    const enabled =
      visible && motion.wake && !motion.reduced && !motion.paused &&
      motion.sea !== false && Math.abs(velocity) > 0.02;
    if (mesh.current) mesh.current.visible = Boolean(enabled);
    resources.uniforms.uOpacity.value = enabled
      ? Math.min(0.64, Math.abs(velocity) * 0.17)
      : 0;
    if (enabled) {
      resources.uniforms.uTime.value = clock?.current || 0;
      resources.uniforms.uWaterTime.value = waterState?.current?.time || 0;
      resources.uniforms.uWaterStrength.value =
        waterState?.current?.strength || 0;
    }
  });
  return (
    <mesh
      ref={mesh}
      visible={false}
      name="harbor:vessel-wake"
      geometry={resources.geometry}
      material={resources.material}
      raycast={NO_RAYCAST}
      dispose={null}
    />
  );
}
