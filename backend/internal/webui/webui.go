// Package webui holds the production frontend. Development builds without a
// prepared index retain the external STATIC_DIR/Vite workflow.
package webui

import (
	"embed"
	"io/fs"
)

//go:embed dist
var assets embed.FS

func Files() (fs.FS, bool) {
	root, err := fs.Sub(assets, "dist")
	if err != nil {
		return nil, false
	}
	_, err = fs.Stat(root, "index.html")
	return root, err == nil
}
