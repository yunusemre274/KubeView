#!/usr/bin/env python3
"""Opt-in bounded real owned-A runner contract. Exactly one sequential test job.

No browser, B/telemetry cluster, Node stop, source mutation or global kubeconfig use.
Only invoke when root has granted the actual cluster test lease.
"""
import argparse
import datetime
import hashlib
import json
import os
from pathlib import Path
import subprocess
import time


def main():
    parser = argparse.ArgumentParser(__doc__)
    parser.add_argument("--state-dir", required=True)
    parser.add_argument("--attempt", required=True)
    args = parser.parse_args()
    root = Path(args.state_dir).expanduser().resolve()
    bundle = Path(__file__).resolve().parents[2]
    runner = bundle / "scripts/manual-lab.sh"
    source = bundle / "scripts/manual_lab.py"
    evidence = bundle / "manual-lab/evidence" / (args.attempt + ".json")
    if evidence.exists():
        raise RuntimeError("immutable attempt already exists")
    report = {"schemaVersion": 1, "attempt": args.attempt, "startedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(), "sourceSHA256": hashlib.sha256(source.read_bytes()).hexdigest(), "testType": "real owned Kubernetes API/runner; no normal UI", "steps": [], "nodeStopInvoked": False, "BStarted": False, "telemetryStarted": False}
    started = time.monotonic()
    caffeinate = subprocess.Popen(["caffeinate", "-w", str(os.getpid())], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL) if os.sys.platform == "darwin" else None
    global_path = Path.home() / ".kube/config"
    original_global = hashlib.sha256(global_path.read_bytes()).hexdigest() if global_path.exists() else None
    def state():
        return json.loads((root / "lab.json").read_text())
    def run(argv, check=True, timeout=150):
        p = subprocess.run([str(x) for x in argv], cwd="/tmp", capture_output=True, text=True, timeout=timeout)
        if check and p.returncode:
            raise RuntimeError(f"{Path(str(argv[0])).name} exit{p.returncode}: {p.stderr[-900:]}")
        return p
    def command(*argv, check=True, timeout=150):
        return run([runner, *argv, "--state-dir", root], check=check, timeout=timeout)
    def kubectl(argv, reader=False, check=True):
        s = state()
        cfg = root / "private" / ("04-kisitli-yetki.json" if reader else "admin.json")
        context = s["clusters"]["a"]["name"] + ("-reader" if reader else "")
        return run(["kubectl", "--kubeconfig", cfg, "--context", context, "--request-timeout=15s", *argv], check=check)
    def objects(resource, ns):
        return json.loads(kubectl(["get", resource, "-n", ns, "-o", "json"]).stdout)["items"]
    def wait_for(label, predicate, timeout=110):
        deadline = time.monotonic() + timeout
        while time.monotonic() < deadline:
            value = predicate()
            if value:
                return value
            time.sleep(0.5)
        raise RuntimeError(label + " condition timeout")
    def step(name, data):
        report["steps"].append({"name": name, "pass": True, "data": data, "elapsedSeconds": round(time.monotonic()-started, 3)})
        print(name + " PASS", flush=True)
    try:
        # 04: real namespaced SA allowed reads and actual API 403, not can-i alone.
        command("up", "--profile", "04-kisitli-yetki")
        s = state(); ns = s["profiles"]["04-kisitli-yetki"]["namespaces"][0]["name"]
        pods = json.loads(kubectl(["get", "pods", "-n", ns, "-o", "json"], reader=True).stdout)["items"]
        denied = {}
        for resource in ("nodes", "namespaces", "secrets"):
            p = kubectl(["get", resource, "-o", "json"] + (["-n", ns] if resource == "secrets" else []), reader=True, check=False)
            denied[resource] = p.returncode != 0 and "forbidden" in p.stderr.lower()
        assert len(pods) == 1 and all(denied.values())
        step("04 actual reader API isolation", {"namespace": ns, "namespaceUid": s["profiles"]["04-kisitli-yetki"]["namespaces"][0]["uid"], "podUids": [p["metadata"]["uid"] for p in pods], "actualForbidden": denied, "tokenRecorded": False, "tokenRefreshedAt": s["profiles"]["04-kisitli-yetki"]["readerTokenRefreshedAt"]})
        # 05: real exit42 in one container, separate image/scheduling failures; reset.
        command("up", "--profile", "05-ariza-toparlanma")
        s = state(); ns = s["profiles"]["05-ariza-toparlanma"]["namespaces"][0]["name"]
        pod = next(p for p in objects("pods", ns) if p["metadata"]["labels"].get("manual.kubeview.local/role") == "two-containers")
        uid = pod["metadata"]["uid"]
        command("scenario", "--profile", "05-ariza-toparlanma", "--name", "container-crash")
        def crashed():
            current = next((p for p in objects("pods", ns) if p["metadata"]["uid"] == uid), None)
            if not current:
                return False
            statuses = {c["name"]: c for c in current.get("status", {}).get("containerStatuses", [])}
            bad = statuses.get("controlled", {}); healthy = statuses.get("healthy", {})
            term = bad.get("lastState", {}).get("terminated", bad.get("state", {}).get("terminated", {}))
            return statuses if term.get("exitCode") == 42 and healthy.get("ready") else False
        statuses = wait_for("controlled actual exit42 and healthy peer", crashed)
        step("05 real single-container crash", {"namespace": ns, "podUid": uid, "exit42": True, "healthyPeerReady": True, "restartCount": statuses["controlled"]["restartCount"]})
        command("scenario", "--profile", "05-ariza-toparlanma", "--name", "container-recover")
        def recovered():
            return any(p["metadata"]["uid"] == uid and len(p.get("status", {}).get("containerStatuses", [])) == 2 and all(c.get("ready") for c in p["status"]["containerStatuses"]) for p in objects("pods", ns))
        wait_for("sameUID recovery", recovered)
        for name in ("bad-image", "unschedulable"):
            command("scenario", "--profile", "05-ariza-toparlanma", "--name", name)
        def image_failure():
            for p in objects("pods", ns):
                if p["metadata"].get("labels", {}).get("manual.kubeview.local/role") == "bad-image":
                    if any(c.get("state", {}).get("waiting", {}).get("reason") in ("ErrImagePull", "ImagePullBackOff") for c in p.get("status", {}).get("containerStatuses", [])):
                        return p["metadata"]["uid"]
            return False
        bad_uid = wait_for("actual image pull failure", image_failure)
        def scheduling_failure():
            for p in objects("pods", ns):
                if p["metadata"].get("labels", {}).get("manual.kubeview.local/role") == "unschedulable" and any(c["type"] == "PodScheduled" and c["status"] == "False" and c.get("reason") == "Unschedulable" for c in p.get("status", {}).get("conditions", [])):
                    return p["metadata"]["uid"]
            return False
        unsched_uid = wait_for("actual Unschedulable", scheduling_failure)
        step("05 actual image and scheduling failures", {"badImagePodUid": bad_uid, "unschedulablePodUid": unsched_uid, "sameUidRecovery": uid})
        command("reset", "--profile", "05-ariza-toparlanma", timeout=250)
        healthy = objects("pods", ns)
        assert len(healthy) == 1 and len(healthy[0]["status"]["containerStatuses"]) == 2 and all(c["ready"] for c in healthy[0]["status"]["containerStatuses"])
        step("05 guarded reset healthy", {"newPodUid": healthy[0]["metadata"]["uid"], "namespacePreserved": json.loads(kubectl(["get", "ns", ns, "-o", "json"]).stdout)["metadata"]["uid"] == s["profiles"]["05-ariza-toparlanma"]["namespaces"][0]["uid"]})
        # 06: actual cross-namespace DNS/Service HTTP and explicit producer lifecycle.
        command("up", "--profile", "06-limanlar-arasi-ag")
        s = state(); spaces = [n["name"] for n in s["profiles"]["06-limanlar-arasi-ag"]["namespaces"]]
        client, server = next(n for n in spaces if n.endswith("-client")), next(n for n in spaces if n.endswith("-server"))
        for name, replicas in (("traffic-start", 1), ("traffic-increase", 3)):
            command("scenario", "--profile", "06-limanlar-arasi-ag", "--name", name)
            kubectl(["rollout", "status", "deployment/traffic", "-n", client, "--timeout=100s"])
            pods = objects("pods", client)
            assert len(pods) == replicas
            log = kubectl(["logs", "-n", client, pods[0]["metadata"]["name"], "--tail=10"]).stdout
            wait_for("HTTP_OK real log", lambda: "HTTP_OK" in kubectl(["logs", "-n", client, pods[0]["metadata"]["name"], "--tail=10"]).stdout, timeout=25)
            step("06 " + name, {"clientNamespace": client, "serverNamespace": server, "clientPods": replicas, "podUids": [p["metadata"]["uid"] for p in pods], "actualHTTP_OK": True, "dnsTarget": "http."+server+".svc.cluster.local", "rawLogRecorded": False})
        command("scenario", "--profile", "06-limanlar-arasi-ag", "--name", "traffic-stop")
        wait_for("producer Pods removed", lambda: not objects("pods", client))
        command("reset", "--profile", "06-limanlar-arasi-ag", timeout=250)
        assert not objects("pods", client)
        step("06 stop/reset no producers", {"producerPods": 0, "serverPods": len(objects("pods", server))})
        # A real down/reup preserves Kubernetes identities and recreates private endpoints.
        before = state(); original_uid = before["clusters"]["a"]["uid"]
        original_ns = {n["name"]: n["uid"] for p in before["profiles"].values() for n in p["namespaces"]}
        command("down", timeout=100)
        status = json.loads(command("status").stdout)
        assert all(not c["running"] for c in status["clusters"]["a"]["containers"])
        command("up", "--profile", "02-ortak-kume", timeout=720)
        after = state(); assert after["clusters"]["a"]["uid"] == original_uid
        for ns, uid in original_ns.items():
            assert json.loads(kubectl(["get", "ns", ns, "-o", "json"]).stdout)["metadata"]["uid"] == uid
        # Refresh reader server/CA/token after the physical restart, then actual read.
        command("up", "--profile", "04-kisitli-yetki")
        restricted_ns = after["profiles"]["04-kisitli-yetki"]["namespaces"][0]["name"]
        assert len(json.loads(kubectl(["get", "pods", "-n", restricted_ns, "-o", "json"], reader=True).stdout)["items"]) == 1
        step("down/reup identities and reader TokenRequest", {"systemUid": original_uid, "namespaceUidsPreserved": original_ns, "readerActualReadAfterRestart": True})
        before_wrong = (root / "lab.json").read_bytes()
        wrong = command("destroy", "--confirm", "kvml-wrong-id", check=False)
        assert wrong.returncode == 2 and before_wrong == (root / "lab.json").read_bytes()
        step("destroy exact-LABID rejection", {"exitCode": wrong.returncode, "stateBytesUnchanged": True})
        final = json.loads(command("status").stdout)
        assert len(final["clusters"]) == 1 and not final["apps"]
        assert all(n["ready"] for n in final["clusters"]["a"]["actualNodes"])
        assert not objects("pods", client)
        report["finalInventory"] = final
        report["pass"] = True
    except Exception as exc:
        report["pass"] = False
        report["failure"] = {"type": type(exc).__name__, "message": str(exc)[-1400:]}
        print("FAIL: " + report["failure"]["message"], flush=True)
    finally:
        report["elapsedSeconds"] = round(time.monotonic()-started, 3)
        report["globalKubeconfigUnchanged"] = original_global == (hashlib.sha256(global_path.read_bytes()).hexdigest() if global_path.exists() else None)
        report["sourceUnchanged"] = report["sourceSHA256"] == hashlib.sha256(source.read_bytes()).hexdigest()
        report["pass"] = bool(report.get("pass") and report["globalKubeconfigUnchanged"] and report["sourceUnchanged"])
        evidence.write_text(json.dumps(report, ensure_ascii=False, indent=2)+"\n")
        if caffeinate:
            caffeinate.terminate(); caffeinate.wait(timeout=5)
    print(json.dumps({"evidence": str(evidence), "pass": report["pass"], "steps": len(report["steps"]), "elapsedSeconds": report["elapsedSeconds"]}), flush=True)
    return 0 if report["pass"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
