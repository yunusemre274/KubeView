package traffic

import (
	"time"

	corev1 "k8s.io/api/core/v1"
)

const maxHistoryBindings = 8192
const maxBindingsPerIP = 8

type podBinding struct {
	uid, name, namespace, nodeName, ip string
	start, end                         time.Time
}
type podHistory struct {
	byIP    map[string][]*podBinding
	current map[string]*podBinding
	dropped uint64
}

func newHistory() *podHistory {
	return &podHistory{byIP: map[string][]*podBinding{}, current: map[string]*podBinding{}}
}
func (h *podHistory) breakContinuity() { h.current = map[string]*podBinding{} }
func (h *podHistory) observe(pods []corev1.Pod, now time.Time) {
	cutoff := now.Add(-30 * time.Second)
	count := 0
	for ip, bindings := range h.byIP {
		kept := bindings[:0]
		for _, b := range bindings {
			if !b.end.Before(cutoff) {
				kept = append(kept, b)
				count++
			}
		}
		if len(kept) == 0 {
			delete(h.byIP, ip)
		} else {
			h.byIP[ip] = kept
		}
	}
	next := map[string]*podBinding{}
	for _, pod := range pods {
		if pod.UID == "" || pod.DeletionTimestamp != nil || pod.Status.Phase == corev1.PodFailed || pod.Status.Phase == corev1.PodSucceeded {
			continue
		}
		ips := pod.Status.PodIPs
		if len(ips) == 0 && pod.Status.PodIP != "" {
			ips = []corev1.PodIP{{IP: pod.Status.PodIP}}
		}
		for _, address := range ips {
			ip := address.IP
			if ip == "" {
				continue
			}
			key := string(pod.UID) + "|" + ip
			if previous := h.current[key]; previous != nil && !previous.end.Before(cutoff) && previous.namespace == pod.Namespace && previous.name == pod.Name && previous.nodeName == pod.Spec.NodeName {
				previous.end = now
				next[key] = previous
				continue
			}
			if count >= maxHistoryBindings || len(h.byIP[ip]) >= maxBindingsPerIP {
				h.dropped++
				continue
			}
			binding := &podBinding{uid: string(pod.UID), name: pod.Name, namespace: pod.Namespace, nodeName: pod.Spec.NodeName, ip: ip, start: now, end: now}
			h.byIP[ip] = append(h.byIP[ip], binding)
			next[key] = binding
			count++
		}
	}
	h.current = next
}
func (h *podHistory) endpoint(observed observedEndpoint, at time.Time, allowNodes bool) Endpoint {
	result := Endpoint{Name: observed.name, Namespace: observed.namespace, IP: observed.ip, Port: observed.port, IdentityStatus: "unverified-time-interval"}
	var found *podBinding
	for _, binding := range h.byIP[observed.ip] {
		if !binding.end.After(binding.start) || binding.namespace != observed.namespace || binding.name != observed.name || at.Before(binding.start) || at.After(binding.end) {
			continue
		}
		if found != nil && found.uid != binding.uid {
			result.IdentityStatus = "ambiguous-ip-reuse"
			return result
		}
		found = binding
	}
	if found != nil {
		uid := found.uid
		result.UID = &uid
		result.IdentityStatus = "confirmed-observation-interval"
		if allowNodes && found.nodeName != "" {
			name := found.nodeName
			result.NodeName = &name
		}
	}
	return result
}
