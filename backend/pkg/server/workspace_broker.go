package server

import (
	"context"
	"errors"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/client-go/dynamic/dynamicinformer"
	"k8s.io/client-go/tools/cache"
)

// watchBroker shares an unfiltered informer only within the same credential
// generation + connectionRef + GVR + exact namespace. Each subscriber applies
// its own selector before any data is sent. Last release stops the upstream.
type watchBroker struct {
	mu      sync.Mutex
	entries map[string]*brokerWatch
	closed  bool
}
type brokerWatch struct {
	scope     ResourceScope
	informer  cache.SharedIndexInformer
	cancel    context.CancelFunc
	listeners map[string]func(error)
}

func (b *watchBroker) acquire(c *Clients, scope ResourceScope, onError func(error)) (cache.SharedIndexInformer, func(), error) {
	b.mu.Lock()
	defer b.mu.Unlock()
	if b.closed {
		return nil, nil, errors.New("watch broker closed")
	}
	if b.entries == nil {
		b.entries = map[string]*brokerWatch{}
	}
	key := c.ID + "|" + scope.key()
	entry := b.entries[key]
	if entry == nil {
		if len(b.entries) >= 512 {
			return nil, nil, errors.New("shared watch capacity exceeded")
		}
		client := c.Dynamic
		if scoped, ok := client.(*workspaceDynamic); ok {
			client = scoped.Interface
		}
		ns := scope.Namespace
		if ns == "*" {
			ns = ""
		}
		factory := dynamicinformer.NewFilteredDynamicSharedInformerFactory(client, 10*time.Minute, ns, nil)
		inf := factory.ForResource(scope.gvr()).Informer()
		ctx, cancel := context.WithCancel(context.Background())
		entry = &brokerWatch{scope: scope, informer: inf, cancel: cancel, listeners: map[string]func(error){}}
		b.entries[key] = entry
		inf.SetWatchErrorHandler(func(_ *cache.Reflector, err error) {
			b.mu.Lock()
			callbacks := []func(error){}
			if current := b.entries[key]; current == entry {
				for _, fn := range current.listeners {
					callbacks = append(callbacks, fn)
				}
			}
			b.mu.Unlock()
			for _, fn := range callbacks {
				fn(err)
			}
		})
		go factory.Start(ctx.Done())
	}
	id := uuid.NewString()
	entry.listeners[id] = onError
	var once sync.Once
	release := func() {
		once.Do(func() {
			b.mu.Lock()
			defer b.mu.Unlock()
			if b.entries[key] != entry {
				return
			}
			delete(entry.listeners, id)
			if len(entry.listeners) == 0 {
				entry.cancel()
				delete(b.entries, key)
			}
		})
	}
	return entry.informer, release, nil
}
func (b *watchBroker) owner(clientID, apiVersion, kind, namespace, name string) (*unstructured.Unstructured, bool) {
	b.mu.Lock()
	defer b.mu.Unlock()
	for key, entry := range b.entries {
		version := entry.scope.Version
		if entry.scope.Group != "" {
			version = entry.scope.Group + "/" + version
		}
		if !strings.HasPrefix(key, clientID+"|") || version != apiVersion || entry.scope.Kind != kind || (entry.scope.Namespace != "*" && entry.scope.Namespace != namespace) || !entry.informer.HasSynced() {
			continue
		}
		object, found, err := entry.informer.GetStore().GetByKey(namespace + "/" + name)
		if err != nil {
			return nil, false
		}
		if !found {
			return nil, true
		}
		if u := unwrap(object); u != nil {
			return u, true
		}
		return nil, true
	}
	return nil, false
}
func (b *watchBroker) objects(clientID, kind, namespace string) ([]*unstructured.Unstructured, bool) {
	b.mu.Lock()
	defer b.mu.Unlock()
	for key, entry := range b.entries {
		if !strings.HasPrefix(key, clientID+"|") || entry.scope.Kind != kind || (entry.scope.Namespace != "*" && entry.scope.Namespace != namespace) || !entry.informer.HasSynced() {
			continue
		}
		out := []*unstructured.Unstructured{}
		for _, object := range entry.informer.GetStore().List() {
			if u := unwrap(object); u != nil && u.GetNamespace() == namespace {
				out = append(out, u)
			}
		}
		return out, true
	}
	return nil, false
}
func (b *watchBroker) close() {
	b.mu.Lock()
	defer b.mu.Unlock()
	b.closed = true
	for key, entry := range b.entries {
		entry.cancel()
		delete(b.entries, key)
	}
}

func workspaceBindings(bindings []scopeBinding, scope *workspaceScope) []scopeBinding {
	if scope == nil {
		return bindings
	}
	out := []scopeBinding{}
	seen := map[string]bool{}
	for _, binding := range bindings {
		if binding.namespaced {
			binding.scope.Selector = scope.harbor.Selector
		}
		if !binding.namespaced {
			if !seen[binding.scope.key()] {
				out = append(out, binding)
				seen[binding.scope.key()] = true
			}
			continue
		}
		if binding.scope.Namespace != "*" {
			if !scope.allowsNamespace(binding.scope.Namespace) {
				binding.scope.Status = "forbidden"
				binding.scope.Error = "Abonelik liman namespace kapsamı dışında"
			}
			if !seen[binding.scope.key()] {
				out = append(out, binding)
				seen[binding.scope.key()] = true
			}
			continue
		}
		for _, ns := range scope.harbor.Namespaces {
			copy := binding
			copy.scope.Namespace = ns
			if !seen[copy.scope.key()] {
				out = append(out, copy)
				seen[copy.scope.key()] = true
			}
		}
	}
	return out
}
