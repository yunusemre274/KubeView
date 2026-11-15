#!/usr/bin/env python3
"""Record one bounded audit command without recording inherited environment."""
import datetime
import json
import os
from pathlib import Path
import signal
import subprocess
import sys
import time

out = Path(__file__).resolve().parent
name, cwd, *command = sys.argv[1:]
started = datetime.datetime.now(datetime.timezone.utc).isoformat()
begin = time.monotonic()
env = dict(os.environ, GOMAXPROCS="2")
timeout = int(os.environ.get("KV_AUDIT_TIMEOUT_SECONDS", "120"))
timed_out = False
with (out / f"{name}.stdout").open("wb") as stdout, (out / f"{name}.stderr").open("wb") as stderr:
    process = subprocess.Popen(command, cwd=cwd, stdout=stdout, stderr=stderr, env=env, start_new_session=True)
    try:
        code = process.wait(timeout=timeout)
    except subprocess.TimeoutExpired:
        timed_out = True
        os.killpg(process.pid, signal.SIGTERM)
        try:
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            os.killpg(process.pid, signal.SIGKILL)
            process.wait()
        code = 124
record = {
    "command": command,
    "cwd_relative_to_repository": os.path.relpath(cwd, out.parents[3]),
    "started_at_utc": started,
    "finished_at_utc": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "duration_seconds": round(time.monotonic() - begin, 3),
    "exit_code": code,
    "timeout_seconds": timeout,
    "timed_out": timed_out,
    "resource_limit": "GOMAXPROCS=2; Go commands explicitly -p=1 where applicable",
    "stdout_file": f"{name}.stdout",
    "stderr_file": f"{name}.stderr",
}
(out / f"{name}.command.json").write_text(json.dumps(record, indent=2) + "\n")
print(json.dumps(record))
raise SystemExit(0)
