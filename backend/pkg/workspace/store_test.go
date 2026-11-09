package workspace

import (
	"bytes"
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"sync"
	"testing"
)

func TestWorkspacePersistenceMigrationAndBackup(t *testing.T) {
	dir := privateWorkspaceDirectory(t)
	store, err := Open(dir, "trusted-context", "project-a")
	if err != nil {
		t.Fatal(err)
	}
	initial := store.Snapshot()
	if len(initial.Harbors) != 1 || initial.Harbors[0].Namespaces[0] != "project-a" {
		t.Fatalf("legacy migration: %+v", initial)
	}
	initialID, harborID := initial.ID, initial.Harbors[0].ID
	updated, err := store.Update(initial.Revision, func(d *Document) error {
		d.Harbors[0].Name = "renamed"
		d.Harbors[0].View = map[string]interface{}{"camera": map[string]interface{}{"position": []interface{}{float64(1), float64(2), float64(3)}}, "selection": map[string]interface{}{"uid": "original-uid"}}
		return nil
	})
	if err != nil {
		t.Fatal(err)
	}
	if _, err = store.Update(initial.Revision, func(*Document) error { return nil }); !errors.Is(err, ErrRevision) {
		t.Fatalf("stale revision accepted: %v", err)
	}
	for _, file := range []string{"workspace.json", "workspace.json.bak"} {
		info, err := os.Stat(filepath.Join(dir, file))
		if err != nil || info.Mode().Perm() != 0600 {
			t.Fatalf("%s permissions: %v %v", file, info, err)
		}
	}
	reopened, err := Open(dir, "different-context", "other")
	if err != nil {
		t.Fatal(err)
	}
	actual := reopened.Snapshot()
	if actual.ID != initialID || actual.Harbors[0].ID != harborID || actual.Revision != updated.Revision || actual.Harbors[0].Name != "renamed" {
		t.Fatal("restart changed identity or repeated migration")
	}
	backup, _ := os.ReadFile(filepath.Join(dir, "workspace.json.bak"))
	var prior Document
	if err = json.Unmarshal(backup, &prior); err != nil || prior.Revision != initial.Revision {
		t.Fatal("backup does not preserve prior valid revision")
	}
}
func TestWorkspaceEmptyCorruptAndFutureArePreserved(t *testing.T) {
	store, err := Open(privateWorkspaceDirectory(t), "", "")
	if err != nil || len(store.Snapshot().Harbors) != 0 {
		t.Fatal("new workspace is not empty", err)
	}
	for _, data := range [][]byte{[]byte("{broken"), []byte(`{"id":"future","schemaVersion":2,"revision":1}`)} {
		dir := privateWorkspaceDirectory(t)
		path := filepath.Join(dir, "workspace.json")
		if err = os.WriteFile(path, data, 0600); err != nil {
			t.Fatal(err)
		}
		if _, err = Open(dir, "trusted", "qa"); err == nil {
			t.Fatal("invalid schema silently reset")
		}
		after, _ := os.ReadFile(path)
		if !bytes.Equal(after, data) {
			t.Fatal("invalid original was modified")
		}
	}
}
func TestWorkspaceExportImportNeverRestoresContextOrIDs(t *testing.T) {
	source, _ := Open(privateWorkspaceDirectory(t), "private-context", "qa")
	src := source.Snapshot()
	src.Harbors[0].View = map[string]interface{}{"tab": "resources"}
	exported := Export(src)
	if exported.Connections[0].Context != "" || exported.Connections[0].Bound {
		t.Fatal("context binding exported")
	}
	dst, _ := Open(privateWorkspaceDirectory(t), "", "")
	doc, err := dst.Update(1, func(d *Document) error { return ImportInto(d, src) })
	if err != nil {
		t.Fatal(err)
	}
	if doc.Harbors[0].ID == src.Harbors[0].ID || doc.Connections[0].ID == src.Connections[0].ID || doc.Harbors[0].WorkspaceID != doc.ID || doc.Connections[0].Bound || doc.Connections[0].Context != "" {
		t.Fatal("import restored identity or authority")
	}
	doc.Harbors[0].View["secretDraft"] = "must-not-persist"
	if err = Validate(doc); err == nil {
		t.Fatal("secret draft persisted")
	}
}
func TestWorkspaceConcurrentRevisionSingleWinner(t *testing.T) {
	store, _ := Open(privateWorkspaceDirectory(t), "", "")
	var wg sync.WaitGroup
	var mu sync.Mutex
	success := 0
	for i := 0; i < 16; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			_, err := store.Update(1, func(d *Document) error { d.Name = "winner"; return nil })
			if err == nil {
				mu.Lock()
				success++
				mu.Unlock()
			} else if !errors.Is(err, ErrRevision) {
				t.Error(err)
			}
		}()
	}
	wg.Wait()
	if success != 1 || store.Snapshot().Revision != 2 {
		t.Fatal("lost update", success)
	}
}
func FuzzWorkspaceDocument(f *testing.F) {
	f.Add([]byte(`{"schemaVersion":1,"id":"workspace","revision":1,"name":"safe","preferences":{},"connections":[],"harbors":[],"relations":[]}`))
	f.Add([]byte(`{"schemaVersion":99}`))
	f.Add([]byte(`{"preferences":{"token":"unsafe"}}`))
	f.Fuzz(func(t *testing.T, b []byte) {
		if len(b) > 2<<20 {
			t.Skip()
		}
		var d Document
		if json.Unmarshal(b, &d) != nil {
			return
		}
		if Validate(d) == nil {
			exported := Export(d)
			if err := Validate(exported); err != nil {
				t.Fatal(err)
			}
			for _, c := range exported.Connections {
				if c.Context != "" || c.Bound {
					t.Fatal("export leaked binding")
				}
			}
		}
	})
}

func TestWorkspaceRejectsSymlinkOversizeAndPublicDirectory(t *testing.T) {
	dir := privateWorkspaceDirectory(t)
	target := filepath.Join(privateWorkspaceDirectory(t), "target")
	original := []byte("must remain untouched")
	if err := os.WriteFile(target, original, 0600); err != nil {
		t.Fatal(err)
	}
	if err := os.Symlink(target, filepath.Join(dir, "workspace.json")); err != nil {
		t.Fatal(err)
	}
	if _, err := Open(dir, "", ""); err == nil {
		t.Fatal("symlink accepted")
	}
	after, _ := os.ReadFile(target)
	if !bytes.Equal(original, after) {
		t.Fatal("symlink target modified")
	}
	dir = privateWorkspaceDirectory(t)
	path := filepath.Join(dir, "workspace.json")
	file, err := os.OpenFile(path, os.O_CREATE|os.O_WRONLY, 0600)
	if err != nil {
		t.Fatal(err)
	}
	if err = file.Truncate(MaxDocumentBytes + 1); err != nil {
		t.Fatal(err)
	}
	file.Close()
	if _, err = Open(dir, "", ""); err == nil {
		t.Fatal("oversize file accepted")
	}
	info, _ := os.Stat(path)
	if info.Size() != MaxDocumentBytes+1 {
		t.Fatal("oversize original changed")
	}
	dir = privateWorkspaceDirectory(t)
	if err = os.Chmod(dir, 0755); err != nil {
		t.Fatal(err)
	}
	if _, err = Open(dir, "", ""); err == nil {
		t.Fatal("public data directory accepted")
	}
	info, _ = os.Stat(dir)
	if info.Mode().Perm() != 0755 {
		t.Fatal("existing directory mode changed")
	}
}
func TestWorkspaceExternalFutureReplacementNotOverwritten(t *testing.T) {
	store, _ := Open(privateWorkspaceDirectory(t), "", "")
	future := []byte(`{"schemaVersion":99}`)
	if err := os.WriteFile(store.path, future, 0600); err != nil {
		t.Fatal(err)
	}
	if _, err := store.Update(1, func(d *Document) error { d.Name = "changed"; return nil }); err == nil {
		t.Fatal("external future schema overwritten")
	}
	after, _ := os.ReadFile(store.path)
	if !bytes.Equal(after, future) {
		t.Fatal("external future original modified")
	}
}

func privateWorkspaceDirectory(t *testing.T) string {
	t.Helper()
	dir := filepath.Join(t.TempDir(), "private-workspace")
	if err := os.Mkdir(dir, 0700); err != nil {
		t.Fatal(err)
	}
	return dir
}

func TestWorkspaceNullCollectionsNormalizeWithoutReset(t *testing.T) {
	dir := privateWorkspaceDirectory(t)
	path := filepath.Join(dir, "workspace.json")
	data := []byte(`{"id":"existing","schemaVersion":1,"revision":7,"name":"existing workspace","preferences":null,"connections":null,"harbors":null,"relations":null}`)
	if err := os.WriteFile(path, data, 0600); err != nil {
		t.Fatal(err)
	}
	store, err := Open(dir, "must-not-migrate", "qa")
	if err != nil {
		t.Fatal(err)
	}
	doc := store.Snapshot()
	if doc.ID != "existing" || doc.Revision != 7 || doc.Connections == nil || doc.Harbors == nil || doc.Relations == nil || doc.Preferences == nil {
		t.Fatal("nullable collections reset identity or produced invalid DTO")
	}
	after, _ := os.ReadFile(path)
	if !bytes.Equal(after, data) {
		t.Fatal("read normalization rewrote original file")
	}
}
