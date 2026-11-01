//go:build !windows

package provision

import (
	"errors"
	"io"
	"os"
	"syscall"
)

// flock is process-scoped and released by the kernel after a crash. The journal
// remains authoritative for unfinished requests; acquiring a lock never retries.
func lockProfile(path string) (io.Closer, error) {
	f, e := os.OpenFile(path, os.O_CREATE|os.O_RDWR, 0600)
	if e != nil {
		return nil, e
	}
	if e = syscall.Flock(int(f.Fd()), syscall.LOCK_EX|syscall.LOCK_NB); e != nil {
		f.Close()
		return nil, errors.New("Minikube profilini başka bir KubeView sağlayıcı süreci kullanıyor")
	}
	return f, nil
}
