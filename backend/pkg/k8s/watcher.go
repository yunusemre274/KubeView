package k8s

import (
	"context"
	"fmt"
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
	clientset kubernetes.Interface
	namespace string
	hub       *ws.Hub

	// Local cache for Initial State Dump
	mu          sync.RWMutex
	nodes       map[string]api.ResourcePayload
	pods        map[string]api.ResourcePayload
	deployments map[string]api.ResourcePayload
	configMaps  map[string]api.ConfigMapInfo
	secrets     map[string]api.SecretInfo
	pvcs        map[string]api.PVCInfo
	pvs         map[string]api.PVInfo
	sas         map[string]api.ServiceAccountInfo
	roles       map[string]api.RoleInfo
}

// NewWatcher initializes a Watcher instance.
func NewWatcher(clientset kubernetes.Interface, namespace string, hub *ws.Hub) *Watcher {
	return &Watcher{
		clientset:   clientset,
		namespace:   namespace,
		hub:         hub,
		nodes:       make(map[string]api.ResourcePayload),
		pods:        make(map[string]api.ResourcePayload),
		deployments: make(map[string]api.ResourcePayload),
		configMaps:  make(map[string]api.ConfigMapInfo),
		secrets:     make(map[string]api.SecretInfo),
		pvcs:        make(map[string]api.PVCInfo),
		pvs:         make(map[string]api.PVInfo),
		sas:         make(map[string]api.ServiceAccountInfo),
		roles:       make(map[string]api.RoleInfo),
	}
}

// GetInitialState returns the current cluster snapshot for newly connected clients.
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

// StartInformerFactory starts shared informers for Nodes, Pods, Deployments, StatefulSets, DaemonSets, Jobs, CronJobs, ConfigMaps, Secrets, PVCs, PVs, ServiceAccounts, Roles, and Events.
func (w *Watcher) StartInformerFactory(ctx context.Context) error {
	var factory informers.SharedInformerFactory
	if w.namespace == "" {
		factory = informers.NewSharedInformerFactory(w.clientset, 10*time.Minute)
	} else {
		factory = informers.NewSharedInformerFactoryWithOptions(w.clientset, 10*time.Minute, informers.WithNamespace(w.namespace))
	}

	// 1. Node Informer
	nodeInformer := factory.Core().V1().Nodes().Informer()
	_, err := nodeInformer.AddEventHandler(cache.ResourceEventHandlerFuncs{
		AddFunc:    func(obj interface{}) { if n, ok := obj.(*corev1.Node); ok { w.handleNodeEvent(api.ActionAdd, n) } },
		UpdateFunc: func(_, newObj interface{}) { if n, ok := newObj.(*corev1.Node); ok { w.handleNodeEvent(api.ActionUpdate, n) } },
		DeleteFunc: func(obj interface{}) { if n, ok := obj.(*corev1.Node); ok { w.handleNodeEvent(api.ActionDelete, n) } },
	})
	if err != nil {
		return fmt.Errorf("failed to add Node event handlers: %w", err)
	}

	// 2. Pod Informer (with OwnerReferences & ServiceAccountName extraction)
	podInformer := factory.Core().V1().Pods().Informer()
	_, err = podInformer.AddEventHandler(cache.ResourceEventHandlerFuncs{
		AddFunc:    func(obj interface{}) { if p, ok := obj.(*corev1.Pod); ok { w.handlePodEvent(api.ActionAdd, p) } },
		UpdateFunc: func(_, newObj interface{}) { if p, ok := newObj.(*corev1.Pod); ok { w.handlePodEvent(api.ActionUpdate, p) } },
		DeleteFunc: func(obj interface{}) { if p, ok := obj.(*corev1.Pod); ok { w.handlePodEvent(api.ActionDelete, p) } },
	})
	if err != nil {
		return fmt.Errorf("failed to add Pod event handlers: %w", err)
	}

	// 3. Deployment Informer
	deployInformer := factory.Apps().V1().Deployments().Informer()
	_, err = deployInformer.AddEventHandler(cache.ResourceEventHandlerFuncs{
		AddFunc:    func(obj interface{}) { if d, ok := obj.(*appsv1.Deployment); ok { w.handleDeploymentEvent(api.ActionAdd, d) } },
		UpdateFunc: func(_, newObj interface{}) { if d, ok := newObj.(*appsv1.Deployment); ok { w.handleDeploymentEvent(api.ActionUpdate, d) } },
		DeleteFunc: func(obj interface{}) { if d, ok := obj.(*appsv1.Deployment); ok { w.handleDeploymentEvent(api.ActionDelete, d) } },
	})
	if err != nil {
		return fmt.Errorf("failed to add Deployment event handlers: %w", err)
	}

	// 4. ServiceAccount Informer
	saInformer := factory.Core().V1().ServiceAccounts().Informer()
	_, err = saInformer.AddEventHandler(cache.ResourceEventHandlerFuncs{
		AddFunc:    func(obj interface{}) { if sa, ok := obj.(*corev1.ServiceAccount); ok { w.handleSAEvent(api.ActionAdd, sa) } },
		UpdateFunc: func(_, newObj interface{}) { if sa, ok := newObj.(*corev1.ServiceAccount); ok { w.handleSAEvent(api.ActionUpdate, sa) } },
		DeleteFunc: func(obj interface{}) { if sa, ok := obj.(*corev1.ServiceAccount); ok { w.handleSAEvent(api.ActionDelete, sa) } },
	})
	if err != nil {
		return fmt.Errorf("failed to add ServiceAccount event handlers: %w", err)
	}

	// 5. Role Informer
	roleInformer := factory.Rbac().V1().Roles().Informer()
	_, err = roleInformer.AddEventHandler(cache.ResourceEventHandlerFuncs{
		AddFunc:    func(obj interface{}) { if r, ok := obj.(*rbacv1.Role); ok { w.handleRoleEvent(api.ActionAdd, r) } },
		UpdateFunc: func(_, newObj interface{}) { if r, ok := newObj.(*rbacv1.Role); ok { w.handleRoleEvent(api.ActionUpdate, r) } },
		DeleteFunc: func(obj interface{}) { if r, ok := obj.(*rbacv1.Role); ok { w.handleRoleEvent(api.ActionDelete, r) } },
	})
	if err != nil {
		return fmt.Errorf("failed to add Role event handlers: %w", err)
	}

	// 6. K8s Core Events Informer (Liman Anonsları)
	k8sEventInformer := factory.Core().V1().Events().Informer()
	_, err = k8sEventInformer.AddEventHandler(cache.ResourceEventHandlerFuncs{
		AddFunc: func(obj interface{}) {
			if e, ok := obj.(*corev1.Event); ok {
				w.handleK8sCoreEvent(e)
			}
		},
	})
	if err != nil {
		return fmt.Errorf("failed to add K8s Event handlers: %w", err)
	}

	factory.Start(ctx.Done())

	fmt.Println("[watcher] Waiting for informer caches to sync...")
	synced := factory.WaitForCacheSync(ctx.Done())
	for resource, ok := range synced {
		if !ok {
			return fmt.Errorf("failed to sync informer cache for %v", resource)
		}
	}
	fmt.Println("[watcher] Informer caches synced (Nodes, Pods, Deployments, ServiceAccounts, Roles, Events). Listening for live events...")

	<-ctx.Done()
	return nil
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

func (w *Watcher) handlePodEvent(action api.ResourceAction, pod *corev1.Pod) {
	podKey := fmt.Sprintf("%s/%s", pod.Namespace, pod.Name)
	status := string(pod.Status.Phase)

	// Extract OwnerReferences (Deployment, StatefulSet, DaemonSet, Job)
	ownerKind := "Deployment"
	ownerName := pod.Name
	if len(pod.OwnerReferences) > 0 {
		ownerKind = pod.OwnerReferences[0].Kind
		ownerName = pod.OwnerReferences[0].Name
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
			ServiceAccountName: saName,
		},
	}

	w.mu.Lock()
	if action == api.ActionDelete {
		delete(w.pods, podKey)
	} else {
		w.pods[podKey] = payload
	}
	w.mu.Unlock()

	msg := api.NewWSMessage(api.TypeResourceEvent, payload)
	w.hub.BroadcastMessage(msg)
}

func (w *Watcher) handleDeploymentEvent(action api.ResourceAction, deploy *appsv1.Deployment) {
	deployKey := fmt.Sprintf("%s/%s", deploy.Namespace, deploy.Name)
	status := fmt.Sprintf("%d/%d Ready", deploy.Status.ReadyReplicas, deploy.Status.Replicas)

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
	}

	w.mu.Lock()
	if action == api.ActionDelete {
		delete(w.deployments, deployKey)
	} else {
		w.deployments[deployKey] = payload
	}
	w.mu.Unlock()

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
	case "Ready", "Running", "Completed", "SAFE", "Normal", "Bound", "Available":
		return "SAFE"
	case "Warning", "NotReady", "Pending", "Released":
		return "WARNING"
	case "Failed", "Error", "CrashLoopBackOff", "OOMKilled", "Critical", "Lost":
		return "CRITICAL"
	default:
		return "SAFE"
	}
}
