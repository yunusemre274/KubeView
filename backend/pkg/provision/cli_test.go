package provision

import (
	"context"
	"os"
	"path/filepath"
	"testing"
)

func TestInstalledMinikubeProfileNames(t *testing.T) {
	cfg := Config{Profile: "kv-repair-test", Home: t.TempDir()}
	dir := filepath.Join(cfg.Home, "profiles", cfg.Profile)
	if err := os.MkdirAll(dir, 0700); err != nil {
		t.Fatal(err)
	}
	fixture := `{"Name":"kv-repair-test","Driver":"docker","Nodes":[{"Name":"","ControlPlane":true,"IP":"192.0.2.2"},{"Name":"m02","Worker":true,"IP":"192.0.2.3"}]}`
	if err := os.WriteFile(filepath.Join(dir, "config.json"), []byte(fixture), 0600); err != nil {
		t.Fatal(err)
	}
	inventory, err := (CLIRunner{}).Inventory(context.Background(), cfg)
	if err != nil {
		t.Fatal(err)
	}
	if len(inventory.Machines) != 2 || inventory.Machines[0].Name != cfg.Profile || inventory.Machines[1].Name != cfg.Profile+"-m02" {
		t.Fatal("minikube1.38 short names not normalized", inventory)
	}
}
