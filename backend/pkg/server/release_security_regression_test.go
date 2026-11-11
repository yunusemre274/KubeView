package server

import (
	"context"
	"errors"
	"io"
	"net/http"
	"strings"
	"testing"

	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/discovery"
	discoveryfake "k8s.io/client-go/discovery/fake"
)

// A discovery outage must not turn a harbor's selector into an optional check
// for typed handlers, which do not pass through workspaceDynamic.
func TestReleaseSecuritySecretRevealFailsClosedWhenDiscoveryOmitsResource(t *testing.T) {
	secret := &corev1.Secret{
		TypeMeta: metav1.TypeMeta{APIVersion: "v1", Kind: "Secret"},
		ObjectMeta: metav1.ObjectMeta{
			Name: "outside-harbor", Namespace: "qa", UID: "outside-harbor-uid",
			Labels: map[string]string{"app": "outside"},
		},
		Data: map[string][]byte{"canary": []byte("synthetic-scope-canary")},
	}
	f := newWorkspaceFixture(t, true, secret)
	connection := f.addConnection()
	harbor := f.addHarbor(connection, []string{"qa"}, "app=allowed")
	if _, err := f.c.Typed.CoreV1().Secrets("qa").Create(context.Background(), secret, metav1.CreateOptions{}); err != nil {
		t.Fatal(err)
	}
	path := "/api/secrets/reveal?namespace=qa&name=outside-harbor&" + f.scope(harbor, "tab-a")
	if response := f.request(http.MethodGet, path, nil, "", ""); response.Code != http.StatusForbidden {
		t.Fatalf("baseline selector denial: status=%d", response.Code)
	}
	// The typed API remains available, but partial discovery no longer advertises
	// Secrets. This may occur independently of Secret GET authorization.
	for _, list := range f.c.Discovery.(*discoveryfake.FakeDiscovery).Resources {
		resources := list.APIResources[:0]
		for _, resource := range list.APIResources {
			if resource.Name != "secrets" {
				resources = append(resources, resource)
			}
		}
		list.APIResources = resources
	}
	response := f.request(http.MethodGet, path, nil, "", "")
	if response.Code != http.StatusForbidden {
		t.Fatalf("partial discovery bypassed selector: status=%d, secret_body_returned=%t", response.Code, strings.Contains(response.Body.String(), "c3ludGhldGljLXNjb3BlLWNhbmFyeQ=="))
	}
}

type releaseSecurityDiscovery struct {
	discovery.DiscoveryInterface
	resources []*metav1.APIResourceList
	err       error
}

func (d releaseSecurityDiscovery) ServerGroupsAndResources() ([]*metav1.APIGroup, []*metav1.APIResourceList, error) {
	return nil, d.resources, d.err
}

func TestReleaseSecurityTypedSelectorsRequireResolvedDiscovery(t *testing.T) {
	for _, mode := range []string{"complete", "omitted", "error", "invalid-version", "empty-version", "unsupported-version", "wrong-resource-scope", "unrelated-partial-error"} {
		t.Run(mode, func(t *testing.T) {
			allowedPod := labeledPod("allowed", "allowed-uid", "qa", "allowed")
			outsidePod := labeledPod("outside", "outside-uid", "qa", "outside")
			secret := func(name, app string) *corev1.Secret {
				return &corev1.Secret{TypeMeta: metav1.TypeMeta{APIVersion: "v1", Kind: "Secret"}, ObjectMeta: metav1.ObjectMeta{Name: name, Namespace: "qa", UID: "secret-uid", Labels: map[string]string{"app": app}}, Data: map[string][]byte{"canary": []byte("synthetic-scope-canary")}}
			}
			allowedSecret, outsideSecret := secret("allowed", "allowed"), secret("outside", "outside")
			f := newWorkspaceFixture(t, false, allowedPod, outsidePod, allowedSecret, outsideSecret)
			connection := f.addConnection()
			harbor := f.addHarbor(connection, []string{"qa"}, "app=allowed")
			for _, pod := range []*corev1.Pod{allowedPod, outsidePod} {
				if _, err := f.c.Typed.CoreV1().Pods("qa").Create(context.Background(), pod, metav1.CreateOptions{}); err != nil {
					t.Fatal(err)
				}
			}
			for _, item := range []*corev1.Secret{allowedSecret, outsideSecret} {
				if _, err := f.c.Typed.CoreV1().Secrets("qa").Create(context.Background(), item, metav1.CreateOptions{}); err != nil {
					t.Fatal(err)
				}
			}
			scope := f.scope(harbor, "tab-a")
			nonce := f.diagnostic(harbor, "tab-a")["connectionID"].(string)
			if response := f.request(http.MethodPost, "/api/management?"+scope, managementBody("test", "qa", nonce, true), "", ""); response.Code != http.StatusOK {
				t.Fatalf("enable fixture: status=%d", response.Code)
			}
			openedLogs := 0
			f.s.openLogStream = func(context.Context, *Clients, string, string, *corev1.PodLogOptions) (io.ReadCloser, error) {
				openedLogs++
				return io.NopCloser(strings.NewReader("synthetic allowed log\n")), nil
			}
			base := f.c.Discovery
			resources := []*metav1.APIResourceList{{GroupVersion: "v1", APIResources: []metav1.APIResource{{Name: "pods", Kind: "Pod", Namespaced: true}, {Name: "secrets", Kind: "Secret", Namespaced: true}}}}
			var discoveryErr error
			switch mode {
			case "omitted":
				resources[0].APIResources = nil
			case "error":
				resources = nil
				discoveryErr = errors.New("synthetic discovery outage")
			case "invalid-version":
				resources[0].GroupVersion = "invalid/v1/extra"
			case "empty-version":
				resources[0].GroupVersion = ""
			case "unsupported-version":
				resources[0].GroupVersion = "v9999"
			case "wrong-resource-scope":
				for i := range resources[0].APIResources {
					resources[0].APIResources[i].Namespaced = false
				}
			case "unrelated-partial-error":
				discoveryErr = errors.New("synthetic unrelated API group outage")
			}
			f.c.Discovery = releaseSecurityDiscovery{DiscoveryInterface: base, resources: resources, err: discoveryErr}
			resolved := mode == "complete" || mode == "unrelated-partial-error"
			for _, target := range []string{"allowed", "outside"} {
				for _, endpoint := range []string{"secret", "log", "exec", "forward-create", "forward-raw"} {
					t.Run(target+"/"+endpoint, func(t *testing.T) {
						method, path, success := http.MethodGet, "", http.StatusOK
						var body interface{}
						podQuery := "namespace=qa&pod=" + target + "&uid=" + target + "-uid&container=app&" + scope
						switch endpoint {
						case "secret":
							path = "/api/secrets/reveal?namespace=qa&name=" + target + "&" + scope
						case "log":
							path = "/api/logs?follow=false&" + podQuery
						case "exec":
							path, success = "/api/exec?"+podQuery, http.StatusServiceUnavailable
						case "forward-create":
							method, path, success = http.MethodPost, "/api/portforwards?"+scope, http.StatusServiceUnavailable
							body = forwardRequest{Namespace: "qa", Pod: target, UID: target + "-uid", Port: 8080}
						case "forward-raw":
							path, success = "/api/portforward?port=8080&"+podQuery, http.StatusServiceUnavailable
						}
						beforeLogs := openedLogs
						response := f.request(method, path, body, nonce, "")
						if target == "allowed" && resolved {
							// Exec/forward reach only their missing-transport guard; the
							// fixture intentionally provides no network configuration.
							if response.Code != success {
								t.Fatalf("resolved authorized target: status=%d want=%d", response.Code, success)
							}
							if endpoint == "log" && openedLogs != beforeLogs+1 {
								t.Fatal("authorized log did not reach the synthetic opener")
							}
							return
						}
						if response.Code != http.StatusForbidden && !(mode == "unsupported-version" && response.Code == http.StatusNotFound) {
							t.Fatalf("unresolved/outside target reached typed handler: status=%d", response.Code)
						}
						if openedLogs != beforeLogs {
							t.Fatal("denied target reached log opener")
						}
					})
				}
			}
		})
	}
}
