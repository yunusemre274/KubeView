package server

import (
	"os"
	"path/filepath"
	"testing"

	"k8s.io/client-go/rest"
)

func TestTrafficIdentityScopeAndCredentialRotation(t *testing.T) {
	tokenFile := filepath.Join(t.TempDir(), "synthetic-token")
	if err := os.WriteFile(tokenFile, []byte("fixture-one"), 0600); err != nil {
		t.Fatal(err)
	}
	config := &rest.Config{Host: "https://127.0.0.1:6443", BearerTokenFile: tokenFile, TLSClientConfig: rest.TLSClientConfig{CAData: []byte("fixture-ca")}}
	a, err := trafficIdentity(config)
	if err != nil {
		t.Fatal(err)
	}
	copy := rest.CopyConfig(config)
	b, err := trafficIdentity(copy)
	if err != nil || a != b {
		t.Fatal("equivalent caller did not retain private collection identity")
	}
	copy.Impersonate.UserName = "system:serviceaccount:fixture:restricted"
	b, err = trafficIdentity(copy)
	if err != nil || a == b {
		t.Fatal("different caller shared private collection identity")
	}
	if err = os.WriteFile(tokenFile, []byte("fixture-two"), 0600); err != nil {
		t.Fatal(err)
	}
	b, err = trafficIdentity(config)
	if err != nil || a == b {
		t.Fatal("token rotation reused stale collection identity")
	}
	original, _ := providerTransport(config)
	copy = rest.CopyConfig(config)
	copy.TLSClientConfig.ServerName = "other-api"
	other, _ := providerTransport(copy)
	if original == other {
		t.Fatal("different API TLS binding matched")
	}
	copy = rest.CopyConfig(config)
	copy.BearerToken = "operator"
	other, _ = providerTransport(copy)
	if original != other {
		t.Fatal("transport binding should not grant or identify caller permissions")
	}
	if err = os.Remove(tokenFile); err != nil {
		t.Fatal(err)
	}
	if _, err = trafficIdentity(config); err == nil {
		t.Fatal("missing token file must fail closed")
	}
}
