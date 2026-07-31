package k8s

import (
	"fmt"

	networkingv1 "k8s.io/api/networking/v1"
	"k8s.io/client-go/informers"
	"k8s.io/client-go/tools/cache"

	"github.com/k8s-tersane/tersane/backend/pkg/api"
)

// RegisterNetworkPolicyInformer adds NetworkPolicy watching capability to the Informer factory.
func (w *Watcher) RegisterNetworkPolicyInformer(factory informers.SharedInformerFactory) error {
	netPolInformer := factory.Networking().V1().NetworkPolicies().Informer()
	_, err := netPolInformer.AddEventHandler(cache.ResourceEventHandlerFuncs{
		AddFunc: func(obj interface{}) {
			if np, ok := obj.(*networkingv1.NetworkPolicy); ok {
				w.handleNetworkPolicyEvent(api.ActionAdd, np)
			}
		},
		UpdateFunc: func(_, newObj interface{}) {
			if np, ok := newObj.(*networkingv1.NetworkPolicy); ok {
				w.handleNetworkPolicyEvent(api.ActionUpdate, np)
			}
		},
		DeleteFunc: func(obj interface{}) {
			if np, ok := obj.(*networkingv1.NetworkPolicy); ok {
				w.handleNetworkPolicyEvent(api.ActionDelete, np)
			}
		},
	})
	return err
}

func (w *Watcher) handleNetworkPolicyEvent(action api.ResourceAction, np *networkingv1.NetworkPolicy) {
	payload := api.ResourcePayload{
		Action:    action,
		Kind:      api.ResourceKind("NetworkPolicy"),
		Namespace: np.Namespace,
		Name:      np.Name,
		Status:    "Active",
		Metaphor: api.ShipyardMetaphor{
			MetaphorRole: "Gümrük ve Erişim Politikası (NetworkPolicy)",
			Compartment:  np.Namespace,
			HealthState:  "SAFE",
		},
	}

	msg := api.NewWSMessage(api.TypeResourceEvent, payload)
	w.hub.BroadcastMessage(msg)
	fmt.Printf("[network-watcher] Broadcasted NetworkPolicy %s (%s)\n", np.Name, action)
}
