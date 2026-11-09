"""Explicit Cilium/Hubble extension for a NEW, separate manual-lab state.

Loaded by the runner only; no import side effects, subprocesses or cluster access.
The default vanilla lab is never converted. Helpers are supplied by the runner so
there is one ownership/error/process implementation throughout the bundle.
"""
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tarfile
import time

VERSION = "1.20.2"
RELEASE = "kv-manual-cilium"
FORWARD = "telemetry-forward"
INTENT_LABEL = "manual.kubeview.local/install-intent"
TRACKED = [("DaemonSet", "cilium"), ("Deployment", "cilium-operator"), ("Deployment", "hubble-relay"), ("Service", "hubble-relay")]


class Telemetry:
    def __init__(self, lab, helpers):
        self.lab = lab
        self.run = helpers["run"]
        self.atomic = helpers["atomic"]
        self.mkdir = helpers["private_dir"]
        self.error = helpers["LabError"]
        self.owner = helpers["OWNER"]
        self.assets = helpers["ASSETS"]
        self.now = helpers["now"]
        self.process_identity = helpers["process_identity"]
        self.owns_port = helpers["pid_owns_port"]
        self.free_port = helpers["free_port"]
        self.process_tools = helpers["process_tools"]

    def dependencies(self, required=False):
        result = {"ciliumChart": VERSION, "hubbleRequired": VERSION, "ciliumCLIRequired": False, "automaticPackageInstall": False}
        helm = shutil.which("helm")
        hubble = getattr(self.lab.args, "hubble_binary", None) or shutil.which("hubble")
        if not hubble and self.lab.state:
            hubble = self.lab.state.get("telemetry", {}).get("hubbleBinary")
        result["helm"] = {"available": bool(helm)}
        result["hubble"] = {"available": bool(hubble)}
        if helm:
            env = {key: value for key, value in self.lab.env().items() if not key.startswith("HELM_")}
            rc, version, _ = self.run([helm, "version", "--short"], env=env, check=False, timeout=12)
            _, help_text, _ = self.run([helm, "upgrade", "--help"], env=env, timeout=12)
            flags = all(flag in help_text for flag in ("--install", "--version", "--values", "--timeout", "--wait", "--kube-context", "--kubeconfig", "--labels"))
            self.content_cache_flag = "--content-cache" in help_text
            result["helm"].update(available=rc == 0 and flags, version=version.strip(), verifiedRequiredFlags=flags, contentCacheFlag=self.content_cache_flag)
        if hubble and Path(hubble).is_file():
            hubble = str(Path(hubble).expanduser().resolve())
            # Explicit empty config: never inherit another user's CLI server/auth.
            rc, version, _ = self.run([hubble, "--config", "/dev/null", "version"], env=self.lab.env(), check=False, timeout=12)
            _, help_text, _ = self.run([hubble, "--config", "/dev/null", "status", "--help"], env=self.lab.env(), timeout=12)
            flags = all(flag in help_text for flag in ("--server", "--timeout", "--request-timeout"))
            correct = bool(re.search(r"\bhubble v?" + re.escape(VERSION) + r"\b", version))
            result["hubble"].update(available=rc == 0 and correct and flags, path=hubble, version=version.strip(), exactVersion=correct, verifiedRequiredFlags=flags)
        if required and not (result["helm"]["available"] and result["hubble"]["available"]):
            raise self.error("Telemetry için kurulu Helm (doğrulanan flags) ve Hubble CLI1.20.2 gerekli; --hubble-binary kullanılabilir. Otomatik paket/CLI kurulmadı")
        return result

    def configure(self):
        """Called under the runner lock, before ANY optional cluster creation."""
        lab = self.lab
        if lab.args.profile != "06-limanlar-arasi-ag":
            raise self.error("İlk --telemetry yalnız06 profili ve ayrı fresh --state-dir içindir")
        existing = lab.state["clusters"].get("a")
        if existing and not lab.state.get("telemetry", {}).get("enabled"):
            raise self.error("Mevcut vanilla A CNI'si değiştirilemez; ayrı fresh --state-dir kullanın")
        if "b" in lab.state["clusters"]:
            raise self.error("Telemetry için A-only ayrı state gerekli; bu lab'da B mevcut")
        deps = self.dependencies(required=True)
        _, names, _ = self.run(["docker", "ps", "--filter", "label=created_by.minikube.sigs.k8s.io=true", "--format", "{{.Names}}"])
        own_prefix = lab.state["labId"] + "-"
        other_manual_nodes = [name for name in names.split() if name.startswith("kvml-") and not name.startswith(own_prefix)]
        if other_manual_nodes:
            raise self.error("Kaynak bütçesi: önce diğer manual A/B lab'larını down ile durdurun; telemetry A2 tek başına başlatılır")
        current = lab.state.setdefault("telemetry", {})
        current.update(enabled=True, version=VERSION, mode="separate-A-only", hubbleBinary=deps["hubble"]["path"])
        lab.save()

    def helm_env(self):
        env = {key: value for key, value in self.lab.env().items() if not key.startswith("HELM_")}
        directory = self.lab.root / "private/tool-cache/helm"
        for kind in ("config", "cache", "data"):
            self.mkdir(directory / kind)
            env["HELM_" + kind.upper() + "_HOME"] = str(directory / kind)
        env["HELM_REGISTRY_CONFIG"] = str(directory / "config/registry.json")
        env["HELM_REPOSITORY_CONFIG"] = str(directory / "config/repositories.yaml")
        env["HELM_REPOSITORY_CACHE"] = str(directory / "cache/repository")
        env["HELM_CONTENT_CACHE"] = str(directory / "cache/content")
        return env

    def helm_cache_args(self):
        # Helm4 has a separate OCI content cache; Helm3 has no such flag.
        return ["--content-cache", self.lab.root / "private/tool-cache/helm/cache/content"] if getattr(self, "content_cache_flag", False) else []

    def chart(self):
        state = self.lab.state["telemetry"]
        directory = self.lab.root / "private/tool-cache/charts"
        self.mkdir(directory)
        path = directory / ("cilium-" + VERSION + ".tgz")
        recorded = state.get("chartSha256")
        if recorded:
            if not path.is_file() or hashlib.sha256(path.read_bytes()).hexdigest() != recorded:
                raise self.error("Kaydedilmiş pinned chart SHA değişmiş; yeni chart sahiplenilmedi")
            return path
        if path.exists():
            raise self.error("SHA kaydı olmayan chart dosyası var; otomatik sahiplenme/overwrite yok")
        state["chartDownloadIntentAt"] = self.now()
        self.lab.save()
        self.run(["helm", "pull", "cilium", "--repo", "https://helm.cilium.io/", "--version", VERSION, "--destination", directory] + self.helm_cache_args(), env=self.helm_env(), timeout=100)
        os.chmod(path, 0o600)
        with tarfile.open(path, "r:gz") as archive:
            stream = archive.extractfile("cilium/Chart.yaml")
            if stream is None:
                raise self.error("Official chart metadata yok")
            metadata = stream.read(100000).decode()
        if not all(re.search(r"^" + key + r":\s*[\"']?" + re.escape(VERSION) + r"[\"']?\s*$", metadata, re.MULTILINE) for key in ("version", "appVersion")):
            raise self.error("Pinned chart/appVersion1.20.2 değil")
        state["chartSha256"] = hashlib.sha256(path.read_bytes()).hexdigest()
        self.lab.save()
        return path

    def guard_resources(self, allow_partial=False):
        state = self.lab.state["telemetry"]
        self.lab.guard_cluster("a")
        recorded = state.setdefault("resourceUids", {})
        found = {}
        for kind, name in TRACKED:
            obj = self.lab.get("a", kind, name, "kube-system")
            if not obj:
                if allow_partial:
                    continue
                raise self.error("Telemetry kaynak eksik: " + kind + "/" + name)
            meta = obj["metadata"]
            labels = meta.get("labels", {})
            if labels.get(self.owner) != self.lab.state["labId"] or labels.get(INTENT_LABEL) != state.get("installIntent") or meta.get("annotations", {}).get("meta.helm.sh/release-name") != RELEASE:
                raise self.error("Telemetry kaynak owner/Helm intent farklı; upgrade/forward reddedildi")
            key = kind + "/" + name
            if key in recorded and recorded[key] != meta["uid"]:
                raise self.error("Telemetry resourceUID değişmiş; otomatik eşleme yok")
            found[key] = meta["uid"]
        return found

    def install(self):
        """No CNI exists beforehand: only the explicit owned new-A may call this."""
        state = self.lab.state["telemetry"]
        self.dependencies(required=True)
        if not state.get("installedAt"):
            import uuid
            if "installIntent" not in state:
                if any(self.lab.get("a", kind, name, "kube-system") for kind, name in TRACKED):
                    raise self.error("Önceden mevcut Cilium/Hubble nesneleri sahiplenilmedi")
                state["installIntent"] = uuid.uuid4().hex
                self.lab.save()
            existing = self.guard_resources(allow_partial=True)
            state.setdefault("resourceUids", {}).update(existing)
            self.lab.save()
            chart = self.chart()
            values = json.loads((self.assets / "templates/telemetry-values.json").read_text().replace("__LAB_ID__", self.lab.state["labId"]))
            values["commonLabels"][INTENT_LABEL] = state["installIntent"]
            file = self.lab.root / "private/telemetry-values.json"
            self.atomic(file, values)
            self.lab.guard_cluster("a")
            self.run(["helm", "upgrade", "--install", RELEASE, chart, "--namespace", "kube-system", "--kubeconfig", self.lab.root / "private/admin.json",
                      "--kube-context", self.lab.state["clusters"]["a"]["name"], "--values", file, "--labels", self.owner + "=" + self.lab.state["labId"], "--wait", "--timeout", "5m"] + self.helm_cache_args(), env=self.helm_env(), timeout=380)
            state["resourceUids"] = self.guard_resources()
            state["installedAt"] = self.now()
            self.lab.save()
        else:
            self.guard_resources()
        self.lab.kubectl("a", ["rollout", "status", "daemonset/cilium", "-n", "kube-system", "--timeout=150s"], timeout=165)
        self.lab.kubectl("a", ["rollout", "status", "deployment/hubble-relay", "-n", "kube-system", "--timeout=150s"], timeout=165)
        self.lab.kubectl("a", ["wait", "nodes", "--all", "--for=condition=Ready", "--timeout=150s"], timeout=165)

    def provider_env(self):
        state = self.lab.state["telemetry"]
        self.dependencies(required=True)
        port = self.lab.state["basePort"] + 8
        if port > 65535:
            raise self.error("Telemetry forward port için --base-port en fazla65527 olmalı")
        return {"KV_HUBBLE_ENABLED": "true", "KV_HUBBLE_CONTEXT": self.lab.state["clusters"]["a"]["name"],
                "KV_HUBBLE_CLUSTER_UID": self.lab.state["clusters"]["a"]["uid"], "KV_HUBBLE_CLUSTER_NAME": self.lab.state["labId"],
                "KV_HUBBLE_BINARY": state["hubbleBinary"], "KV_HUBBLE_SERVER": "127.0.0.1:" + str(port), "KV_HUBBLE_ALLOW_LOOPBACK_PLAINTEXT": "true"}

    def forward(self):
        self.process_tools()
        self.guard_resources()
        self.dependencies(required=True)
        lab = self.lab
        service = lab.get("a", "Service", "hubble-relay", "kube-system")
        port = lab.state["basePort"] + 8
        if port > 65535:
            raise self.error("Telemetry forward port taşması")
        old = lab.state["processes"].get(FORWARD)
        if old and self.process_identity(old["pid"]) == old["identity"] and self.owns_port(old["pid"], port):
            if old.get("serviceUid") != service["metadata"]["uid"]:
                raise self.error("Açık forward ServiceUID farklı")
            return
        if old:
            lab.stop_process(FORWARD)
        if not self.free_port(port):
            raise self.error("Telemetry forward port başka süreçte; kapatılmadı")
        binary = str(Path(shutil.which("kubectl")).resolve())
        config = lab.root / "private/admin.json"
        command = [binary, "--kubeconfig", str(config), "--context", lab.state["clusters"]["a"]["name"], "-n", "kube-system", "port-forward", "--address=127.0.0.1",
                   "service/hubble-relay", str(port) + ":" + str(service["spec"]["ports"][0]["port"]), "--pod-running-timeout=30s"]
        proc = subprocess.Popen(command, env=lab.env(), stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, start_new_session=True)
        deadline = time.monotonic() + 35
        while time.monotonic() < deadline:
            if proc.poll() is not None:
                raise self.error("Owned Hubble forward portu açamadı")
            if not self.free_port(port) and self.owns_port(proc.pid, port):
                break
            time.sleep(0.1)
        else:
            proc.terminate()
            try:
                proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                proc.kill(); proc.wait(timeout=5)
            raise self.error("Hubble forward35s içinde Ready olmadı")
        lab.state["processes"][FORWARD] = {"kind": "provider", "pid": proc.pid, "identity": self.process_identity(proc.pid), "port": port,
            "binary": binary, "binarySha256": hashlib.sha256(Path(binary).read_bytes()).hexdigest(), "dataDir": str(config), "variant": "real-cilium-hubble-1.20.2",
            "serviceUid": service["metadata"]["uid"], "startedAt": self.now()}
        lab.save()
        # Hubble uses an empty explicit config; no user's CLI credentials are read.
        empty = lab.root / "private/hubble-empty.json"
        self.atomic(empty, {})
        try:
            self.run([lab.state["telemetry"]["hubbleBinary"], "--config", empty, "status", "--server", "127.0.0.1:" + str(port), "--timeout", "5s", "--request-timeout", "5s"], env=lab.env(), timeout=15)
        except Exception:
            lab.stop_process(FORWARD)
            raise

    def stop_if_unused(self):
        if FORWARD in self.lab.state["processes"] and not any(key != FORWARD for key in self.lab.state["processes"]):
            self.lab.stop_process(FORWARD)
