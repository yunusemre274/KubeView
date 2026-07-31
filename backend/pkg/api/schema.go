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
	KindNode               ResourceKind = "Node"
	KindPod                ResourceKind = "Pod"
	KindDeployment         ResourceKind = "Deployment"
	KindStatefulSet        ResourceKind = "StatefulSet"
	KindDaemonSet          ResourceKind = "DaemonSet"
	KindJob                ResourceKind = "Job"
	KindCronJob            ResourceKind = "CronJob"
	KindService            ResourceKind = "Service"
	KindEvent              ResourceKind = "Event"
	KindConfigMap          ResourceKind = "ConfigMap"
	KindSecret             ResourceKind = "Secret"
	KindPVC                ResourceKind = "PersistentVolumeClaim"
	KindPV                 ResourceKind = "PersistentVolume"
	KindServiceAccount     ResourceKind = "ServiceAccount"
	KindRole               ResourceKind = "Role"
	KindClusterRole        ResourceKind = "ClusterRole"
	KindRoleBinding        ResourceKind = "RoleBinding"
	KindClusterRoleBinding ResourceKind = "ClusterRoleBinding"
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
	KeyNames  []string `json:"key_names"`
	UsedBy    []string `json:"used_by,omitempty"`
	CreatedAt string   `json:"created_at,omitempty"`
}

// PVCInfo holds PersistentVolumeClaim details for inspection.
type PVCInfo struct {
	Name              string   `json:"name"`
	Namespace         string   `json:"namespace"`
	Status            string   `json:"status"`
	RequestedCapacity string   `json:"requested_capacity"`
	BoundPV           string   `json:"bound_pv,omitempty"`
	StorageClass      string   `json:"storage_class,omitempty"`
	AccessModes       []string `json:"access_modes,omitempty"`
	UsedByPods        []string `json:"used_by_pods,omitempty"`
	CreatedAt         string   `json:"created_at,omitempty"`
}

// PVInfo holds PersistentVolume details for inspection.
type PVInfo struct {
	Name          string `json:"name"`
	Status        string `json:"status"`
	Capacity      string `json:"capacity"`
	StorageClass  string `json:"storage_class,omitempty"`
	ReclaimPolicy string `json:"reclaim_policy,omitempty"`
	BoundPVC      string `json:"bound_pvc,omitempty"`
	BackendType   string `json:"backend_type,omitempty"`
	CreatedAt     string `json:"created_at,omitempty"`
}

// StatefulSetInfo holds StatefulSet workload details.
type StatefulSetInfo struct {
	Name          string   `json:"name"`
	Namespace     string   `json:"namespace"`
	Replicas      int32    `json:"replicas"`
	ReadyReplicas int32    `json:"ready_replicas"`
	ServiceName   string   `json:"service_name,omitempty"`
	VolumeClaim   string   `json:"volume_claim,omitempty"`
	PodNames      []string `json:"pod_names,omitempty"`
}

// DaemonSetInfo holds DaemonSet workload details.
type DaemonSetInfo struct {
	Name          string   `json:"name"`
	Namespace     string   `json:"namespace"`
	DesiredNumber int32    `json:"desired_number"`
	CurrentNumber int32    `json:"current_number"`
	NumberReady   int32    `json:"number_ready"`
	NodeNames     []string `json:"node_names,omitempty"`
}

// JobInfo holds Job batch workload details.
type JobInfo struct {
	Name        string `json:"name"`
	Namespace   string `json:"namespace"`
	Completions int32  `json:"completions"`
	Succeeded   int32  `json:"succeeded"`
	Failed      int32  `json:"failed"`
	Status      string `json:"status"`
	StartTime   string `json:"start_time,omitempty"`
	EndTime     string `json:"end_time,omitempty"`
}

// CronJobInfo holds CronJob scheduled workload details.
type CronJobInfo struct {
	Name         string `json:"name"`
	Namespace    string `json:"namespace"`
	Schedule     string `json:"schedule"`
	LastSchedule string `json:"last_schedule,omitempty"`
	ActiveJobs   int32  `json:"active_jobs"`
	Suspend      bool   `json:"suspend"`
}

// ServiceAccountInfo holds ServiceAccount identity details.
type ServiceAccountInfo struct {
	Name         string   `json:"name"`
	Namespace    string   `json:"namespace"`
	BoundRole    string   `json:"bound_role,omitempty"`
	BoundBinding string   `json:"bound_binding,omitempty"`
	UsedByPods   []string `json:"used_by_pods,omitempty"`
	IsAdmin      bool     `json:"is_admin,omitempty"`
	CreatedAt    string   `json:"created_at,omitempty"`
}

// RoleRule represents a single RBAC permission rule.
type RoleRule struct {
	Resources []string `json:"resources"`
	Verbs     []string `json:"verbs"`
}

// RoleInfo holds Role / ClusterRole details with clean permission rules table.
type RoleInfo struct {
	Name        string     `json:"name"`
	Namespace   string     `json:"namespace,omitempty"` // Empty if ClusterRole
	IsCluster   bool       `json:"is_cluster"`
	Rules       []RoleRule `json:"rules"`
	BoundSAs    []string   `json:"bound_sas,omitempty"`
	CreatedAt   string     `json:"created_at,omitempty"`
}

// ShipyardMetaphor holds the mapping data to help 3D frontend render shipyard elements easily.
type ShipyardMetaphor struct {
	MetaphorRole       string          `json:"metaphor_role"` // e.g. "Gemi (Node)", "Palet (Pod)", "Kimlik Kartı (SA)"
	ContainerID        string          `json:"container_id,omitempty"`
	NodeName           string          `json:"node_name,omitempty"`     // Target ship for Pods
	Compartment        string          `json:"compartment,omitempty"`   // Namespace (Ambar)
	HealthState        string          `json:"health_state,omitempty"`  // "SAFE", "WARNING", "CRITICAL"
	OwnerKind          string          `json:"owner_kind,omitempty"`    // "Deployment", "StatefulSet", "DaemonSet", "Job"
	OwnerName          string          `json:"owner_name,omitempty"`    // e.g. "api-backend-deploy", "redis-cache-set"
	Ordinal            string          `json:"ordinal,omitempty"`       // e.g. "#0", "#1"
	ServiceAccountName string          `json:"service_account,omitempty"`
	Metrics            ResourceMetrics `json:"metrics,omitempty"`
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
	ClusterName  string               `json:"cluster_name"`
	Nodes        []ResourcePayload    `json:"nodes"`
	Pods         []ResourcePayload    `json:"pods"`
	ConfigMaps   []ConfigMapInfo      `json:"config_maps,omitempty"`
	Secrets      []SecretInfo         `json:"secrets,omitempty"`
	PVCs         []PVCInfo            `json:"pvcs,omitempty"`
	PVs          []PVInfo             `json:"pvs,omitempty"`
	ServiceAccounts []ServiceAccountInfo `json:"service_accounts,omitempty"`
	Roles        []RoleInfo           `json:"roles,omitempty"`
	TotalShips   int                  `json:"total_ships"`
	TotalPallets int                  `json:"total_pallets"`
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
