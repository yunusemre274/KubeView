package k8s

import (
	"context"
	"fmt"
	"sync"
	"time"

	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
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

	return api.InitialStatePayload{
		ClusterName:  "k8s-tersane-cluster",
		Nodes:        nodeList,
		Pods:         podList,
		ConfigMaps:   cmList,
		Secrets:      secList,
		PVCs:         pvcList,
		PVs:          pvList,
		TotalShips:   len(nodeList),
		TotalPallets: len(podList),
	}
}

// StartInformerFactory starts shared informers for Nodes, Pods, Deployments, ConfigMaps, Secrets, PVCs, PVs, and Events.
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

	// 2. Pod Informer
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

	// 4. ConfigMap Informer
	cmInformer := factory.Core().V1().ConfigMaps().Informer()
	_, err = cmInformer.AddEventHandler(cache.ResourceEventHandlerFuncs{
		AddFunc:    func(obj interface{}) { if cm, ok := obj.(*corev1.ConfigMap); ok { w.handleConfigMapEvent(api.ActionAdd, cm) } },
		UpdateFunc: func(_, newObj interface{}) { if cm, ok := newObj.(*corev1.ConfigMap); ok { w.handleConfigMapEvent(api.ActionUpdate, cm) } },
		DeleteFunc: func(obj interface{}) { if cm, ok := obj.(*corev1.ConfigMap); ok { w.handleConfigMapEvent(api.ActionDelete, cm) } },
	})
	if err != nil {
		return fmt.Errorf("failed to add ConfigMap event handlers: %w", err)
	}

	// 5. Secret Informer (Metadata & Key names ONLY!)
	secInformer := factory.Core().V1().Secrets().Informer()
	_, err = secInformer.AddEventHandler(cache.ResourceEventHandlerFuncs{
		AddFunc:    func(obj interface{}) { if sec, ok := obj.(*corev1.Secret); ok { w.handleSecretEvent(api.ActionAdd, sec) } },
		UpdateFunc: func(_, newObj interface{}) { if sec, ok := newObj.(*corev1.Secret); ok { w.handleSecretEvent(api.ActionUpdate, sec) } },
		DeleteFunc: func(obj interface{}) { if sec, ok := obj.(*corev1.Secret); ok { w.handleSecretEvent(api.ActionDelete, sec) } },
	})
	if err != nil {
		return fmt.Errorf("failed to add Secret event handlers: %w", err)
	}

	// 6. PVC Informer
	pvcInformer := factory.Core().V1().PersistentVolumeClaims().Informer()
	_, err = pvcInformer.AddEventHandler(cache.ResourceEventHandlerFuncs{
		AddFunc:    func(obj interface{}) { if pvc, ok := obj.(*corev1.PersistentVolumeClaim); ok { w.handlePVCEvent(api.ActionAdd, pvc) } },
		UpdateFunc: func(_, newObj interface{}) { if pvc, ok := newObj.(*corev1.PersistentVolumeClaim); ok { w.handlePVCEvent(api.ActionUpdate, pvc) } },
		DeleteFunc: func(obj interface{}) { if pvc, ok := obj.(*corev1.PersistentVolumeClaim); ok { w.handlePVCEvent(api.ActionDelete, pvc) } },
	})
	if err != nil {
		return fmt.Errorf("failed to add PVC event handlers: %w", err)
	}

	// 7. PV Informer
	pvInformer := factory.Core().V1().PersistentVolumes().Informer()
	_, err = pvInformer.AddEventHandler(cache.ResourceEventHandlerFuncs{
		AddFunc:    func(obj interface{}) { if pv, ok := obj.(*corev1.PersistentVolume); ok { w.handlePVEvent(api.ActionAdd, pv) } },
		UpdateFunc: func(_, newObj interface{}) { if pv, ok := newObj.(*corev1.PersistentVolume); ok { w.handlePVEvent(api.ActionUpdate, pv) } },
		DeleteFunc: func(obj interface{}) { if pv, ok := obj.(*corev1.PersistentVolume); ok { w.handlePVEvent(api.ActionDelete, pv) } },
	})
	if err != nil {
		return fmt.Errorf("failed to add PV event handlers: %w", err)
	}

	// 8. K8s Core Events Informer (Liman Anonsları)
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
	fmt.Println("[watcher] Informer caches synced (Nodes, Pods, Deployments, ConfigMaps, Secrets, PVCs, PVs, Events). Listening for live events...")

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

	payload := api.ResourcePayload{
		Action:    action,
		Kind:      api.KindPod,
		Namespace: pod.Namespace,
		Name:      pod.Name,
		Status:    status,
		Metaphor: api.ShipyardMetaphor{
			MetaphorRole: "Palet (Pod)",
			NodeName:     pod.Spec.NodeName,
			Compartment:  pod.Namespace,
			HealthState:  w.getHealthState(status),
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

func (w *Watcher) handleConfigMapEvent(action api.ResourceAction, cm *corev1.ConfigMap) {
	cmKey := fmt.Sprintf("%s/%s", cm.Namespace, cm.Name)
	cmInfo := api.ConfigMapInfo{
		Name:      cm.Name,
		Namespace: cm.Namespace,
		Data:      cm.Data,
		CreatedAt: cm.CreationTimestamp.Format(time.RFC3339),
	}

	w.mu.Lock()
	if action == api.ActionDelete {
		delete(w.configMaps, cmKey)
	} else {
		w.configMaps[cmKey] = cmInfo
	}
	w.mu.Unlock()

	payload := api.ResourcePayload{
		Action:    action,
		Kind:      api.KindConfigMap,
		Namespace: cm.Namespace,
		Name:      cm.Name,
		Status:    "Active",
		Metaphor: api.ShipyardMetaphor{
			MetaphorRole: "Sevkiyat Föyü (ConfigMap)",
			Compartment:  cm.Namespace,
			HealthState:  "SAFE",
		},
		Object: cmInfo,
	}

	msg := api.NewWSMessage(api.TypeResourceEvent, payload)
	w.hub.BroadcastMessage(msg)
}

func (w *Watcher) handleSecretEvent(action api.ResourceAction, secret *corev1.Secret) {
	secKey := fmt.Sprintf("%s/%s", secret.Namespace, secret.Name)

	keys := make([]string, 0, len(secret.Data))
	for k := range secret.Data {
		keys = append(keys, k)
	}

	secInfo := api.SecretInfo{
		Name:      secret.Name,
		Namespace: secret.Namespace,
		Type:      string(secret.Type),
		KeyNames:  keys,
		CreatedAt: secret.CreationTimestamp.Format(time.RFC3339),
	}

	w.mu.Lock()
	if action == api.ActionDelete {
		delete(w.secrets, secKey)
	} else {
		w.secrets[secKey] = secInfo
	}
	w.mu.Unlock()

	payload := api.ResourcePayload{
		Action:    action,
		Kind:      api.KindSecret,
		Namespace: secret.Namespace,
		Name:      secret.Name,
		Status:    "Encrypted & Locked",
		Metaphor: api.ShipyardMetaphor{
			MetaphorRole: "Kilitli Kasa (Secret)",
			Compartment:  secret.Namespace,
			HealthState:  "SAFE",
		},
		Object: secInfo,
	}

	msg := api.NewWSMessage(api.TypeResourceEvent, payload)
	w.hub.BroadcastMessage(msg)
}

func (w *Watcher) handlePVCEvent(action api.ResourceAction, pvc *corev1.PersistentVolumeClaim) {
	pvcKey := fmt.Sprintf("%s/%s", pvc.Namespace, pvc.Name)

	modes := make([]string, 0, len(pvc.Spec.AccessModes))
	for _, m := range pvc.Spec.AccessModes {
		modes = append(modes, string(m))
	}

	capStr := ""
	if qty, ok := pvc.Spec.Resources.Requests[corev1.ResourceStorage]; ok {
		capStr = qty.String()
	}

	scName := ""
	if pvc.Spec.StorageClassName != nil {
		scName = *pvc.Spec.StorageClassName
	}

	pvcInfo := api.PVCInfo{
		Name:              pvc.Name,
		Namespace:         pvc.Namespace,
		Status:            string(pvc.Status.Phase),
		RequestedCapacity: capStr,
		BoundPV:           pvc.Spec.VolumeName,
		StorageClass:      scName,
		AccessModes:       modes,
		CreatedAt:         pvc.CreationTimestamp.Format(time.RFC3339),
	}

	w.mu.Lock()
	if action == api.ActionDelete {
		delete(w.pvcs, pvcKey)
	} else {
		w.pvcs[pvcKey] = pvcInfo
	}
	w.mu.Unlock()

	payload := api.ResourcePayload{
		Action:    action,
		Kind:      api.KindPVC,
		Namespace: pvc.Namespace,
		Name:      pvc.Name,
		Status:    string(pvc.Status.Phase),
		Metaphor: api.ShipyardMetaphor{
			MetaphorRole: "Depo Talebi (PVC)",
			Compartment:  pvc.Namespace,
			HealthState:  "SAFE",
		},
		Object: pvcInfo,
	}

	msg := api.NewWSMessage(api.TypeResourceEvent, payload)
	w.hub.BroadcastMessage(msg)
}

func (w *Watcher) handlePVEvent(action api.ResourceAction, pv *corev1.PersistentVolume) {
	capStr := ""
	if qty, ok := pv.Spec.Capacity[corev1.ResourceStorage]; ok {
		capStr = qty.String()
	}

	boundPVC := ""
	if pv.Spec.ClaimRef != nil {
		boundPVC = fmt.Sprintf("%s/%s", pv.Spec.ClaimRef.Namespace, pv.Spec.ClaimRef.Name)
	}

	backendType := "hostPath"
	if pv.Spec.AWSElasticBlockStore != nil {
		backendType = "AWS EBS (" + pv.Spec.AWSElasticBlockStore.VolumeID + ")"
	} else if pv.Spec.GCEPersistentDisk != nil {
		backendType = "GCE PD (" + pv.Spec.GCEPersistentDisk.PDName + ")"
	} else if pv.Spec.NFS != nil {
		backendType = "NFS (" + pv.Spec.NFS.Server + ")"
	} else if pv.Spec.CSI != nil {
		backendType = "CSI (" + pv.Spec.CSI.Driver + ")"
	}

	pvInfo := api.PVInfo{
		Name:          pv.Name,
		Status:        string(pv.Status.Phase),
		Capacity:      capStr,
		StorageClass:  pv.Spec.StorageClassName,
		ReclaimPolicy: string(pv.Spec.PersistentVolumeReclaimPolicy),
		BoundPVC:      boundPVC,
		BackendType:   backendType,
		CreatedAt:     pv.CreationTimestamp.Format(time.RFC3339),
	}

	w.mu.Lock()
	if action == api.ActionDelete {
		delete(w.pvs, pv.Name)
	} else {
		w.pvs[pv.Name] = pvInfo
	}
	w.mu.Unlock()

	payload := api.ResourcePayload{
		Action:    action,
		Kind:      api.KindPV,
		Name:      pv.Name,
		Status:    string(pv.Status.Phase),
		Metaphor: api.ShipyardMetaphor{
			MetaphorRole: "Fiziksel Depo Ambarı (PV)",
			HealthState:  "SAFE",
		},
		Object: pvInfo,
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
	case "Ready", "Running", "SAFE", "Normal", "Bound", "Available":
		return "SAFE"
	case "Warning", "NotReady", "Pending", "Released":
		return "WARNING"
	case "Failed", "Error", "CrashLoopBackOff", "OOMKilled", "Critical", "Lost":
		return "CRITICAL"
	default:
		return "SAFE"
	}
}
