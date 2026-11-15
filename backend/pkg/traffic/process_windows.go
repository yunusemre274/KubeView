//go:build windows

package traffic

import (
	"os"
	"os/exec"
)

func configureHubbleProcess(command *exec.Cmd) {
	// Windows uses CommandContext's direct-process cancellation semantics.
	// The shared WaitDelay also bounds inherited-pipe cleanup; no shell or
	// caller-supplied host command is introduced for process termination.
	command.Cancel = func() error {
		if command.Process == nil {
			return os.ErrProcessDone
		}
		return command.Process.Kill()
	}
}
