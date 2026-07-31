import { useClusterConnection } from '../context/ShipyardClusterContext'

// Backward-compatible hook wrapper that delegates directly to the single global ShipyardClusterContext
export function useShipyardWebSocket() {
  return useClusterConnection()
}
