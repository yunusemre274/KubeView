package api

import "time"

// MessageType defines the category of WebSocket messages.
type MessageType string

const (
	TypeInitialState  MessageType = "INITIAL_STATE"
	TypeResourceEvent MessageType = "RESOURCE_EVENT"
	TypeMetricsUpdate MessageType = "METRICS_UPDATE"
	TypePing          MessageType = "PING"
	TypePong          MessageType = "PONG"
	TypeError         MessageType = "ERROR"
)

// ResourceAction defines the CRUD action fanned out by Informers.
type ResourceAction string

const (
	ActionAdd    ResourceAction = "ADD"
	ActionUpdate ResourceAction = "UPDATE"
	ActionDelete ResourceAction = "DELETE"
)

// ResourceKind defines the Kubernetes resource kind.
type ResourceKind string

const (
	KindNode       ResourceKind = "Node"
	KindPod        ResourceKind = "Pod"
	KindDeployment ResourceKind = "Deployment"
	KindService    ResourceKind = "Service"
	KindEvent      ResourceKind = "Event"
)

// ResourceMetrics contains CPU & RAM metrics data.
type ResourceMetrics struct {
	CPUUsage    string  `json:"cpu_usage"`
	MemoryUsage string  `json:"memory_usage"`
	CPUPercent  float64 `json:"cpu_percent,omitempty"`
	MemPercent  float64 `json:"mem_percent,omitempty"`
}

// ShipyardMetaphor holds the mapping data to help 3D frontend render shipyard elements easily.
type ShipyardMetaphor struct {
	MetaphorRole string          `json:"metaphor_role"` // e.g. "Gemi (Node)", "Palet (Pod)", "Kontrol Kulesi (API Server)"
	ContainerID  string          `json:"container_id,omitempty"`
	NodeName     string          `json:"node_name,omitempty"`     // Target ship for Pods
	Compartment  string          `json:"compartment,omitempty"`   // Namespace (Ambar)
	HealthState  string          `json:"health_state,omitempty"`  // "SAFE", "WARNING", "CRITICAL"
	Metrics      ResourceMetrics `json:"metrics,omitempty"`
}

// ResourcePayload represents the detailed payload inside a RESOURCE_EVENT message.
type ResourcePayload struct {
	Action    ResourceAction   `json:"action"`
	Kind      ResourceKind     `json:"kind"`
	Namespace string           `json:"namespace,omitempty"`
	Name      string           `json:"name"`
	Status    string           `json:"status"`
	Message   string           `json:"message,omitempty"`
	Metaphor  ShipyardMetaphor `json:"metaphor"`
	Object    interface{}      `json:"object,omitempty"`
}

// InitialStatePayload is sent to newly connected WebSocket clients.
type InitialStatePayload struct {
	ClusterName  string            `json:"cluster_name"`
	Nodes        []ResourcePayload `json:"nodes"`
	Pods         []ResourcePayload `json:"pods"`
	TotalShips   int               `json:"total_ships"`
	TotalPallets int               `json:"total_pallets"`
}

// WSMessage is the top-level WebSocket envelope.
type WSMessage struct {
	Type      MessageType `json:"type"`
	Timestamp string      `json:"timestamp"`
	Payload   interface{} `json:"payload"`
}

// NewWSMessage creates a timestamped WSMessage envelope.
func NewWSMessage(msgType MessageType, payload interface{}) WSMessage {
	return WSMessage{
		Type:      msgType,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Payload:   payload,
	}
}
