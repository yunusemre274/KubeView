// Package workspace persists local harbor configuration, never Kubernetes credentials.
package workspace

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"github.com/google/uuid"
	"k8s.io/apimachinery/pkg/labels"
	"k8s.io/apimachinery/pkg/util/validation"
)

const SchemaVersion = 1
const MaxHarbors = 100
const MaxDocumentBytes = 2 << 20

var ErrRevision = errors.New("workspace revision changed; reload configuration")

type Connection struct {
	ID      string `json:"id"`
	Name    string `json:"name"`
	Context string `json:"context,omitempty"`
	Bound   bool   `json:"bound"`
}
type Harbor struct {
	ID            string                 `json:"id"`
	WorkspaceID   string                 `json:"workspaceId"`
	Name          string                 `json:"name"`
	ConnectionRef string                 `json:"connectionRef"`
	Namespaces    []string               `json:"namespaces"`
	Selector      string                 `json:"selector"`
	Environment   string                 `json:"environment,omitempty"`
	Color         string                 `json:"color,omitempty"`
	Position      [2]float64             `json:"position"`
	View          map[string]interface{} `json:"view"`
}
type Relation struct {
	ID           string `json:"id"`
	Type         string `json:"type"`
	SourceHarbor string `json:"sourceHarbor"`
	TargetHarbor string `json:"targetHarbor"`
	Origin       string `json:"origin"`
}
type Document struct {
	ID            string                 `json:"id"`
	SchemaVersion int                    `json:"schemaVersion"`
	Revision      uint64                 `json:"revision"`
	Name          string                 `json:"name"`
	Preferences   map[string]interface{} `json:"preferences"`
	Connections   []Connection           `json:"connections"`
	Harbors       []Harbor               `json:"harbors"`
	Relations     []Relation             `json:"relations"`
}
type Store struct {
	mu       sync.Mutex
	path     string
	document Document
}

// Open creates an empty workspace or migrates an explicitly selected legacy
// context once. Existing malformed/future documents are returned untouched.
func Open(dir, legacyContext, legacyNamespace string) (*Store, error) {
	if dir == "" {
		return nil, errors.New("workspace data directory required")
	}
	if err := os.MkdirAll(dir, 0700); err != nil {
		return nil, err
	}
	info, err := os.Lstat(dir)
	if err != nil {
		return nil, err
	}
	if !info.IsDir() || info.Mode()&os.ModeSymlink != 0 {
		return nil, errors.New("workspace directory must be a real directory")
	}
	if info.Mode().Perm()&0077 != 0 {
		return nil, errors.New("workspace directory must be private (0700); existing directory permissions were not changed")
	}
	s := &Store{path: filepath.Join(dir, "workspace.json")}
	b, err := readDocumentFile(s.path)
	if err == nil {
		if err = json.Unmarshal(b, &s.document); err != nil {
			return nil, fmt.Errorf("workspace is corrupt; original file preserved: %w", err)
		}
		normalizeCollections(&s.document)
		if err = Validate(s.document); err != nil {
			return nil, err
		}
		if err = os.Chmod(s.path, 0600); err != nil {
			return nil, err
		}
		return s, nil
	}
	if !os.IsNotExist(err) {
		return nil, err
	}
	s.document = Document{ID: uuid.NewString(), SchemaVersion: SchemaVersion, Revision: 1, Name: "Çalışma alanım", Preferences: map[string]interface{}{}, Connections: []Connection{}, Harbors: []Harbor{}, Relations: []Relation{}}
	if legacyContext != "" {
		c := Connection{ID: uuid.NewString(), Name: legacyContext, Context: legacyContext, Bound: true}
		if legacyNamespace == "" {
			legacyNamespace = "*"
		}
		s.document.Connections = append(s.document.Connections, c)
		s.document.Harbors = append(s.document.Harbors, Harbor{ID: uuid.NewString(), WorkspaceID: s.document.ID, Name: legacyContext, ConnectionRef: c.ID, Namespaces: []string{legacyNamespace}, View: map[string]interface{}{}})
	}
	if err = Validate(s.document); err != nil {
		return nil, err
	}
	if err = s.persist(s.document); err != nil {
		return nil, err
	}
	return s, nil
}
func readDocumentFile(path string) ([]byte, error) {
	info, err := os.Lstat(path)
	if err != nil {
		return nil, err
	}
	if !info.Mode().IsRegular() {
		return nil, errors.New("workspace file must be regular; symlinks are not read")
	}
	if info.Size() > MaxDocumentBytes {
		return nil, errors.New("workspace file too large")
	}
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()
	actual, err := f.Stat()
	if err != nil {
		return nil, err
	}
	if !actual.Mode().IsRegular() || !os.SameFile(info, actual) {
		return nil, errors.New("workspace file changed during open")
	}
	b, err := io.ReadAll(io.LimitReader(f, MaxDocumentBytes+1))
	if len(b) > MaxDocumentBytes {
		return nil, errors.New("workspace file too large")
	}
	return b, err
}
func clone(d Document) Document {
	b, _ := json.Marshal(d)
	var out Document
	_ = json.Unmarshal(b, &out)
	return out
}
func normalizeCollections(d *Document) {
	if d.Connections == nil {
		d.Connections = []Connection{}
	}
	if d.Harbors == nil {
		d.Harbors = []Harbor{}
	}
	if d.Relations == nil {
		d.Relations = []Relation{}
	}
	if d.Preferences == nil {
		d.Preferences = map[string]interface{}{}
	}
	for i := range d.Harbors {
		if d.Harbors[i].View == nil {
			d.Harbors[i].View = map[string]interface{}{}
		}
	}
}
func (s *Store) Snapshot() Document { s.mu.Lock(); defer s.mu.Unlock(); return clone(s.document) }
func (s *Store) Update(revision uint64, change func(*Document) error) (Document, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if revision != s.document.Revision {
		return Document{}, ErrRevision
	}
	d := clone(s.document)
	if err := change(&d); err != nil {
		return Document{}, err
	}
	d.ID = s.document.ID
	d.SchemaVersion = SchemaVersion
	d.Revision++
	normalizeCollections(&d)
	if err := Validate(d); err != nil {
		return Document{}, err
	}
	if err := s.persist(d); err != nil {
		return Document{}, err
	}
	s.document = d
	return clone(d), nil
}
func atomicWrite(path string, data []byte) error {
	tmp := path + ".tmp-" + uuid.NewString()
	f, err := os.OpenFile(tmp, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0600)
	if err != nil {
		return err
	}
	defer os.Remove(tmp)
	if _, err = f.Write(data); err == nil {
		err = f.Sync()
	}
	closeErr := f.Close()
	if err == nil {
		err = closeErr
	}
	if err != nil {
		return err
	}
	return os.Rename(tmp, path)
}
func (s *Store) persist(d Document) error {
	b, err := json.MarshalIndent(d, "", "  ")
	if err != nil {
		return err
	}
	if len(b)+1 > MaxDocumentBytes {
		return errors.New("workspace document exceeds disk size limit")
	}
	if old, e := readDocumentFile(s.path); e == nil {
		var disk Document
		if json.Unmarshal(old, &disk) != nil || Validate(disk) != nil {
			return errors.New("workspace file changed to invalid data; original preserved")
		}
		if disk.ID != s.document.ID || disk.Revision != s.document.Revision {
			return ErrRevision
		}
		if e = atomicWrite(s.path+".bak", old); e != nil {
			return e
		}
	} else if !os.IsNotExist(e) {
		return e
	}
	if err = atomicWrite(s.path, append(b, '\n')); err != nil {
		return err
	}
	dir, e := os.Open(filepath.Dir(s.path))
	if e != nil {
		return e
	}
	defer dir.Close()
	return dir.Sync()
}
func validID(id string) bool {
	return len(id) > 0 && len(id) <= 128 && !strings.ContainsAny(id, "/\\ \t\r\n")
}
func safeText(s string, n int) bool { return len(s) <= n && !strings.ContainsRune(s, 0) }

// JSON preferences are bounded and reject credential/draft/body material. These
// are UI preferences, not a general arbitrary-object persistence endpoint.
func safePreferences(v interface{}, depth int) bool {
	if depth > 10 {
		return false
	}
	switch x := v.(type) {
	case nil, bool, string, float64:
		if s, ok := x.(string); ok {
			return safeText(s, 4096)
		}
		if n, ok := x.(float64); ok {
			return !math.IsNaN(n) && !math.IsInf(n, 0)
		}
		return true
	case []interface{}:
		if len(x) > 128 {
			return false
		}
		for _, e := range x {
			if !safePreferences(e, depth+1) {
				return false
			}
		}
		return true
	case map[string]interface{}:
		if len(x) > 64 {
			return false
		}
		for k, e := range x {
			lower := strings.ToLower(k)
			for _, bad := range []string{"token", "secret", "password", "credential", "kubeconfig", "privatekey", "draft", "payload", "authorization", "cookie"} {
				if strings.Contains(lower, bad) {
					return false
				}
			}
			if !safeText(k, 128) || !safePreferences(e, depth+1) {
				return false
			}
		}
		return true
	}
	return false
}
func Validate(d Document) error {
	if d.SchemaVersion != SchemaVersion {
		return fmt.Errorf("unsupported workspace schemaVersion %d; file preserved", d.SchemaVersion)
	}
	if !validID(d.ID) || d.Revision == 0 || !safeText(d.Name, 160) {
		return errors.New("invalid workspace identity/name/revision")
	}
	if len(d.Harbors) > MaxHarbors || len(d.Connections) > 64 || len(d.Relations) > 512 {
		return errors.New("workspace capacity exceeded")
	}
	if !safePreferences(d.Preferences, 0) {
		return errors.New("unsafe workspace preferences")
	}
	ids := map[string]bool{d.ID: true}
	connections := map[string]bool{}
	harbors := map[string]bool{}
	add := func(id string) bool {
		if !validID(id) || ids[id] {
			return false
		}
		ids[id] = true
		return true
	}
	for _, c := range d.Connections {
		if !add(c.ID) || !safeText(c.Name, 160) || !safeText(c.Context, 256) || c.Bound != (c.Context != "") {
			return errors.New("invalid connection")
		}
		connections[c.ID] = true
	}
	for _, h := range d.Harbors {
		if !add(h.ID) || h.WorkspaceID != d.ID || !connections[h.ConnectionRef] || !safeText(h.Name, 160) || !safeText(h.Environment, 80) || !safeText(h.Color, 40) || !safePreferences(h.View, 0) {
			return errors.New("invalid harbor")
		}
		for _, n := range h.Position {
			if math.IsNaN(n) || math.IsInf(n, 0) || math.Abs(n) > 1e7 {
				return errors.New("invalid harbor position")
			}
		}
		if len(h.Namespaces) == 0 || len(h.Namespaces) > 64 {
			return errors.New("explicit namespace scope required")
		}
		seen := map[string]bool{}
		for _, ns := range h.Namespaces {
			if seen[ns] || ns == "*" && len(h.Namespaces) != 1 || ns != "*" && len(validation.IsDNS1123Label(ns)) != 0 {
				return errors.New("invalid namespace scope")
			}
			seen[ns] = true
		}
		if len(h.Selector) > 2048 {
			return errors.New("selector too large")
		}
		if _, err := labels.Parse(h.Selector); err != nil {
			return fmt.Errorf("invalid Kubernetes label selector: %w", err)
		}
		harbors[h.ID] = true
	}
	for _, r := range d.Relations {
		if !add(r.ID) || !harbors[r.SourceHarbor] || !harbors[r.TargetHarbor] || r.SourceHarbor == r.TargetHarbor || (r.Type != "configured" && r.Type != "infrastructure") || !safeText(r.Origin, 160) {
			return errors.New("invalid harbor relation")
		}
	}
	if encoded, err := json.Marshal(d); err != nil || len(encoded) > MaxDocumentBytes {
		return errors.New("workspace document too large or invalid")
	}
	return nil
}

// Export drops trusted context bindings. Import never restores authorization.
func Export(d Document) Document {
	d = clone(d)
	normalizeCollections(&d)
	for i := range d.Connections {
		d.Connections[i].Context = ""
		d.Connections[i].Bound = false
	}
	return d
}
func ImportInto(dst *Document, src Document) error {
	src = Export(src)
	if err := Validate(src); err != nil {
		return err
	}
	ids := map[string]string{}
	for _, c := range src.Connections {
		old := c.ID
		c.ID = uuid.NewString()
		ids[old] = c.ID
		dst.Connections = append(dst.Connections, c)
	}
	for _, h := range src.Harbors {
		old := h.ID
		h.ID = uuid.NewString()
		ids[old] = h.ID
		h.WorkspaceID = dst.ID
		h.ConnectionRef = ids[h.ConnectionRef]
		dst.Harbors = append(dst.Harbors, h)
	}
	for _, r := range src.Relations {
		r.ID = uuid.NewString()
		r.Type = "configured"
		r.Origin = "user-imported"
		r.SourceHarbor = ids[r.SourceHarbor]
		r.TargetHarbor = ids[r.TargetHarbor]
		dst.Relations = append(dst.Relations, r)
	}
	return nil
}
