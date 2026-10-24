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

const RIPPLE_GLSL = `
vec2 harborRipples(vec2 position, float seconds) {
  vec2 a = position * 0.57 + vec2(0.028, -0.018) * seconds;
  vec2 first = vec2(sin(a.x + 0.65 * sin(a.y)), cos(a.y + 0.45 * sin(a.x)));
  if (uWaterDetail < 0.7) return first;
  vec2 b = mat2(0.80, -0.60, 0.60, 0.80) * position * 0.83 + vec2(-0.019, -0.025) * seconds;
  vec2 second = vec2(cos(b.x + 0.40 * b.y), sin(b.y + 0.55 * cos(b.x)));
  return first * 0.60 + second * 0.40;
}
`;

export function createOceanResources(quality = "medium", bounds) {
  const geometry = createWaterGeometry(quality, bounds);
  const uniforms = {
    uWaterTime: { value: 0 },
    uWaterStrength: { value: 0 },
    uWaterDetail: { value: quality === "low" ? 0.6 : 1 },
  };
  const material = new THREE.MeshStandardMaterial({
    color: "#285b65",
    roughness: 0.36,
    metalness: 0.1,
  });
  material.name = "KubeView calm harbor water";
  material.extensions = { ...material.extensions, derivatives: true };
  material.userData.oceanUniforms = uniforms;
  material.customProgramCacheKey = () => "kubeview-analytic-harbor-water-v1";
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
      `uniform float uWaterTime;\nuniform float uWaterStrength;\nuniform float uWaterDetail;\nvarying vec3 vOceanWorld;\n${WATER_GLSL}\n${RIPPLE_GLSL}\n` +
      shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <normal_fragment_maps>",
      `
      #include <normal_fragment_maps>
      vec3 macroWave = harborWave(vOceanWorld.xz, uWaterTime, uWaterStrength);
      vec2 footprint = fwidth(vOceanWorld.xz);
      float detailFade = uWaterDetail / (1.0 + dot(footprint, footprint) * 0.12);
      vec2 surfaceRipples = harborRipples(vOceanWorld.xz, uWaterTime);
      vec2 ripple = surfaceRipples * (0.025 + 0.10 * uWaterStrength) * detailFade;
      vec3 surfaceNormal = normalize(vec3(-macroWave.y - ripple.x, 1.0, -macroWave.z - ripple.y));
      normal = normalize(mat3(viewMatrix) * surfaceNormal);
    `,
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <opaque_fragment>",
      `
      vec3 reflectedSkyDirection = inverseTransformDirection(reflect(-normalize(vViewPosition), normal), viewMatrix);
      float skyHeight = clamp(reflectedSkyDirection.y * 0.5 + 0.5, 0.0, 1.0);
      vec3 quietSky = mix(vec3(0.08, 0.16, 0.18), vec3(0.27, 0.39, 0.42), skyHeight);
      float waterFresnel = pow(1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0), 4.0);
      outgoingLight = mix(outgoingLight, quietSky, 0.09 + waterFresnel * 0.22);
      outgoingLight *= 0.94 + dot(surfaceRipples, vec2(0.035, 0.025)) * detailFade;
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
    },
  };
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
    if (resources.uniforms.uWaterTime.value !== time)
      resources.uniforms.uWaterTime.value = time;
    if (resources.uniforms.uWaterStrength.value !== strength)
      resources.uniforms.uWaterStrength.value = strength;
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
    indices = [];
  const stern = -D.SHIP_LENGTH / 2 + 1.5,
    rows = 10;
  for (const side of [-1, 1]) {
    const offset = positions.length / 3;
    for (let row = 0; row <= rows; row++) {
      const along = row / rows,
        center = side * (D.SHIP_WIDTH * 0.37 + along * 7.5),
        width = 0.5 + along * 2.2;
      for (const edge of [-1, 1]) {
        positions.push(
          center + edge * width,
          SEA_LEVEL + 0.016,
          stern - along * 31,
        );
        uvs.push((edge + 1) / 2, along);
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
    vertexShader: `uniform float uWaterTime; uniform float uWaterStrength; varying vec2 vUv; ${WATER_GLSL} void main() { vUv = uv; vec3 displaced = position; vec2 worldXZ = (modelMatrix * vec4(position, 1.0)).xz; displaced.y += harborWave(worldXZ, uWaterTime, uWaterStrength).x; gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0); }`,
    fragmentShader: `
    uniform float uTime; uniform float uOpacity; varying vec2 vUv;
    void main() {
      float edge = smoothstep(0.0, 0.28, vUv.x) * (1.0 - smoothstep(0.72, 1.0, vUv.x));
      float age = smoothstep(0.0, 0.10, vUv.y) * pow(1.0 - vUv.y, 1.7);
      float ripples = 0.58 + 0.22 * sin(vUv.y * 61.0 - uTime * 1.4 + sin(vUv.x * 11.0));
      gl_FragColor = vec4(vec3(0.54, 0.70, 0.69), edge * age * ripples * uOpacity);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `,
  });
  material.name = "KubeView subtle vessel wake";
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
      visible && motion.wake && !motion.reduced && Math.abs(velocity) > 0.02;
    if (mesh.current) mesh.current.visible = Boolean(enabled);
    resources.uniforms.uOpacity.value = enabled
      ? Math.min(0.11, Math.abs(velocity) * 0.075)
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
