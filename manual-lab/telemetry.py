"""Explicit Cilium/Hubble extension for a NEW, separate manual-lab state.

Loaded by the runner only; no import side effects, subprocesses or cluster access.
The default vanilla lab is never converted. Helpers are supplied by the runner so
there is one ownership/error/process implementation throughout the bundle.
"""
import base64
import hashlib
import ipaddress
import json
import os
from pathlib import Path
import re
import shutil
import ssl
import subprocess
import tarfile
import tempfile
import time

VERSION = "1.20.2"
RELEASE = "kv-manual-cilium"
FORWARD = "telemetry-forward"
INTENT_LABEL = "manual.kubeview.local/install-intent"
TRACKED = [("DaemonSet", "cilium"), ("Deployment", "cilium-operator"), ("Deployment", "hubble-relay"), ("Service", "hubble-relay")]
CLIENT_SECRET = "hubble-relay-client-certs"
SERVER_SECRET = "hubble-relay-server-certs"
TLS_SERVER_NAME = "ui.hubble-relay.cilium.io"
TRACKED += [("Secret", CLIENT_SECRET), ("Secret", SERVER_SECRET)]


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
        self.require_tls_lab()
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
        self.require_tls_lab()
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
                      "--kube-context", self.lab.state["clusters"]["a"]["name"], "--values", file, "--labels", self.owner + "=" + self.lab.state["labId"], "--wait=false", "--timeout", "5m"] + self.helm_cache_args(), env=self.helm_env(), timeout=380)
            state["resourceUids"] = self.guard_resources()
            state["helmAppliedAt"] = self.now()
            self.lab.save()
        else:
            self.guard_resources()
        self.lab.kubectl("a", ["rollout", "status", "daemonset/cilium", "-n", "kube-system", "--timeout=150s"], timeout=165)
        self.relay_network(repair=True)
        self.lab.kubectl("a", ["rollout", "status", "deployment/hubble-relay", "-n", "kube-system", "--timeout=150s"], timeout=165)
        self.lab.kubectl("a", ["wait", "nodes", "--all", "--for=condition=Ready", "--timeout=150s"], timeout=165)
        self.relay_network()
        state.setdefault("installedAt", self.now())
        self.lab.save()

    def cilium_network(self):
        """Read only plugin names from this lab's exact owned node containers."""
        self.require_tls_lab()
        cluster = self.lab.guard_cluster("a")
        nodes = self.lab.get("a", "nodes")["items"]
        if {n["metadata"]["name"]: n["metadata"]["uid"] for n in nodes} != cluster.get("nodeUids"):
            raise self.error("Cilium CNI doğrulamasında NodeUID envanteri değişmiş")
        proof = {}
        for node in nodes:
            name = node["metadata"]["name"]
            container = next((item for item in cluster["containers"] if item["name"] == name), None)
            if not container or not self.lab.check_container(cluster, container)["State"]["Running"]:
                raise self.error("Cilium CNI için exact owned aktif Node container gerekli")
            _, listing, _ = self.run(["docker", "exec", container["id"], "ls", "-1", "/etc/cni/net.d"])
            files = [f for f in listing.splitlines() if re.fullmatch(r"[A-Za-z0-9_.-]+\.(?:conf|conflist|json)", f)]
            plugins = []
            for file in files:
                _, content, _ = self.run(["docker", "exec", container["id"], "cat", "/etc/cni/net.d/" + file])
                try:
                    config = json.loads(content)
                    plugins.extend(p.get("type") for p in config.get("plugins", [config]))
                except (ValueError, TypeError, AttributeError):
                    raise self.error("Owned Node CNI config güvenli plugin adıyla doğrulanamadı") from None
            if not plugins or set(plugins) != {"cilium-cni"}:
                raise self.error("Owned Node aktif CNI yalnız Cilium değil; relay Pod silinmedi")
            try:
                cidr = str(ipaddress.ip_network(node["spec"]["podCIDR"]))
            except (KeyError, ValueError):
                raise self.error("Owned Node PodCIDR bilinmiyor; relay Pod silinmedi") from None
            proof[name] = {"nodeUid": node["metadata"]["uid"], "podCIDR": cidr, "pluginNames": sorted(set(plugins))}
        self.lab.state["telemetry"]["cniReadyProof"] = proof
        self.lab.save()
        return proof

    def wait_relay_pod(self, pod, deployment_uid, network):
        """Allow one owned incarnation to acquire its IP; never follow a new UID."""
        name, uid = pod["metadata"]["name"], pod["metadata"]["uid"]
        node = pod.get("spec", {}).get("nodeName")
        owner = next((r for r in pod["metadata"].get("ownerReferences", []) if r.get("controller") and r.get("kind") == "ReplicaSet"), None)
        expected_node_uid = network.get(node, {}).get("nodeUid")
        try:
            cidr = ipaddress.ip_network(network[node]["podCIDR"])
        except (KeyError, ValueError, TypeError):
            raise self.error("Relay owned NodeCIDR doğrulanamadı; silme yok") from None
        if not owner or not expected_node_uid:
            raise self.error("Relay owned Pod/RS/NodeUID doğrulanamadı; silme yok")
        deadline = time.monotonic() + 45

        def read(kind, resource_name, namespace=None):
            remaining = deadline - time.monotonic()
            if remaining <= 0:
                raise self.error("Relay aynı PodUID için45s içinde kullanılabilir PodIP vermedi; silme yok")
            args = ["get", kind, resource_name] + (["-n", namespace] if namespace else [])
            args += ["-o", "json", "--ignore-not-found", "--request-timeout=" + str(min(2, remaining)) + "s"]
            _, content, _ = self.lab.kubectl("a", args, timeout=min(3, remaining))
            return json.loads(content) if content.strip() else None

        while True:
            meta = pod.get("metadata", {}) if pod else {}
            current_owner = next((r for r in meta.get("ownerReferences", []) if r.get("controller") and r.get("kind") == "ReplicaSet"), None)
            labels = meta.get("labels", {})
            if meta.get("uid") != uid or meta.get("deletionTimestamp") or current_owner != owner or pod.get("spec", {}).get("nodeName") != node or labels.get(self.owner) != self.lab.state["labId"] or labels.get(INTENT_LABEL) != self.lab.state["telemetry"].get("installIntent"):
                raise self.error("Relay beklerken PodUID/owner/Node değişmiş; silme yok")
            rs = read("ReplicaSet", owner["name"], "kube-system")
            actual_node = read("Node", node)
            if not rs or rs["metadata"]["uid"] != owner["uid"] or not any(r.get("controller") and r.get("kind") == "Deployment" and r.get("uid") == deployment_uid for r in rs["metadata"].get("ownerReferences", [])) or not actual_node or actual_node["metadata"]["uid"] != expected_node_uid:
                raise self.error("Relay beklerken RS owner/NodeUID değişmiş; silme yok")
            try:
                if ipaddress.ip_network(actual_node["spec"]["podCIDR"]) != cidr:
                    raise ValueError("NodeCIDR changed")
            except (KeyError, ValueError, TypeError):
                raise self.error("Relay beklerken NodeCIDR değişmiş/geçersiz; silme yok") from None
            phase = pod.get("status", {}).get("phase")
            value = pod.get("status", {}).get("podIP")
            if phase not in ("Pending", "Running"):
                raise self.error("Relay Pod başlangıç durumu doğrulanamadı; silme yok")
            if value:
                try:
                    ip = ipaddress.ip_address(value)
                except (ValueError, TypeError):
                    raise self.error("Relay PodIP geçersiz; silme yok") from None
                if phase == "Running":
                    return pod, ip, cidr
            remaining = deadline - time.monotonic()
            if remaining <= 0:
                raise self.error("Relay aynı PodUID için45s içinde kullanılabilir PodIP vermedi; silme yok")
            time.sleep(min(0.25, remaining))
            pod = read("Pod", name, "kube-system")

    def relay_network(self, repair=False):
        """Repair the demonstrated bootstrap race once, never generic readiness."""
        self.guard_resources()
        network = self.cilium_network()
        state = self.lab.state["telemetry"]
        deployment_uid = state["resourceUids"]["Deployment/hubble-relay"]
        _, content, _ = self.lab.kubectl("a", ["get", "pods", "-n", "kube-system", "-l", "k8s-app=hubble-relay", "-o", "json"])
        pods = [pod for pod in json.loads(content)["items"] if not pod["metadata"].get("deletionTimestamp")]
        if len(pods) != 1:
            raise self.error("Tek exact owned relay Pod doğrulanamadı; silme yok")
        pod, ip, cidr = self.wait_relay_pod(pods[0], deployment_uid, network)
        meta = pod["metadata"]
        node = pod["spec"]["nodeName"]
        within = ip in cidr
        endpoint = self.lab.get("a", "CiliumEndpoint", meta["name"], "kube-system")
        endpoint_owned = bool(endpoint and any(r.get("kind") == "Pod" and r.get("uid") == meta["uid"] for r in endpoint["metadata"].get("ownerReferences", [])))
        if within and endpoint_owned:
            state["relayNetworkProof"] = {"podUid": meta["uid"], "node": node, "podIP": str(ip), "podIpWithinNodePodCIDR": True, "ciliumEndpointUid": endpoint["metadata"]["uid"]}
            self.lab.save()
            return
        # A missing endpoint alone can be transient. Only the observed invalid
        # node CIDR AND absent CiliumEndpoint prove this particular startup race.
        if not repair or within or endpoint is not None or state.get("relayBootstrapRepair"):
            raise self.error("Relay Cilium ağı doğrulanamadı; kör Pod restart/silme yok")
        current = self.lab.get("a", "Pod", meta["name"], "kube-system")
        if not current or current["metadata"]["uid"] != meta["uid"] or current["metadata"]["resourceVersion"] != meta["resourceVersion"]:
            raise self.error("Relay Pod UID/RV değişmiş; silme yok")
        self.guard_resources()
        if self.cilium_network() != network:
            raise self.error("Relay silme öncesi CNI/NodeUID/CIDR değişmiş; silme yok")
        state["relayBootstrapRepair"] = {"oldPodUid": meta["uid"], "node": node, "oldPodIP": str(ip), "nodePodCIDR": network[node]["podCIDR"], "reason": "outside-node-cidr-and-no-cilium-endpoint", "intentAt": self.now()}
        self.lab.save()
        options = {"apiVersion": "v1", "kind": "DeleteOptions", "preconditions": {"uid": meta["uid"], "resourceVersion": meta["resourceVersion"]}}
        self.lab.kubectl("a", ["delete", "--raw", "/api/v1/namespaces/kube-system/pods/" + meta["name"], "-f", "-"], obj=options)

    def require_tls_lab(self):
        state = self.lab.state or {}
        telemetry = state.get("telemetry", {})
        clusters = state.get("clusters", {})
        if not telemetry.get("enabled") or telemetry.get("mode") != "separate-A-only" or set(clusters) != {"a"} or clusters["a"].get("cni") != "false":
            raise self.error("TLS Secret yalnız explicit ayrı owned telemetry A lab'ında okunabilir")

    def write_pem(self, path, data):
        self.mkdir(path.parent)
        fd, temporary = tempfile.mkstemp(prefix=".tls-", dir=path.parent)
        try:
            os.fchmod(fd, 0o600)
            with os.fdopen(fd, "wb") as stream:
                stream.write(data); stream.flush(); os.fsync(stream.fileno())
            os.replace(temporary, path)
            directory = os.open(path.parent, os.O_RDONLY)
            try:
                os.fsync(directory)
            finally:
                os.close(directory)
        finally:
            if os.path.exists(temporary):
                os.unlink(temporary)

    def tls_material(self):
        self.require_tls_lab()
        self.guard_resources()
        state = self.lab.state["telemetry"]
        # Only two fixed, previously UID-pinned Helm Secrets are read. No caller
        # can select another namespace, Secret, cluster or credential path.
        client = self.lab.get("a", "Secret", CLIENT_SECRET, "kube-system")
        server = self.lab.get("a", "Secret", SERVER_SECRET, "kube-system")
        for name, secret in ((CLIENT_SECRET, client), (SERVER_SECRET, server)):
            meta = secret.get("metadata", {}) if secret else {}
            labels = meta.get("labels", {})
            if not state.get("resourceUids", {}).get("Secret/" + name) or meta.get("uid") != state["resourceUids"]["Secret/" + name] or labels.get(self.owner) != self.lab.state["labId"] or labels.get(INTENT_LABEL) != state.get("installIntent") or meta.get("annotations", {}).get("meta.helm.sh/release-name") != RELEASE:
                raise self.error("TLS Secret UID/Helm/owner farklı; private credential kopyalanmadı")
        try:
            ca = base64.b64decode(client["data"]["ca.crt"], validate=True)
            cert = base64.b64decode(client["data"]["tls.crt"], validate=True)
            key = base64.b64decode(client["data"]["tls.key"], validate=True)
            server_ca = base64.b64decode(server["data"]["ca.crt"], validate=True)
            if not ca or not cert or not key or ca != server_ca:
                raise ValueError("TLS CA mismatch")
            directory = self.lab.root / "private/telemetry-tls"
            paths = {"ca": directory / "ca.crt", "cert": directory / "client.crt", "key": directory / "client.key"}
            for name, payload in (("ca", ca), ("cert", cert), ("key", key)):
                self.write_pem(paths[name], payload)
            context = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
            context.load_verify_locations(cadata=ca.decode("ascii"))
            context.load_cert_chain(paths["cert"], paths["key"])
        except Exception:
            raise self.error("Owned TLS materyali doğrulanamadı; değerler/private yollar tanıya yazılmadı") from None
        state["tlsMaterial"] = {"clientSecretUid": client["metadata"]["uid"], "serverSecretUid": server["metadata"]["uid"],
            "caSha256": hashlib.sha256(ca).hexdigest(), "clientCertSha256": hashlib.sha256(cert).hexdigest(), "clientKeyPresent": True, "serverName": TLS_SERVER_NAME, "mutualTLS": True}
        self.lab.save()
        return paths

    def provider_env(self):
        state = self.lab.state["telemetry"]
        self.dependencies(required=True)
        port = self.lab.state["basePort"] + 8
        if port > 65535:
            raise self.error("Telemetry forward port için --base-port en fazla65527 olmalı")
        paths = self.tls_material()
        return {"KV_HUBBLE_ENABLED": "true", "KV_HUBBLE_CONTEXT": self.lab.state["clusters"]["a"]["name"],
                "KV_HUBBLE_CLUSTER_UID": self.lab.state["clusters"]["a"]["uid"], "KV_HUBBLE_CLUSTER_NAME": self.lab.state["labId"],
                "KV_HUBBLE_BINARY": state["hubbleBinary"], "KV_HUBBLE_SERVER": "tls://127.0.0.1:" + str(port), "KV_HUBBLE_ALLOW_LOOPBACK_PLAINTEXT": "false",
                "KV_HUBBLE_TLS_CA": str(paths["ca"]), "KV_HUBBLE_TLS_CERT": str(paths["cert"]), "KV_HUBBLE_TLS_KEY": str(paths["key"]), "KV_HUBBLE_TLS_SERVER_NAME": TLS_SERVER_NAME}

    def forward(self):
        self.process_tools()
        self.guard_resources()
        self.dependencies(required=True)
        paths = self.tls_material()
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
            self.run([lab.state["telemetry"]["hubbleBinary"], "--config", empty, "status", "--server", "127.0.0.1:" + str(port), "--tls",
                      "--tls-ca-cert-files", paths["ca"], "--tls-client-cert-file", paths["cert"], "--tls-client-key-file", paths["key"], "--tls-server-name", TLS_SERVER_NAME,
                      "--timeout", "5s", "--request-timeout", "5s"], env=lab.env(), timeout=15)
        except Exception:
            lab.stop_process(FORWARD)
            raise self.error("Hubble mTLS status doğrulanamadı; private tanılar artefakta yazılmadı") from None

    def stop_if_unused(self):
        if FORWARD in self.lab.state["processes"] and not any(key != FORWARD for key in self.lab.state["processes"]):
            self.lab.stop_process(FORWARD)
