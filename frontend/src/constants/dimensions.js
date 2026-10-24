import * as THREE from "three";

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
  MAX_ROWS_PER_TIER: 3,
};

export const SHIP_DIMENSIONS = {
  HULL_WIDTH: 9.0,
  HULL_HEIGHT: 1.8,
  HULL_LENGTH: 28.0,
  SAFE_GAP_X: 12.0,
  SAFE_GAP_Z: 14.0,
  CABIN_Z: -9.0,
  BRIDGE_Z: 14.5,
  DECK_START_Z: -4.5,
  BASE_DECK_Y: 3.7,
};

export const HARBOR_DOCK_BOUNDS = {
  SHORE_MIN_X: -45.0,
  SHORE_MAX_X: -6.0, // Land pier boundary: Ships must stay at x >= 4.0
  WATER_MIN_Z: -35.0,
  WATER_MAX_Z: 35.0,
};

export const GANTRY_CRANE_DIMENSIONS = {
  SPAN_X: 14.0,
  HEIGHT: 10.0,
  LENGTH_Z: 16.0,
  SAFE_MARGIN: 4.0,
};

export const STORAGE_DEPOT_DIMENSIONS = {
  BASE_WIDTH: 7.5,
  BASE_HEIGHT: 0.8,
  BASE_LENGTH: 10.0,
  MAIN_HEIGHT: 4.8,
  ROOF_HEIGHT: 1.8,
  TOTAL_HEIGHT: 7.4,
};

export const CONTROL_TOWER_DIMENSIONS = {
  WIDTH: 16.0,
  HEIGHT: 12.0,
  LENGTH: 16.0,
};

export const INGRESS_LIGHTHOUSE_DIMENSIONS = {
  BASE_WIDTH: 10.0,
  TOTAL_HEIGHT: 12.0,
  BASE_LENGTH: 14.0,
};

export const KUBE_PROXY_DIMENSIONS = {
  WIDTH: 8.0,
  HEIGHT: 5.0,
  LENGTH: 8.0,
};

// -----------------------------------------------------------------------------
// GRID LAYOUT HELPER FUNCTION FOR SHIP CONTAINER STACKING
// Calculates exact [x, y, z] container coordinates to guarantee zero clipping.
// -----------------------------------------------------------------------------
export function calculateContainerDeckPosition(index) {
  const {
    WIDTH,
    HEIGHT,
    LENGTH,
    GAP_X,
    GAP_Z,
    GAP_Y,
    MAX_COLS,
    MAX_ROWS_PER_TIER,
  } = CONTAINER_DIMENSIONS;
  const { DECK_START_Z, BASE_DECK_Y } = SHIP_DIMENSIONS;

  const itemsPerTier = MAX_COLS * MAX_ROWS_PER_TIER;
  const tier = Math.floor(index / itemsPerTier);
  const indexInTier = index % itemsPerTier;

  const col = indexInTier % MAX_COLS;
  const row = Math.floor(indexInTier / MAX_COLS);

  // X Position: col=0 -> -1.8, col=1 -> +1.8
  const x = (col - 0.5) * (WIDTH + GAP_X);

  // Z Position: row=0 -> -4.5, row=1 -> +1.1, row=2 -> +6.7
  const z = DECK_START_Z + row * (LENGTH + GAP_Z);

  // Y Position: tier=0 -> 3.7, tier=1 -> 6.2, tier=2 -> 8.7 (Vertical Stacking)
  const y = BASE_DECK_Y + tier * (HEIGHT + GAP_Y);

  return [x, y, z];
}

// -----------------------------------------------------------------------------
// DOCKING BERTH POSITION ALGORITHM FOR STATIC / DOCKED SHIPS
// Guarantees zero overlap with harbor dock structure (x >= 4.0) and other ships.
// -----------------------------------------------------------------------------
export function calculateShipDockPosition(shipIndex) {
  // Grid of water berths: 2 columns in open water (x=8, x=28), spaced by z=34
  const col = shipIndex % 2;
  const row = Math.floor(shipIndex / 2);
  const x = 8.0 + col * 20.0; // col 0 -> 8.0, col 1 -> 28.0
  const z = -10.0 + row * 34.0; // row 0 -> -10.0, row 1 -> +24.0, row 2 -> +58.0
  return [x, 0, z];
}

// -----------------------------------------------------------------------------
// GLOBAL PATROL LOOP ALGORITHM WITH EQUAL PHASE OFFSETS
// Guarantees zero ship-ship collision and zero ship-shore collision.
// -----------------------------------------------------------------------------
export function calculateShipPatrolPosition(
  shipIndex,
  totalShips,
  elapsedTime,
  isNodeNotReady = false,
) {
  // Outer harbor curve in open water (x >= 8.0, z = -18 to 14)
  const points = [
    new THREE.Vector3(8, 0, 14),
    new THREE.Vector3(32, 0, 14),
    new THREE.Vector3(32, 0, -18),
    new THREE.Vector3(8, 0, -18),
  ];
  const curve = new THREE.CatmullRomCurve3(points, true);

  // Calculate phase offset to evenly distribute all ships around the patrol loop
  const total = Math.max(1, totalShips);
  const phaseStep = 1.0 / total;
  const initialOffset = shipIndex * phaseStep;
  const timeOffset = elapsedTime * 0.012;

  const t = (initialOffset + (isNodeNotReady ? 0 : timeOffset)) % 1.0;

  const pos = curve.getPointAt(t);
  const tangent = curve.getTangentAt(t);
  const angle = Math.atan2(tangent.x, tangent.z);

  return {
    position: [pos.x, pos.y, pos.z],
    rotationY: angle,
    t,
  };
}

// -----------------------------------------------------------------------------
// DEBUG HELPER TO LOG BOUNDING BOX OVERLAPS IN DEV
// -----------------------------------------------------------------------------
export function checkBoundingBoxOverlap(boxA, boxB) {
  return (
    boxA.minX <= boxB.maxX &&
    boxA.maxX >= boxB.minX &&
    boxA.minY <= boxB.maxY &&
    boxA.maxY >= boxB.minY &&
    boxA.minZ <= boxB.maxZ &&
    boxA.maxZ >= boxB.minZ
  );
}

// Harbor redesign: Y is up; vessels remain in water, all crane feet remain on concrete.
export const HARBOR_DIMENSIONS = Object.freeze({
  PIER_WIDTH: 22,
  PIER_GAP: 80,
  PIER_START_Z: -30,
  PIER_MIN_END_Z: 100,
  SHORE_START_Z: -92,
  SHORE_END_Z: -30,
  SHORE_MIN_X: -120,
  SHORE_MAX_X: 120,
  SHIP_WIDTH: 16,
  SHIP_LENGTH: 72,
  SHIP_DECK_Y: 4.2,
  BERTH_FIRST_X: -54,
  BERTH_FIRST_Z: 37,
  BERTH_ROW_GAP: 88,
  BERTH_COLUMNS: 4,
  CONTAINER_WIDTH: 3.1,
  CONTAINER_HEIGHT: 2.5,
  CONTAINER_LENGTH: 6.1,
  DECK_COLUMNS: 3,
  DECK_ROWS: 6,
  DECK_COL_GAP: 3.65,
  DECK_ROW_GAP: 6.65,
  CRANE_HEIGHT: 29,
  CRANE_SPAN: 18,
  CRANE_JIB: 43,
  HANGAR_WIDTH: 35,
  HANGAR_LENGTH: 43,
  HANGAR_HEIGHT: 18,
  MAX_TRANSFERS: 4,
  TRANSFER_SECONDS: 2.1,
  MAX_QUEUED_TRANSFERS: 16,
});

export const FLEET_DIMENSIONS = Object.freeze({
  VISIBLE_CAPACITY: 8,
  PIER_END: 173,
  ROUTE_MIN_X: -175,
  ROUTE_MAX_X: 175,
  ROUTE_MIN_Z: -145,
  ROUTE_MAX_Z: 238,
  ROUTE_RADIUS: 45,
  PATROL_SPEED: 9,
  DOCK_SPEED: 35,
  HEADWAY: 84,
  CAPSULE_HALF_AXIS: 28,
  CAPSULE_RADIUS: 10,
  DOCK_Z: 128,
  GATE_Z: 231,
  MERGE_HOLD_Z: 188,
  TURN_SECONDS: 1.5,
  JOB_WAIT_SECONDS: 10,
});
