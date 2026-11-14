// Package provision implements one explicitly configured local worker provider.
// It never accepts a command, binary, profile or host from the browser.
package provision

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
)

type Config struct {
	Enabled                                              bool
	Profile, Context, ClusterUID, Home, StateDir, Binary string
	MaxNodes                                             int
	Timeout                                              time.Duration
}
type Machine struct {
	Name string `json:"name"`
	IP   string `json:"ip"`
}
type Inventory struct {
	Driver   string
	Machines []Machine
}
type Runner interface {
	Inventory(context.Context, Config) (Inventory, error)
	ProfileUID(context.Context, Config) (string, error)
	Add(context.Context, Config, func(string), func(int)) error
	HostExists(context.Context, Config, string) (bool, error)
}
type Operation struct {
	ID              string            `json:"id"`
	KeyHash         string            `json:"keyHash"`
	Context         string            `json:"context"`
	Profile         string            `json:"profile"`
	ClusterUID      string            `json:"clusterUID"`
	Status          string            `json:"status"`
	ExpectedName    string            `json:"expectedName,omitempty"`
	NodeName        string            `json:"nodeName,omitempty"`
	NodeUID         string            `json:"nodeUID,omitempty"`
	StartedAt       time.Time         `json:"startedAt"`
	UpdatedAt       time.Time         `json:"updatedAt"`
	StageSource     string            `json:"stageSource"`
	Reason          string            `json:"reason,omitempty"`
	CancelRequested bool              `json:"cancelRequested,omitempty"`
	Before          map[string]string `json:"before"`
	ProcessPID      int               `json:"processPID,omitempty"`
	ProcessExited   bool              `json:"processExited"`
	ClaimVerified   bool              `json:"claimVerified"`
}
type Manager struct {
	mu          sync.Mutex
	cfg         Config
	runner      Runner
	operations  []Operation
	cancel      context.CancelFunc
	closed      bool
	lock        io.Closer
	profileLock io.Closer
	life        context.Context
	stop        context.CancelFunc
	wg          sync.WaitGroup
}

var profilePattern = regexp.MustCompile(`^[a-z0-9][a-z0-9-]{0,62}$`)
var requestPattern = regexp.MustCompile(`^[a-zA-Z0-9_-]{16,128}$`)

func FromEnv() Config {
	home := os.Getenv("KV_MINIKUBE_HOME")
	if home == "" {
		if h, e := os.UserHomeDir(); e == nil {
			home = filepath.Join(h, ".minikube")
		}
	}
	if home != "" && filepath.Base(home) != ".minikube" {
		home = filepath.Join(home, ".minikube")
	}
	state := os.Getenv("KV_PROVIDER_STATE_DIR")
	if state == "" {
		if h, e := os.UserHomeDir(); e == nil {
			state = filepath.Join(h, ".local", "state", "kubeview", "providers")
		}
	}
	bin := os.Getenv("KV_MINIKUBE_BINARY")
	if bin == "" {
		bin = "minikube"
	}
	maxNodes := 8
	if raw := os.Getenv("KV_MINIKUBE_MAX_NODES"); raw != "" {
		n, err := strconv.Atoi(raw)
		if err != nil {
			maxNodes = 0
		} else {
			maxNodes = n
		}
	}
	return Config{Enabled: os.Getenv("KV_MINIKUBE_ENABLED") == "true", Profile: os.Getenv("KV_MINIKUBE_PROFILE"), Context: os.Getenv("KV_MINIKUBE_CONTEXT"), ClusterUID: os.Getenv("KV_MINIKUBE_CLUSTER_UID"), Home: home, StateDir: state, Binary: bin, MaxNodes: maxNodes, Timeout: 6 * time.Minute}
}
func (c Config) Validate() error {
	if !c.Enabled {
		return errors.New("Yerel minikube worker sağlayıcısı yapılandırılmamış")
	}
	if !profilePattern.MatchString(c.Profile) || c.Context == "" || c.ClusterUID == "" || !filepath.IsAbs(c.Home) || !filepath.IsAbs(c.StateDir) {
		return errors.New("Sağlayıcı için sabit profil, context, cluster UID ve mutlak özel dizinler gerekli")
	}
	if c.MaxNodes < 2 || c.MaxNodes > 64 || c.Timeout <= 0 {
		return errors.New("Geçersiz sağlayıcı kapasite/zaman sınırı")
	}
	return nil
}
func New(cfg Config, runner Runner) (*Manager, error) {
	if err := cfg.Validate(); err != nil {
		return nil, err
	}
	if runner == nil {
		runner = CLIRunner{}
	}
	if err := os.MkdirAll(cfg.StateDir, 0700); err != nil {
		return nil, err
	}
	m := &Manager{cfg: cfg, runner: runner}
	m.life, m.stop = context.WithCancel(context.Background())
	lock, lockErr := lockProfile(filepath.Join(cfg.StateDir, "minikube-"+cfg.Profile+".lock"))
	if lockErr != nil {
		m.stop()
		return nil, lockErr
	}
	m.lock = lock
	loaded := false
	defer func() {
		if !loaded {
			m.stop()
			if m.profileLock != nil {
				_ = m.profileLock.Close()
			}
			_ = lock.Close()
		}
	}()
	// Journals remain independent, but mutations of one physical profile must
	// share ownership even when gateways use different journal directories.
	// Retain the original journal lock for same-StateDir compatibility.
	profileLockDir := filepath.Join(cfg.Home, ".kubeview-provider-locks")
	if err := os.MkdirAll(profileLockDir, 0700); err != nil {
		return nil, err
	}
	profileLock, profileLockErr := lockProfile(filepath.Join(profileLockDir, "minikube-"+cfg.Profile+".lock"))
	if profileLockErr != nil {
		return nil, profileLockErr
	}
	m.profileLock = profileLock
	data, err := os.ReadFile(m.journal())
	if err != nil && !os.IsNotExist(err) {
		return nil, err
	}
	if len(data) > 2<<20 {
		return nil, errors.New("Sağlayıcı işlem kaydı boyut sınırını aşıyor")
	}
	if len(data) > 0 {
		if err = json.Unmarshal(data, &m.operations); err != nil {
			return nil, errors.New("Sağlayıcı işlem kaydı okunamadı; kör yeniden deneme engellendi")
		}
	}
	if len(m.operations) > 64 {
		return nil, errors.New("Sağlayıcı işlem kaydı kapasite sınırını aşıyor")
	}
	for i := range m.operations {
		op := &m.operations[i]
		if op.Profile != cfg.Profile || op.Context != cfg.Context || op.ClusterUID != cfg.ClusterUID {
			return nil, errors.New("İşlem kaydı farklı bir küme kimliğine ait")
		}
		if !terminal(op.Status) {
			op.Status = "reconciling"
			op.Reason = "Backend yeniden başladı; mevcut worker/Node envanteri uzlaştırılıyor, otomatik yeniden deneme yok."
			op.UpdatedAt = time.Now().UTC()
		}
	}
	if err = m.persist(); err != nil {
		return nil, err
	}
	loaded = true
	return m, nil
}
func (m *Manager) journal() string {
	return filepath.Join(m.cfg.StateDir, "minikube-"+m.cfg.Profile+".json")
}
func terminal(s string) bool { return s == "ready" || s == "failed" }
func (m *Manager) persist() error {
	data, err := json.MarshalIndent(m.operations, "", "  ")
	if err != nil {
		return err
	}
	tmp := m.journal() + ".tmp"
	if err = os.WriteFile(tmp, data, 0600); err != nil {
		return err
	}
	return os.Rename(tmp, m.journal())
}
func (m *Manager) Snapshot() []Operation {
	m.mu.Lock()
	defer m.mu.Unlock()
	out := make([]Operation, len(m.operations))
	for i, op := range m.operations {
		out[i] = op
		out[i].Before = nil
	}
	return out
}
func (m *Manager) update(id string, fn func(*Operation)) {
	m.mu.Lock()
	defer m.mu.Unlock()
	for i := range m.operations {
		if m.operations[i].ID == id {
			fn(&m.operations[i])
			m.operations[i].UpdatedAt = time.Now().UTC()
			if err := m.persist(); err != nil {
				m.operations[i].Status = "reconciling"
				m.operations[i].Reason = "İşlem kaydı yazılamadı; yeni worker isteği engellendi."
			}
			return
		}
	}
}
func (m *Manager) Verify(ctx context.Context, client kubernetes.Interface, selectedContext string) ([]corev1.Node, Inventory, error) {
	if selectedContext != m.cfg.Context {
		return nil, Inventory{}, errors.New("Seçili context izin verilen sağlayıcı context'iyle eşleşmiyor")
	}
	ns, err := client.CoreV1().Namespaces().Get(ctx, "kube-system", metav1.GetOptions{})
	if err != nil {
		return nil, Inventory{}, err
	}
	if string(ns.UID) != m.cfg.ClusterUID {
		return nil, Inventory{}, errors.New("Küme UID'si izin verilen profil ile eşleşmiyor")
	}
	profileUID, err := m.runner.ProfileUID(ctx, m.cfg)
	if err != nil || profileUID != m.cfg.ClusterUID {
		return nil, Inventory{}, errors.New("Minikube profilinin gerçek küme UID'si seçili API ile eşleşmiyor")
	}
	nodes, err := client.CoreV1().Nodes().List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, Inventory{}, err
	}
	inv, err := m.runner.Inventory(ctx, m.cfg)
	if err != nil {
		return nil, inv, err
	}
	if inv.Driver != "docker" {
		return nil, inv, errors.New("İlk yerel sağlayıcı yalnız doğrulanmış minikube docker driver'ını destekliyor")
	}
	known := map[string]bool{}
	for _, n := range nodes.Items {
		known[n.Name] = true
	}
	for _, machine := range inv.Machines {
		if !known[machine.Name] {
			return nil, inv, errors.New("Profil envanteri ile gerçek Node kayıtları farklı; önce mevcut katılımı uzlaştırın")
		}
	}
	return nodes.Items, inv, nil
}
func (m *Manager) Begin(ctx context.Context, client kubernetes.Interface, selectedContext, key string) (Operation, error) {
	if !requestPattern.MatchString(key) {
		return Operation{}, errors.New("16–128 karakterlik idempotencyKey gerekli")
	}
	digest := sha256.Sum256([]byte(selectedContext + "\x00" + key))
	kh := hex.EncodeToString(digest[:])
	m.mu.Lock()
	for _, op := range m.operations {
		if op.KeyHash == kh {
			m.mu.Unlock()
			op.Before = nil
			return op, nil
		}
	}
	for _, op := range m.operations {
		if !terminal(op.Status) {
			m.mu.Unlock()
			return Operation{}, errors.New("Bu profil için açık/uzlaştırılmamış worker işlemi var; ikinci worker otomatik oluşturulmaz")
		}
	}
	if m.closed {
		m.mu.Unlock()
		return Operation{}, errors.New("Sağlayıcı kapanıyor")
	}
	m.mu.Unlock()
	nodes, inv, err := m.Verify(ctx, client, selectedContext)
	if err != nil {
		return Operation{}, err
	}
	if len(inv.Machines) >= m.cfg.MaxNodes {
		return Operation{}, errors.New("Yerel sağlayıcı worker kapasite sınırına ulaştı")
	}
	if len(inv.Machines) == 0 {
		return Operation{}, errors.New("Profilde mevcut control-plane bulunamadı")
	}
	expected, err := NextName(m.cfg.Profile, inv.Machines[len(inv.Machines)-1].Name)
	if err != nil {
		return Operation{}, err
	}
	exists, err := m.runner.HostExists(ctx, m.cfg, expected)
	if err != nil {
		return Operation{}, err
	}
	if exists {
		return Operation{}, errors.New("Beklenen worker host'u zaten var; önce yarım işlemi uzlaştırın")
	}
	now := time.Now().UTC()
	op := Operation{ID: uuid.NewString(), KeyHash: kh, Context: selectedContext, Profile: m.cfg.Profile, ClusterUID: m.cfg.ClusterUID, Status: "accepted", ExpectedName: expected, StartedAt: now, UpdatedAt: now, StageSource: "verified-profile-and-kubernetes-inventory", Before: map[string]string{}}
	for _, n := range nodes {
		op.Before[n.Name] = string(n.UID)
		if n.Name == expected {
			return Operation{}, errors.New("Beklenen worker adı Kubernetes'te zaten mevcut")
		}
	}
	m.mu.Lock()
	defer m.mu.Unlock()
	if m.closed {
		return Operation{}, errors.New("Sağlayıcı kapanıyor")
	}
	for _, old := range m.operations {
		if old.KeyHash == kh {
			old.Before = nil
			return old, nil
		}
		if !terminal(old.Status) {
			return Operation{}, errors.New("Aynı profil için eşzamanlı işlem reddedildi")
		}
	}
	if len(m.operations) >= 32 {
		m.operations = append([]Operation(nil), m.operations[len(m.operations)-31:]...)
	}
	m.operations = append(m.operations, op)
	if err = m.persist(); err != nil {
		m.operations = m.operations[:len(m.operations)-1]
		return Operation{}, err
	}
	workCtx, cancel := context.WithTimeout(m.life, m.cfg.Timeout)
	m.cancel = cancel
	m.wg.Add(1)
	go m.run(workCtx, cancel, client, op)
	op.Before = nil
	return op, nil
}
func NextName(profile, last string) (string, error) {
	if last == profile {
		return fmt.Sprintf("%s-m02", profile), nil
	}
	prefix := profile + "-m"
	if !strings.HasPrefix(last, prefix) {
		return "", errors.New("Minikube profil node adı beklenen biçimde değil")
	}
	n, e := strconv.Atoi(strings.TrimPrefix(last, prefix))
	if e != nil || n < 1 || n >= 99 {
		return "", errors.New("Minikube worker sıra numarası doğrulanamadı")
	}
	return fmt.Sprintf("%s-m%02d", profile, n+1), nil
}
func (m *Manager) run(ctx context.Context, cancel context.CancelFunc, client kubernetes.Interface, op Operation) {
	defer m.wg.Done()
	defer cancel()
	m.update(op.ID, func(o *Operation) { o.Status = "provisioning"; o.StageSource = "minikube-worker-add-running" })
	claim := regexp.MustCompile(`Adding node ([a-z0-9-]+) to cluster ` + regexp.QuoteMeta(m.cfg.Profile) + `\b`)
	err := m.runner.Add(ctx, m.cfg, func(line string) {
		if found := claim.FindStringSubmatch(line); len(found) == 2 {
			m.update(op.ID, func(o *Operation) {
				name := found[1]
				if regexp.MustCompile(`^m[0-9]{2}$`).MatchString(name) {
					name = m.cfg.Profile + "-" + name
				}
				if name != op.ExpectedName {
					return
				}
				o.ExpectedName = name
				o.ClaimVerified = true
				o.StageSource = "minikube-command-confirmed-worker-name"
			})
		}
	}, func(pid int) { m.update(op.ID, func(o *Operation) { o.ProcessPID = pid }) })
	m.update(op.ID, func(o *Operation) {
		o.ProcessExited = true
		if err != nil {
			o.Status = "reconciling"
			o.Reason = "Sağlayıcı komutu tamamlanamadı veya iptal edildi; oluşmuş worker silinmeden envanter uzlaştırılıyor."
		}
	})
	// Reconciliation is independent of command exit and includes a partial result
	// after cancellation. A successful CLI exit is never a Ready assertion.
	observeCtx, stop := context.WithTimeout(m.life, 2*time.Minute)
	defer stop()
	ticker := time.NewTicker(time.Second)
	defer ticker.Stop()
	for {
		done := m.Reconcile(observeCtx, client)
		if done {
			return
		}
		select {
		case <-observeCtx.Done():
			m.update(op.ID, func(o *Operation) {
				if !terminal(o.Status) {
					o.Status = "reconciling"
					o.Reason = "Ready/worker sonucu kesinleşmedi; işlem kaydı korundu, kör yeniden deneme engelli."
				}
			})
			return
		case <-ticker.C:
		}
	}
}

// Reconcile associates only the exact name emitted by this command, confirmed
// in the provider profile and with the actual Node InternalIP and new UID.
func (m *Manager) Reconcile(ctx context.Context, client kubernetes.Interface) bool {
	m.mu.Lock()
	var op *Operation
	for _, r := range m.operations {
		if !terminal(r.Status) {
			copy := r
			op = &copy
			break
		}
	}
	m.mu.Unlock()
	if op == nil {
		return true
	}
	inv, err := m.runner.Inventory(ctx, m.cfg)
	if err != nil {
		return false
	}
	node, err := client.CoreV1().Nodes().Get(ctx, op.ExpectedName, metav1.GetOptions{})
	if err != nil {
		return false
	}
	if !op.ClaimVerified || op.Before[node.Name] != "" || node.CreationTimestamp.Time.Before(op.StartedAt.Add(-time.Second)) {
		return false
	}
	match := false
	for _, machine := range inv.Machines {
		if machine.Name == node.Name && machine.IP != "" {
			for _, address := range node.Status.Addresses {
				if address.Type == corev1.NodeInternalIP && address.Address == machine.IP {
					match = true
				}
			}
		}
	}
	if !match {
		return false
	}
	ready := false
	for _, condition := range node.Status.Conditions {
		if condition.Type == corev1.NodeReady && condition.Status == corev1.ConditionTrue {
			ready = true
		}
	}
	m.update(op.ID, func(o *Operation) {
		o.NodeUID = string(node.UID)
		o.NodeName = node.Name
		o.StageSource = "minikube-profile-and-kubelet-node-observation"
		if ready {
			o.Status = "ready"
			o.Reason = "Gerçek Node kaydı ve Ready doğrulandı."
		} else {
			o.Status = "registered"
			o.Reason = "Gerçek Node kaydoldu; Ready bekleniyor."
		}
		if o.CancelRequested {
			o.Reason += " İstek iptal edilmişti; oluşan worker korunarak kayda alındı."
		}
	})
	return ready
}
func (m *Manager) Cancel(id string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	for i := range m.operations {
		op := &m.operations[i]
		if op.ID == id {
			if terminal(op.Status) {
				return nil
			}
			op.CancelRequested = true
			op.Status = "reconciling"
			op.Reason = "Komut iptali istendi; oluşmuş worker otomatik silinmez ve sonuç uzlaştırılır."
			if m.cancel != nil {
				m.cancel()
			}
			return m.persist()
		}
	}
	return errors.New("İşlem bulunamadı")
}
func (m *Manager) Close() {
	m.mu.Lock()
	if m.closed {
		m.mu.Unlock()
		return
	}
	m.closed = true
	m.stop()
	if m.cancel != nil {
		m.cancel()
	}
	for i := range m.operations {
		if !terminal(m.operations[i].Status) {
			m.operations[i].Status = "reconciling"
			m.operations[i].Reason = "Sunucu kapandı; işlem sonraki açılışta uzlaştırılmalı."
		}
	}
	_ = m.persist()
	m.mu.Unlock()
	m.wg.Wait()
	if m.profileLock != nil {
		_ = m.profileLock.Close()
	}
	_ = m.lock.Close()
}
func (m *Manager) Configuration() map[string]interface{} {
	return map[string]interface{}{"profile": m.cfg.Profile, "context": m.cfg.Context, "clusterUID": m.cfg.ClusterUID, "maxNodes": m.cfg.MaxNodes, "driver": "docker"}
}
func SortedNames(inv Inventory) []string {
	names := make([]string, 0, len(inv.Machines))
	for _, m := range inv.Machines {
		names = append(names, m.Name)
	}
	sort.Strings(names)
	return names
}
