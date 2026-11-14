package workspace

import (
	"bytes"
	"encoding/json"
	"fmt"
	"os"
	"reflect"
	"testing"
)

const releaseImportInputCap = 64 << 10

func releaseImportDestination() Document {
	return Document{ID: "destination-workspace", SchemaVersion: SchemaVersion, Revision: 7, Name: "existing trusted workspace", Preferences: map[string]interface{}{"quality": "medium"}, Connections: []Connection{{ID: "existing-connection", Name: "trusted", Context: "SYNTHETIC_TRUSTED_CONTEXT", Bound: true}}, Harbors: []Harbor{{ID: "existing-a", WorkspaceID: "destination-workspace", Name: "A", ConnectionRef: "existing-connection", Namespaces: []string{"qa"}, View: map[string]interface{}{"tab": "summary"}}, {ID: "existing-b", WorkspaceID: "destination-workspace", Name: "B", ConnectionRef: "existing-connection", Namespaces: []string{"other"}, View: map[string]interface{}{}}}, Relations: []Relation{{ID: "existing-relation", Type: "configured", SourceHarbor: "existing-a", TargetHarbor: "existing-b", Origin: "user-existing"}}}
}
func releaseImportSource() Document {
	return Document{ID: "source-workspace", SchemaVersion: SchemaVersion, Revision: 3, Name: "synthetic imported workspace", Preferences: map[string]interface{}{"quality": "medium"}, Connections: []Connection{{ID: "source-connection-a", Name: "A", Context: "SYNTHETIC_UNTRUSTED_CONTEXT_A", Bound: true}, {ID: "source-connection-b", Name: "B", Context: "SYNTHETIC_UNTRUSTED_CONTEXT_B", Bound: true}}, Harbors: []Harbor{{ID: "source-harbor-a", WorkspaceID: "source-workspace", Name: "A", ConnectionRef: "source-connection-a", Namespaces: []string{"qa"}, Selector: "app in (a,c),!excluded", View: map[string]interface{}{"tab": "summary"}}, {ID: "source-harbor-b", WorkspaceID: "source-workspace", Name: "B", ConnectionRef: "source-connection-b", Namespaces: []string{"other"}, View: map[string]interface{}{}}}, Relations: []Relation{{ID: "source-relation", Type: "infrastructure", SourceHarbor: "source-harbor-a", TargetHarbor: "source-harbor-b", Origin: "synthetic-source"}}}
}
func releaseImportJSON(t testing.TB, d Document) []byte {
	t.Helper()
	b, err := json.Marshal(d)
	if err != nil {
		t.Fatal("synthetic document encoding failed")
	}
	return b
}

// Invalid means invalid after Export's documented authority stripping and nil
// collection normalization. A raw Bound/Context mismatch can intentionally heal.
func releaseCheckImport(t testing.TB, src Document) {
	t.Helper()
	dst := releaseImportDestination()
	before := releaseImportJSON(t, dst)
	sourceBefore := releaseImportJSON(t, src)
	exported := Export(src)
	invalid := Validate(exported) != nil
	err := ImportInto(&dst, src)
	if !bytes.Equal(sourceBefore, releaseImportJSON(t, src)) {
		t.Fatal("ImportInto mutated source")
	}
	if invalid {
		if err == nil || !bytes.Equal(before, releaseImportJSON(t, dst)) {
			t.Fatal("invalid imported document changed destination or succeeded")
		}
		return
	}
	if err != nil {
		t.Fatal("valid exported source rejected")
	}
	original := releaseImportDestination()
	baseConnections, baseHarbors, baseRelations := len(original.Connections), len(original.Harbors), len(original.Relations)
	if len(dst.Connections) != baseConnections+len(exported.Connections) || len(dst.Harbors) != baseHarbors+len(exported.Harbors) || len(dst.Relations) != baseRelations+len(exported.Relations) {
		t.Fatal("imported collection counts differ")
	}
	existingOnly := dst
	existingOnly.Connections = dst.Connections[:baseConnections]
	existingOnly.Harbors = dst.Harbors[:baseHarbors]
	existingOnly.Relations = dst.Relations[:baseRelations]
	if !bytes.Equal(before, releaseImportJSON(t, existingOnly)) {
		t.Fatal("import altered destination identity/preferences/trusted bindings/existing objects")
	}
	used := map[string]bool{original.ID: true, src.ID: true}
	for _, d := range []Document{original, src} {
		for _, c := range d.Connections {
			used[c.ID] = true
		}
		for _, h := range d.Harbors {
			used[h.ID] = true
		}
		for _, r := range d.Relations {
			used[r.ID] = true
		}
	}
	fresh := func(id string) {
		if id == "" || used[id] {
			t.Fatal("import restored or reused source/destination identifier")
		}
		used[id] = true
	}
	connectionMap, harborMap := map[string]string{}, map[string]string{}
	for i, c := range dst.Connections[baseConnections:] {
		fresh(c.ID)
		if c.Context != "" || c.Bound {
			t.Fatal("import restored connection authority")
		}
		connectionMap[exported.Connections[i].ID] = c.ID
	}
	for i, h := range dst.Harbors[baseHarbors:] {
		fresh(h.ID)
		source := exported.Harbors[i]
		if h.WorkspaceID != original.ID || h.ConnectionRef != connectionMap[source.ConnectionRef] || !reflect.DeepEqual(h.Namespaces, source.Namespaces) || h.Selector != source.Selector || !reflect.DeepEqual(h.View, source.View) {
			t.Fatal("harbor identity/scope/view not remapped correctly")
		}
		harborMap[source.ID] = h.ID
	}
	for i, r := range dst.Relations[baseRelations:] {
		fresh(r.ID)
		source := exported.Relations[i]
		if r.SourceHarbor != harborMap[source.SourceHarbor] || r.TargetHarbor != harborMap[source.TargetHarbor] || r.Type != "configured" || r.Origin != "user-imported" {
			t.Fatal("relation restored authority or wrong remapping")
		}
	}
	// Aggregate capacity belongs to Store.Update, not ImportInto alone.
	if len(dst.Connections) <= 64 && len(dst.Harbors) <= MaxHarbors && len(dst.Relations) <= 512 {
		if err = Validate(dst); err != nil {
			t.Fatal("capacity-compatible merged document invalid")
		}
	}
	if len(exported.Harbors) > 0 {
		dst.Harbors[baseHarbors].View["import_probe"] = true
		dst.Harbors[baseHarbors].Namespaces[0] = "probe-ns"
		if !bytes.Equal(sourceBefore, releaseImportJSON(t, src)) {
			t.Fatal("imported fields alias mutable source")
		}
	}
}

func TestReleaseImportRejectsInvalidWithoutMutation(t *testing.T) {
	cases := []struct {
		name   string
		change func(*Document)
	}{
		{"malformed-identity", func(d *Document) { d.ID = "bad/id" }},
		{"future-schema", func(d *Document) { d.SchemaVersion = SchemaVersion + 1 }},
		{"unsafe-preferences", func(d *Document) {
			d.Preferences = map[string]interface{}{"authorization": "SYNTHETIC_NOT_A_CREDENTIAL"}
		}},
		{"unsafe-view", func(d *Document) { d.Harbors[0].View = map[string]interface{}{"payload": "SYNTHETIC_DRAFT"} }},
		{"duplicate-id", func(d *Document) { d.Connections[0].ID = d.Harbors[0].ID }},
		{"missing-connection", func(d *Document) { d.Harbors[0].ConnectionRef = "missing" }},
		{"invalid-selector", func(d *Document) { d.Harbors[0].Selector = "app in (" }},
		{"invalid-namespace", func(d *Document) { d.Harbors[0].Namespaces = []string{"bad/namespace"} }},
		{"invalid-relation", func(d *Document) { d.Relations[0].TargetHarbor = d.Relations[0].SourceHarbor }},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			src := releaseImportSource()
			tc.change(&src)
			if Validate(Export(src)) == nil {
				t.Fatal("negative fixture is not invalid")
			}
			releaseCheckImport(t, src)
		})
	}
}
func TestReleaseImportRemapsAuthorityIDsAndRelations(t *testing.T) {
	src := releaseImportSource()
	if Validate(src) != nil {
		t.Fatal("positive fixture invalid")
	}
	releaseCheckImport(t, src)
	// Bound/context inconsistency is removed before validation by design.
	src.Connections[0].Bound = false
	releaseCheckImport(t, src)
}
func TestReleaseImportTransactionCapacityPreservesDisk(t *testing.T) {
	store, err := Open(privateWorkspaceDirectory(t), "SYNTHETIC_TRUSTED_CONTEXT", "qa")
	if err != nil {
		t.Fatal(err)
	}
	before := store.Snapshot()
	diskBefore, err := os.ReadFile(store.path)
	if err != nil {
		t.Fatal(err)
	}
	src := Document{ID: "source-capacity", SchemaVersion: SchemaVersion, Revision: 1, Name: "capacity", Preferences: map[string]interface{}{}, Harbors: []Harbor{}, Relations: []Relation{}}
	for i := 0; i < 64; i++ {
		src.Connections = append(src.Connections, Connection{ID: fmt.Sprintf("source-connection-%02d", i), Name: "synthetic"})
	}
	if Validate(src) != nil {
		t.Fatal("source must individually satisfy capacity")
	}
	sourceBefore := releaseImportJSON(t, src)
	scratch := clone(before)
	if ImportInto(&scratch, src) != nil || Validate(scratch) == nil {
		t.Fatal("test must exceed only combined capacity")
	}
	if _, err = store.Update(before.Revision, func(d *Document) error { return ImportInto(d, src) }); err == nil {
		t.Fatal("overcapacity transaction committed")
	}
	after, err := os.ReadFile(store.path)
	if err != nil || !bytes.Equal(diskBefore, after) || !bytes.Equal(releaseImportJSON(t, before), releaseImportJSON(t, store.Snapshot())) || !bytes.Equal(sourceBefore, releaseImportJSON(t, src)) {
		t.Fatal("failed transaction changed persisted/in-memory/source document")
	}
	reopened, err := Open(store.path[:len(store.path)-len("workspace.json")], "unused-context", "other")
	if err != nil || !bytes.Equal(releaseImportJSON(t, before), releaseImportJSON(t, reopened.Snapshot())) {
		t.Fatal("failed import changed reopened persisted document")
	}
}

func FuzzReleaseImportInto(f *testing.F) {
	valid := releaseImportSource()
	f.Add(releaseImportJSON(f, valid))
	f.Add(releaseImportJSON(f, Export(valid)))
	f.Add([]byte(`{"id":"empty","schemaVersion":1,"revision":1,"name":"empty","preferences":null,"connections":null,"harbors":null,"relations":null}`))
	f.Add([]byte(`{"id":"future","schemaVersion":99,"revision":1,"preferences":{}}`))
	f.Add([]byte(`{"id":"unsafe","schemaVersion":1,"revision":1,"preferences":{"token":"SYNTHETIC"}}`))
	f.Add([]byte(`{"id":"valid-extension","schemaVersion":1,"revision":1,"preferences":{},"ignoredExtension":{"token":"SYNTHETIC_IGNORED"}}`))
	f.Add([]byte(`{"id":"truncated"`))
	f.Add([]byte(`null`))
	f.Fuzz(func(t *testing.T, data []byte) {
		if len(data) > releaseImportInputCap {
			t.Skip("excluded: input exceeds64KiB; no large-body validation claim")
		}
		inputBefore := append([]byte(nil), data...)
		var src Document
		if json.Unmarshal(data, &src) != nil {
			return
		}
		releaseCheckImport(t, src)
		if !bytes.Equal(inputBefore, data) {
			t.Fatal("input bytes mutated")
		}
	})
}
