//go:build windows

package provision

import (
	"errors"
	"io"
)

func lockProfile(string) (io.Closer, error) {
	return nil, errors.New("Yerel worker sağlayıcısı bu sürümde macOS/Linux operatörünü destekliyor")
}
