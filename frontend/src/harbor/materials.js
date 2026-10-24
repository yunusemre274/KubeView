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
    const v = Math.round(185 + noise * 60)
    image.data[i] = image.data[i + 1] = image.data[i + 2] = v
    image.data[i + 3] = 255
  }
  ctx.putImageData(image, 0, 0)
  const concrete = new THREE.CanvasTexture(canvas)
  concrete.wrapS = concrete.wrapT = THREE.RepeatWrapping
  concrete.repeat.set(9, 9)
  concrete.colorSpace = THREE.SRGBColorSpace
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
  stripe.addColorStop(0, '#868686'); stripe.addColorStop(0.2, '#b0b0b0'); stripe.addColorStop(0.4, '#ededed'); stripe.addColorStop(0.8, '#b8b8b8'); stripe.addColorStop(1, '#868686')
  for (let x = 0; x < 128; x += 16) { corr.save(); corr.translate(x, 0); corr.fillStyle = stripe; corr.fillRect(0, 0, 16, 128); corr.restore() }
  const metal = new THREE.CanvasTexture(corrCanvas)
  metal.wrapS = metal.wrapT = THREE.RepeatWrapping
  metal.repeat.set(2, 1)
  metal.colorSpace = THREE.SRGBColorSpace
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
    concrete: standard('#d1c9b7', { map: maps.concrete, roughness: 0.95 }),
    edge: standard('#999b91', { map: maps.concrete, roughness: 0.95 }),
    road: standard('#626d6d', { roughness: 0.98 }),
    dark: standard('#344149', { metalness: 0.27 }),
    roof: standard('#535e62', { map: maps.metal, metalness: 0.32 }),
    lightRoof: standard('#bab6a7', { map: maps.metal, metalness: 0.18 }),
    yellow: standard('#e4b33f', { metalness: 0.28, roughness: 0.56 }),
    rust: standard('#aa543d', { metalness: 0.26 }),
    rail: standard('#69787a', { metalness: 0.65, roughness: 0.49 }),
    white: standard('#e2e1d6', { roughness: 0.62 }),
    blue: standard('#2d647b', { metalness: 0.32, roughness: 0.5 }),
    red: standard('#934735', { metalness: 0.22, roughness: 0.7 }),
    deck: standard('#a7aaa0', { roughness: 0.85 }),
    window: standard('#304d58', { metalness: 0.4, roughness: 0.28 }),
    line: standard('#e3d49c', { roughness: 0.9 }),
    black: standard('#25363c', { roughness: 0.98 }),
    sea: standard('#356576', { normalMap: maps.water, normalScale: new THREE.Vector2(0.36, 0.36), roughness: 0.32, metalness: 0.15 }),
    cargo: standard('#ffffff', { map: maps.metal, roughness: 0.69, metalness: 0.25, vertexColors: false }),
    selected: new THREE.MeshBasicMaterial({ color: '#3b82f6', transparent: true, opacity: 0.85, depthWrite: false }),
  }
  return { ...palette, dispose() { Object.values(palette).forEach(material => material.dispose()) } }
}
