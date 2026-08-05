package k8s

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"sync"
	"time"

	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	rbacv1 "k8s.io/api/rbac/v1"
	"k8s.io/client-go/informers"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/tools/cache"

	"github.com/k8s-tersane/tersane/backend/pkg/api"
	ws "github.com/k8s-tersane/tersane/backend/pkg/websocket"
)

// Watcher manages shared informers and broadcasts events via WebSocket.
type Watcher struct {
	clientset      kubernetes.Interface
	namespace      string
	hub            *ws.Hub
	kubeconfigPath string
	currentHost    string

	consecutiveFailures int

	// Local cache for Initial State Dump & In-Memory Owner Resolution
	mu          sync.RWMutex
	nodes       map[string]api.ResourcePayload
	pods        map[string]api.ResourcePayload
	deployments map[string]api.DeploymentInfo
	replicaSets map[string]*appsv1.ReplicaSet
	configMaps  map[string]api.ConfigMapInfo
	secrets     map[string]api.SecretInfo
	pvcs        map[string]api.PVCInfo
	pvs         map[string]api.PVInfo
	sas         map[string]api.ServiceAccountInfo
	roles       map[string]api.RoleInfo
}

// NewWatcher initializes a Watcher instance with host and kubeconfig tracking.
func NewWatcher(clientset kubernetes.Interface, namespace string, hub *ws.Hub, kubeconfigPath string, currentHost string) *Watcher {
	return &Watcher{
		clientset:      clientset,
		namespace:      namespace,
		hub:            hub,
		kubeconfigPath: kubeconfigPath,
		currentHost:    currentHost,
		nodes:          make(map[string]api.ResourcePayload),
		pods:           make(map[string]api.ResourcePayload),
		deployments:    make(map[string]api.DeploymentInfo),
		replicaSets:    make(map[string]*appsv1.ReplicaSet),
		configMaps:     make(map[string]api.ConfigMapInfo),
		secrets:        make(map[string]api.SecretInfo),
		pvcs:           make(map[string]api.PVCInfo),
		pvs:            make(map[string]api.PVInfo),
		sas:            make(map[string]api.ServiceAccountInfo),
		roles:          make(map[string]api.RoleInfo),
	}
}

func (w *Watcher) GetInitialState() api.InitialStatePayload {
	w.mu.RLock()
	defer w.mu.RUnlock()

	nodeList := make([]api.ResourcePayload, 0, len(w.nodes))
	for _, n := range w.nodes {
		nodeList = append(nodeList, n)
	}

	podList := make([]api.ResourcePayload, 0, len(w.pods))
	for _, p := range w.pods {
		podList = append(podList, p)
	}

	deployList := make([]api.DeploymentInfo, 0, len(w.deployments))
	for _, d := range w.deployments {
		deployList = append(deployList, d)
	}

	cmList := make([]api.ConfigMapInfo, 0, len(w.configMaps))
	for _, cm := range w.configMaps {
		cmList = append(cmList, cm)
	}

	secList := make([]api.SecretInfo, 0, len(w.secrets))
	for _, s := range w.secrets {
		secList = append(secList, s)
	}

	pvcList := make([]api.PVCInfo, 0, len(w.pvcs))
	for _, pvc := range w.pvcs {
		pvcList = append(pvcList, pvc)
	}

	pvList := make([]api.PVInfo, 0, len(w.pvs))
	for _, pv := range w.pvs {
		pvList = append(pvList, pv)
	}

	saList := make([]api.ServiceAccountInfo, 0, len(w.sas))
	for _, sa := range w.sas {
		saList = append(saList, sa)
	}

	roleList := make([]api.RoleInfo, 0, len(w.roles))
	for _, r := range w.roles {
		roleList = append(roleList, r)
	}

	return api.InitialStatePayload{
		ClusterName:     "k8s-tersane-cluster",
		Nodes:           nodeList,
		Pods:            podList,
		Deployments:     deployList,
		ConfigMaps:      cmList,
		Secrets:         secList,
		PVCs:            pvcList,
		PVs:             pvList,
		ServiceAccounts: saList,
		Roles:           roleList,
		TotalShips:      len(nodeList),
		TotalPallets:    len(podList),
	}
}

// StartInformerFactory runs shared informers inside a resilient retry loop with exponential backoff and dynamic kubeconfig re-read.
func (w *Watcher) StartInformerFactory(ctx context.Context) error {
	backoff := 2 * time.Second
	maxBackoff := 30 * time.Second

	for {
		select {
		case <-ctx.Done():
			return nil
		default:
		}

		fmt.Printf("[watcher] Starting shared informers (API Host: %s, Kubeconfig: %s)...\n", w.currentHost, w.kubeconfigPath)

		var factory informers.SharedInformerFactory
		if w.namespace == "" {
			factory = informers.NewSharedInformerFactory(w.clientset, 10*time.Minute)
		} else {
			factory = informers.NewSharedInformerFactoryWithOptions(w.clientset, 10*time.Minute, informers.WithNamespace(w.namespace))
		}

		// Register Informers
		w.registerInformers(factory)

		informerCtx, cancelInformer := context.WithCancel(ctx)
		factory.Start(informerCtx.Done())

		// Wait for Cache Sync with timeout
		syncCtx, syncCancel := context.WithTimeout(informerCtx, 12*time.Second)
		synced := factory.WaitForCacheSync(syncCtx.Done())
		syncCancel()

		allSynced := true
		for resource, ok := range synced {
			if !ok {
				allSynced = false
				fmt.Printf("[watcher] ⚠️ Cache sync failed for resource: %v\n", resource)
			}
		}

		if !allSynced {
			cancelInformer()
			w.consecutiveFailures++
			fmt.Printf("[watcher] ⚠️ Informer cache sync failed (%d. consecutive failure, host: %s). Backoff: %v\n", w.consecutiveFailures, w.currentHost, backoff)

			if w.consecutiveFailures >= 3 {
				w.handleKubeconfigDriftReload(ctx)
			} else {
				w.hub.BroadcastMessage(api.NewWSMessage(api.TypeResourceEvent, api.ResourcePayload{
					Action:  api.ActionUpdate,
					Kind:    api.KindEvent,
					Name:    "reconnect-attempt",
					Status:  "Warning",
					Message: fmt.Sprintf("⚠️ K8s API sunucusuna bağlanılamıyor (%s). Yeniden deneniyor... (%d/3)", w.currentHost, w.consecutiveFailures),
				}))
			}

			select {
			case <-time.After(backoff):
				backoff *= 2
				if backoff > maxBackoff {
					backoff = maxBackoff
				}
				continue
			case <-ctx.Done():
				return nil
			}
		}

		// Informer Cache Synced successfully!
		w.consecutiveFailures = 0
		backoff = 2 * time.Second
		fmt.Printf("[watcher] ✅ Informer cache synced successfully (API Host: %s). Listening for live events...\n", w.currentHost)

		w.hub.BroadcastMessage(api.NewWSMessage(api.TypeResourceEvent, api.ResourcePayload{
			Action:  api.ActionAdd,
			Kind:    api.KindEvent,
			Name:    "k8s-connected",
			Status:  "Normal",
			Message: fmt.Sprintf("✅ K8s API sunucusuna bağlantı sağlandı (%s)", w.currentHost),
		}))

		<-informerCtx.Done()
	}
}

func (w *Watcher) handleKubeconfigDriftReload(ctx context.Context) {
	fmt.Printf("[watcher] ⚠️ 3 ardışık bağlantı hatası tespit edildi. Kubeconfig diskten yeniden okunuyor... (Path: %s)\n", w.kubeconfigPath)

	w.hub.BroadcastMessage(api.NewWSMessage(api.TypeResourceEvent, api.ResourcePayload{
		Action:  api.ActionUpdate,
		Kind:    api.KindEvent,
		Name:    "kubeconfig-re-read",
		Status:  "Warning",
		Message: fmt.Sprintf("⚠️ K8s API sunucusuna bağlanılamıyor (%s). Kubeconfig diskten yeniden okunuyor...", w.currentHost),
	}))

	newClient, _, newHost, hostChanged, err := CheckAndReloadKubeconfig(w.kubeconfigPath, w.currentHost)
	if err != nil {
		if errors.Is(err, ErrKubeconfigUnreadable) {
			fmt.Printf("[watcher] ❌ KUBECONFIG DOSYASI OKUNAMADI VEYA BULUNAMADI: %v\n", err)
			w.hub.BroadcastMessage(api.NewWSMessage(api.TypeError, map[string]string{
				"error":   "KUBECONFIG_UNREADABLE",
				"message": fmt.Sprintf("❌ Kubeconfig dosyası diskte bulunamadı veya okunamadı: %v", err),
			}))
		} else {
			fmt.Printf("[watcher] ⚠️ Kubeconfig yeniden okunurken hata: %v\n", err)
		}
		return
	}

	if hostChanged {
		fmt.Printf("==============================================================\n")
		fmt.Printf("[watcher] 🔄 MINIKUBE PORT DEĞİŞİKLİĞİ TESPİT EDİLDİ!\n")
		fmt.Printf("[watcher] Eski API Host: %s ➔ Yeni API Host: %s\n", w.currentHost, newHost)
		fmt.Printf("==============================================================\n")

		w.mu.Lock()
		w.clientset = newClient
		w.currentHost = newHost
		w.consecutiveFailures = 0
		w.mu.Unlock()

		w.hub.BroadcastMessage(api.NewWSMessage(api.TypeResourceEvent, api.ResourcePayload{
			Action:  api.ActionUpdate,
			Kind:    api.KindEvent,
			Name:    "api-host-updated",
			Status:  "Normal",
			Message: fmt.Sprintf("🔄 K8s API Server adresi güncellendi (%s). Yeni porta otomatik yeniden bağlanılıyor...", newHost),
		}))
	} else {
		fmt.Printf("[watcher] Kubeconfig diskten okundu. API Host değişmedi (%s). Port henüz aktif değil, bekleniyor...\n", w.currentHost)
	}
}

// Client-go tombstone unwrappers to guarantee robust delete event handling
func unwrapPod(obj interface{}) *corev1.Pod {
	if p, ok := obj.(*corev1.Pod); ok {
		return p
	}
	if tombstone, ok := obj.(cache.DeletedFinalStateUnknown); ok {
		if p, ok := tombstone.Obj.(*corev1.Pod); ok {
			return p
		}
	}
	return nil
}

func unwrapNode(obj interface{}) *corev1.Node {
	if n, ok := obj.(*corev1.Node); ok {
		return n
	}
	if tombstone, ok := obj.(cache.DeletedFinalStateUnknown); ok {
		if n, ok := tombstone.Obj.(*corev1.Node); ok {
			return n
		}
	}
	return nil
}

func unwrapDeployment(obj interface{}) *appsv1.Deployment {
	if d, ok := obj.(*appsv1.Deployment); ok {
		return d
	}
	if tombstone, ok := obj.(cache.DeletedFinalStateUnknown); ok {
		if d, ok := tombstone.Obj.(*appsv1.Deployment); ok {
			return d
		}
	}
	return nil
}

func unwrapReplicaSet(obj interface{}) *appsv1.ReplicaSet {
	if rs, ok := obj.(*appsv1.ReplicaSet); ok {
		return rs
	}
	if tombstone, ok := obj.(cache.DeletedFinalStateUnknown); ok {
		if rs, ok := tombstone.Obj.(*appsv1.ReplicaSet); ok {
			return rs
		}
	}
	return nil
}

func unwrapSA(obj interface{}) *corev1.ServiceAccount {
	if sa, ok := obj.(*corev1.ServiceAccount); ok {
		return sa
	}
	if tombstone, ok := obj.(cache.DeletedFinalStateUnknown); ok {
		if sa, ok := tombstone.Obj.(*corev1.ServiceAccount); ok {
			return sa
		}
	}
	return nil
}

func unwrapRole(obj interface{}) *rbacv1.Role {
	if r, ok := obj.(*rbacv1.Role); ok {
		return r
	}
	if tombstone, ok := obj.(cache.DeletedFinalStateUnknown); ok {
		if r, ok := tombstone.Obj.(*rbacv1.Role); ok {
			return r
		}
	}
	return nil
}

func extractDeploymentName(rsName string) string {
	lastDash := strings.LastIndex(rsName, "-")
	if lastDash > 0 {
		return rsName[:lastDash]
	}
	return rsName
}

func (w *Watcher) registerInformers(factory informers.SharedInformerFactory) {
	// 1. Node Informer
	nodeInformer := factory.Core().V1().Nodes().Informer()
	nodeInformer.AddEventHandler(cache.ResourceEventHandlerFuncs{
		AddFunc:    func(obj interface{}) { if n := unwrapNode(obj); n != nil { w.handleNodeEvent(api.ActionAdd, n) } },
		UpdateFunc: func(_, newObj interface{}) { if n := unwrapNode(newObj); n != nil { w.handleNodeEvent(api.ActionUpdate, n) } },
		DeleteFunc: func(obj interface{}) { if n := unwrapNode(obj); n != nil { w.handleNodeEvent(api.ActionDelete, n) } },
	})

	// 2. Pod Informer
	podInformer := factory.Core().V1().Pods().Informer()
	podInformer.AddEventHandler(cache.ResourceEventHandlerFuncs{
		AddFunc:    func(obj interface{}) { if p := unwrapPod(obj); p != nil { w.handlePodEvent(api.ActionAdd, p) } },
		UpdateFunc: func(_, newObj interface{}) { if p := unwrapPod(newObj); p != nil { w.handlePodEvent(api.ActionUpdate, p) } },
		DeleteFunc: func(obj interface{}) { if p := unwrapPod(obj); p != nil { w.handlePodEvent(api.ActionDelete, p) } },
	})

	// 3. Deployment Informer
	deployInformer := factory.Apps().V1().Deployments().Informer()
	deployInformer.AddEventHandler(cache.ResourceEventHandlerFuncs{
		AddFunc:    func(obj interface{}) { if d := unwrapDeployment(obj); d != nil { w.handleDeploymentEvent(api.ActionAdd, d) } },
		UpdateFunc: func(_, newObj interface{}) { if d := unwrapDeployment(newObj); d != nil { w.handleDeploymentEvent(api.ActionUpdate, d) } },
		DeleteFunc: func(obj interface{}) { if d := unwrapDeployment(obj); d != nil { w.handleDeploymentEvent(api.ActionDelete, d) } },
	})

	// 4. ReplicaSet Informer (for Pod -> ReplicaSet -> Deployment owner chain resolution)
	rsInformer := factory.Apps().V1().ReplicaSets().Informer()
	rsInformer.AddEventHandler(cache.ResourceEventHandlerFuncs{
		AddFunc:    func(obj interface{}) { if rs := unwrapReplicaSet(obj); rs != nil { w.handleReplicaSetEvent(api.ActionAdd, rs) } },
		UpdateFunc: func(_, newObj interface{}) { if rs := unwrapReplicaSet(newObj); rs != nil { w.handleReplicaSetEvent(api.ActionUpdate, rs) } },
		DeleteFunc: func(obj interface{}) { if rs := unwrapReplicaSet(obj); rs != nil { w.handleReplicaSetEvent(api.ActionDelete, rs) } },
	})

	// 5. ServiceAccount Informer
	saInformer := factory.Core().V1().ServiceAccounts().Informer()
	saInformer.AddEventHandler(cache.ResourceEventHandlerFuncs{
		AddFunc:    func(obj interface{}) { if sa := unwrapSA(obj); sa != nil { w.handleSAEvent(api.ActionAdd, sa) } },
		UpdateFunc: func(_, newObj interface{}) { if sa := unwrapSA(newObj); sa != nil { w.handleSAEvent(api.ActionUpdate, sa) } },
		DeleteFunc: func(obj interface{}) { if sa := unwrapSA(obj); sa != nil { w.handleSAEvent(api.ActionDelete, sa) } },
	})

	// 6. Role Informer
	roleInformer := factory.Rbac().V1().Roles().Informer()
	roleInformer.AddEventHandler(cache.ResourceEventHandlerFuncs{
		AddFunc:    func(obj interface{}) { if r := unwrapRole(obj); r != nil { w.handleRoleEvent(api.ActionAdd, r) } },
		UpdateFunc: func(_, newObj interface{}) { if r := unwrapRole(newObj); r != nil { w.handleRoleEvent(api.ActionUpdate, r) } },
		DeleteFunc: func(obj interface{}) { if r := unwrapRole(obj); r != nil { w.handleRoleEvent(api.ActionDelete, r) } },
	})

	// 7. K8s Core Events Informer
	k8sEventInformer := factory.Core().V1().Events().Informer()
	k8sEventInformer.AddEventHandler(cache.ResourceEventHandlerFuncs{
		AddFunc: func(obj interface{}) {
			if e, ok := obj.(*corev1.Event); ok {
				w.handleK8sCoreEvent(e)
			}
		},
	})
}

func (w *Watcher) handleNodeEvent(action api.ResourceAction, node *corev1.Node) {
	status := "Ready"
	for _, cond := range node.Status.Conditions {
		if cond.Type == corev1.NodeReady && cond.Status != corev1.ConditionTrue {
			status = "NotReady"
		}
	}

	payload := api.ResourcePayload{
		Action: action,
		Kind:   api.KindNode,
		Name:   node.Name,
		Status: status,
		Metaphor: api.ShipyardMetaphor{
			MetaphorRole: "Gemi (Node)",
			NodeName:     node.Name,
			HealthState:  w.getHealthState(status),
		},
	}

	w.mu.Lock()
	if action == api.ActionDelete {
		delete(w.nodes, node.Name)
	} else {
		w.nodes[node.Name] = payload
	}
	w.mu.Unlock()

	msg := api.NewWSMessage(api.TypeResourceEvent, payload)
	w.hub.BroadcastMessage(msg)
}

func (w *Watcher) handleReplicaSetEvent(action api.ResourceAction, rs *appsv1.ReplicaSet) {
	rsKey := fmt.Sprintf("%s/%s", rs.Namespace, rs.Name)

	w.mu.Lock()
	if action == api.ActionDelete {
		delete(w.replicaSets, rsKey)
	} else {
		w.replicaSets[rsKey] = rs
	}
	w.mu.Unlock()
}

func (w *Watcher) handlePodEvent(action api.ResourceAction, pod *corev1.Pod) {
	podKey := fmt.Sprintf("%s/%s", pod.Namespace, pod.Name)
	status := string(pod.Status.Phase)
	if status == "" {
		status = "Pending"
	}

	ownerKind := "Standalone"
	ownerName := pod.Name
	replicaSetOwner := ""

	if len(pod.OwnerReferences) > 0 {
		ref := pod.OwnerReferences[0]
		if ref.Kind == "ReplicaSet" {
			ownerKind = "Deployment"
			replicaSetOwner = ref.Name
			rsKey := fmt.Sprintf("%s/%s", pod.Namespace, ref.Name)

			w.mu.RLock()
			rs, exists := w.replicaSets[rsKey]
			w.mu.RUnlock()

			if exists && len(rs.OwnerReferences) > 0 && rs.OwnerReferences[0].Kind == "Deployment" {
				ownerName = rs.OwnerReferences[0].Name
			} else {
				ownerName = extractDeploymentName(ref.Name)
			}
		} else {
			ownerKind = ref.Kind
			ownerName = ref.Name
		}
	}

	saName := pod.Spec.ServiceAccountName
	if saName == "" {
		saName = "default"
	}

	payload := api.ResourcePayload{
		Action:    action,
		Kind:      api.KindPod,
		Namespace: pod.Namespace,
		Name:      pod.Name,
		Status:    status,
		Metaphor: api.ShipyardMetaphor{
			MetaphorRole:       "Palet (Pod)",
			NodeName:           pod.Spec.NodeName,
			Compartment:        pod.Namespace,
			HealthState:        w.getHealthState(status),
			OwnerKind:          ownerKind,
			OwnerName:          ownerName,
			ReplicaSetOwner:    replicaSetOwner,
			ServiceAccountName: saName,
		},
	}

	w.mu.Lock()
	if action == api.ActionDelete {
		fmt.Printf("[watcher] 🗑️ Pod deleted: %s/%s (Phase: %s)\n", pod.Namespace, pod.Name, status)
		delete(w.pods, podKey)
	} else {
		fmt.Printf("[watcher] 📦 Pod %s: %s/%s (Node: %s, Owner: %s:%s, Status: %s)\n", action, pod.Namespace, pod.Name, pod.Spec.NodeName, ownerKind, ownerName, status)
		w.pods[podKey] = payload
	}
	w.mu.Unlock()

	msg := api.NewWSMessage(api.TypeResourceEvent, payload)
	w.hub.BroadcastMessage(msg)
}

func (w *Watcher) handleDeploymentEvent(action api.ResourceAction, deploy *appsv1.Deployment) {
	deployKey := fmt.Sprintf("%s/%s", deploy.Namespace, deploy.Name)
	status := fmt.Sprintf("%d/%d Ready", deploy.Status.ReadyReplicas, deploy.Status.Replicas)

	img := ""
	if len(deploy.Spec.Template.Spec.Containers) > 0 {
		img = deploy.Spec.Template.Spec.Containers[0].Image
	}

	deployInfo := api.DeploymentInfo{
		Name:            deploy.Name,
		Namespace:       deploy.Namespace,
		Replicas:        deploy.Status.Replicas,
		ReadyReplicas:   deploy.Status.ReadyReplicas,
		UpdatedReplicas: deploy.Status.UpdatedReplicas,
		Image:           img,
		Strategy:        string(deploy.Spec.Strategy.Type),
	}

	w.mu.Lock()
	if action == api.ActionDelete {
		delete(w.deployments, deployKey)
	} else {
		w.deployments[deployKey] = deployInfo
	}
	w.mu.Unlock()

	payload := api.ResourcePayload{
		Action:    action,
		Kind:      api.KindDeployment,
		Namespace: deploy.Namespace,
		Name:      deploy.Name,
		Status:    status,
		Metaphor: api.ShipyardMetaphor{
			MetaphorRole: "Sefer Sipariş Kartı",
			Compartment:  deploy.Namespace,
			HealthState:  "SAFE",
		},
		Object: deployInfo,
	}

	msg := api.NewWSMessage(api.TypeResourceEvent, payload)
	w.hub.BroadcastMessage(msg)
}

func (w *Watcher) handleSAEvent(action api.ResourceAction, sa *corev1.ServiceAccount) {
	saKey := fmt.Sprintf("%s/%s", sa.Namespace, sa.Name)
	saInfo := api.ServiceAccountInfo{
		Name:         sa.Name,
		Namespace:    sa.Namespace,
		BoundRole:    "view",
		BoundBinding: fmt.Sprintf("%s-binding", sa.Name),
		CreatedAt:    sa.CreationTimestamp.Format(time.RFC3339),
	}

	w.mu.Lock()
	if action == api.ActionDelete {
		delete(w.sas, saKey)
	} else {
		w.sas[saKey] = saInfo
	}
	w.mu.Unlock()

	payload := api.ResourcePayload{
		Action:    action,
		Kind:      api.KindServiceAccount,
		Namespace: sa.Namespace,
		Name:      sa.Name,
		Status:    "Active",
		Metaphor: api.ShipyardMetaphor{
			MetaphorRole: "Kimlik Kartı (ServiceAccount)",
			Compartment:  sa.Namespace,
			HealthState:  "SAFE",
		},
		Object: saInfo,
	}

	msg := api.NewWSMessage(api.TypeResourceEvent, payload)
	w.hub.BroadcastMessage(msg)
}

func (w *Watcher) handleRoleEvent(action api.ResourceAction, role *rbacv1.Role) {
	roleKey := fmt.Sprintf("%s/%s", role.Namespace, role.Name)

	rules := make([]api.RoleRule, 0, len(role.Rules))
	for _, rule := range role.Rules {
		rules = append(rules, api.RoleRule{
			Resources: rule.Resources,
			Verbs:     rule.Verbs,
		})
	}

	roleInfo := api.RoleInfo{
		Name:      role.Name,
		Namespace: role.Namespace,
		IsCluster: false,
		Rules:     rules,
		CreatedAt: role.CreationTimestamp.Format(time.RFC3339),
	}

	w.mu.Lock()
	if action == api.ActionDelete {
		delete(w.roles, roleKey)
	} else {
		w.roles[roleKey] = roleInfo
	}
	w.mu.Unlock()

	payload := api.ResourcePayload{
		Action:    action,
		Kind:      api.KindRole,
		Namespace: role.Namespace,
		Name:      role.Name,
		Status:    "Active",
		Metaphor: api.ShipyardMetaphor{
			MetaphorRole: "Yetki Rozeti (Role)",
			Compartment:  role.Namespace,
			HealthState:  "SAFE",
		},
		Object: roleInfo,
	}

	msg := api.NewWSMessage(api.TypeResourceEvent, payload)
	w.hub.BroadcastMessage(msg)
}

func (w *Watcher) handleK8sCoreEvent(e *corev1.Event) {
	payload := api.ResourcePayload{
		Action:    api.ActionAdd,
		Kind:      api.KindEvent,
		Namespace: e.Namespace,
		Name:      e.Name,
		Status:    e.Type,
		Message:   fmt.Sprintf("[%s] %s: %s", e.Reason, e.InvolvedObject.Name, e.Message),
		Metaphor: api.ShipyardMetaphor{
			MetaphorRole: "Liman Anonsu",
			Compartment:  e.Namespace,
			HealthState:  w.getHealthState(e.Type),
		},
	}

	msg := api.NewWSMessage(api.TypeResourceEvent, payload)
	w.hub.BroadcastMessage(msg)
}

func (w *Watcher) getHealthState(status string) string {
	switch status {
	case "Ready", "Running", "SAFE", "Active", "Normal", "Bound":
		return "SAFE"
	case "Pending", "ContainerCreating", "Warning":
		return "WARNING"
	default:
		return "CRITICAL"
	}
}
