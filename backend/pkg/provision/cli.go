package provision

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strings"
)

type CLIRunner struct{}

func (CLIRunner) ProfileUID(ctx context.Context, c Config) (string, error) {
	cmd := exec.CommandContext(ctx, c.Binary, "--profile", c.Profile, "kubectl", "--ssh", "--", "get", "namespace", "kube-system", "-o", "jsonpath={.metadata.uid}", "--request-timeout=5s")
	cmd.Env = cliEnv(c)
	out, e := cmd.Output()
	if e != nil {
		return "", errors.New("Minikube profil API kimliği okunamadı")
	}
	if len(out) > 128 {
		return "", errors.New("Minikube profil kimlik yanıtı geçersiz")
	}
	return strings.TrimSpace(string(out)), nil
}
func (CLIRunner) Inventory(_ context.Context, c Config) (Inventory, error) {
	data, err := os.ReadFile(filepath.Join(c.Home, "profiles", c.Profile, "config.json"))
	if err != nil {
		return Inventory{}, errors.New("Yapılandırılmış minikube profil dosyası okunamıyor")
	}
	if len(data) > 1<<20 {
		return Inventory{}, errors.New("Minikube profil boyut sınırı")
	}
	var profile struct {
		Name   string
		Driver string
		Nodes  []struct {
			Name         string
			IP           string
			ControlPlane bool
		}
	}
	if err = json.Unmarshal(data, &profile); err != nil || profile.Name != c.Profile {
		return Inventory{}, errors.New("Minikube profil kimliği doğrulanamadı")
	}
	inv := Inventory{Driver: profile.Driver}
	for i, n := range profile.Nodes {
		name := n.Name
		if name == "" && i == 0 && n.ControlPlane {
			name = c.Profile
		} else if regexp.MustCompile(`^m[0-9]{2}$`).MatchString(name) {
			name = c.Profile + "-" + name
		} else if name != c.Profile && !strings.HasPrefix(name, c.Profile+"-m") {
			return Inventory{}, fmt.Errorf("Minikube node adı doğrulanamadı")
		}
		inv.Machines = append(inv.Machines, Machine{Name: name, IP: n.IP})
	}
	return inv, nil
}
func cliEnv(c Config) []string {
	env := []string{}
	for _, v := range os.Environ() {
		if !strings.HasPrefix(v, "MINIKUBE_HOME=") && !strings.HasPrefix(v, "LANG=") && !strings.HasPrefix(v, "NO_COLOR=") {
			env = append(env, v)
		}
	}
	return append(env, "MINIKUBE_HOME="+c.Home, "LANG=C", "NO_COLOR=1")
}
func (CLIRunner) Add(ctx context.Context, c Config, line func(string), started func(int)) error {
	// Arguments are fixed. In particular --delete-on-failure is never passed.
	cmd := exec.CommandContext(ctx, c.Binary, "--profile", c.Profile, "node", "add", "--worker")
	cmd.Env = cliEnv(c)
	pipe, err := cmd.StdoutPipe()
	if err != nil {
		return err
	}
	cmd.Stderr = io.Discard
	if err = cmd.Start(); err != nil {
		return err
	}
	started(cmd.Process.Pid)
	scanner := bufio.NewScanner(pipe)
	scanner.Buffer(make([]byte, 4096), 64<<10)
	for scanner.Scan() {
		line(scanner.Text())
	}
	scanErr := scanner.Err()
	if scanErr != nil {
		_ = cmd.Process.Kill()
	}
	waitErr := cmd.Wait()
	if scanErr != nil {
		return scanErr
	}
	return waitErr
}
func (CLIRunner) HostExists(ctx context.Context, c Config, name string) (bool, error) {
	if !profilePattern.MatchString(name) || !strings.HasPrefix(name, c.Profile+"-m") {
		return false, errors.New("Beklenen worker host adı geçersiz")
	}
	cmd := exec.CommandContext(ctx, "docker", "inspect", "--format", "{{.Name}}", name)
	cmd.Env = cliEnv(c)
	var out, stderr bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &stderr
	err := cmd.Run()
	if err == nil {
		return strings.TrimSpace(out.String()) == "/"+name, nil
	}
	message := strings.ToLower(stderr.String())
	if strings.Contains(message, "no such object") || strings.Contains(message, "no such container") {
		return false, nil
	}
	return false, errors.New("Docker worker envanteri okunamadı")
}
