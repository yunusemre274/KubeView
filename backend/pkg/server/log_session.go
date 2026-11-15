package server

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	corev1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/fields"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apimachinery/pkg/watch"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/cache"
	watchtools "k8s.io/client-go/tools/watch"
)

type logStreamOpener func(context.Context, *Clients, string, string, *corev1.PodLogOptions) (io.ReadCloser, error)

// Kubernetes /log has no UID precondition. This session therefore guards an
// expected UID with before/open/after validation, a replayable Pod watch and a
// bounded first read. It never claims an atomic UID-aware Kubernetes log API.
type podLogGuard struct {
	ctx                          context.Context
	cancel                       context.CancelFunc
	watcher                      *watchtools.RetryWatcher
	mu                           sync.Mutex
	failure                      error
	expectedUID, namespace, name string
	client                       *Clients
}

func (g *podLogGuard) fail(err error) {
	g.mu.Lock()
	if g.failure == nil {
		g.failure = err
	}
	g.mu.Unlock()
	g.cancel()
}
func (g *podLogGuard) err() error {
	g.mu.Lock()
	defer g.mu.Unlock()
	return g.failure
}
func (g *podLogGuard) check() error {
	if err := g.err(); err != nil {
		return err
	}
	pod, err := g.client.Typed.CoreV1().Pods(g.namespace).Get(g.ctx, g.name, metav1.GetOptions{})
	if guarded := g.err(); guarded != nil {
		return guarded
	}
	if apierrors.IsNotFound(err) {
		err = apierrors.NewConflict(schema.GroupResource{Resource: "pods"}, g.name, fmt.Errorf("Beklenen Pod artık mevcut değil; log oturumu kapatıldı"))
	}
	if err == nil && string(pod.UID) != g.expectedUID {
		err = apierrors.NewConflict(schema.GroupResource{Resource: "pods"}, g.name, fmt.Errorf("Pod UID değişti; aynı adlı yeni Pod'un logları gösterilmedi"))
	}
	if err == nil && workspaceScopeFrom(g.ctx) != nil {
		_, err = g.client.Dynamic.Resource(schemaGVR("", "v1", "pods")).Namespace(g.namespace).Get(g.ctx, g.name, metav1.GetOptions{})
	}
	if err != nil {
		g.fail(err)
	}
	return err
}
func (g *podLogGuard) close() {
	g.cancel()
	if g.watcher != nil {
		g.watcher.Stop()
	}
}

func startPodLogGuard(ctx context.Context, c *Clients, pod *corev1.Pod) (*podLogGuard, error) {
	ctx, cancel := context.WithCancel(ctx)
	g := &podLogGuard{ctx: ctx, cancel: cancel, expectedUID: string(pod.UID), namespace: pod.Namespace, name: pod.Name, client: c}
	watchClient := c.Typed
	if c.Config != nil {
		config := rest.CopyConfig(c.Config)
		config.Timeout = 0
		typed, e := kubernetes.NewForConfig(config)
		if e != nil {
			cancel()
			return nil, e
		}
		watchClient = typed
	}
	started := make(chan struct{})
	var once sync.Once
	w, err := watchtools.NewRetryWatcher(pod.ResourceVersion, &cache.ListWatch{WatchFunc: func(options metav1.ListOptions) (watch.Interface, error) {
		options.FieldSelector = fields.OneTermEqualSelector("metadata.name", pod.Name).String()
		upstream, e := watchClient.CoreV1().Pods(pod.Namespace).Watch(ctx, options)
		if e == nil {
			once.Do(func() { close(started) })
		}
		return upstream, e
	}})
	if err != nil {
		cancel()
		return nil, err
	}
	g.watcher = w
	go func() {
		for {
			select {
			case <-ctx.Done():
				return
			case event, ok := <-w.ResultChan():
				if !ok {
					if ctx.Err() == nil {
						g.fail(apierrors.NewServiceUnavailable("Pod kimliği watch bağlantısıyla doğrulanamıyor; log oturumu kapatıldı"))
					}
					return
				}
				if event.Type == watch.Error {
					g.fail(apierrors.FromObject(event.Object))
					return
				}
				observed, ok := event.Object.(*corev1.Pod)
				if !ok || observed.Name != pod.Name || observed.Namespace != pod.Namespace {
					continue
				}
				if string(observed.UID) != g.expectedUID || event.Type == watch.Deleted {
					g.fail(apierrors.NewConflict(schema.GroupResource{Resource: "pods"}, pod.Name, fmt.Errorf("Pod silindi veya UID değişti; eski log oturumu iptal edildi")))
					return
				}
				if workspaceScopeFrom(ctx) != nil {
					if err := g.check(); err != nil {
						return
					}
				}
			}
		}
	}()
	deadline := time.NewTimer(8 * time.Second)
	defer deadline.Stop()
	select {
	case <-started:
		if err := g.check(); err != nil {
			g.close()
			return nil, err
		}
		return g, nil
	case <-ctx.Done():
		err := g.err()
		if err == nil {
			err = ctx.Err()
		}
		g.close()
		return nil, err
	case <-deadline.C:
		g.close()
		return nil, apierrors.NewServiceUnavailable("Pod kimliği watch bağlantısı zamanında açılamadı")
	}
}

func openKubernetesLogs(ctx context.Context, c *Clients, ns, pod string, opts *corev1.PodLogOptions) (io.ReadCloser, error) {
	logClient := c.Typed
	if c.Config != nil {
		config := rest.CopyConfig(c.Config)
		config.Timeout = 0
		typed, err := kubernetes.NewForConfig(config)
		if err != nil {
			return nil, err
		}
		logClient = typed
	}
	return logClient.CoreV1().Pods(ns).GetLogs(pod, opts).Stream(ctx)
}

func logSessionName(raw string) (string, error) {
	if raw == "" {
		return uuid.NewString(), nil
	}
	if len(raw) > 128 || strings.ContainsAny(raw, "\r\n\x1e:") {
		return "", apierrors.NewBadRequest("Geçersiz log oturum kimliği")
	}
	return raw, nil
}
func writeLogSessionError(w http.ResponseWriter, session string, err error) {
	message := safeError(err)
	if len(message) > 512 {
		message = message[:512]
	}
	code := 503
	if status, ok := err.(apierrors.APIStatus); ok && status.Status().Code >= 400 {
		code = int(status.Status().Code)
	}
	encoded, _ := json.Marshal(map[string]interface{}{"error": message, "code": code})
	fmt.Fprintf(w, "\n\x1eKUBEVIEW_LOG_ERROR:%s:%s\n", session, encoded)
	if f, ok := w.(http.Flusher); ok {
		f.Flush()
	}
}
