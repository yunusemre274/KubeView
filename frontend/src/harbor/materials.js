import * as THREE from 'three'

// Deterministic, locally generated PBR surface maps. No third-party runtime requests.
export function makeSurfaceMaps() {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 256
  const ctx = canvas.getContext('2d')
  const image = ctx.createImageData(256, 256)
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
    const hash = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
    const noise = hash - Math.floor(hash)
    const i = (y * 256 + x) * 4
    // Fine grain, not large high-contrast speckles. This map is also reused as
    // a shallow bump map; no additional per-frame texture or noise allocation.
    const grain = Math.sin(x * 0.13 + Math.sin(y * 0.09)) * Math.cos(y * 0.17)
    const v = Math.round(228 + noise * 19 + grain * 4)
    image.data[i] = image.data[i + 1] = image.data[i + 2] = v
    image.data[i + 3] = 255
  }
  ctx.putImageData(image, 0, 0)
  const concrete = new THREE.CanvasTexture(canvas)
  concrete.wrapS = concrete.wrapT = THREE.RepeatWrapping
  concrete.repeat.set(9, 9)
  concrete.colorSpace = THREE.SRGBColorSpace
  concrete.anisotropy = 4
  const seaCanvas = document.createElement('canvas')
  seaCanvas.width = seaCanvas.height = 256
  const sea = seaCanvas.getContext('2d')
  const ripples = sea.createImageData(256, 256)
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
    const i = (y * 256 + x) * 4
    const a = Math.sin((x + y * 0.37) * 0.31) * Math.sin(y * 0.14)
    const b = Math.sin(y * 0.46 + Math.cos(x * 0.11) * 1.8)
    ripples.data[i] = 128 + a * 16
    ripples.data[i + 1] = 128 + b * 14
    ripples.data[i + 2] = 250
    ripples.data[i + 3] = 255
  }
  sea.putImageData(ripples, 0, 0)
  const water = new THREE.CanvasTexture(seaCanvas)
  water.wrapS = water.wrapT = THREE.RepeatWrapping
  water.repeat.set(420, 420)
  const corrCanvas = document.createElement('canvas')
  corrCanvas.width = corrCanvas.height = 128
  const corr = corrCanvas.getContext('2d')
  const stripe = corr.createLinearGradient(0, 0, 16, 0)
  stripe.addColorStop(0, '#b2b2b2'); stripe.addColorStop(0.12, '#ededed'); stripe.addColorStop(0.3, '#ededed'); stripe.addColorStop(0.36, '#cdcdcd'); stripe.addColorStop(0.88, '#cdcdcd'); stripe.addColorStop(1, '#b2b2b2')
  for (let x = 0; x < 128; x += 16) { corr.save(); corr.translate(x, 0); corr.fillStyle = stripe; corr.fillRect(0, 0, 16, 128); corr.restore() }
  const metal = new THREE.CanvasTexture(corrCanvas)
  metal.wrapS = metal.wrapT = THREE.RepeatWrapping
  metal.repeat.set(2, 1)
  metal.colorSpace = THREE.SRGBColorSpace
  metal.anisotropy = 4
  return { concrete, water, metal, dispose() { concrete.dispose(); water.dispose(); metal.dispose() } }
}

export const CARGO_PALETTE = ['#465f79', '#ad4f37', '#d6cdb8', '#5d7768', '#ba8f45', '#687c8e', '#7b4a40']
export function hashColor(value = '') {
  let hash = 0
  for (let i = 0; i < value.length; i++) hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0
  return CARGO_PALETTE[Math.abs(hash) % CARGO_PALETTE.length]
}

export function makeMaterials(maps) {
  const standard = (color, opts = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0.08, ...opts })
  const palette = {
    concrete: standard('#d7cdb9', { map: maps.concrete, bumpMap: maps.concrete, bumpScale: 0.07, roughness: 0.95 }),
    edge: standard('#a4a395', { map: maps.concrete, roughness: 0.95 }),
    road: standard('#6a6e6b', { map: maps.concrete, roughness: 0.98 }),
    dark: standard('#28353c', { metalness: 0.2 }),
    cladding: standard('#28343c', { map: maps.metal, bumpMap: maps.metal, bumpScale: 0.12, metalness: 0.25, roughness: 0.68 }),
    roof: standard('#354048', { map: maps.metal, bumpMap: maps.metal, bumpScale: 0.1, metalness: 0.30, roughness: 0.62 }),
    lightRoof: standard('#c1b7a2', { map: maps.metal, bumpMap: maps.metal, bumpScale: 0.1, metalness: 0.18, roughness: 0.72 }),
    yellow: standard('#e7ad25', { metalness: 0.22, roughness: 0.48 }),
    rust: standard('#b54e35', { metalness: 0.22, roughness: 0.62 }),
    rail: standard('#7c8786', { metalness: 0.62, roughness: 0.48 }),
    white: standard('#eae8df', { roughness: 0.58 }),
    blue: standard('#255569', { metalness: 0.27, roughness: 0.44 }),
    red: standard('#934735', { metalness: 0.22, roughness: 0.7 }),
    deck: standard('#cecbb9', { roughness: 0.78 }),
    window: standard('#213e4a', { metalness: 0.48, roughness: 0.19 }),
    line: standard('#e3d49c', { roughness: 0.9 }),
    black: standard('#25363c', { roughness: 0.98 }),
    sea: standard('#356576', { normalMap: maps.water, normalScale: new THREE.Vector2(0.36, 0.36), roughness: 0.32, metalness: 0.15 }),
    cargo: standard('#ffffff', { map: maps.metal, bumpMap: maps.metal, bumpScale: 0.07, roughness: 0.69, metalness: 0.25, vertexColors: false }),
    selected: new THREE.MeshBasicMaterial({ color: '#3b82f6', transparent: true, opacity: 0.85, depthWrite: false }),
  }
  return { ...palette, dispose() { Object.values(palette).forEach(material => material.dispose()) } }
}
