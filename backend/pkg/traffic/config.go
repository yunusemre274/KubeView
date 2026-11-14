// Package traffic reads measured Hubble flow observations. It does not infer
// application protocols from Service ports or install/change a cluster CNI.
package traffic

import (
	"context"
	"fmt"
	"net"
	"os"
	"os/exec"
	"strconv"
	"strings"
	"time"
)

const supportedCLIVersion = "1.20.2"
const Window = 10 * time.Second
const leaseTTL = 15 * time.Second

type Config struct {
	Enabled                bool
	Context                string
	ClusterUID             string
	ClusterName            string
	Server                 string
	Binary                 string
	TLSCA                  string
	TLSCert                string
	TLSKey                 string
	TLSServerName          string
	AllowLoopbackPlaintext bool
}

func FromEnv() Config {
	binary := os.Getenv("KV_HUBBLE_BINARY")
	if binary == "" {
		binary = "hubble"
	}
	return Config{Enabled: os.Getenv("KV_HUBBLE_ENABLED") == "true", Context: os.Getenv("KV_HUBBLE_CONTEXT"), ClusterUID: os.Getenv("KV_HUBBLE_CLUSTER_UID"), ClusterName: os.Getenv("KV_HUBBLE_CLUSTER_NAME"), Server: os.Getenv("KV_HUBBLE_SERVER"), Binary: binary, TLSCA: os.Getenv("KV_HUBBLE_TLS_CA"), TLSCert: os.Getenv("KV_HUBBLE_TLS_CERT"), TLSKey: os.Getenv("KV_HUBBLE_TLS_KEY"), TLSServerName: os.Getenv("KV_HUBBLE_TLS_SERVER_NAME"), AllowLoopbackPlaintext: os.Getenv("KV_HUBBLE_ALLOW_LOOPBACK_PLAINTEXT") == "true"}
}

func (c Config) validate() (Config, bool, error) {
	if !c.Enabled {
		return c, true, nil
	}
	if c.Context == "" || c.ClusterUID == "" || c.ClusterName == "" || c.Server == "" {
		return c, true, fmt.Errorf("Hubble context, cluster UID/cluster adı ve server eşlemesi gerekli")
	}
	target := strings.TrimPrefix(c.Server, "tls://")
	if strings.Contains(target, "://") {
		return c, true, fmt.Errorf("Desteklenmeyen Hubble server adresi")
	}
	host, port, err := net.SplitHostPort(target)
	if err != nil || host == "" || port == "" {
		return c, true, fmt.Errorf("Hubble server host:port biçiminde olmalı")
	}
	numericPort, err := strconv.Atoi(port)
	if err != nil || numericPort < 1 || numericPort > 65535 {
		return c, true, fmt.Errorf("Geçerli Hubble server portu gerekli")
	}
	ip := net.ParseIP(host)
	loopback := host == "localhost" || (ip != nil && ip.IsLoopback())
	tls := !c.AllowLoopbackPlaintext || !loopback || strings.HasPrefix(c.Server, "tls://") || c.TLSCA != "" || c.TLSCert != "" || c.TLSKey != ""
	if (c.TLSCert == "") != (c.TLSKey == "") {
		return c, tls, fmt.Errorf("Hubble mTLS sertifikası ve anahtarı birlikte gerekli")
	}
	for _, path := range []string{c.TLSCA, c.TLSCert, c.TLSKey} {
		if path != "" {
			info, e := os.Stat(path)
			if e != nil || !info.Mode().IsRegular() {
				return c, tls, fmt.Errorf("Hubble TLS dosyası okunabilir normal dosya olmalı")
			}
		}
	}
	binary := c.Binary
	if binary == "" {
		binary = "hubble"
	}
	resolved, err := exec.LookPath(binary)
	if err != nil {
		return c, tls, fmt.Errorf("Hubble CLI bulunamadı")
	}
	c.Binary = resolved
	return c, tls, nil
}

type identityContextKey struct{}
type selectedUIDContextKey struct{}

// WithIdentity binds the request to a backend-computed opaque auth identity.
// The value must never be copied from a browser parameter or published in JSON.
func WithIdentity(ctx context.Context, fingerprint string) context.Context {
	return context.WithValue(ctx, identityContextKey{}, fingerprint)
}
func requestIdentity(ctx context.Context) string {
	v, _ := ctx.Value(identityContextKey{}).(string)
	return v
}

// Selection only prioritizes already-authorized groups in the bounded response;
// it never broadens a collector's namespace/auth scope or restarts its lease.
func WithSelectedUID(ctx context.Context, uid string) context.Context {
	if len(uid) > 128 || strings.ContainsAny(uid, "\x00\r\n\t ") {
		uid = ""
	}
	return context.WithValue(ctx, selectedUIDContextKey{}, uid)
}
func selectedUID(ctx context.Context) string {
	uid, _ := ctx.Value(selectedUIDContextKey{}).(string)
	return uid
}

// Exclude implicit HUBBLE_*, kubeconfig, auth and proxy environment values. The
// CLI gets an explicit empty private config and only operator-validated flags.
func safeEnvironment(privateHome string) []string {
	env := []string{"HOME=" + privateHome, "XDG_CONFIG_HOME=" + privateHome, "LANG=C", "LC_ALL=C"}
	for _, key := range []string{"PATH", "TMPDIR", "SYSTEMROOT"} {
		if value := os.Getenv(key); value != "" {
			env = append(env, key+"="+value)
		}
	}
	return env
}
