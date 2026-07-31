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
	KindConfigMap  ResourceKind = "ConfigMap"
	KindSecret     ResourceKind = "Secret"
)

// ResourceMetrics contains CPU & RAM metrics data.
type ResourceMetrics struct {
	CPUUsage    string  `json:"cpu_usage"`
	MemoryUsage string  `json:"memory_usage"`
	CPUPercent  float64 `json:"cpu_percent,omitempty"`
	MemPercent  float64 `json:"mem_percent,omitempty"`
}

// ConfigMapInfo holds sanitized ConfigMap details for frontend inspection.
type ConfigMapInfo struct {
	Name      string            `json:"name"`
	Namespace string            `json:"namespace"`
	Data      map[string]string `json:"data"`
	UsedBy    []string          `json:"used_by,omitempty"`
	CreatedAt string            `json:"created_at,omitempty"`
}

// SecretInfo holds strictly metadata-only Secret details.
// SECURITY GUARANTEE: Data/StringData payload maps are intentionally omitted.
type SecretInfo struct {
	Name      string   `json:"name"`
	Namespace string   `json:"namespace"`
	Type      string   `json:"type"`
	KeyNames  []string `json:"key_names"` // Only key names (e.g. "username", "password"), NEVER raw values!
	UsedBy    []string `json:"used_by,omitempty"`
	CreatedAt string   `json:"created_at,omitempty"`
}

// ShipyardMetaphor holds the mapping data to help 3D frontend render shipyard elements easily.
type ShipyardMetaphor struct {
	MetaphorRole string          `json:"metaphor_role"` // e.g. "Gemi (Node)", "Palet (Pod)", "Sevkiyat Föyü (ConfigMap)", "Kilitli Kasa (Secret)"
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
	ConfigMaps   []ConfigMapInfo   `json:"config_maps,omitempty"`
	Secrets      []SecretInfo      `json:"secrets,omitempty"`
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
