//go:build !windows

package traffic

import (
	"os"
	"os/exec"
	"syscall"
)

func configureHubbleProcess(command *exec.Cmd) {
	command.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}
	// Kill only this fixed CLI's newly-created process group. Its owner still
	// calls Wait and joins stdout/health readers on cancellation.
	command.Cancel = func() error {
		if command.Process == nil {
			return os.ErrProcessDone
		}
		err := syscall.Kill(-command.Process.Pid, syscall.SIGKILL)
		if err == syscall.ESRCH {
			return os.ErrProcessDone
		}
		return err
	}
}
