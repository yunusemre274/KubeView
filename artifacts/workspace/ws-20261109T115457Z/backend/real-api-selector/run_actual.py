#!/usr/bin/env python3
"""Explicitly leased, single bounded owned-lab phase; no credential output."""
import datetime
import hashlib
import json
import os
from pathlib import Path
import subprocess
import time

REPO = Path(__file__).resolve().parents[5]
OUTPUT = Path(__file__).resolve().parent
STATE = Path.home() / "Library/Application Support/KubeView/manual-lab-v1/lab.json"
PRIVATE = STATE.parent / "private/admin.json"
EXPECTED = "b9a17b7b-b14a-4678-9b88-d5554e5d9ea5"


def sources():
    files = {}
    for path in sorted((REPO / "backend").rglob("*.go")):
        if "vendor" not in path.parts:
            files[str(path.relative_to(REPO / "backend"))] = hashlib.sha256(path.read_bytes()).hexdigest()
    encoded = json.dumps(files, sort_keys=True, separators=(",", ":")).encode()
    return {"files": files, "sha256": hashlib.sha256(encoded).hexdigest()}


if os.environ.get("KUBEVIEW_WORKSPACE_REAL_LEASE") != "selector-multins-overlap":
    raise SystemExit("explicit root lease required")
lab = json.loads(STATE.read_text())
process = lab.get("processes", {}).get("02-ortak-kume", {})
if lab.get("labId") != "kvml-ccdfe731dabd" or lab.get("clusters", {}).get("a", {}).get("uid") != EXPECTED or process.get("port") != 19702 or not process.get("pid") or len(process.get("binarySha256", "")) != 64:
    raise SystemExit("owned lab/gateway identity precondition failed")
stamp = datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%dT%H%M%SZ")
log = OUTPUT / ("selector-" + stamp + ".jsonl")
metadata = OUTPUT / ("selector-" + stamp + "-meta.json")
command = ["go", "test", "-json", "-count=1", "-p=1", "-timeout=210s", "./pkg/server", "-run", "^TestOwnedWorkspaceRealAPISelectorMultiNSOverlap$"]
env = os.environ.copy()
env.update({
    "KUBEVIEW_WORKSPACE_REAL_PHASE": "selector-multins-overlap",
    "KUBEVIEW_WORKSPACE_REAL_BASE_URL": "http://127.0.0.1:19702",
    "KUBEVIEW_WORKSPACE_REAL_KUBECONFIG": str(PRIVATE),
    "KUBEVIEW_WORKSPACE_REAL_LAB_STATE": str(STATE),
    "KUBEVIEW_WORKSPACE_REAL_CLUSTER_UID": EXPECTED,
    "KUBEVIEW_WORKSPACE_REAL_OUTPUT": str(OUTPUT),
})
started = time.monotonic()
meta = {"kind": "real owned selector/multiNS/overlap API/watch; not UI/performance", "startedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(), "command": command, "sourceBefore": sources(), "gatewayBinarySHA256": process["binarySha256"], "output": str(log.relative_to(REPO))}
with log.open("wb") as output:
    child = subprocess.Popen(command, cwd=REPO / "backend", env=env, stdout=output, stderr=subprocess.STDOUT)
    meta["goPID"] = child.pid
    try:
        meta["exitCode"] = child.wait(timeout=220)
    except subprocess.TimeoutExpired:
        child.terminate()
        try:
            child.wait(timeout=5)
        except subprocess.TimeoutExpired:
            child.kill()
            child.wait()
        meta["exitCode"] = 124
        meta["outerTimeout"] = True
meta.update({"finishedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(), "elapsedSeconds": round(time.monotonic() - started, 3), "sourceAfter": sources()})
metadata.write_text(json.dumps(meta, indent=2) + "\n")
print(json.dumps({"metadata": str(metadata.relative_to(REPO)), "output": str(log.relative_to(REPO)), "exitCode": meta["exitCode"], "elapsedSeconds": meta["elapsedSeconds"], "sourceUnchanged": meta["sourceBefore"] == meta["sourceAfter"]}))
raise SystemExit(meta["exitCode"])
