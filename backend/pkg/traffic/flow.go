package traffic

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
	"time"
)

type Endpoint struct {
	UID            *string `json:"uid"`
	Name           string  `json:"name"`
	Namespace      string  `json:"namespace"`
	NodeName       *string `json:"nodeName"`
	NodeUID        *string `json:"nodeUID"`
	IP             string  `json:"ip"`
	Port           *uint32 `json:"port"`
	ContainerName  *string `json:"containerName"`
	IdentityStatus string  `json:"identityStatus"`
}
type Flow struct {
	ID                string    `json:"id"`
	Source            Endpoint  `json:"source"`
	Destination       Endpoint  `json:"destination"`
	Protocol          string    `json:"protocol"`
	TransportProtocol string    `json:"transportProtocol"`
	Verdict           string    `json:"verdict"`
	Direction         string    `json:"direction"`
	FirstObserved     time.Time `json:"firstObserved"`
	LastObserved      time.Time `json:"lastObserved"`
	EventCount        uint64    `json:"eventCount"`
	LatencyMS         *float64  `json:"latencyMs"`
	HTTPCode          *uint32   `json:"httpCode"`
	HTTPProtocol      *string   `json:"httpProtocol"`
	DNSRcode          *uint32   `json:"dnsRcode"`
	DropReason        *string   `json:"dropReason"`
	IsReply           *bool     `json:"isReply"`
}
type Snapshot struct {
	Status                  string           `json:"status"`
	Provider                string           `json:"provider"`
	Context                 string           `json:"context"`
	ClusterUID              string           `json:"clusterUID"`
	Namespace               string           `json:"namespace"`
	NamespaceScopes         []NamespaceScope `json:"namespaceScopes,omitempty"`
	WindowSeconds           int              `json:"windowSeconds"`
	ObservedAt              time.Time        `json:"observedAt"`
	UpdatedAt               *time.Time       `json:"updatedAt"`
	Dropped                 uint64           `json:"dropped"`
	Summarized              uint64           `json:"summarized"`
	Flows                   []Flow           `json:"flows"`
	FilteredEvents          uint64           `json:"filteredEvents"`
	DuplicateEvents         uint64           `json:"duplicateEvents"`
	ProviderLostEvents      uint64           `json:"providerLostEvents"`
	MappingDropped          uint64           `json:"mappingDropped"`
	UnverifiedClusterEvents uint64           `json:"unverifiedClusterEvents"`
	TotalFlowGroups         int              `json:"totalFlowGroups"`
	OmittedGroups           int              `json:"omittedGroups"`
	Error                   string           `json:"error,omitempty"`
	Units                   string           `json:"units"`
}
type observedEndpoint struct {
	name, namespace, ip, cluster string
	port                         *uint32
}
type observedFlow struct {
	uuid                                    string
	at                                      time.Time
	source, destination                     observedEndpoint
	protocol, transport, verdict, direction string
	latencyMS                               *float64
	httpCode, dnsRcode                      *uint32
	httpProtocol, dropReason                *string
	isReply                                 *bool
}

type object map[string]json.RawMessage

func getObject(m object, keys ...string) object {
	for _, key := range keys {
		if raw := m[key]; len(raw) > 0 && string(raw) != "null" {
			var v object
			if json.Unmarshal(raw, &v) == nil {
				return v
			}
		}
	}
	return nil
}
func getString(m object, keys ...string) string {
	for _, key := range keys {
		if raw := m[key]; len(raw) > 0 {
			var s string
			if json.Unmarshal(raw, &s) == nil {
				return s
			}
		}
	}
	return ""
}
func getUint(m object, keys ...string) *uint64 {
	for _, key := range keys {
		if raw := m[key]; len(raw) > 0 {
			var s string
			if json.Unmarshal(raw, &s) != nil {
				s = string(raw)
			}
			n, e := strconv.ParseUint(s, 10, 64)
			if e == nil {
				return &n
			}
		}
	}
	return nil
}
func uint32Value(m object, keys ...string) *uint32 {
	n := getUint(m, keys...)
	if n == nil || *n > 1<<32-1 {
		return nil
	}
	v := uint32(*n)
	return &v
}
func optionalString(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

// Decode only a privacy whitelist from JSONPB. Unknown fields such as URLs,
// headers, DNS query names, labels and payload are never retained or returned.
func decodeObservation(line []byte) (*observedFlow, uint64, error) {
	var envelope object
	if err := json.Unmarshal(line, &envelope); err != nil {
		return nil, 0, fmt.Errorf("Geçersiz Hubble JSONPB kaydı")
	}
	if lost := getObject(envelope, "lost_events", "lostEvents"); lost != nil {
		n := getUint(lost, "num_events", "numEvents")
		if n != nil {
			return nil, *n, nil
		}
		return nil, 0, nil
	}
	f := getObject(envelope, "flow")
	if f == nil {
		return nil, 0, nil
	}
	at, err := time.Parse(time.RFC3339Nano, getString(f, "time"))
	if err != nil {
		return nil, 0, fmt.Errorf("Hubble gözlem zamanı eksik veya geçersiz")
	}
	ip := getObject(f, "IP", "ip")
	src, dst := getObject(f, "source"), getObject(f, "destination")
	row := &observedFlow{uuid: getString(f, "uuid"), at: at, source: observedEndpoint{name: getString(src, "pod_name", "podName"), namespace: getString(src, "namespace"), cluster: getString(src, "cluster_name", "clusterName"), ip: getString(ip, "source")}, destination: observedEndpoint{name: getString(dst, "pod_name", "podName"), namespace: getString(dst, "namespace"), cluster: getString(dst, "cluster_name", "clusterName"), ip: getString(ip, "destination")}, verdict: getString(f, "verdict"), direction: getString(f, "traffic_direction", "trafficDirection"), dropReason: optionalString(getString(f, "drop_reason_desc", "dropReasonDesc"))}
	l4 := getObject(f, "l4")
	transport := getObject(l4, "TCP", "tcp")
	if transport != nil {
		row.transport = "TCP"
	} else {
		transport = getObject(l4, "UDP", "udp")
		if transport != nil {
			row.transport = "UDP"
		}
	}
	row.source.port = uint32Value(transport, "source_port", "sourcePort")
	row.destination.port = uint32Value(transport, "destination_port", "destinationPort")
	row.protocol = row.transport
	if row.protocol == "" {
		row.protocol = "UNKNOWN"
	}
	if row.verdict == "" {
		row.verdict = "UNKNOWN"
	}
	if row.direction == "" {
		row.direction = "UNKNOWN"
	}
	l7 := getObject(f, "l7")
	httpRecord := getObject(l7, "http", "HTTP")
	dnsRecord := getObject(l7, "dns", "DNS")
	kafkaRecord := getObject(l7, "kafka", "Kafka")
	l7Type := getString(l7, "type")
	// Cilium1.20.2 FieldMask.Alloc materializes empty nested oneof messages
	// even for genuine L3/L4 observations. Presence of l7.http:{} is not an
	// HTTP observation. Request Flow.Type plus every oneof variant's harmless
	// scalar so active DNS/HTTP/Kafka selection is preserved by FieldMask.Copy.
	recordCount := 0
	for _, record := range []object{httpRecord, dnsRecord, kafkaRecord} {
		if record != nil {
			recordCount++
		}
	}
	genuineL7 := getString(f, "Type", "type") == "L7" && (l7Type == "REQUEST" || l7Type == "RESPONSE" || l7Type == "SAMPLE") && recordCount == 1
	if genuineL7 && httpRecord != nil {
		row.protocol = "HTTP"
		row.httpCode = uint32Value(httpRecord, "code")
		row.httpProtocol = optionalString(getString(httpRecord, "protocol"))
	} else if genuineL7 && dnsRecord != nil {
		row.protocol = "DNS"
		row.dnsRcode = uint32Value(dnsRecord, "rcode")
	} else if genuineL7 {
		row.protocol = "UNKNOWN_L7"
	}
	if genuineL7 && (httpRecord != nil || dnsRecord != nil) && l7Type == "RESPONSE" {
		if latency := getUint(l7, "latency_ns", "latencyNs"); latency != nil {
			v := float64(*latency) / 1e6
			row.latencyMS = &v
		}
	}
	for _, key := range []string{"is_reply", "isReply"} {
		if raw := f[key]; len(raw) > 0 {
			var b bool
			if json.Unmarshal(raw, &b) == nil {
				row.isReply = &b
			}
		}
	}
	if row.uuid == "" {
		safe, _ := json.Marshal([]interface{}{row.at, row.source.name, row.source.namespace, row.source.ip, row.source.port, row.destination.name, row.destination.namespace, row.destination.ip, row.destination.port, row.protocol, row.verdict, row.direction})
		sum := sha256.Sum256(safe)
		row.uuid = hex.EncodeToString(sum[:])
	}
	return row, 0, nil
}
func (f observedFlow) permitted(namespace string) bool {
	if f.source.name == "" || f.destination.name == "" || f.source.namespace == "" || f.destination.namespace == "" || f.source.ip == "" || f.destination.ip == "" {
		return false
	}
	if f.source.cluster != "" && f.destination.cluster != "" && f.source.cluster != f.destination.cluster {
		return false
	}
	return namespace == "" || (f.source.namespace == namespace && f.destination.namespace == namespace)
}
func flowGroupKey(f Flow) string {
	uid := func(e Endpoint) string {
		if e.UID != nil {
			return *e.UID
		}
		return "unverified:" + e.Namespace + "/" + e.Name + "/" + e.IP
	}
	raw, _ := json.Marshal([]interface{}{uid(f.Source), f.Source.Port, uid(f.Destination), f.Destination.Port, f.Protocol, f.TransportProtocol, f.Verdict, f.Direction, f.HTTPCode, f.DNSRcode, f.IsReply})
	sum := sha256.Sum256(raw)
	return strings.ToLower(hex.EncodeToString(sum[:12]))
}
