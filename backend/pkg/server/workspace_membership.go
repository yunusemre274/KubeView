package server

import (
	"net/http"

	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
)

const maxWorkspaceMembers = 4096

// A reconnect can distinguish selector exit from deletion only for UIDs this
// operator scope actually saw before. Never publish an inventory of outsiders.
type workspaceMember struct {
	scope  ResourceScope
	object *unstructured.Unstructured
}

func memberMetadata(u *unstructured.Unstructured) *unstructured.Unstructured {
	return &unstructured.Unstructured{Object: map[string]interface{}{"apiVersion": u.GetAPIVersion(), "kind": u.GetKind(), "metadata": map[string]interface{}{"name": u.GetName(), "namespace": u.GetNamespace(), "uid": string(u.GetUID()), "resourceVersion": u.GetResourceVersion()}}}
}
func (s *Server) beginWorkspaceMembership(r *http.Request, generation string) map[string]workspaceMember {
	previous := map[string]workspaceMember{}
	if workspaceScopeFrom(r.Context()) == nil {
		return previous
	}
	request, _ := r.Context().Value(operatorRequestKey{}).(operatorRequest)
	s.operatorMu.Lock()
	defer s.operatorMu.Unlock()
	if session := s.operators[request.id]; session != nil {
		session.streamGeneration = generation
		for uid, member := range session.members {
			previous[uid] = member
		}
	}
	return previous
}
func (s *Server) updateWorkspaceMember(r *http.Request, generation, action string, u *unstructured.Unstructured, scope ResourceScope) bool {
	if workspaceScopeFrom(r.Context()) == nil {
		return true
	}
	request, _ := r.Context().Value(operatorRequestKey{}).(operatorRequest)
	s.operatorMu.Lock()
	defer s.operatorMu.Unlock()
	session := s.operators[request.id]
	if session == nil || session.streamGeneration != generation {
		return false
	}
	if session.members == nil {
		session.members = map[string]workspaceMember{}
	}
	uid := string(u.GetUID())
	if action == "DELETE" || action == "OUT_OF_SCOPE" {
		delete(session.members, uid)
		return true
	}
	if _, exists := session.members[uid]; !exists && len(session.members) >= maxWorkspaceMembers {
		return false
	}
	session.members[uid] = workspaceMember{scope: scope, object: memberMetadata(u)}
	return true
}
func (s *Server) replaceWorkspaceMembers(r *http.Request, generation string, members map[string]workspaceMember) bool {
	if workspaceScopeFrom(r.Context()) == nil {
		return true
	}
	if len(members) > maxWorkspaceMembers {
		return false
	}
	request, _ := r.Context().Value(operatorRequestKey{}).(operatorRequest)
	s.operatorMu.Lock()
	defer s.operatorMu.Unlock()
	session := s.operators[request.id]
	if session == nil || session.streamGeneration != generation {
		return false
	}
	session.members = members
	return true
}
