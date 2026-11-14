package server

import (
	"context"
	"fmt"
	"sync/atomic"
	"time"

	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime/schema"
)

// Reserve a whole-batch network margin plus the configured 30QPS cost even
// from an empty token bucket. This does not raise QPS/Burst or cache decisions.
func watchAuthorizationBudgetForScopes(scopes []ResourceScope) time.Duration {
	return 5*time.Second + time.Duration(float64(2*len(uniqueWatchAuthorizationScopes(scopes)))/30*float64(time.Second))
}

type watchAuthorizationFailure struct {
	Scope ResourceScope
	Err   error
}
type watchPermissionReview func(context.Context, ResourceScope, string) error

// Only scopes already admitted into this consumer's informer set are renewed.
// GVR and explicit namespaces stay exact; selector differences do not change RBAC.
func uniqueWatchAuthorizationScopes(scopes []ResourceScope) []ResourceScope {
	seen := map[string]bool{}
	out := make([]ResourceScope, 0, len(scopes))
	for _, scope := range scopes {
		if !seen[scope.key()] {
			seen[scope.key()] = true
			out = append(out, scope)
		}
	}
	return out
}

func reviewWatchAuthorization(ctx context.Context, scopes []ResourceScope, review watchPermissionReview, current func(ResourceScope)) *watchAuthorizationFailure {
	for _, scope := range uniqueWatchAuthorizationScopes(scopes) {
		if current != nil {
			current(scope)
		}
		for _, verb := range []string{"list", "watch"} {
			if err := ctx.Err(); err != nil {
				return &watchAuthorizationFailure{scope, err}
			}
			if err := review(ctx, scope, verb); err != nil {
				return &watchAuthorizationFailure{scope, err}
			}
			if err := ctx.Err(); err != nil {
				return &watchAuthorizationFailure{scope, err}
			}
		}
	}
	return nil
}

// Direct SSAR repeats the admitted read permission, without discovery, extra
// context-free liveness calls, operator mutation, or namespace broadening.
func reviewWatchPermission(ctx context.Context, c *Clients, scope ResourceScope, verb string) error {
	namespace := scope.Namespace
	if namespace == "*" {
		namespace = ""
	}
	reply, err := c.Typed.AuthorizationV1().SelfSubjectAccessReviews().Create(ctx, accessReview(verb, scope.Group, scope.Resource, "", namespace, ""), metav1.CreateOptions{})
	if err != nil {
		return err
	}
	if reply == nil {
		return fmt.Errorf("Kaynak watch izin yanıtı yok")
	}
	if !reply.Status.Allowed {
		return apierrors.NewForbidden(schema.GroupResource{Group: scope.Group, Resource: scope.Resource}, "", fmt.Errorf("Kaynak %s yetkisi reddedildi", verb))
	}
	return nil
}

type watchAuthorizationBatch struct {
	ctx       context.Context
	cancel    context.CancelFunc
	result    chan *watchAuthorizationFailure
	current   atomic.Pointer[ResourceScope]
	completed atomic.Bool
}

// The writer owns one pending batch at a time. The buffer lets a cancelled
// consumer leave without stranding a result sender. Actual REST calls honor ctx.
func startWatchAuthorizationBatch(parent context.Context, scopes []ResourceScope, budget time.Duration, review watchPermissionReview, onFailure func(*watchAuthorizationFailure)) *watchAuthorizationBatch {
	ctx, cancel := context.WithTimeout(parent, budget)
	b := &watchAuthorizationBatch{ctx: ctx, cancel: cancel, result: make(chan *watchAuthorizationFailure, 1)}
	if len(scopes) > 0 {
		first := scopes[0]
		b.current.Store(&first)
	}
	go func() {
		failure := reviewWatchAuthorization(ctx, scopes, review, func(scope ResourceScope) { b.current.Store(&scope) })
		if failure != nil {
			onFailure(failure)
		} // publication stop precedes the result
		b.completed.Store(true)
		b.result <- failure
	}()
	return b
}

// Enforced by the writer as well as the context-aware worker: a stalled review
// cannot let queued publications outrun the whole-batch deadline.
func (b *watchAuthorizationBatch) expired() *watchAuthorizationFailure {
	if err := b.ctx.Err(); err != nil && !b.completed.Load() {
		scope := ResourceScope{}
		if current := b.current.Load(); current != nil {
			scope = *current
		}
		return &watchAuthorizationFailure{scope, err}
	}
	return nil
}

// Only an authorization response establishes API reachability. An unavailable
// review is a failed read authority proof, not evidence of a failed Node object.
func watchAuthorizationFailureStatus(failure *watchAuthorizationFailure) envelope {
	scope := failure.Scope
	scopeError(&scope, failure.Err)
	return envelope{Type: "STATUS", Scopes: []ResourceScope{scope}, Errors: []string{scope.Error}, Synced: false, Reachable: apierrors.IsForbidden(failure.Err) || apierrors.IsUnauthorized(failure.Err), Message: "Kaynak watch yetkisi yenilenemedi; yeni yetki ve snapshot gerekli"}
}
