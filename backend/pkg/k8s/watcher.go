package k8s

import (
	"context"
	"fmt"
	"sync"
	"time"

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
	mu    sync.RWMutex
	nodes map[string]api.ResourcePayload
	pods  map[string]api.ResourcePayload
}

// NewWatcher initializes a Watcher instance.
func NewWatcher(clientset kubernetes.Interface, namespace string, hub *ws.Hub) *Watcher {
	return &Watcher{
		clientset: clientset,
		namespace: namespace,
		hub:       hub,
		nodes:     make(map[string]api.ResourcePayload),
		pods:      make(map[string]api.ResourcePayload),
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

	return api.InitialStatePayload{
		ClusterName:  "k8s-tersane-cluster",
		Nodes:        nodeList,
		Pods:         podList,
		TotalShips:   len(nodeList),
		TotalPallets: len(podList),
	}
}

// StartInformerFactory starts shared informers for Nodes and Pods.
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
		AddFunc: func(obj interface{}) {
			node, ok := obj.(*corev1.Node)
			if !ok {
				return
			}
			w.handleNodeEvent(api.ActionAdd, node)
		},
		UpdateFunc: func(oldObj, newObj interface{}) {
			newNode, ok := newObj.(*corev1.Node)
			if !ok {
				return
			}
			w.handleNodeEvent(api.ActionUpdate, newNode)
		},
		DeleteFunc: func(obj interface{}) {
			node, ok := obj.(*corev1.Node)
			if !ok {
				return
			}
			w.handleNodeEvent(api.ActionDelete, node)
		},
	})
	if err != nil {
		return fmt.Errorf("failed to add Node event handlers: %w", err)
	}

	// 2. Pod Informer
	podInformer := factory.Core().V1().Pods().Informer()
	_, err = podInformer.AddEventHandler(cache.ResourceEventHandlerFuncs{
		AddFunc: func(obj interface{}) {
			pod, ok := obj.(*corev1.Pod)
			if !ok {
				return
			}
			w.handlePodEvent(api.ActionAdd, pod)
		},
		UpdateFunc: func(oldObj, newObj interface{}) {
			newPod, ok := newObj.(*corev1.Pod)
			if !ok {
				return
			}
			w.handlePodEvent(api.ActionUpdate, newPod)
		},
		DeleteFunc: func(obj interface{}) {
			pod, ok := obj.(*corev1.Pod)
			if !ok {
				return
			}
			w.handlePodEvent(api.ActionDelete, pod)
		},
	})
	if err != nil {
		return fmt.Errorf("failed to add Pod event handlers: %w", err)
	}

	// Start informers
	factory.Start(ctx.Done())

	// Wait for cache sync
	fmt.Println("[watcher] Waiting for informer caches to sync...")
	synced := factory.WaitForCacheSync(ctx.Done())
	for resource, ok := range synced {
		if !ok {
			return fmt.Errorf("failed to sync informer cache for %v", resource)
		}
	}
	fmt.Println("[watcher] Informer caches synced. Broadcasting live events via WebSocket...")

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

func (w *Watcher) getHealthState(status string) string {
	switch status {
	case "Running", "Ready":
		return "SAFE"
	case "Pending", "ContainerCreating":
		return "WARNING"
	default:
		return "CRITICAL"
	}
}
