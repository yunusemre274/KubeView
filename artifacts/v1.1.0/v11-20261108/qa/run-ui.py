"""Run the bounded QA queue with an idle assertion tied to its exact PID."""
from pathlib import Path
import datetime
import hashlib
import json
import os
import shlex
import subprocess
import sys
import time

if os.environ.get("KV_V11_TEST_LEASE") != "v11-20261108-qa":
    raise SystemExit("Root QA lease required")
root = Path(__file__).resolve().parents[4]
command = ["node", str(root / "frontend/node_modules/playwright/cli.js"), "test", "-c", "e2e/v11-playwright.config.js", *sys.argv[1:]]
env = os.environ.copy()
env["KV_V11_INVOKED_COMMAND"] = shlex.join(command)
def configuration_hashes():
    private = root / ".git/kv-v11-runtime"
    files = [Path(value) for value in (private / "app-kubeconfig-pathlist.txt").read_text().strip().split(os.pathsep)]
    files += [private / "qa-merged.json", Path.home() / ".kube/config"]
    return {str(file.relative_to(root)) if file.is_relative_to(root) else "global-user-kubeconfig": hashlib.sha256(file.read_bytes()).hexdigest() for file in files}
before_config = configuration_hashes()
started_wall, started_mono = time.time(), time.monotonic()
runner = subprocess.Popen(command, cwd=root / "frontend", env=env)
awake = subprocess.Popen(["/usr/bin/caffeinate", "-di", "-w", str(runner.pid)])
report = {"startedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(), "runnerPID": runner.pid,
          "caffeinatePID": awake.pid, "command": command, "configurationBeforeSHA256": before_config,
          "scope": "Only this runner lifetime; no global OS setting change"}
print("[KV-QA-MANAGER] PID-bound idle assertion active for runner " + str(runner.pid), flush=True)
try:
    code = runner.wait()
finally:
    if runner.poll() is None:
        runner.terminate()
        runner.wait(timeout=10)
    if awake.poll() is None:
        awake.terminate()
        awake.wait(timeout=10)
    report.update(finishedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(), runnerExit=runner.returncode,
                  elapsedWallSeconds=time.time() - started_wall, elapsedMonotonicSeconds=time.monotonic() - started_mono,
                  caffeinateExited=awake.poll() is not None)
    report["configurationAfterSHA256"] = configuration_hashes()
    report["configurationUnchanged"] = before_config == report["configurationAfterSHA256"]
    if not report["configurationUnchanged"]:
        code = 1
    target = Path(__file__).with_name("ui-invocation-" + str(time.time_ns()) + ".json")
    target.write_text(json.dumps(report, indent=2) + "\n")
raise SystemExit(code)
