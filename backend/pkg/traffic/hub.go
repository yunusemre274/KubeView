package traffic

import (
	"bufio"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	corev1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/labels"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/kubernetes"
)

const maxScopes = 8
const maxLeases = 32
const maxEvents = 4096
const maxFlowGroups = 512

// Field masks apply at the Hubble server, then decodeObservation applies a
// second local whitelist. No URL/header/query/payload/label field is requested.
const flowFieldMask = "time,uuid,Type,verdict,IP.source,IP.destination,l4,source.namespace,source.pod_name,source.cluster_name,destination.namespace,destination.pod_name,destination.cluster_name,node_name,traffic_direction,l7.type,l7.latency_ns,l7.http.code,l7.http.protocol,l7.dns.rcode,l7.kafka.error_code,drop_reason_desc,is_reply"

type Hub struct {
	cfg       Config
	tls       bool
	directory string
	mu        sync.Mutex
	scopes    map[string]*collection
	closed    bool
	janitor   bool
	wg        sync.WaitGroup
}
type collection struct {
	hub                                 *Hub
	key, namespace, contextName         string
	allowNodes                          bool
	namespaceScopes                     []NamespaceScope
	strictEndpoints                     bool
	allowedEndpoints                    map[string]bool
	ctx                                 context.Context
	cancel                              context.CancelFunc
	done                                chan struct{}
	startOnce                           sync.Once
	mu                                  sync.Mutex
	leases                              map[string]time.Time
	history                             *podHistory
	refreshMu                           sync.Mutex
	lastRefresh                         time.Time
	metadataError                       string
	status, errorText                   string
	lastUpdate, lastHealth              *time.Time
	events                              [maxEvents]observedFlow
	position, count                     int
	seen                                map[string]time.Time
	dropped, filtered, duplicates, lost uint64
	queueDrops                          atomic.Uint64
}
type streamRecord struct {
	flow *observedFlow
	lost uint64
	err  error
}

func NewHub(cfg Config) (*Hub, error) {
	validated, tls, err := cfg.validate()
	if err != nil {
		return nil, err
	}
	h := &Hub{cfg: validated, tls: tls, scopes: map[string]*collection{}}
	if !cfg.Enabled {
		return h, nil
	}
	directory, err := os.MkdirTemp("", "kubeview-hubble-")
	if err != nil {
		return nil, fmt.Errorf("Hubble özel yapılandırma dizini oluşturulamadı")
	}
	h.directory = directory
	if err = os.WriteFile(filepath.Join(directory, "empty.yaml"), []byte("{}\n"), 0600); err != nil {
		os.RemoveAll(directory)
		return nil, fmt.Errorf("Hubble özel yapılandırması yazılamadı")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	command := h.command(ctx, []string{"version"})
	version := boundedCapture{limit: 4096}
	command.Stdout = &version
	command.Stderr = &boundedDiscard{limit: 4096}
	if err = command.Run(); err != nil || !regexp.MustCompile(`(^|[[:space:]])v?1[.]20[.]2([@+[:space:]-]|$)`).Match(version.data) {
		os.RemoveAll(directory)
		return nil, fmt.Errorf("Bu adaptör doğrulanmış Hubble CLI %s gerektiriyor", supportedCLIVersion)
	}
	return h, nil
}

func (h *Hub) base(contextName, namespace, status string) Snapshot {
	return Snapshot{Status: status, Provider: "hubble", Context: contextName, ClusterUID: h.cfg.ClusterUID, Namespace: namespace, WindowSeconds: int(Window / time.Second), ObservedAt: time.Now().UTC(), Flows: []Flow{}, Units: "flow observations / 10 seconds; not packets, bytes or bandwidth; provider loss may have wider scope"}
}

var namespacePattern = regexp.MustCompile(`^[a-z0-9]([-a-z0-9]*[a-z0-9])?$`)
var leasePattern = regexp.MustCompile(`^[A-Za-z0-9_-]{1,128}$`)

func normalizeLease(ids []string) (string, error) {
	if len(ids) == 0 {
		return "legacy", nil
	}
	if len(ids) != 1 || !leasePattern.MatchString(ids[0]) {
		return "", apierrors.NewBadRequest("Geçersiz trafik aboneliği kimliği")
	}
	return ids[0], nil
}

func (h *Hub) Snapshot(ctx context.Context, client kubernetes.Interface, contextName, namespace string, allowNodes bool, leaseIDs ...string) (Snapshot, error) {
	if namespace == "all" || namespace == "*" {
		namespace = ""
	}
	return h.snapshotScopes(ctx, client, contextName, namespace, nil, allowNodes, leaseIDs...)
}

// NamespaceScope is explicit metadata authorization, not a Hubble privilege.
// Selectors are ORed within a namespace; both flow endpoints must be covered.
// Empty Namespace is allowed only when the caller explicitly authorized all.
type NamespaceScope struct {
	Namespace string `json:"namespace"`
	Selector  string `json:"selector"`
}

func normalizeNamespaceScopes(scopes []NamespaceScope) ([]NamespaceScope, string, error) {
	if len(scopes) == 0 || len(scopes) > 128 {
		return nil, "", apierrors.NewBadRequest("Explicit traffic namespace scopes required (max128)")
	}
	out := []NamespaceScope{}
	seen := map[string]bool{}
	for _, scope := range scopes {
		if scope.Namespace == "*" {
			scope.Namespace = ""
		}
		if scope.Namespace != "" && (len(scope.Namespace) > 63 || !namespacePattern.MatchString(scope.Namespace)) {
			return nil, "", apierrors.NewBadRequest("Invalid traffic namespace")
		}
		parsed, err := labels.Parse(scope.Selector)
		if err != nil {
			return nil, "", apierrors.NewBadRequest("Invalid traffic selector")
		}
		scope.Selector = parsed.String()
		key := scope.Namespace + "\x00" + scope.Selector
		if !seen[key] {
			out = append(out, scope)
			seen[key] = true
		}
	}
	sort.Slice(out, func(i, j int) bool {
		if out[i].Namespace == out[j].Namespace {
			return out[i].Selector < out[j].Selector
		}
		return out[i].Namespace < out[j].Namespace
	})
	b, _ := json.Marshal(out)
	sum := sha256.Sum256(b)
	return out, "scopes:" + hex.EncodeToString(sum[:16]), nil
}
func (h *Hub) SnapshotScopes(ctx context.Context, client kubernetes.Interface, contextName string, scopes []NamespaceScope, allowNodes bool, leaseIDs ...string) (Snapshot, error) {
	normalized, key, err := normalizeNamespaceScopes(scopes)
	if err != nil {
		return h.base(contextName, "", "forbidden"), err
	}
	return h.snapshotScopes(ctx, client, contextName, key, normalized, allowNodes, leaseIDs...)
}
func (h *Hub) snapshotScopes(ctx context.Context, client kubernetes.Interface, contextName, namespace string, scopes []NamespaceScope, allowNodes bool, leaseIDs ...string) (Snapshot, error) {
	if !h.cfg.Enabled {
		return h.base(contextName, namespace, "disabled"), nil
	}
	base := h.base(contextName, namespace, "forbidden")
	identity := requestIdentity(ctx)
	if contextName != h.cfg.Context || identity == "" || client == nil {
		return base, apierrors.NewForbidden(schema.GroupResource{Resource: "traffic"}, "", fmt.Errorf("Trafik context/kimlik eşlemesi doğrulanamadı"))
	}
	if scopes == nil && namespace != "" && (len(namespace) > 63 || !namespacePattern.MatchString(namespace)) {
		return base, apierrors.NewBadRequest("Geçerli namespace gerekli")
	}
	lease, err := normalizeLease(leaseIDs)
	if err != nil {
		return base, err
	}
	key := contextName + "\x00" + identity + "\x00" + namespace + fmt.Sprintf("\x00%t", allowNodes)
	h.mu.Lock()
	if h.closed {
		h.mu.Unlock()
		base.Status = "error"
		return base, apierrors.NewServiceUnavailable("Trafik sağlayıcısı kapalı")
	}
	scope := h.scopes[key]
	if scope == nil {
		if len(h.scopes) >= maxScopes {
			h.mu.Unlock()
			base.Status = "error"
			return base, apierrors.NewServiceUnavailable("Trafik kapsamı sınırına ulaşıldı")
		}
		collectorCtx, cancel := context.WithCancel(context.Background())
		scope = &collection{hub: h, key: key, namespace: namespace, contextName: contextName, allowNodes: allowNodes, namespaceScopes: scopes, strictEndpoints: scopes != nil, ctx: collectorCtx, cancel: cancel, done: make(chan struct{}), leases: map[string]time.Time{}, history: newHistory(), status: "connecting", seen: map[string]time.Time{}}
		h.scopes[key] = scope
	}
	scope.mu.Lock()
	if _, exists := scope.leases[lease]; !exists && len(scope.leases) >= maxLeases {
		scope.mu.Unlock()
		h.mu.Unlock()
		base.Status = "error"
		return base, apierrors.NewServiceUnavailable("Trafik istemci aboneliği sınırına ulaşıldı")
	}
	scope.leases[lease] = time.Now()
	scope.mu.Unlock()
	if !h.janitor {
		h.janitor = true
		h.wg.Add(1)
		go h.expireLeases()
	}
	h.mu.Unlock()
	if err = scope.refreshPods(ctx, client); err != nil {
		if apierrors.IsForbidden(err) || apierrors.IsUnauthorized(err) {
			h.removeScope(key, scope)
			return base, err
		}
		if ctx.Err() != nil {
			h.ReleaseIdentity(ctx, contextName, namespace, lease)
			return h.base(contextName, namespace, "error"), ctx.Err()
		}
	}
	// Close and lease expiry share this mutex: no worker can be added after
	// Close starts waiting, nor started after its scope was removed.
	h.mu.Lock()
	if h.closed || h.scopes[key] != scope {
		h.mu.Unlock()
		return h.base(contextName, namespace, "error"), apierrors.NewServiceUnavailable("Trafik aboneliği kapandı")
	}
	scope.startOnce.Do(func() { h.wg.Add(1); go scope.run() })
	h.mu.Unlock()
	return scope.snapshot(time.Now().UTC(), selectedUID(ctx)), nil
}

func (s *collection) refreshPods(ctx context.Context, client kubernetes.Interface) error {
	s.refreshMu.Lock()
	defer s.refreshMu.Unlock()
	if time.Since(s.lastRefresh) < 2*time.Second {
		return nil
	}
	requestCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	namespaces := s.namespaces()
	pods := []corev1.Pod{}
	var err error
	for _, namespace := range namespaces {
		list, e := client.CoreV1().Pods(namespace).List(requestCtx, metav1.ListOptions{})
		if e != nil {
			err = e
			break
		}
		for _, pod := range list.Items {
			if s.podAllowed(&pod) {
				pods = append(pods, pod)
			}
		}
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	s.lastRefresh = time.Now()
	if err != nil {
		s.history.breakContinuity()
		s.metadataError = "Kubernetes Pod kimlik gözlemleri güncellenemiyor"
		return err
	}
	s.history.observe(pods, time.Now().UTC())
	if s.strictEndpoints {
		s.allowedEndpoints = map[string]bool{}
		for _, pod := range pods {
			ips := pod.Status.PodIPs
			if len(ips) == 0 && pod.Status.PodIP != "" {
				ips = []corev1.PodIP{{IP: pod.Status.PodIP}}
			}
			for _, ip := range ips {
				if len(s.allowedEndpoints) >= maxHistoryBindings {
					break
				}
				s.allowedEndpoints[pod.Namespace+"\x00"+pod.Name+"\x00"+ip.IP] = true
			}
		}
	}
	s.metadataError = ""
	return nil
}
func (s *collection) namespaces() []string {
	if s.namespaceScopes == nil {
		return []string{s.namespace}
	}
	out := []string{}
	seen := map[string]bool{}
	for _, scope := range s.namespaceScopes {
		if scope.Namespace == "" {
			return []string{""}
		}
		if !seen[scope.Namespace] {
			out = append(out, scope.Namespace)
			seen[scope.Namespace] = true
		}
	}
	return out
}
func (s *collection) podAllowed(pod *corev1.Pod) bool {
	if s.namespaceScopes == nil {
		return true
	}
	for _, scope := range s.namespaceScopes {
		if scope.Namespace != "" && scope.Namespace != pod.Namespace {
			continue
		}
		selector, _ := labels.Parse(scope.Selector)
		if selector.Matches(labels.Set(pod.Labels)) {
			return true
		}
	}
	return false
}
func (s *collection) endpointAllowed(endpoint observedEndpoint) bool {
	if !s.strictEndpoints {
		return true
	}
	return s.allowedEndpoints[endpoint.namespace+"\x00"+endpoint.name+"\x00"+endpoint.ip]
}
func (s *collection) flowAllowed(row observedFlow) bool {
	if s.namespaceScopes == nil {
		return row.permitted(s.namespace)
	}
	allowed := func(ns string) bool {
		for _, scope := range s.namespaceScopes {
			if scope.Namespace == "" || scope.Namespace == ns {
				return true
			}
		}
		return false
	}
	return allowed(row.source.namespace) && allowed(row.destination.namespace)
}

func (h *Hub) removeScope(key string, scope *collection) {
	h.mu.Lock()
	if h.scopes[key] == scope {
		delete(h.scopes, key)
		scope.cancel()
	}
	h.mu.Unlock()
}

// ReleaseIdentity releases only the caller's leases. A browser-provided lease
// identifier never grants permission to cancel another authenticated reader.
func (h *Hub) ReleaseIdentity(ctx context.Context, contextName, namespace string, leaseIDs ...string) {
	identity := requestIdentity(ctx)
	if identity == "" {
		return
	}
	h.release(contextName, namespace, identity, leaseIDs...)
}
func (h *Hub) ReleaseScopesIdentity(ctx context.Context, contextName string, scopes []NamespaceScope, leaseIDs ...string) {
	_, key, err := normalizeNamespaceScopes(scopes)
	if err != nil {
		return
	}
	h.ReleaseIdentity(ctx, contextName, key, leaseIDs...)
}

// Release is an operator-side cleanup helper; HTTP handlers use ReleaseIdentity.
func (h *Hub) Release(contextName, namespace string, leaseIDs ...string) {
	h.release(contextName, namespace, "", leaseIDs...)
}
func (h *Hub) release(contextName, namespace, identity string, leaseIDs ...string) {
	if namespace == "all" || namespace == "*" {
		namespace = ""
	}
	lease, err := normalizeLease(leaseIDs)
	if err != nil {
		return
	}
	h.mu.Lock()
	defer h.mu.Unlock()
	for key, scope := range h.scopes {
		if scope.contextName != contextName || scope.namespace != namespace || (identity != "" && !strings.HasPrefix(key, contextName+"\x00"+identity+"\x00")) {
			continue
		}
		scope.mu.Lock()
		delete(scope.leases, lease)
		empty := len(scope.leases) == 0
		scope.mu.Unlock()
		if empty {
			delete(h.scopes, key)
			scope.cancel()
		}
	}
}
func (h *Hub) expireLeases() {
	defer h.wg.Done()
	ticker := time.NewTicker(time.Second)
	defer ticker.Stop()
	for range ticker.C {
		h.mu.Lock()
		now := time.Now()
		for key, scope := range h.scopes {
			scope.mu.Lock()
			for lease, last := range scope.leases {
				if now.Sub(last) > leaseTTL {
					delete(scope.leases, lease)
				}
			}
			empty := len(scope.leases) == 0
			scope.mu.Unlock()
			if empty {
				delete(h.scopes, key)
				scope.cancel()
			}
		}
		if h.closed || len(h.scopes) == 0 {
			h.janitor = false
			h.mu.Unlock()
			return
		}
		h.mu.Unlock()
	}
}
func (h *Hub) Close() {
	h.mu.Lock()
	if h.closed {
		h.mu.Unlock()
		return
	}
	h.closed = true
	for _, scope := range h.scopes {
		scope.cancel()
	}
	h.scopes = map[string]*collection{}
	h.mu.Unlock()
	h.wg.Wait()
	if h.directory != "" {
		os.RemoveAll(h.directory)
	}
}

type boundedDiscard struct{ limit, written int }

type boundedCapture struct {
	limit int
	data  []byte
}

func (w *boundedCapture) Write(data []byte) (int, error) {
	n := len(data)
	if remaining := w.limit - len(w.data); remaining > 0 {
		if remaining > n {
			remaining = n
		}
		w.data = append(w.data, data[:remaining]...)
	}
	return n, nil
}

func (w *boundedDiscard) Write(data []byte) (int, error) {
	n := len(data)
	remaining := w.limit - w.written
	if remaining > 0 {
		if remaining > n {
			remaining = n
		}
		w.written += remaining
	}
	return n, nil
}

func (h *Hub) command(ctx context.Context, args []string) *exec.Cmd {
	command := exec.CommandContext(ctx, h.cfg.Binary, args...)
	command.Env = safeEnvironment(h.directory)
	command.WaitDelay = 2 * time.Second
	configureHubbleProcess(command)
	return command
}
func (h *Hub) serverArguments() []string {
	args := []string{"--config", filepath.Join(h.directory, "empty.yaml"), "--server", h.cfg.Server, "--timeout", "3s", "--request-timeout", "3s", "--port-forward=false"}
	if h.tls {
		args = append(args, "--tls")
	}
	if h.cfg.TLSCA != "" {
		args = append(args, "--tls-ca-cert-files", h.cfg.TLSCA)
	}
	if h.cfg.TLSCert != "" {
		args = append(args, "--tls-client-cert-file", h.cfg.TLSCert, "--tls-client-key-file", h.cfg.TLSKey)
	}
	if h.cfg.TLSServerName != "" {
		args = append(args, "--tls-server-name", h.cfg.TLSServerName)
	}
	return args
}

func (s *collection) run() {
	defer s.hub.wg.Done()
	defer close(s.done)
	delay := 2 * time.Second
	for {
		if s.ctx.Err() != nil {
			return
		}
		s.runStream()
		if s.ctx.Err() != nil {
			return
		}
		// A live layer retries a disconnected provider without replaying old
		// observations. Its finite lease still owns and cancels every attempt.
		timer := time.NewTimer(delay)
		select {
		case <-s.ctx.Done():
			timer.Stop()
			return
		case <-timer.C:
		}
		if delay < 10*time.Second {
			delay *= 2
			if delay > 10*time.Second {
				delay = 10 * time.Second
			}
		}
	}
}

func (s *collection) runStream() {
	streamCtx, stopStream := context.WithCancel(s.ctx)
	defer stopStream()
	args := append(s.hub.serverArguments(), "observe", "--follow", "--since", time.Now().UTC().Format(time.RFC3339Nano), "--output", "jsonpb", "--field-mask", flowFieldMask)
	namespaces := s.namespaces()
	if len(namespaces) > 0 && namespaces[0] != "" {
		for _, namespace := range namespaces {
			args = append(args, "--from-namespace", namespace, "--to-namespace", namespace)
		}
	} else {
		args = append(args, "--all-namespaces")
	}
	command := s.hub.command(streamCtx, args)
	stdout, err := command.StdoutPipe()
	if err != nil {
		s.setFailure("Hubble akış taşıması açılamadı")
		return
	}
	command.Stderr = &boundedDiscard{limit: 4096}
	if err = command.Start(); err != nil {
		s.setFailure("Hubble okuma işlemi başlatılamadı")
		return
	}
	records := make(chan streamRecord, 256)
	readerDone := make(chan struct{})
	go func() {
		defer close(readerDone)
		defer close(records)
		scanner := bufio.NewScanner(stdout)
		scanner.Buffer(make([]byte, 8192), 256<<10)
		for scanner.Scan() {
			flow, lost, e := decodeObservation(scanner.Bytes())
			record := streamRecord{flow: flow, lost: lost, err: e}
			select {
			case records <- record:
			default:
				s.queueDrops.Add(1)
			}
			if e != nil {
				return
			}
			select {
			case <-streamCtx.Done():
				return
			default:
			}
		}
		if scanner.Err() != nil {
			select {
			case records <- streamRecord{err: fmt.Errorf("Hubble kayıt boyutu veya taşıma sınırı aşıldı")}:
			default:
				s.queueDrops.Add(1)
			}
		}
	}()
	health := make(chan bool, 1)
	healthDone := make(chan struct{})
	go func() {
		defer close(healthDone)
		ticker := time.NewTicker(5 * time.Second)
		defer ticker.Stop()
		for {
			ctx, cancel := context.WithTimeout(streamCtx, 4*time.Second)
			probe := s.hub.command(ctx, append(s.hub.serverArguments(), "status"))
			probe.Stdout = &boundedDiscard{limit: 4096}
			probe.Stderr = &boundedDiscard{limit: 4096}
			ok := probe.Run() == nil
			cancel()
			select {
			case health <- ok:
			case <-streamCtx.Done():
				return
			}
			select {
			case <-streamCtx.Done():
				return
			case <-ticker.C:
			}
		}
	}()
	defer func() { stopStream(); command.Wait(); <-readerDone; <-healthDone }()
	for {
		select {
		case <-s.ctx.Done():
			return
		case ok := <-health:
			s.mu.Lock()
			if ok {
				now := time.Now().UTC()
				s.lastHealth = &now
				s.status = "live"
				s.errorText = ""
			} else {
				s.status = "stale"
				s.errorText = "Hubble bağlantı sağlığı doğrulanamıyor"
			}
			s.mu.Unlock()
		case record, ok := <-records:
			if !ok {
				s.setFailure("Hubble akışı kapandı; yeni veri iddiası durduruldu")
				return
			}
			if record.err != nil {
				s.setFailure(record.err.Error())
				return
			}
			s.mu.Lock()
			s.lost += record.lost
			if record.flow != nil {
				s.ingest(*record.flow, time.Now().UTC())
			}
			s.mu.Unlock()
		}
	}
}
func (s *collection) setFailure(message string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.lastUpdate != nil {
		s.status = "stale"
	} else {
		s.status = "error"
	}
	s.errorText = message
}
func (s *collection) ingest(row observedFlow, now time.Time) {
	if !s.flowAllowed(row) || !s.endpointAllowed(row.source) || !s.endpointAllowed(row.destination) || (row.source.cluster != "" && row.source.cluster != s.hub.cfg.ClusterName) || (row.destination.cluster != "" && row.destination.cluster != s.hub.cfg.ClusterName) || row.at.Before(now.Add(-Window)) || row.at.After(now.Add(time.Second)) {
		s.filtered++
		return
	}
	if _, exists := s.seen[row.uuid]; exists {
		s.duplicates++
		return
	}
	if s.count == maxEvents {
		old := s.events[s.position]
		delete(s.seen, old.uuid)
		if !old.at.Before(now.Add(-Window)) {
			s.dropped++
		}
	} else {
		s.count++
	}
	s.events[s.position] = row
	s.position = (s.position + 1) % maxEvents
	s.seen[row.uuid] = row.at
	if s.lastUpdate == nil || row.at.After(*s.lastUpdate) {
		at := row.at
		s.lastUpdate = &at
	}
	s.status = "live"
	s.errorText = ""
}

func (s *collection) snapshot(now time.Time, preferredUIDs ...string) Snapshot {
	s.mu.Lock()
	defer s.mu.Unlock()
	result := s.hub.base(s.contextName, s.namespace, s.status)
	if s.namespaceScopes != nil {
		result.Namespace = ""
		result.NamespaceScopes = append([]NamespaceScope(nil), s.namespaceScopes...)
	}
	result.UpdatedAt = s.lastUpdate
	result.Dropped = s.dropped + s.queueDrops.Load() + s.lost
	result.FilteredEvents = s.filtered
	result.DuplicateEvents = s.duplicates
	result.ProviderLostEvents = s.lost
	result.MappingDropped = s.history.dropped
	result.Error = s.errorText
	if s.metadataError != "" {
		result.Status = "stale"
		result.Error = s.metadataError
	}
	groups := map[string]*Flow{}
	count := uint64(0)
	cutoff := now.Add(-Window)
	for i := 0; i < s.count; i++ {
		row := s.events[i]
		if row.at.Before(cutoff) || row.at.After(now) {
			continue
		}
		if !s.endpointAllowed(row.source) || !s.endpointAllowed(row.destination) {
			continue
		}
		source, destination := s.history.endpoint(row.source, row.at, s.allowNodes), s.history.endpoint(row.destination, row.at, s.allowNodes)
		if (row.source.cluster == "" || row.destination.cluster == "") && (source.UID == nil || destination.UID == nil) {
			result.UnverifiedClusterEvents++
			continue
		}
		count++
		flow := Flow{Source: source, Destination: destination, Protocol: row.protocol, TransportProtocol: row.transport, Verdict: row.verdict, Direction: row.direction, FirstObserved: row.at, LastObserved: row.at, EventCount: 1, LatencyMS: row.latencyMS, HTTPCode: row.httpCode, HTTPProtocol: row.httpProtocol, DNSRcode: row.dnsRcode, DropReason: row.dropReason, IsReply: row.isReply}
		flow.ID = flowGroupKey(flow)
		if group := groups[flow.ID]; group != nil {
			group.EventCount++
			if row.at.Before(group.FirstObserved) {
				group.FirstObserved = row.at
			}
			if row.at.After(group.LastObserved) {
				group.LastObserved = row.at
				group.LatencyMS = row.latencyMS
			}
		} else {
			copy := flow
			groups[flow.ID] = &copy
		}
	}
	result.TotalFlowGroups = len(groups)
	result.Summarized = count - uint64(len(groups))
	all := make([]Flow, 0, len(groups))
	for _, flow := range groups {
		all = append(all, *flow)
	}
	preferred := ""
	if len(preferredUIDs) > 0 {
		preferred = preferredUIDs[0]
	}
	matchesSelection := func(flow Flow) bool {
		return preferred != "" && ((flow.Source.UID != nil && *flow.Source.UID == preferred) || (flow.Destination.UID != nil && *flow.Destination.UID == preferred))
	}
	sort.Slice(all, func(i, j int) bool {
		if selectedI, selectedJ := matchesSelection(all[i]), matchesSelection(all[j]); selectedI != selectedJ {
			return selectedI
		}
		if all[i].LastObserved.Equal(all[j].LastObserved) {
			return all[i].ID < all[j].ID
		}
		return all[i].LastObserved.After(all[j].LastObserved)
	})
	if len(all) > maxFlowGroups {
		result.OmittedGroups = len(all) - maxFlowGroups
		all = all[:maxFlowGroups]
	}
	result.Flows = all
	return result
}
