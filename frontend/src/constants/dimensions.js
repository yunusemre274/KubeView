// -----------------------------------------------------------------------------
// DIMENSIONS & LAYOUT CONSTANTS (Centralized 3D Bounding Sizes & Spacing)
// Prevents magic numbers and guarantees zero 3D mesh clipping / overlap.
// -----------------------------------------------------------------------------

export const CONTAINER_DIMENSIONS = {
  WIDTH: 3.0,
  HEIGHT: 2.4,
  LENGTH: 4.8,
  GAP_X: 0.6,
  GAP_Z: 0.8,
  GAP_Y: 0.1,
  MAX_COLS: 2,
  MAX_ROWS_PER_TIER: 3
}

export const SHIP_DIMENSIONS = {
  HULL_WIDTH: 9.0,
  HULL_HEIGHT: 1.8,
  HULL_LENGTH: 28.0,
  CABIN_Z: -9.0,
  BRIDGE_Z: 14.5,
  DECK_START_Z: -4.5,
  BASE_DECK_Y: 3.7
}

export const GANTRY_CRANE_DIMENSIONS = {
  SPAN_X: 14.0,
  HEIGHT: 10.0,
  LENGTH_Z: 16.0,
  SAFE_MARGIN: 4.0
}

export const STORAGE_DEPOT_DIMENSIONS = {
  BASE_WIDTH: 7.5,
  BASE_HEIGHT: 0.8,
  BASE_LENGTH: 10.0,
  MAIN_HEIGHT: 4.8,
  ROOF_HEIGHT: 1.8,
  TOTAL_HEIGHT: 7.4
}

export const CONTROL_TOWER_DIMENSIONS = {
  WIDTH: 16.0,
  HEIGHT: 12.0,
  LENGTH: 16.0
}

export const INGRESS_LIGHTHOUSE_DIMENSIONS = {
  BASE_WIDTH: 10.0,
  TOTAL_HEIGHT: 12.0,
  BASE_LENGTH: 14.0
}

export const KUBE_PROXY_DIMENSIONS = {
  WIDTH: 8.0,
  HEIGHT: 5.0,
  LENGTH: 8.0
}

// -----------------------------------------------------------------------------
// GRID LAYOUT HELPER FUNCTION FOR SHIP CONTAINER STACKING
// Calculates exact [x, y, z] container coordinates to guarantee zero clipping.
// -----------------------------------------------------------------------------
export function calculateContainerDeckPosition(index) {
  const { WIDTH, HEIGHT, LENGTH, GAP_X, GAP_Z, GAP_Y, MAX_COLS, MAX_ROWS_PER_TIER } = CONTAINER_DIMENSIONS
  const { DECK_START_Z, BASE_DECK_Y } = SHIP_DIMENSIONS

  const itemsPerTier = MAX_COLS * MAX_ROWS_PER_TIER
  const tier = Math.floor(index / itemsPerTier)
  const indexInTier = index % itemsPerTier

  const col = indexInTier % MAX_COLS
  const row = Math.floor(indexInTier / MAX_COLS)

  // X Position: col=0 -> -1.8, col=1 -> +1.8
  const x = (col - 0.5) * (WIDTH + GAP_X)

  // Z Position: row=0 -> -4.5, row=1 -> +1.1, row=2 -> +6.7
  const z = DECK_START_Z + row * (LENGTH + GAP_Z)

  // Y Position: tier=0 -> 3.7, tier=1 -> 6.2, tier=2 -> 8.7 (Vertical Stacking)
  const y = BASE_DECK_Y + tier * (HEIGHT + GAP_Y)

  return [x, y, z]
}

// -----------------------------------------------------------------------------
// OPTIONAL DEBUG HELPER TO LOG BOUNDING BOX OVERLAPS IN DEV
// -----------------------------------------------------------------------------
export function checkBoundingBoxOverlap(boxA, boxB) {
  return (
    boxA.minX <= boxB.maxX &&
    boxA.maxX >= boxB.minX &&
    boxA.minY <= boxB.maxY &&
    boxA.maxY >= boxB.minY &&
    boxA.minZ <= boxB.maxZ &&
    boxA.maxZ >= boxB.minZ
  )
}
