import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { transform } from 'esbuild'
import * as THREE from 'three'
import { WATER_WAVES, WATER_MAX_HEIGHT, WATER_MAX_SLOPE_X, WATER_MAX_SLOPE_Z, WATER_GLSL, sampleWater, createWaterState, advanceWaterState, waterNeedsFrame } from './waterModel.js'

test('calm analytic sea stays within height and slope budgets for every quality strength', () => {
  for (const strength of [0, 0.15, 0.45, 1]) for (let t = 0; t <= 120; t += 3.7) for (let x = -120; x <= 120; x += 19) {
    const result = sampleWater(t, x, x * -0.37 + 82, strength)
    assert.ok(Math.abs(result.height) <= WATER_MAX_HEIGHT * strength + 1e-12)
    assert.ok(Math.abs(result.dx) <= WATER_MAX_SLOPE_X * strength + 1e-12)
    assert.ok(Math.abs(result.dz) <= WATER_MAX_SLOPE_Z * strength + 1e-12)
    assert.ok(Math.abs(result.pitch) < Math.PI / 180)
    assert.ok(Math.abs(result.roll) < Math.PI / 180)
  }
  assert.ok(WATER_MAX_HEIGHT <= 0.25)
})

test('analytic gradients and vessel pitch/roll agree with displaced water derivatives', () => {
  const epsilon = 0.0001
  for (const [t, x, z] of [[0, 0, 0], [11, -54, 42], [37, 26, 151], [91, 55, 410]]) {
    const result = sampleWater(t, x, z, 0.45)
    const dx = (sampleWater(t, x + epsilon, z, 0.45).height - sampleWater(t, x - epsilon, z, 0.45).height) / (2 * epsilon)
    const dz = (sampleWater(t, x, z + epsilon, 0.45).height - sampleWater(t, x, z - epsilon, 0.45).height) / (2 * epsilon)
    assert.ok(Math.abs(result.dx - dx) < 1e-8)
    assert.ok(Math.abs(result.dz - dz) < 1e-8)
    assert.ok(Math.abs(Math.tan(result.pitch) + dz) < 1e-8)
    assert.ok(Math.abs(Math.tan(result.roll) - dx) < 1e-8)
  }
})

test('sea off freezes phase immediately and eases geometry and vessel pose to the same flat endpoint', () => {
  const state = createWaterState(0.45)
  state.time = 17
  const initial = sampleWater(state.time, -54, 42, state.strength)
  advanceWaterState(state, 1 / 60, 0)
  assert.equal(state.time, 17)
  assert.ok(state.strength < 0.45 && state.strength > 0)
  for (let frame = 0; frame < 120; frame++) advanceWaterState(state, 1 / 60, 0)
  assert.equal(state.time, 17)
  assert.equal(state.strength, 0)
  assert.equal(waterNeedsFrame(state, 0), false)
  assert.deepEqual(sampleWater(state.time, -54, 42, state.strength), { height: 0, dx: 0, dz: 0, pitch: 0, roll: 0 })
  assert.ok(initial.height !== 0)
  advanceWaterState(state, 1 / 60, 0.45)
  assert.ok(state.time > 17 && state.strength > 0 && state.strength < 0.45)
})

test('paused/hidden dt=0 freezes all shared state and background resume has no wall-clock catchup', () => {
  const state = createWaterState(0.45)
  state.time = 4
  assert.strictEqual(advanceWaterState(state, 0, 0), state)
  assert.deepEqual(state, { time: 4, strength: 0.45 })
  advanceWaterState(state, 1000, 0.45)
  assert.ok(Math.abs(state.time - 4.1) < 1e-12)
  const destination = {}
  assert.strictEqual(sampleWater(0, 0, 0, 0.45, destination), destination)
})

test('disabled sea does not evaluate trigonometry and invalid inputs remain finite', () => {
  const sin = Math.sin, cos = Math.cos
  try {
    Math.sin = Math.cos = () => { throw new Error('disabled sea must not evaluate waves') }
    assert.deepEqual(sampleWater(100, 50, 10, 0), { height: 0, dx: 0, dz: 0, pitch: 0, roll: 0 })
  } finally { Math.sin = sin; Math.cos = cos }
  assert.ok(Object.values(sampleWater(NaN, Infinity, undefined, 1)).every(Number.isFinite))
})

test('GPU shader coefficients come from the exact shared vessel wave model', () => {
  for (const wave of WATER_WAVES) for (const value of Object.values(wave)) assert.ok(WATER_GLSL.includes(String(value)))
  assert.ok(WATER_GLSL.includes('if (strength <= 0.0) return wave'))
})

// Load the real JSX resource factories through the project's existing compiler.
// This tests Three.js resource ownership and shader patching without a WebGL or
// DOM mock; the actual renderer is separately exercised by browser QA.
let oceanModule
async function loadOceanFactories() {
  if (oceanModule) return oceanModule
  const source = await readFile(new URL('./Ocean.jsx', import.meta.url), 'utf8')
  const importsResolved = source.replace(/from\s+(['"])([^'"]+)\1/g, (_, quote, specifier) => `from ${JSON.stringify(import.meta.resolve(specifier))}`)
  const compiled = await transform(importsResolved, { loader: 'jsx', format: 'esm', target: 'es2022' })
  oceanModule = await import(`data:text/javascript;base64,${Buffer.from(compiled.code).toString('base64')}`)
  return oceanModule
}

test('Ocean owns finite static geometry and material disposal; uniforms stay stable over animation', async () => {
  const { createOceanResources } = await loadOceanFactories()
  const resources = createOceanResources('medium', { maxZ: 510 })
  let geometryDisposed = 0, materialDisposed = 0, textureDisposed = 0
  resources.geometry.addEventListener('dispose', () => geometryDisposed++)
  resources.material.addEventListener('dispose', () => materialDisposed++)
  resources.uniforms.uWaterSurface.value.addEventListener('dispose', () => textureDisposed++)
  const originalPositions = resources.geometry.attributes.position.array.slice()
  const uniforms = resources.uniforms
  const shader = { uniforms: {}, vertexShader: THREE.ShaderLib.standard.vertexShader, fragmentShader: THREE.ShaderLib.standard.fragmentShader }
  resources.material.onBeforeCompile(shader)
  assert.strictEqual(shader.uniforms.uWaterTime, uniforms.uWaterTime)
  assert.ok(shader.vertexShader.includes('transformed.y += harborWave'))
  assert.ok(shader.fragmentShader.includes('harborRipples'))
  assert.ok(shader.fragmentShader.includes('normal = normalize(mat3(viewMatrix) * surfaceNormal)'))
  for (let frame = 0; frame < 120; frame++) uniforms.uWaterTime.value = frame / 60
  assert.strictEqual(resources.uniforms, uniforms)
  assert.deepEqual(resources.geometry.attributes.position.array, originalPositions)
  assert.ok(resources.geometry.index.count / 3 < 20000)
  assert.ok(Array.from(originalPositions).every(Number.isFinite))
  resources.dispose()
  assert.equal(geometryDisposed, 1)
  assert.equal(materialDisposed, 1)
  assert.equal(textureDisposed, 1)
})

test('sun reflection toggles preserve texture, geometry, material and the held water phase', async () => {
  const { createOceanResources, updateOceanUniforms } = await loadOceanFactories()
  const resources = createOceanResources('medium')
  const texture = resources.uniforms.uWaterSurface.value
  const geometry = resources.geometry, material = resources.material
  const positions = geometry.attributes.position.array.slice(), version = material.version
  const phase = createWaterState(0.45)
  phase.time = 17
  for (let i = 0; i < 20; i++) {
    updateOceanUniforms(resources, phase.time, phase.strength, false)
    assert.equal(resources.uniforms.uSunGlint.value, 0)
    assert.equal(resources.uniforms.uWaterTime.value, 17)
    updateOceanUniforms(resources, phase.time, phase.strength, true)
    assert.equal(resources.uniforms.uSunGlint.value, 1)
  }
  updateOceanUniforms(resources, 17, 0)
  assert.equal(resources.uniforms.uSunGlint.value, 1)
  assert.equal(resources.uniforms.uWaterTime.value, 17)
  assert.strictEqual(resources.uniforms.uWaterSurface.value, texture)
  assert.strictEqual(resources.geometry, geometry)
  assert.strictEqual(resources.material, material)
  assert.equal(material.version, version)
  assert.deepEqual(geometry.attributes.position.array, positions)
  assert.equal(texture.image.width, 256)
  assert.equal(texture.image.height, 256)
  assert.equal(texture.wrapS, THREE.RepeatWrapping)
  assert.equal(texture.wrapT, THREE.RepeatWrapping)
  assert.equal(texture.minFilter, THREE.LinearMipmapLinearFilter)
  assert.equal(texture.generateMipmaps, true)
  assert.equal(texture.colorSpace, THREE.NoColorSpace)
  resources.dispose()
})

test('wake is bounded aft geometry and disposes its own resources without touching shared assets', async () => {
  const { createWakeResources } = await loadOceanFactories()
  const resources = createWakeResources()
  let disposed = 0
  resources.geometry.addEventListener('dispose', () => disposed++)
  resources.material.addEventListener('dispose', () => disposed++)
  const positions = resources.geometry.attributes.position
  for (let i = 0; i < positions.count; i++) assert.ok(positions.getZ(i) < -30 && positions.getZ(i) > -83)
  assert.deepEqual(new Set(resources.geometry.attributes.wakeLane.array), new Set([-1, 0, 1]))
  assert.ok(resources.geometry.index.count / 3 <= 144)
  assert.equal(resources.uniforms.uOpacity.value, 0)
  assert.equal(resources.material.depthWrite, false)
  assert.equal(resources.material.forceSinglePass, true)
  resources.dispose()
  assert.equal(disposed, 2)
})
