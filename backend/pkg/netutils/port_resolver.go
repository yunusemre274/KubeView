package netutils

import (
	"fmt"
	"net"
	"strconv"
)

// ResolveAvailablePort checks if startPort is available. If occupied, it scans up to maxPort.
// It returns an active net.Listener and the assigned port number.
func ResolveAvailablePort(startPort, maxPort int) (net.Listener, int, error) {
	for port := startPort; port <= maxPort; port++ {
		addr := fmt.Sprintf(":%d", port)
		listener, err := net.Listen("tcp", addr)
		if err == nil {
			if port != startPort {
				fmt.Printf("\n[PORT-RESOLVER] ⚠️ Preferred port %d was in use. Automatically assigned free port %d!\n\n", startPort, port)
			} else {
				fmt.Printf("[PORT-RESOLVER] ✅ Preferred port %d is available.\n", port)
			}
			return listener, port, nil
		}
	}
	return nil, 0, fmt.Errorf("no free ports available in range %d-%d", startPort, maxPort)
}

// ParsePortEnv helper to convert environment variable string to integer port.
func ParsePortEnv(envVal string, defaultPort int) int {
	if envVal == "" {
		return defaultPort
	}
	p, err := strconv.Atoi(envVal)
	if err != nil {
		return defaultPort
	}
	return p
}
