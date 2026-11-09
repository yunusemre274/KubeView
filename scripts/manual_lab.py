#!/usr/bin/env python3
"""KubeView's private, restartable manual acceptance lab (stdlib only).

No command ever loads the user's default kubeconfig. Runtime state is outside the
bundle. Ownership failures are fatal; a resource with a familiar name is not ours.
"""
from __future__ import annotations

import argparse
import base64
import contextlib
import copy
import datetime as dt
import fcntl
import hashlib
import http.cookiejar
import importlib.util
import ipaddress
import json
import os
from pathlib import Path
import platform
import re
import shlex
import shutil
import signal
import socket
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
import uuid

# A read-only installation bundle must never become a runtime cache directory.
sys.dont_write_bytecode = True

ASSETS = Path(__file__).resolve().parent.parent / "manual-lab"
CATALOG = json.loads((ASSETS / "profiles.json").read_text())
PROFILES = {p["id"]: p for p in CATALOG["profiles"]}
PINS = CATALOG["pins"]
OWNER = "manual.kubeview.local/lab-id"
PROFILE = "manual.kubeview.local/profile"
ROLE = "manual.kubeview.local/role"
SCHEMA = 1


class LabError(Exception):
    pass


def now():
    return dt.datetime.now(dt.timezone.utc).isoformat()


def scrub(value):
    value = re.sub(r"eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+", "[TOKEN REDACTED]", str(value))
    value = re.sub(r"(?i)(bearer\s+)[^\s\"']+", r"\1[REDACTED]", value)
    value = re.sub(r"(?i)(token|client-key-data|client-certificate-data|certificate-authority-data)([\"']?\s*[:=]\s*)[^\s,]+", r"\1\2[REDACTED]", value)
    return value[-1800:]


def run(argv, *, env=None, payload=None, timeout=45, check=True):
    """Finite subprocess; terminate only the process group created by this call."""
    try:
        proc = subprocess.Popen([str(x) for x in argv], stdin=subprocess.PIPE if payload is not None else subprocess.DEVNULL,
                                stdout=subprocess.PIPE, stderr=subprocess.PIPE, env=env, start_new_session=True)
        try:
            out, err = proc.communicate(payload.encode() if isinstance(payload, str) else payload, timeout=timeout)
        except subprocess.TimeoutExpired:
            os.killpg(proc.pid, signal.SIGTERM)
            try:
                proc.communicate(timeout=5)
            except subprocess.TimeoutExpired:
                os.killpg(proc.pid, signal.SIGKILL)
                proc.communicate()
            raise LabError(f"{Path(str(argv[0])).name}: {timeout}s süre sınırı aşıldı; bu çağrının süreci kapatıldı")
        except KeyboardInterrupt:
            # A cancelled CLI must not leave its minikube/kubectl child running.
            with contextlib.suppress(ProcessLookupError):
                os.killpg(proc.pid, signal.SIGTERM)
            try:
                proc.communicate(timeout=5)
            except subprocess.TimeoutExpired:
                with contextlib.suppress(ProcessLookupError):
                    os.killpg(proc.pid, signal.SIGKILL)
                proc.communicate()
            raise
    except FileNotFoundError:
        raise LabError(f"Araç bulunamadı: {argv[0]}")
    if check and proc.returncode:
        # TokenRequest and raw kubeconfig output must never enter diagnostics.
        safe = "private credential işlemi başarısız" if any(x in argv for x in ("token", "--raw")) else scrub(err.decode(errors="replace"))
        raise LabError(f"{Path(str(argv[0])).name} çıkış {proc.returncode}: {safe}")
    return proc.returncode, out.decode(errors="replace"), err.decode(errors="replace")


def private_dir(path):
    path.mkdir(parents=True, exist_ok=True, mode=0o700)
    if path.is_symlink() or path.stat().st_uid != os.getuid():
        raise LabError(f"Özel dizin sahibi/symlink güvenli değil: {path}")
    os.chmod(path, 0o700)


def atomic(path, obj):
    private_dir(path.parent)
    data = (json.dumps(obj, indent=2, ensure_ascii=False) + "\n").encode()
    fd, temporary = tempfile.mkstemp(prefix=".atomic-", dir=path.parent)
    try:
        os.fchmod(fd, 0o600)
        with os.fdopen(fd, "wb") as stream:
            stream.write(data)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, path)
        directory = os.open(path.parent, os.O_RDONLY)
        try:
            os.fsync(directory)
        finally:
            os.close(directory)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest() if path.is_file() else None


def default_state():
    if sys.platform == "darwin":
        return Path.home() / "Library/Application Support/KubeView/manual-lab-v1"
    base = Path(os.environ.get("XDG_STATE_HOME", str(Path.home() / ".local/state"))).expanduser()
    if not base.is_absolute():
        raise LabError("XDG_STATE_HOME mutlak bir yol olmalı")
    return base / "kubeview/manual-lab-v1"


def global_configs():
    paths = {Path.home() / ".kube/config"}
    paths.update(Path(p).expanduser() for p in os.environ.get("KUBECONFIG", "").split(os.pathsep) if p)
    return {str(p.absolute()): digest(p) for p in paths}


def free_port(port):
    with socket.socket() as sock:
        try:
            sock.bind(("127.0.0.1", port))
            return True
        except OSError:
            return False


def process_identity(pid):
    rc, out, _ = run(["ps", "-p", str(pid), "-o", "lstart=", "-o", "command="], check=False)
    return out.strip() if rc == 0 else None


def pid_owns_port(pid, port):
    if shutil.which("lsof"):
        rc, out, _ = run(["lsof", "-nP", "-a", "-p", str(pid), "-iTCP:" + str(port), "-sTCP:LISTEN", "-t"], check=False)
        return rc == 0 and str(pid) in out.split()
    if sys.platform.startswith("linux"):
        rc, out, _ = run(["ss", "-ltnp", "sport = :" + str(port)], check=False)
        return rc == 0 and f"pid={pid}," in out
    raise LabError("Süreç/port sahipliği için lsof (macOS/Linux) veya ss (Linux) gerekli")


def process_tools():
    if not shutil.which("ps"):
        raise LabError("Süreç doğum/komut doğrulaması için ps gerekli; child başlatılmadı")
    if shutil.which("lsof"):
        return "lsof"
    if sys.platform.startswith("linux") and shutil.which("ss"):
        return "ss"
    raise LabError("Süreç/port sahipliği için lsof veya Linux ss gerekli; child başlatılmadı")


class Lab:
    def __init__(self, args):
        self.args = args
        raw = Path(args.state_dir).expanduser() if args.state_dir else default_state()
        if raw.is_symlink():
            raise LabError("State dizini symlink olamaz")
        self.root = raw.absolute().resolve()
        bundle = ASSETS.parent
        if self.root == Path.home() or self.root == Path("/") or self.root == bundle or bundle in self.root.parents:
            raise LabError("State dizini normal kullanıcı verisinde ve bundle/repo dışında olmalı")
        self.file = self.root / "lab.json"
        self.state = None
        if self.file.exists():
            if self.file.is_symlink() or self.file.stat().st_uid != os.getuid() or self.file.stat().st_mode & 0o077:
                raise LabError("lab.json özel kullanıcı dosyası olmalı (0600), symlink olamaz")
            try:
                self.state = json.loads(self.file.read_text())
            except (ValueError, OSError):
                raise LabError("lab.json bozuk/okunamıyor; otomatik sıfırlanmadı. Dosyayı yedekleyip farklı --state-dir kullanın")
            if self.state.get("schemaVersion") != SCHEMA:
                raise LabError("Desteklenmeyen lab şeması; otomatik migration veya overwrite yok")
            if self.state.get("stateDir") != str(self.root) or not re.fullmatch(r"kvml-[0-9a-f]{12}", self.state.get("labId", "")):
                raise LabError("Lab kimliği veya stateDir eşleşmiyor; dizini kopyalayarak başka lab'a dönüştürmeyin")

    def save(self):
        self.state["updatedAt"] = now()
        atomic(self.file, self.state)

    def telemetry(self):
        if not hasattr(self, "_telemetry"):
            spec = importlib.util.spec_from_file_location("kubeview_manual_telemetry", ASSETS / "telemetry.py")
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            self._telemetry = module.Telemetry(self, globals())
        return self._telemetry

    @contextlib.contextmanager
    def lock(self, initialize=False):
        if not self.state and not initialize:
            raise LabError("Henüz lab yok; önce up --profile ... çalıştırın")
        if not self.state:
            if self.root.exists() and any(self.root.iterdir()):
                raise LabError("State dizini dolu fakat lab kimliği yok; sahiplenme reddedildi")
            private_dir(self.root)
        with (self.root / ".lock").open("a+") as handle:
            os.chmod(self.root / ".lock", 0o600)
            try:
                fcntl.flock(handle, fcntl.LOCK_EX | fcntl.LOCK_NB)
            except BlockingIOError:
                raise LabError("Bu lab'da başka runner komutu çalışıyor")
            # Re-read under lock so a concurrent creator cannot be overwritten.
            if self.file.exists():
                self.state = Lab(self.args).state
            elif not self.state:
                base = self.args.base_port or 19700
                if not 1024 <= base <= 65528:
                    raise LabError("--base-port 1024..65528 arasında olmalı")
                self.state = {"schemaVersion": SCHEMA, "labId": "kvml-" + uuid.uuid4().hex[:12],
                              "stateDir": str(self.root), "createdAt": now(), "basePort": base,
                              "clusters": {}, "profiles": {}, "processes": {}, "globalConfigHashesAtCreation": global_configs()}
                self.save()
            if self.args.base_port and self.args.base_port != self.state["basePort"]:
                raise LabError("Mevcut lab port planı farklı; yeni --state-dir seçin")
            before = global_configs()
            try:
                yield
            finally:
                if global_configs() != before:
                    raise LabError("GLOBAL KUBECONFIG DEĞİŞTİ: bu çağrı sırasında dış değişiklik veya ihlal oldu; inceleyin")

    def env(self):
        env = dict(os.environ)
        for key in list(env):
            if key.startswith(("MINIKUBE_", "KUBEVIEW_", "HUBBLE_", "KV_HUBBLE_", "KV_MINIKUBE_", "KV_PROVIDER_", "KUBERNETES_")) or key in {
                "KUBECONFIG", "KUBE_CONTEXT", "WATCH_NAMESPACE", "API_TOKEN", "STATIC_DIR", "READ_ONLY", "BIND_ADDR", "PORT"}:
                env.pop(key, None)
        env["MINIKUBE_HOME"] = str(self.root / "minikube")
        env["KUBECONFIG"] = str(self.root / "private/admin.json")
        env["MINIKUBE_IN_STYLE"] = "false"
        env["MINIKUBE_WANTUPDATENOTIFICATION"] = "false"
        return env

    def kubectl(self, key, argv, *, obj=None, check=True, timeout=40):
        cluster = self.state["clusters"][key]
        if argv and argv[0] != "config":
            self.validate_admin_auth(key)
        command = ["kubectl", "--kubeconfig", self.root / "private/admin.json", "--context", cluster["name"], "--request-timeout=20s"] + list(argv)
        return run(command, env=self.env(), payload=json.dumps(obj) if obj is not None else None, check=check, timeout=timeout)

    def admin_document(self):
        _, out, _ = run(["kubectl", "--kubeconfig", self.root / "private/admin.json", "config", "view", "--raw", "-o", "json"], env=self.env())
        return json.loads(out)

    def validate_admin_auth(self, key):
        config = self.admin_document()
        name = self.state["clusters"][key]["name"]
        context = next((c["context"] for c in config.get("contexts", []) if c["name"] == name), {})
        cluster = next((c["cluster"] for c in config.get("clusters", []) if c["name"] == context.get("cluster")), {})
        user = next((u["user"] for u in config.get("users", []) if u["name"] == context.get("user")), {})
        ca = cluster.get("certificate-authority-data") or cluster.get("certificate-authority")
        cert = user.get("client-certificate-data") or user.get("client-certificate")
        key_data = user.get("client-key-data") or user.get("client-key")
        if not ca or not cert or not key_data or cluster.get("insecure-skip-tls-verify"):
            raise LabError("Private admin auth/CA eksik veya güvensiz; interaktif Username prompt çalıştırılmadı")

    def refresh_admin_server(self, key):
        """Keep all other contexts; repair only this owned minikube entry.

        minikube1.38.1 update-context can overwrite embedded CA/auth with empty
        settings. Inspect the actual mapped port instead; reconstruct missing
        credentials exclusively from this lab's owned private profile files.
        """
        cluster = self.guard_cluster(key, api=False)
        name = cluster["name"]
        primary = next(record for record in cluster["containers"] if record["name"] == name)
        actual = self.check_container(cluster, primary)
        network = actual["NetworkSettings"]["Networks"].get(cluster["network"]["name"], {})
        if network.get("NetworkID") != cluster["network"]["id"]:
            raise LabError("Owned API server network ID farklı")
        bindings = actual["NetworkSettings"].get("Ports", {}).get("8443/tcp") or []
        binding = next((b for b in bindings if b.get("HostIp") == "127.0.0.1"), None)
        if not binding or not str(binding.get("HostPort", "")).isdigit() or not 1 <= int(binding["HostPort"]) <= 65535:
            raise LabError("Owned8443 API loopback port mapping yok; private config değiştirilmedi")
        config = self.admin_document()
        context_entry = next((c for c in config.get("contexts", []) if c["name"] == name), {"name": name, "context": {"cluster": name, "user": name}})
        if context_entry["context"].get("cluster") != name or context_entry["context"].get("user") != name:
            raise LabError("Owned context referansları değişmiş; başka cluster/user alanı overwrite edilmedi")
        cluster_entry = copy.deepcopy(next((c for c in config.get("clusters", []) if c["name"] == name), {"name": name, "cluster": {}}))
        user_entry = copy.deepcopy(next((u for u in config.get("users", []) if u["name"] == name), {"name": name, "user": {}}))
        fields, auth = cluster_entry["cluster"], user_entry["user"]
        def owned_bytes(path):
            if not path.is_file() or not path.resolve().is_relative_to(self.root) or path.stat().st_uid != os.getuid():
                raise LabError("Owned private minikube credential dosyası yok/güvensiz; user global config kullanılmadı")
            return base64.b64encode(path.read_bytes()).decode("ascii")
        if not (fields.get("certificate-authority-data") or fields.get("certificate-authority")):
            fields["certificate-authority-data"] = owned_bytes(self.root / "minikube/.minikube/ca.crt")
        if not ((auth.get("client-certificate-data") or auth.get("client-certificate")) and (auth.get("client-key-data") or auth.get("client-key"))):
            if any(auth.get(k) for k in ("token", "tokenFile", "username", "password", "exec", "auth-provider")):
                raise LabError("Owned admin yerine farklı auth yöntemi var; kullanıcı yetkisi otomatik yükseltilmedi")
            profile = self.root / "minikube/.minikube/profiles" / name
            auth["client-certificate-data"] = owned_bytes(profile / "client.crt")
            auth["client-key-data"] = owned_bytes(profile / "client.key")
            auth.pop("client-certificate", None)
            auth.pop("client-key", None)
        fields["server"] = "https://127.0.0.1:" + binding["HostPort"]
        fields["insecure-skip-tls-verify"] = False
        config["clusters"] = [c for c in config.get("clusters", []) if c["name"] != name] + [cluster_entry]
        config["users"] = [u for u in config.get("users", []) if u["name"] != name] + [user_entry]
        config["contexts"] = [c for c in config.get("contexts", []) if c["name"] != name] + [context_entry]
        atomic(self.root / "private/admin.json", config)
        self.validate_admin_auth(key)

    def get(self, key, resource, name=None, ns=None):
        args = ["get", resource] + ([name] if name else []) + (["-n", ns] if ns else []) + ["-o", "json", "--ignore-not-found"]
        _, out, _ = self.kubectl(key, args)
        if out.strip():
            return json.loads(out)
        # kubectl --ignore-not-found emits no bytes for an empty collection.
        # API/transport errors still raise; offline is never interpreted as empty.
        return {"apiVersion": "v1", "kind": "List", "items": []} if name is None else None

    def inspect_container(self, name):
        rc, out, _ = run(["docker", "container", "inspect", name], check=False)
        if rc:
            return None
        values = json.loads(out)
        return values[0] if values else None

    def check_container(self, cluster, record):
        actual = self.inspect_container(record["id"])
        if not actual or actual["Id"] != record["id"] or actual["Name"].lstrip("/") != record["name"] or actual["Created"] != record["created"]:
            raise LabError("Docker container kimliği değişti; mutasyon reddedildi")
        labels = actual["Config"].get("Labels") or {}
        expected_names = {cluster["name"]} | {cluster["name"] + f"-m{n:02d}" for n in range(2, cluster["nodes"] + 1)}
        if labels.get("created_by.minikube.sigs.k8s.io") != "true" or labels.get("name.minikube.sigs.k8s.io") != record["name"] or record["name"] not in expected_names:
            raise LabError("Minikube container label sahibi eşleşmiyor")
        return actual

    def guard_cluster(self, key, api=True):
        cluster = self.state["clusters"].get(key)
        if not cluster or not cluster.get("containers"):
            raise LabError("Kayıtlı container sahipliği yok; önce kontrollü up kurtarması gerekli")
        for record in cluster["containers"]:
            self.check_container(cluster, record)
        if api:
            system = self.get(key, "namespace", "kube-system")
            if not system or system["metadata"]["uid"] != cluster.get("uid"):
                raise LabError("kube-system UID farklı; yanlış kümeye mutasyon reddedildi")
            marker = self.get(key, "configmap", "kubeview-manual-lab-owner", "kube-system")
            if not marker or marker["metadata"].get("labels", {}).get(OWNER) != self.state["labId"] or marker["metadata"]["uid"] != cluster.get("markerUid"):
                raise LabError("Küme owner marker/UID farklı")
        return cluster

    def verify_tools(self):
        for tool in ("docker", "kubectl", "minikube"):
            if not shutil.which(tool):
                raise LabError(f"{tool} gerekli; doctor kurulum gereksinimlerini gösterir, paket yüklemez")
        _, version, _ = run(["minikube", "version", "--short"])
        if version.strip() != PINS["minikube"]:
            raise LabError(f"Bu manifestler minikube {PINS['minikube']} için sabit; kurulu sürüm: {version.strip()}")
        _, help_text, _ = run(["minikube", "start", "--help"])
        for flag in ("--keep-context", "--embed-certs", "--nodes", "--listen-address", "--cni"):
            if flag not in help_text:
                raise LabError(f"Kurulu minikube {flag} desteklemiyor")

    def ensure_network(self, cluster):
        """Private minikube homes cannot allocate around other homes' subnets."""
        record = cluster.get("network")
        if record:
            rc, out, _ = run(["docker", "network", "inspect", record["id"]], check=False)
            actual = json.loads(out)[0] if rc == 0 else None
            if not actual or actual["Id"] != record["id"] or actual["Name"] != cluster["name"] or actual.get("Labels", {}).get(OWNER) != self.state["labId"]:
                raise LabError("Docker network exactID/owner eşleşmedi")
            return record["name"]
        rc, _, _ = run(["docker", "network", "inspect", cluster["name"]], check=False)
        if rc == 0:
            raise LabError("Kaydedilmemiş aynı adlı network sahiplenilmedi")
        _, ids, _ = run(["docker", "network", "ls", "-q"])
        networks = []
        if ids.split():
            _, out, _ = run(["docker", "network", "inspect"] + ids.split())
            for net in json.loads(out):
                networks += [ipaddress.ip_network(item["Subnet"], strict=False) for item in (net.get("IPAM", {}).get("Config") or []) if item.get("Subnet")]
        start = int(self.state["labId"][-2:], 16)
        candidate = next((ipaddress.ip_network(f"172.29.{(start+offset)%256}.0/24") for offset in range(256) if not any(ipaddress.ip_network(f"172.29.{(start+offset)%256}.0/24").overlaps(other) for other in networks if other.version == 4)), None)
        if not candidate:
            raise LabError("Owned network için172.29/16 içinde boş/çakışmayan /24 yok; mevcut ağ değiştirilmedi")
        _, ident, _ = run(["docker", "network", "create", "--driver", "bridge", "--subnet", str(candidate), "--label", OWNER + "=" + self.state["labId"], cluster["name"]])
        cluster["network"] = {"id": ident.strip(), "name": cluster["name"], "subnet": str(candidate)}
        self.save()
        return cluster["name"]

    def repair_owned_worker_hosts(self, key, include_control_plane=False, offline=False):
        """Repair the one minikube alias Docker drops from owned /etc/hosts.

        No host OS file or kubelet config is edited. A wrong existing mapping is
        refused; a missing line is appended once as one short stdin write.
        """
        # Before kubelet/API startup only immutable physical ownership is
        # available. The caller verifies live cluster/marker/NodeUID afterwards.
        cluster = self.guard_cluster(key, api=not offline)
        primary = next(item for item in cluster["containers"] if item["name"] == cluster["name"])
        actual = self.check_container(cluster, primary)
        network = actual["NetworkSettings"]["Networks"].get(cluster["network"]["name"], {})
        address = network.get("IPAddress", "")
        if network.get("NetworkID") != cluster["network"]["id"] or ipaddress.ip_address(address) not in ipaddress.ip_network(cluster["network"]["subnet"]):
            raise LabError("Control-plane IP exact-owned network içinde değil; hosts onarımı reddedildi")
        changed = False
        for item in cluster["containers"]:
            if item["name"] == primary["name"] and not include_control_plane:
                continue
            target = self.check_container(cluster, item)
            target_network = target["NetworkSettings"]["Networks"].get(cluster["network"]["name"], {})
            if target_network.get("NetworkID") != cluster["network"]["id"]:
                raise LabError("Worker exact-owned network içinde değil; hosts onarımı reddedildi")
            if not offline:
                node = self.get(key, "node", item["name"])
                if not node or node["metadata"]["uid"] != cluster["nodeUids"].get(item["name"]):
                    raise LabError("NodeUID değişti; hosts onarımı reddedildi")
            _, content, _ = run(["docker", "exec", item["id"], "cat", "/etc/hosts"])
            entries = [line.split("#", 1)[0].split() for line in content.splitlines()]
            mappings = [entry[0] for entry in entries if len(entry) > 1 and "control-plane.minikube.internal" in entry[1:]]
            if mappings and any(mapping != address for mapping in mappings):
                raise LabError("Worker'da farklı mevcut control-plane alias eşlemesi var; otomatik overwrite yok")
            if not mappings:
                self.guard_cluster(key, api=not offline)
                self.check_container(cluster, item)
                run(["docker", "exec", "-i", item["id"], "/bin/sh", "-c", "cat >> /etc/hosts"], payload="\n" + address + "\tcontrol-plane.minikube.internal\n")
                changed = True
            _, resolved, _ = run(["docker", "exec", item["id"], "getent", "hosts", "control-plane.minikube.internal"])
            if not resolved.split() or resolved.split()[0] != address:
                raise LabError("Worker alias gerçek owned CP IP'sine çözülmüyor")
        return changed

    def ensure_cluster(self, key):
        self.verify_tools()
        private_dir(self.root / "private")
        private_dir(self.root / "minikube")
        cfg = self.root / "private/admin.json"
        if not cfg.exists():
            atomic(cfg, {"apiVersion": "v1", "kind": "Config", "clusters": [], "contexts": [], "users": [], "current-context": ""})
        clusters = self.state["clusters"]
        if key not in clusters:
            name = self.state["labId"] + "-" + key
            if self.inspect_container(name) or (self.root / "minikube/.minikube/profiles" / name).exists():
                raise LabError("Aynı adlı önceden mevcut profile/container sahiplenilmedi")
            cni = "false" if key == "a" and self.state.get("telemetry", {}).get("enabled") else "kindnet"
            clusters[key] = {"name": name, "nodes": 2 if key == "a" else 1, "cni": cni, "intentAt": now(), "containers": []}
            self.save()
        cluster = clusters[key]
        if cluster["cni"] == "bridge":
            raise LabError("Eski başarısız bridge-CNI attempt korunuyor; fresh cold kurulum için yeni --state-dir kullanın")
        network = self.ensure_network(cluster)
        if cluster.get("containers"):
            self.guard_cluster(key, api=False)
            if cluster.get("uid") and cluster.get("markerUid"):
                stopped = [item for item in cluster["containers"] if not self.check_container(cluster, item)["State"]["Running"]]
                # Existing minikube multi-node start can wait for a still-stopped
                # worker during its control-plane phase. Start every exact owned
                # container first; Kubernetes' own services resume from their disk.
                for item in stopped:
                    self.check_container(cluster, item)
                    run(["docker", "start", item["id"]], timeout=40)
                # Kicbase's control-plane kubelet is not necessarily enabled.
                # Restore its fixed alias and explicitly start the existing unit;
                # never enable units, install a CNI, or change cluster policies.
                repaired = self.repair_owned_worker_hosts(key, include_control_plane=True, offline=True)
                kubelets_started = 0
                for item in cluster["containers"]:
                    self.check_container(cluster, item)
                    rc, _, _ = run(["docker", "exec", item["id"], "systemctl", "is-active", "--quiet", "kubelet"], check=False)
                    if rc:
                        self.check_container(cluster, item)
                        run(["docker", "exec", item["id"], "systemctl", "start", "kubelet"], timeout=45)
                        kubelets_started += 1
                # Preserve CA/auth and every other context while refreshing the
                # actual owned Docker API port. Never call update-context here.
                self.refresh_admin_server(key)
                api_deadline = time.monotonic() + 100
                while True:
                    try:
                        self.guard_cluster(key)
                        break
                    except LabError as exc:
                        if "UID" in str(exc) or "owner" in str(exc) or "auth/CA" in str(exc) or time.monotonic() >= api_deadline:
                            raise
                        time.sleep(0.5)
                repaired = self.repair_owned_worker_hosts(key) or repaired
                needs_reconcile = bool(stopped) or repaired or bool(kubelets_started)
                if key == "a" and self.state.get("telemetry", {}).get("enabled"):
                    self.telemetry().install()
                deadline, last_error = time.monotonic() + 180, "Node Ready bekleniyor"
                while time.monotonic() < deadline:
                    try:
                        self.guard_cluster(key)
                        nodes = self.get(key, "nodes")["items"]
                        identities = {node["metadata"]["name"]: node["metadata"]["uid"] for node in nodes}
                        if identities != cluster.get("nodeUids"):
                            raise LabError("NodeUID envanteri değişti; eski placement ile sessiz mutasyon yapılmadı")
                        ready = len(nodes) == cluster["nodes"] and all(any(c["type"] == "Ready" and c["status"] == "True" for c in node.get("status", {}).get("conditions", [])) for node in nodes)
                        if ready:
                            print(f"Küme {key.upper()}: Ready; {len(stopped)} exact-owned container açıldı; kubelet start={kubelets_started}; adres onarımı={repaired}")
                            return needs_reconcile
                    except LabError as exc:
                        if "UID" in str(exc) or "owner" in str(exc) or "auth/CA" in str(exc):
                            raise
                        last_error = str(exc)
                    time.sleep(0.5)
                raise LabError("Mevcut owned cluster180s içinde Ready olmadı: " + last_error)
        else:
            # An interrupted first start is recoverable only with exact unique profile,
            # creation time after intent, and minikube's actual labels. Persist IDs now.
            self.capture_containers(key, allow_partial=True)
        command = ["minikube", "start", "-p", cluster["name"], "--driver=docker", "--nodes=" + str(cluster["nodes"]),
                   "--cpus=2", "--memory=2048mb", "--disk-size=12000mb", "--kubernetes-version=" + PINS["kubernetes"],
                   "--base-image=" + PINS["baseImage"], "--keep-context", "--embed-certs", "--listen-address=127.0.0.1",
                   "--network=" + network, "--cni=" + cluster["cni"], "--interactive=false", "--auto-update-drivers=false",
                   "--wait=" + ("apiserver" if cluster["cni"] == "false" else "apiserver,node_ready"), "--wait-timeout=5m"]
        print(f"Küme {key.upper()}: {cluster['name']} ({cluster['nodes']} Node), private state; bounded start")
        try:
            run(command, env=self.env(), timeout=660)
        finally:
            self.capture_containers(key, allow_partial=True)
            if cfg.exists():
                os.chmod(cfg, 0o600)
        self.capture_containers(key)
        system = self.get(key, "namespace", "kube-system")
        current_uid = system["metadata"]["uid"]
        if cluster.get("uid") and cluster["uid"] != current_uid:
            raise LabError("Yeniden başlatma farklı kube-system UID üretti; eski fixture eşlemesi kullanılmadı")
        cluster["uid"] = current_uid
        marker = self.get(key, "configmap", "kubeview-manual-lab-owner", "kube-system")
        if marker:
            if marker["metadata"].get("labels", {}).get(OWNER) != self.state["labId"] or (cluster.get("markerUid") and marker["metadata"]["uid"] != cluster["markerUid"]):
                raise LabError("Mevcut cluster marker bize ait değil")
        else:
            if cluster.get("markerUid"):
                raise LabError("Kaydedilmiş owner marker silinmiş; otomatik sahiplenme yok")
            obj = {"apiVersion": "v1", "kind": "ConfigMap", "metadata": {"name": "kubeview-manual-lab-owner", "namespace": "kube-system", "labels": {OWNER: self.state["labId"]}}, "data": {"labId": self.state["labId"]}}
            _, out, _ = self.kubectl(key, ["create", "-f", "-", "-o", "json"], obj=obj)
            marker = json.loads(out)
        cluster["markerUid"] = marker["metadata"]["uid"]
        nodes = self.get(key, "nodes")["items"]
        cluster["nodeUids"] = {n["metadata"]["name"]: n["metadata"]["uid"] for n in nodes}
        cluster["worker"] = next((n["metadata"]["name"] for n in nodes if "node-role.kubernetes.io/control-plane" not in n["metadata"].get("labels", {})), nodes[0]["metadata"]["name"])
        self.save()
        self.guard_cluster(key)
        if key == "a" and self.state.get("telemetry", {}).get("enabled"):
            self.telemetry().install()
            nodes = self.get(key, "nodes")["items"]
            if len(nodes) != cluster["nodes"]:
                raise LabError("Telemetry kuruldu fakat beklenen gerçek Node sayısı yok")
            cluster["nodeUids"] = {n["metadata"]["name"]: n["metadata"]["uid"] for n in nodes}
            self.save()
        return True

    def capture_containers(self, key, allow_partial=False):
        cluster = self.state["clusters"][key]
        discovered = []
        expected_names = [cluster["name"]] + [cluster["name"] + f"-m{n:02d}" for n in range(2, cluster["nodes"] + 1)]
        for name in expected_names:
            actual = self.inspect_container(name)
            if not actual:
                continue
            labels = actual["Config"].get("Labels") or {}
            created = dt.datetime.fromisoformat(actual["Created"].replace("Z", "+00:00"))
            intent = dt.datetime.fromisoformat(cluster["intentAt"])
            if labels.get("created_by.minikube.sigs.k8s.io") != "true" or labels.get("name.minikube.sigs.k8s.io") != name or created < intent:
                raise LabError("Profile label bulundu fakat sahiplik başlangıç zamanı eşleşmiyor")
            record = {"id": actual["Id"], "name": actual["Name"].lstrip("/"), "created": actual["Created"]}
            old = next((r for r in cluster["containers"] if r["name"] == record["name"]), None)
            if old and old["id"] != record["id"]:
                raise LabError("Kaydedilmiş container aynı adla değiştirilmiş")
            discovered.append(record)
        if any(r["id"] not in {d["id"] for d in discovered} for r in cluster["containers"]):
            raise LabError("Kaydedilmiş container kayıp; sessiz yeniden yaratma reddedildi")
        if not allow_partial and len(discovered) != cluster["nodes"]:
            raise LabError("Beklenen gerçek Node container sayısı yok")
        cluster["containers"] = discovered
        self.save()

    def profile_state(self, profile):
        profiles = self.state["profiles"]
        if profile not in profiles:
            profiles[profile] = {"namespaces": [], "objects": [], "seeds": [], "scenarios": [], "createdAt": now()}
            self.save()
        return profiles[profile]

    def ns_guard(self, profile, key, name):
        entry = next((n for n in self.profile_state(profile)["namespaces"] if n["cluster"] == key and n["name"] == name), None)
        actual = self.get(key, "namespace", name)
        if not entry or not actual or actual["metadata"]["uid"] != entry["uid"] or actual["metadata"].get("labels", {}).get(OWNER) != self.state["labId"] or actual["metadata"].get("labels", {}).get(PROFILE) != profile:
            raise LabError(f"Namespace UID/owner farklı: {name}; mutasyon reddedildi")
        return actual

    def ensure_namespace(self, profile, key, name):
        self.guard_cluster(key)
        state = self.profile_state(profile)
        record = next((n for n in state["namespaces"] if n["cluster"] == key and n["name"] == name), None)
        actual = self.get(key, "namespace", name)
        if record:
            self.ns_guard(profile, key, name)
            return
        pending = state.get("pendingNamespace", {})
        if actual and pending.get("cluster") == key and pending.get("name") == name and actual["metadata"].get("labels", {}).get(OWNER) == self.state["labId"] and actual["metadata"].get("annotations", {}).get("manual.kubeview.local/create-intent") == pending.get("intent"):
            state["namespaces"].append({"cluster": key, "name": name, "uid": actual["metadata"]["uid"]})
            state.pop("pendingNamespace", None)
            self.save()
            self.ns_guard(profile, key, name)
            return
        if actual:
            raise LabError(f"Kaydı olmayan namespace mevcut: {name}; sahiplenilmedi")
        manifest = {"apiVersion": "v1", "kind": "Namespace", "metadata": {"name": name, "labels": {OWNER: self.state["labId"], PROFILE: profile}}}
        # Intent persisted before CREATE permits exact reconciliation after a process interruption.
        state["pendingNamespace"] = {"cluster": key, "name": name, "intent": uuid.uuid4().hex}
        manifest["metadata"]["annotations"] = {"manual.kubeview.local/create-intent": state["pendingNamespace"]["intent"]}
        self.save()
        _, out, _ = self.kubectl(key, ["create", "-f", "-", "-o", "json"], obj=manifest)
        actual = json.loads(out)
        state["namespaces"].append({"cluster": key, "name": name, "uid": actual["metadata"]["uid"]})
        state.pop("pendingNamespace", None)
        self.save()

    def labels(self, profile, role):
        return {OWNER: self.state["labId"], PROFILE: profile, ROLE: role, "app.kubernetes.io/managed-by": "kubeview-manual-lab"}

    def workload(self, profile, namespace, name="web", *, replicas=1, node=None, two=False, traffic_url=None):
        labels = self.labels(profile, name)
        requests = {"requests": {"cpu": "10m", "memory": "16Mi"}, "limits": {"cpu": "200m", "memory": "96Mi"}}
        if two:
            containers = [
                {"name": "controlled", "image": PINS["busybox"], "command": ["sh", "-c", "echo healthy; while [ ! -e /control/crash ]; do sleep 1; done; echo requested-crash; exit 42"], "volumeMounts": [{"name": "control", "mountPath": "/control"}], "resources": requests},
                {"name": "healthy", "image": PINS["busybox"], "command": ["sh", "-c", "while true; do echo healthy-peer; sleep 10; done"], "volumeMounts": [{"name": "control", "mountPath": "/control"}], "resources": requests}]
        elif traffic_url:
            containers = [{"name": "http-client", "image": PINS["busybox"], "env": [{"name": "TARGET", "value": traffic_url}],
                           "command": ["sh", "-c", 'while true; do wget -T 3 -q -O /dev/null "$TARGET" && echo HTTP_OK || echo HTTP_FAIL; sleep 1; done'], "resources": requests}]
        else:
            containers = [{"name": "web", "image": PINS["nginx"], "ports": [{"containerPort": 80}], "readinessProbe": {"httpGet": {"path": "/", "port": 80}, "periodSeconds": 2}, "resources": requests}]
        spec = {"containers": containers, "terminationGracePeriodSeconds": 5}
        if two:
            spec["volumes"] = [{"name": "control", "emptyDir": {}}]
        if node:
            spec["affinity"] = {"nodeAffinity": {"requiredDuringSchedulingIgnoredDuringExecution": {"nodeSelectorTerms": [{"matchFields": [{"key": "metadata.name", "operator": "In", "values": [node]}]}]}}}
        return {"apiVersion": "apps/v1", "kind": "Deployment", "metadata": {"name": name, "namespace": namespace, "labels": labels},
                "spec": {"replicas": replicas, "selector": {"matchLabels": labels}, "template": {"metadata": {"labels": labels}, "spec": spec}}}

    def desired(self, profile):
        suffix = self.state["labId"][-8:]
        base = "kvml-" + suffix + "-" + profile[:2]
        namespaces, objects, seeds = [], [], []
        worker = self.state["clusters"].get("a", {}).get("worker")
        def add_ns(key, tail):
            ns = base + tail
            namespaces.append((key, ns))
            return ns
        def harbor(name, key, ns, restricted=False):
            seeds.append({"name": name, "cluster": key, "context": self.state["clusters"][key]["name"] + ("-reader" if restricted else ""), "namespaces": [ns], "selector": "", "position": [len(seeds) * 1400, 0]})
        if profile == "01-bos-baslangic":
            # A is a real trusted context, but no fixtures and no workspace registrations.
            return namespaces, objects, seeds
        if profile == "02-ortak-kume":
            for index in (1, 2):
                ns = add_ns("a", "-p" + str(index))
                objects.append(("a", self.workload(profile, ns, node=worker)))
                harbor("Proje " + str(index), "a", ns)
        elif profile == "03-bagimsiz-kumeler":
            for key in ("a", "b"):
                ns = add_ns(key, "-same")
                deployment = self.workload(profile, ns, "same-app")
                objects.append((key, deployment))
                pod = {"apiVersion": "v1", "kind": "Pod", "metadata": {"name": "same-pod", "namespace": ns, "labels": self.labels(profile, "same-pod")}, "spec": copy.deepcopy(deployment["spec"]["template"]["spec"])}
                objects.append((key, pod))
                harbor("Bağımsız " + key.upper(), key, ns)
        elif profile == "04-kisitli-yetki":
            ns = add_ns("a", "-restricted")
            objects.append(("a", self.workload(profile, ns, node=worker)))
            metadata = lambda name: {"name": name, "namespace": ns, "labels": self.labels(profile, name)}
            objects += [("a", {"apiVersion": "v1", "kind": "ServiceAccount", "metadata": metadata("reader")}),
                        ("a", {"apiVersion": "rbac.authorization.k8s.io/v1", "kind": "Role", "metadata": metadata("reader"), "rules": [
                            {"apiGroups": [""], "resources": ["pods", "pods/log", "events", "services", "endpoints", "configmaps"], "verbs": ["get", "list", "watch"]},
                            {"apiGroups": ["apps"], "resources": ["deployments", "replicasets", "statefulsets", "daemonsets"], "verbs": ["get", "list", "watch"]}]}),
                        ("a", {"apiVersion": "rbac.authorization.k8s.io/v1", "kind": "RoleBinding", "metadata": metadata("reader"), "roleRef": {"apiGroup": "rbac.authorization.k8s.io", "kind": "Role", "name": "reader"}, "subjects": [{"kind": "ServiceAccount", "name": "reader", "namespace": ns}]})]
            harbor("Kısıtlı okuyucu", "a", ns, restricted=True)
            harbor("Ayrı admin", "a", ns)
        elif profile == "05-ariza-toparlanma":
            ns = add_ns("a", "-fault")
            objects.append(("a", self.workload(profile, ns, "two-containers", node=worker, two=True)))
            objects.append(("a", self.workload(profile, ns, "bad-image", replicas=0, node=worker)))
            objects.append(("a", self.workload(profile, ns, "unschedulable", replicas=0)))
            harbor("Arıza laboratuvarı", "a", ns)
        elif profile == "06-limanlar-arasi-ag":
            client = add_ns("a", "-client")
            server = add_ns("a", "-server")
            objects.append(("a", self.workload(profile, server, "http-server", node=worker)))
            objects.append(("a", {"apiVersion": "v1", "kind": "Service", "metadata": {"name": "http", "namespace": server, "labels": self.labels(profile, "http")}, "spec": {"selector": self.labels(profile, "http-server"), "ports": [{"name": "http", "port": 80, "targetPort": 80}]}}))
            objects.append(("a", self.workload(profile, client, "traffic", replicas=0, node=worker, traffic_url=f"http://http.{server}.svc.cluster.local/")))
            harbor("HTTP istemcileri", "a", client)
            harbor("HTTP servisi", "a", server)
        return namespaces, objects, seeds

    def object_record(self, profile, key, obj):
        meta = obj["metadata"]
        return next((r for r in self.profile_state(profile)["objects"] if (r["cluster"], r["kind"], r["namespace"], r["name"]) == (key, obj["kind"], meta["namespace"], meta["name"])), None)

    def guard_object(self, profile, key, obj):
        self.guard_cluster(key)
        self.ns_guard(profile, key, obj["metadata"]["namespace"])
        record = self.object_record(profile, key, obj)
        actual = self.get(key, obj["kind"], obj["metadata"]["name"], obj["metadata"]["namespace"])
        if not record or not actual or actual["metadata"]["uid"] != record["uid"] or actual["metadata"].get("labels", {}).get(OWNER) != self.state["labId"] or actual["metadata"].get("labels", {}).get(PROFILE) != profile:
            raise LabError("Fixture UID/owner değişti; aynı ada sessiz sahiplenme yok")
        return actual

    def ensure_object(self, profile, key, obj):
        self.guard_cluster(key)
        self.ns_guard(profile, key, obj["metadata"]["namespace"])
        record = self.object_record(profile, key, obj)
        if record:
            self.guard_object(profile, key, obj)
            return
        actual = self.get(key, obj["kind"], obj["metadata"]["name"], obj["metadata"]["namespace"])
        state = self.profile_state(profile)
        pending = state.get("pendingObject", {})
        identity = [key, obj["kind"], obj["metadata"]["namespace"], obj["metadata"]["name"]]
        if actual and pending.get("identity") == identity and actual["metadata"].get("labels", {}).get(OWNER) == self.state["labId"] and actual["metadata"].get("labels", {}).get(PROFILE) == profile and actual["metadata"].get("annotations", {}).get("manual.kubeview.local/create-intent") == pending.get("intent"):
            state["objects"].append({"cluster": key, "kind": obj["kind"], "namespace": obj["metadata"]["namespace"], "name": obj["metadata"]["name"], "uid": actual["metadata"]["uid"]})
            state.pop("pendingObject", None)
            self.save()
            return
        if actual:
            raise LabError("Kaydedilmemiş aynı adlı fixture bulundu; CREATE sahiplenmesi reddedildi")
        state["pendingObject"] = {"identity": identity, "intent": uuid.uuid4().hex}
        obj = copy.deepcopy(obj)
        obj["metadata"].setdefault("annotations", {})["manual.kubeview.local/create-intent"] = state["pendingObject"]["intent"]
        self.save()
        _, out, _ = self.kubectl(key, ["create", "-f", "-", "-o", "json"], obj=obj)
        created = json.loads(out)
        self.profile_state(profile)["objects"].append({"cluster": key, "kind": obj["kind"], "namespace": obj["metadata"]["namespace"], "name": obj["metadata"]["name"], "uid": created["metadata"]["uid"]})
        state.pop("pendingObject", None)
        self.save()

    def write_profile_config(self, profile):
        """Flatten only owned cluster contexts, never the global loader's defaults."""
        keys = PROFILES[profile]["clusterKeys"]
        config = {"apiVersion": "v1", "kind": "Config", "clusters": [], "contexts": [], "users": [], "current-context": ""}
        for key in keys:
            self.guard_cluster(key)
            _, out, _ = self.kubectl(key, ["config", "view", "--minify", "--flatten", "--raw", "-o", "json"])
            part = json.loads(out)
            for field in ("clusters", "contexts", "users"):
                config[field] += part.get(field, [])
        if profile == "04-kisitli-yetki":
            self.refresh_reader(profile, config)
        private_path = self.root / "private" / (profile + ".json")
        atomic(private_path, config)
        return private_path

    def refresh_reader(self, profile, config):
        ns = self.profile_state(profile)["namespaces"][0]["name"]
        _, objects, _ = self.desired(profile)
        # Verify owner, exact UID, role rules and binding before minting a credential.
        for key, wanted in objects:
            if wanted["kind"] in ("ServiceAccount", "Role", "RoleBinding"):
                actual = self.guard_object(profile, key, wanted)
                for field in ("rules", "roleRef", "subjects"):
                    if field in wanted and actual.get(field) != wanted[field]:
                        raise LabError("Reader RBAC kuralları/binding değişmiş; TokenRequest reddedildi")
        _, response, _ = self.kubectl("a", ["create", "token", "reader", "-n", ns, "--duration=1h", "-o", "json"])
        request = json.loads(response)
        token = request.get("status", {}).get("token", "")
        expires = dt.datetime.fromisoformat(request["status"]["expirationTimestamp"].replace("Z", "+00:00"))
        issued = dt.datetime.now(dt.timezone.utc)
        if not token or expires <= issued + dt.timedelta(seconds=120):
            raise LabError("TokenRequest kullanılabilir süre vermedi; credential dosyası değiştirilmedi")
        # A recreated SA or changed role during TokenRequest must not be trusted.
        for key, wanted in objects:
            if wanted["kind"] in ("ServiceAccount", "Role", "RoleBinding"):
                actual = self.guard_object(profile, key, wanted)
                for field in ("rules", "roleRef", "subjects"):
                    if field in wanted and actual.get(field) != wanted[field]:
                        raise LabError("TokenRequest sırasında reader RBAC değişti; credential dosyası değiştirilmedi")
        context_name = self.state["clusters"]["a"]["name"] + "-reader"
        cluster_ref = config["contexts"][0]["context"]["cluster"]
        config["users"].append({"name": context_name, "user": {"token": token}})
        config["contexts"].append({"name": context_name, "context": {"cluster": cluster_ref, "user": context_name, "namespace": ns}})
        self.profile_state(profile)["readerTokenRefreshedAt"] = issued.isoformat()
        self.profile_state(profile)["readerTokenExpiresAt"] = expires.isoformat()
        self.profile_state(profile)["readerTokenRefreshBefore"] = max(issued, expires - dt.timedelta(minutes=5)).isoformat()
        self.save()

    def up(self):
        profile = self.args.profile
        with self.lock(initialize=True):
            state = self.profile_state(profile)
            if self.args.telemetry or self.state.get("telemetry", {}).get("enabled"):
                self.telemetry().configure()
            restarted = False
            for key in PROFILES[profile]["clusterKeys"]:
                restarted = self.ensure_cluster(key) or restarted
            namespaces, objects, seeds = self.desired(profile)
            for key, namespace in namespaces:
                self.ensure_namespace(profile, key, namespace)
            for key, obj in objects:
                self.ensure_object(profile, key, obj)
            if restarted or not state.get("initialReadyVerified"):
                self.wait_baseline(objects)
                state["initialReadyVerified"] = now()
            state["seeds"] = seeds
            state["lastUpAt"] = now()
            for key in PROFILES[profile]["clusterKeys"]:
                atomic(self.root / "profiles" / profile / ("manifests-" + key + ".json"), {"apiVersion": "v1", "kind": "List", "items": [obj for cluster_key, obj in objects if cluster_key == key]})
            self.write_profile_config(profile)
            self.save()
            print(f"Hazır: {profile}; labId={self.state['labId']}; {len(seeds)} kayıt planı. app komutu ayrı çalıştırılır.")
            print("Varsayılan fixture sağlığı için status; kullanıcının önceki scenario değişiklikleri up ile sıfırlanmaz.")

    def wait_baseline(self, objects):
        for key, obj in objects:
            namespace = obj["metadata"]["namespace"]
            if obj["kind"] == "Deployment" and obj["spec"].get("replicas", 1) > 0:
                self.kubectl(key, ["rollout", "status", "deployment/" + obj["metadata"]["name"], "-n", namespace, "--timeout=100s"], timeout=115)
            if obj["kind"] == "Pod":
                self.kubectl(key, ["wait", "pod/" + obj["metadata"]["name"], "-n", namespace, "--for=condition=Ready", "--timeout=100s"], timeout=115)

    def replace(self, profile, key, wanted, change):
        actual = self.guard_object(profile, key, wanted)
        changed = copy.deepcopy(actual)
        change(changed)
        # API performs resourceVersion concurrency checks; preserve all unrelated fields.
        self.guard_cluster(key)
        self.ns_guard(profile, key, actual["metadata"]["namespace"])
        _, out, _ = self.kubectl(key, ["replace", "-f", "-", "-o", "json"], obj=changed)
        return json.loads(out)

    def delete_owned(self, profile, key, wanted):
        actual = self.guard_object(profile, key, wanted)
        plural = {"Deployment": ("/apis/apps/v1", "deployments"), "Pod": ("/api/v1", "pods"), "Service": ("/api/v1", "services"),
                  "ServiceAccount": ("/api/v1", "serviceaccounts"), "Role": ("/apis/rbac.authorization.k8s.io/v1", "roles"), "RoleBinding": ("/apis/rbac.authorization.k8s.io/v1", "rolebindings")}
        prefix, resource = plural[actual["kind"]]
        meta = actual["metadata"]
        uri = f"{prefix}/namespaces/{meta['namespace']}/{resource}/{meta['name']}"
        options = {"apiVersion": "v1", "kind": "DeleteOptions", "propagationPolicy": "Foreground", "preconditions": {"uid": meta["uid"], "resourceVersion": meta["resourceVersion"]}}
        self.kubectl(key, ["delete", "--raw", uri, "-f", "-"], obj=options)
        deadline = time.monotonic() + 70
        while time.monotonic() < deadline:
            if not self.get(key, actual["kind"], meta["name"], meta["namespace"]):
                record = self.object_record(profile, key, wanted)
                self.profile_state(profile)["objects"].remove(record)
                self.save()
                return
            time.sleep(0.5)
        raise LabError("Fixture DELETE kabul edildi fakat 70s içinde 404 olmadı; zorla silinmedi")

    def worker_power(self, recover=False):
        cluster = self.guard_cluster("a", api=not recover)
        worker = cluster["worker"]
        record = next((r for r in cluster["containers"] if r["name"] == worker), None)
        if not record or worker == cluster["name"]:
            raise LabError("Yalnız kayıtlı worker durdurulabilir; control-plane hedeflenmez")
        self.check_container(cluster, record)
        if recover:
            self.ensure_cluster("a")
            current = self.get("a", "node", worker)
            if current["metadata"]["uid"] != cluster["nodeUids"][worker]:
                raise LabError("Worker NodeUID değişti; yeni UID eski arıza devamı sayılmadı")
        else:
            current = self.get("a", "node", worker)
            if current["metadata"]["uid"] != cluster["nodeUids"][worker]:
                raise LabError("Worker NodeUID değişti; stop reddedildi")
            print("UYARI: Bu gerçek A worker'ı paylaşan bütün profil/limanlar etkilenir.")
            run(["docker", "stop", "--time", "15", record["id"]], timeout=40)

    def scenario(self):
        profile, name = self.args.profile, self.args.name
        with self.lock():
            if profile not in self.state["profiles"]:
                raise LabError("Seçilen profil için önce up gerekli")
            _, objects, _ = self.desired(profile)
            if profile == "05-ariza-toparlanma":
                if name in ("node-stop", "node-recover"):
                    for ns in self.profile_state(profile)["namespaces"]:
                        self.ns_guard(profile, ns["cluster"], ns["name"])
                    self.worker_power(recover=name == "node-recover")
                elif name in ("bad-image", "unschedulable"):
                    wanted = next(obj for _, obj in objects if obj["metadata"]["name"] == name)
                    def change(obj):
                        obj["spec"]["replicas"] = 1
                        if name == "bad-image":
                            obj["spec"]["template"]["spec"]["containers"][0]["image"] = "registry.invalid/kubeview/manual-nonexistent:deliberate"
                        else:
                            obj["spec"]["template"]["spec"]["nodeSelector"] = {"manual.kubeview.local/nonexistent-node": self.state["labId"]}
                    self.replace(profile, "a", wanted, change)
                elif name in ("container-crash", "container-recover"):
                    wanted = next(obj for _, obj in objects if obj["metadata"]["name"] == "two-containers")
                    deployment = self.guard_object(profile, "a", wanted)
                    ns = deployment["metadata"]["namespace"]
                    pods = self.get("a", "pods", ns=ns)["items"]
                    pods = [p for p in pods if p["metadata"].get("labels", {}).get(OWNER) == self.state["labId"] and p["metadata"].get("labels", {}).get(ROLE) == "two-containers" and not p["metadata"].get("deletionTimestamp")]
                    if len(pods) != 1:
                        raise LabError("Tek gerçek two-container Pod hazır değil; rastgele Pod seçilmedi")
                    pod = pods[0]
                    rs_owner = next((r for r in pod["metadata"].get("ownerReferences", []) if r.get("controller") and r.get("kind") == "ReplicaSet"), None)
                    rs = self.get("a", "replicaset", rs_owner["name"], ns) if rs_owner else None
                    if not rs or rs["metadata"]["uid"] != rs_owner["uid"] or not any(r.get("uid") == deployment["metadata"]["uid"] for r in rs["metadata"].get("ownerReferences", [])):
                        raise LabError("Pod → RS → Deployment gerçek UID zinciri doğrulanamadı")
                    current = self.get("a", "pod", pod["metadata"]["name"], ns)
                    if current["metadata"]["uid"] != pod["metadata"]["uid"]:
                        raise LabError("Pod exec öncesi UID değişti")
                    # Kubernetes exec itself is name-addressed, not UID-conditional.
                    command = ["touch", "/control/crash"] if name == "container-crash" else ["rm", "-f", "/control/crash"]
                    container = "controlled" if name == "container-crash" else "healthy"
                    self.kubectl("a", ["exec", "-n", ns, pod["metadata"]["name"], "-c", container, "--"] + command)
                    after = self.get("a", "pod", pod["metadata"]["name"], ns)
                    if not after or after["metadata"]["uid"] != pod["metadata"]["uid"]:
                        raise LabError("Exec aralığında UID değişti; sonuç aynı Pod kanıtı değildir")
                else:
                    raise LabError("05 senaryoları: container-crash, container-recover, bad-image, unschedulable, node-stop, node-recover")
            elif profile == "06-limanlar-arasi-ag" and name in ("traffic-start", "traffic-increase", "traffic-stop"):
                wanted = next(obj for _, obj in objects if obj["metadata"]["name"] == "traffic")
                replicas = {"traffic-start": 1, "traffic-increase": 3, "traffic-stop": 0}[name]
                self.replace(profile, "a", wanted, lambda obj: obj["spec"].update(replicas=replicas))
            else:
                raise LabError("Senaryo yalnız05/06 profilinin açık ve sınırlı işlemleridir")
            self.profile_state(profile)["scenarios"].append({"at": now(), "name": name})
            self.save()
            print(f"Senaryo kabul edildi: {profile}/{name}. API kabulü gözlenen Ready/arıza sonucu değildir; status ve UI'ı inceleyin.")

    def reset(self):
        profile = self.args.profile
        with self.lock():
            if profile not in self.state["profiles"]:
                raise LabError("Bu profil kurulmamış")
            if profile == "07-yuk-ve-gecis":
                raise LabError("Replay sabit veri kaynağıdır. down ve app ile yeniden açın; workspace tercihleri silinmez")
            for key in PROFILES[profile]["clusterKeys"]:
                self.guard_cluster(key)
            if profile == "05-ariza-toparlanma":
                cluster = self.state["clusters"]["a"]
                stopped = any(not self.check_container(cluster, r)["State"]["Running"] for r in cluster["containers"])
                if stopped:
                    self.worker_power(recover=True)
            _, objects, _ = self.desired(profile)
            # Preflight all identities before the first destructive operation.
            for key, obj in objects:
                self.guard_object(profile, key, obj)
            for key, obj in reversed(objects):
                self.delete_owned(profile, key, obj)
            for key, obj in objects:
                self.ensure_object(profile, key, obj)
            self.wait_baseline(objects)
            self.write_profile_config(profile)
            self.profile_state(profile)["lastResetAt"] = now()
            self.save()
            print("Yalnız seçilen profilin kaydedilmiş fixture'ları sıfırlandı; namespace ve workspace tercihleri korundu.")

    def binary(self):
        bundled = ASSETS.parent / "kubeview"
        value = self.args.binary or os.environ.get("KUBEVIEW_BINARY") or (str(bundled) if bundled.is_file() else None) or shutil.which("kubeview")
        if not value:
            raise LabError("Teslim edilen embedded binary için --binary /tam/yol/kubeview veya KUBEVIEW_BINARY belirtin. Runner derleme yapmaz")
        path = Path(value).expanduser().resolve()
        if not path.is_file() or not os.access(path, os.X_OK):
            raise LabError("--binary çalıştırılabilir bir dosya olmalı")
        return path

    def stop_process(self, profile):
        record = self.state["processes"].get(profile)
        if not record:
            return
        identity = process_identity(record["pid"])
        if identity is None:
            if not free_port(record["port"]):
                raise LabError("Kayıtlı app öldü fakat port başka süreçte; o sürece dokunulmadı")
            del self.state["processes"][profile]
            self.save()
            return
        if identity != record["identity"] or str(record["dataDir"]) not in identity or str(record["binary"]) not in identity:
            raise LabError("PID başlangıç/komut kimliği farklı; kill reddedildi")
        if not pid_owns_port(record["pid"], record["port"]):
            raise LabError("Kayıtlı PID beklenen port sahibi değil; kill reddedildi")
        os.kill(record["pid"], signal.SIGTERM)
        deadline = time.monotonic() + 15
        while time.monotonic() < deadline:
            with contextlib.suppress(ChildProcessError):
                os.waitpid(record["pid"], os.WNOHANG)
            if process_identity(record["pid"]) is None and free_port(record["port"]):
                self.state["processes"].pop(profile, None)
                self.save()
                return
            time.sleep(0.2)
        raise LabError("App SIGTERM sonrası15s içinde kapanmadı; PID yeniden doğrulanmadan SIGKILL gönderilmedi")

    def bootstrap_workspace(self, profile, port, variant):
        state = self.profile_state(profile)
        seeded = state.setdefault("seedCompleted", {})
        if profile == "01-bos-baslangic" or self.args.empty_workspace or seeded.get(variant):
            return
        jar = http.cookiejar.CookieJar()
        opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
        base = f"http://127.0.0.1:{port}"
        def request(path, body=None, nonce=None):
            headers = {"Accept": "application/json", "Origin": base}
            if body is not None:
                headers["Content-Type"] = "application/json"
            if nonce:
                headers["X-KubeView-Workspace-Nonce"] = nonce
            req = urllib.request.Request(base + path, data=json.dumps(body).encode() if body is not None else None, headers=headers)
            try:
                with opener.open(req, timeout=15) as response:
                    return json.load(response)
            except urllib.error.HTTPError as exc:
                # Never include response bodies (they may contain server paths/cookies).
                raise LabError(f"Workspace nativeAPI {path}: HTTP{exc.code}; store doğrudan yazılmadı")
        workspace = request("/api/workspace")
        nonce = workspace.get("workspaceNonce")
        if not nonce:
            raise LabError("Native workspace nonce yok; bu binary sözleşmeyle uyumlu değil")
        # Seed plans are derived from this runner's layout contract. Old saved lab
        # plans must not introduce obsolete close spacing into a fresh app store.
        # Completed workspaces return above and retain all user layout changes.
        seeds = self.desired(profile)[2]
        if profile == "07-yuk-ve-gecis":
            seeds = [{"name": f"TEST / REPLAY {self.args.replay} {index+1:02d}", "context": "test-replay-" + self.args.replay,
                      "namespaces": ["bench-0", "bench-1", "bench-2", "bench-3"], "selector": "", "position": [(index % 5)*1400, (index//5)*1400]} for index in range(self.args.harbors)]
        connection_map = {}
        for seed in seeds:
            context = seed["context"]
            if context not in connection_map:
                current = next((c for c in workspace.get("connections", []) if c.get("context") == context), None)
                if not current:
                    workspace = request("/api/workspace/connections", {"revision": workspace["revision"], "connection": {"name": "Lab " + context, "context": context}}, nonce)
                    nonce = workspace.get("workspaceNonce", nonce)
                    current = next((c for c in workspace.get("connections", []) if c.get("context") == context), None)
                if not current:
                    raise LabError("Native API oluşturulan connection kimliğini döndürmedi")
                connection_map[context] = current["id"]
            # Names are only an initial seed key; once complete, later rename/remove is preserved.
            if any(h.get("name") == seed["name"] and h.get("connectionRef") == connection_map[context] for h in workspace.get("harbors", [])):
                continue
            harbor = {"name": seed["name"], "connectionRef": connection_map[context], "namespaces": seed["namespaces"], "selector": seed["selector"], "position": seed["position"], "view": {}}
            workspace = request("/api/workspace/harbors", {"revision": workspace["revision"], "harbor": harbor}, nonce)
            nonce = workspace.get("workspaceNonce", nonce)
        seeded[variant] = {"at": now(), "workspaceId": workspace.get("id"), "initialHarborCount": len(seeds)}
        self.save()

    def app(self):
        profile = self.args.profile
        with self.lock():
            if profile not in self.state["profiles"]:
                raise LabError("Önce bu profil için up çalıştırın")
            process_tools()
            binary = self.binary()
            telemetry = self.telemetry() if self.state.get("telemetry", {}).get("enabled") and profile == "06-limanlar-arasi-ag" else None
            _, help_text, help_err = run([binary, "--help"], check=False)
            if "--data-dir" not in help_text + help_err and "-data-dir" not in help_text + help_err:
                raise LabError("Teslim edilen binary --data-dir desteklemiyor; eski binary kullanılmadı")
            variant = f"{self.args.replay}-h{self.args.harbors:02d}" if profile == "07-yuk-ve-gecis" else "real"
            port = self.state["basePort"] + int(profile[:2])
            data_dir = self.root / "profiles" / profile / "app-data" / variant
            record = self.state["processes"].get(profile)
            if record and process_identity(record["pid"]) == record["identity"]:
                if record["variant"] != variant or record["binarySha256"] != digest(binary):
                    raise LabError("Başka variant/binary açık; önce down --profile ... çalıştırın")
                if not pid_owns_port(record["pid"], port):
                    raise LabError("Kayıtlı süreç port sahibi değil")
                if telemetry:
                    telemetry.forward()
                print(f"Zaten açık: http://127.0.0.1:{port}/ ; {data_dir}")
                return
            if record:
                self.stop_process(profile)
            if not free_port(port):
                raise LabError(f"Port {port} başka süreçte; kapatılmadı. Yeni lab için açık --base-port seçin")
            config = self.write_profile_config(profile)
            private_dir(data_dir)
            env = self.env()
            env["KUBECONFIG"] = str(config)
            env["READ_ONLY"] = "false" if self.args.write and profile != "07-yuk-ve-gecis" else "true"
            if telemetry:
                env.update(telemetry.provider_env())
            command = [str(binary), "--bind", "127.0.0.1", "--port", str(port), "--data-dir", str(data_dir), "--kubeconfig", str(config)]
            # No --context: 01 remains a genuinely empty workspace. Other profiles
            # also seed through the public API, avoiding a hidden legacy migration.
            if profile == "07-yuk-ve-gecis":
                command += ["--replay-profile", self.args.replay]
            elif self.args.write:
                command += ["--write"]
            proc = subprocess.Popen(command, env=env, stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, start_new_session=True)
            deadline = time.monotonic() + 25
            identity = process_identity(proc.pid)
            try:
                while time.monotonic() < deadline:
                    if proc.poll() is not None:
                        raise LabError(f"Embedded app başlamadı (exit{proc.returncode}); hiçbir development server çalıştırılmadı")
                    if not free_port(port) and pid_owns_port(proc.pid, port):
                        break
                    time.sleep(0.1)
                else:
                    raise LabError("App25s içinde beklenen loopback portunu dinlemedi")
            except BaseException:
                # This is the exact child just created, not a state-file PID.
                if proc.poll() is None:
                    proc.terminate()
                    try:
                        proc.wait(timeout=5)
                    except subprocess.TimeoutExpired:
                        proc.kill(); proc.wait(timeout=5)
                raise
            identity = process_identity(proc.pid)
            self.state["processes"][profile] = {"pid": proc.pid, "identity": identity, "port": port, "binary": str(binary), "binarySha256": digest(binary),
                                                   "dataDir": str(data_dir), "variant": variant, "startedAt": now(), "writeOptIn": env["READ_ONLY"] == "false"}
            self.save()
            try:
                if telemetry:
                    telemetry.forward()
                self.bootstrap_workspace(profile, port, variant)
            except Exception:
                self.stop_process(profile)
                if telemetry:
                    telemetry.stop_if_unused()
                raise
            print(f"Açıldı: http://127.0.0.1:{port}/")
            print(f"Profil veri dizini: {data_dir}")
            print("TEST / REPLAY: gerçek Kubernetes değil; yönetim zorunlu salt okunur." if profile == "07-yuk-ve-gecis" else "Gerçek Kubernetes. Tarayıcı yönetim izni ayrıca açık kullanıcı eylemi ve gerçek RBAC gerektirir.")

    def down(self):
        with self.lock():
            targets = [self.args.profile] if self.args.profile else list(self.state["processes"])
            for profile in targets:
                self.stop_process(profile)
            if self.args.profile:
                if self.state.get("telemetry", {}).get("enabled"):
                    self.telemetry().stop_if_unused()
                print("Yalnız seçilen app kapandı; paylaşılan kümeler korunuyor. Tüm lab için down kullanın.")
                return
            for key in reversed(list(self.state["clusters"])):
                cluster = self.guard_cluster(key, api=False)
                for record in reversed(cluster["containers"]):
                    actual = self.check_container(cluster, record)
                    if actual["State"]["Running"]:
                        run(["docker", "stop", "--time", "15", record["id"]], timeout=40)
            self.state["lastDownAt"] = now()
            self.save()
            print("Bu lab'ın app/container süreçleri durdu. Workspace, private config ve manifestler korundu.")

    def destroy(self):
        with self.lock():
            if self.args.confirm != self.state["labId"]:
                raise LabError("--confirm exact labId ile eşleşmeli; hiçbir şey silinmedi")
            if self.state["processes"]:
                raise LabError("Önce down; kayıtlı app süreçleri varken destroy yok")
            # Stopped clusters have no API. Exact container IDs, creation times,
            # labels and previously pinned system UID prove the owned offline disk.
            for key, cluster in self.state["clusters"].items():
                self.guard_cluster(key, api=False)
                if not cluster.get("uid") or not cluster.get("markerUid"):
                    raise LabError("Tam clusterUID/marker kanıtı yok; otomatik destroy reddedildi")
                for record in cluster["containers"]:
                    if self.check_container(cluster, record)["State"]["Running"]:
                        raise LabError("Önce down; çalışan cluster destroy edilmez")
            for key, cluster in self.state["clusters"].items():
                self.guard_cluster(key, api=False)
                run(["minikube", "delete", "-p", cluster["name"]], env=self.env(), timeout=180)
                for record in cluster["containers"]:
                    if self.inspect_container(record["id"]):
                        raise LabError("Minikube delete sonrası owned container hâlâ mevcut; state silinmedi")
                if cluster.get("network"):
                    self.ensure_network(cluster)
                    run(["docker", "network", "rm", cluster["network"]["id"]], timeout=30)
            # Keep an identity-only tombstone; never recursively delete an unknown root.
            tombstone = {"schemaVersion": SCHEMA, "labId": self.state["labId"], "destroyedAt": now(), "stateDir": str(self.root)}
            for child in ("profiles", "private", "minikube"):
                path = self.root / child
                if path.is_symlink():
                    raise LabError("Destroy sırasında symlink bulundu; recursive silme reddedildi")
                if path.exists():
                    shutil.rmtree(path)
            atomic(self.root / "destroyed.json", tombstone)
            self.file.unlink()
            print(f"Yalnız {tombstone['labId']} silindi. Tombstone: {self.root / 'destroyed.json'}; yeni kurulum için yeni --state-dir seçin.")

    def status(self):
        if not self.state:
            print(json.dumps({"stateDir": str(self.root), "status": "not-created"}, ensure_ascii=False, indent=2))
            return
        result = {"labId": self.state["labId"], "stateDir": str(self.root), "clusters": {}, "apps": {}, "providers": {}, "profiles": {}}
        for key, cluster in self.state["clusters"].items():
            record = {"name": cluster["name"], "systemUid": cluster.get("uid"), "nodesExpected": cluster["nodes"], "containers": []}
            try:
                self.guard_cluster(key, api=False)
                for container in cluster["containers"]:
                    actual = self.check_container(cluster, container)
                    record["containers"].append({"id": container["id"], "name": container["name"], "running": actual["State"]["Running"]})
                if all(c["running"] for c in record["containers"]):
                    self.guard_cluster(key)
                    nodes = self.get(key, "nodes")["items"]
                    record["actualNodes"] = [{"name": n["metadata"]["name"], "uid": n["metadata"]["uid"], "ready": any(c["type"] == "Ready" and c["status"] == "True" for c in n.get("status", {}).get("conditions", []))} for n in nodes]
            except LabError as exc:
                record["ownershipError"] = str(exc)
            result["clusters"][key] = record
        for profile, process in self.state["processes"].items():
            matching = process_identity(process["pid"]) == process["identity"]
            target = "providers" if process.get("kind") == "provider" else "apps"
            result[target][profile] = {"pid": process["pid"], "identityMatches": matching, "portOwned": matching and pid_owns_port(process["pid"], process["port"]), "url": f"http://127.0.0.1:{process['port']}/", "dataDir": process["dataDir"], "variant": process["variant"]}
        for profile, state in self.state["profiles"].items():
            report = {"registeredHarborPlan": len(state["seeds"]), "namespaces": state["namespaces"], "fixtureObjects": len(state["objects"]), "pods": [], "readerTokenRefreshBefore": state.get("readerTokenRefreshBefore")}
            for namespace in state["namespaces"]:
                key, name = namespace["cluster"], namespace["name"]
                cluster_info = result["clusters"].get(key, {})
                if "actualNodes" not in cluster_info:
                    continue
                try:
                    self.ns_guard(profile, key, name)
                    pods = self.get(key, "pods", ns=name)["items"]
                    report["pods"] += [{"cluster": key, "namespace": name, "name": p["metadata"]["name"], "uid": p["metadata"]["uid"], "node": p.get("spec", {}).get("nodeName"), "phase": p.get("status", {}).get("phase"), "readyContainers": sum(c.get("ready", False) for c in p.get("status", {}).get("containerStatuses", [])), "containerCount": len(p.get("spec", {}).get("containers", []))} for p in pods if p["metadata"].get("labels", {}).get(OWNER) == self.state["labId"] and p["metadata"].get("labels", {}).get(PROFILE) == profile]
                except LabError as exc:
                    report["ownershipError"] = str(exc)
            result["profiles"][profile] = report
        print(json.dumps(result, ensure_ascii=False, indent=2))

    def doctor(self):
        report = {"readOnly": True, "platform": platform.platform(), "python": platform.python_version(), "stateDir": str(self.root), "stateExists": self.state is not None,
                  "pins": PINS, "tools": {}, "ports": {}, "budgets": {"A": "2 nodes × 2 CPU/2048MiB; ~4GiB + Docker overhead", "A+B": "3 nodes; ~6GiB + overhead", "telemetry": "explicit separate state only; no default CNI changes"},
                  "network": ["First up: Kubernetes v1.35.1 binaries/images from minikube registries", "Fixture images: nginx:1.27.5-alpine and busybox:1.37.0", "Optional telemetry downloads require separate explicit opt-in"], "automaticInstall": False}
        commands = {"minikube": ["minikube", "version", "--short"], "kubectl": ["kubectl", "version", "--client", "-o", "json"], "docker": ["docker", "version", "--format", "{{.Server.Version}}"]}
        for name, command in commands.items():
            try:
                rc, out, err = run(command, check=False, timeout=15)
                report["tools"][name] = {"available": rc == 0, "version": scrub(out.strip()), "error": scrub(err.strip()) if rc else None}
            except LabError as exc:
                report["tools"][name] = {"available": False, "error": str(exc)}
        if report["tools"].get("minikube", {}).get("available"):
            _, out, _ = run(["minikube", "start", "--help"], timeout=15)
            report["verifiedStartFlags"] = {flag: flag in out for flag in ("--keep-context", "--embed-certs", "--nodes", "--listen-address", "--cni")}
        if report["tools"].get("docker", {}).get("available"):
            _, out, _ = run(["docker", "info", "--format", '{"cpus":{{.NCPU}},"memoryBytes":{{.MemTotal}},"architecture":"{{.Architecture}}"}'])
            report["dockerResources"] = json.loads(out)
            rc, out, _ = run(["docker", "image", "inspect", PINS["baseImage"], "--format", "{{.Id}} {{.Architecture}}"], check=False)
            report["localBaseImage"] = out.strip() if rc == 0 else "missing; up requires network pull"
        ancestor = self.root
        while not ancestor.exists():
            ancestor = ancestor.parent
        report["diskFreeBytes"] = shutil.disk_usage(ancestor).free
        base = self.state["basePort"] if self.state else self.args.base_port or 19700
        report["ports"] = {profile: {"port": base + int(profile[:2]), "free": free_port(base + int(profile[:2]))} for profile in PROFILES}
        try:
            binary = self.binary()
            _, out, _ = run([binary, "--version"], timeout=10)
            report["binary"] = {"path": str(binary), "sha256": digest(binary), "version": out.strip()}
        except LabError as exc:
            report["binary"] = {"available": False, "error": str(exc)}
        report["globalKubeconfigHashes"] = global_configs()
        try:
            report["processOwnershipTool"] = {"available": True, "tool": process_tools()}
        except LabError as exc:
            report["processOwnershipTool"] = {"available": False, "error": str(exc)}
        if self.state:
            report["readerTokens"] = {key: {"serverExpiryKnown": bool(value.get("readerTokenExpiresAt")), "expiresAt": value.get("readerTokenExpiresAt"), "refreshBefore": value.get("readerTokenRefreshBefore") if value.get("readerTokenExpiresAt") else None} for key, value in self.state["profiles"].items() if "readerTokenRefreshedAt" in value}
        report["optionalTelemetry"] = self.telemetry().dependencies()
        report["optionalTelemetry"]["forwardPort"] = {"port": base + 8, "free": base + 8 <= 65535 and free_port(base + 8)}
        if self.state:
            report["ownership"] = {"labId": self.state["labId"], "stateMode": oct(self.root.stat().st_mode & 0o777), "privateFileModes": {p.name: oct(p.stat().st_mode & 0o777) for p in (self.root / "private").glob("*") if p.is_file()}}
        print(json.dumps(report, ensure_ascii=False, indent=2))


def parser():
    shared = argparse.ArgumentParser(add_help=False)
    shared.add_argument("--state-dir", help="Private normal-user state directory, outside the runner bundle/repo")
    shared.add_argument("--binary", help="Delivered embedded kubeview executable (or KUBEVIEW_BINARY)")
    shared.add_argument("--hubble-binary", help="Optional telemetry only: installed Hubble CLI1.20.2 executable")
    shared.add_argument("--base-port", type=int, help="Persisted lab base port; default19700, profile ports19701..19707")
    result = argparse.ArgumentParser(description=__doc__, parents=[shared])
    sub = result.add_subparsers(dest="command", required=True)
    for name in ("doctor", "up", "app", "status", "scenario", "reset", "down", "destroy"):
        child = sub.add_parser(name)
        # Suppressed defaults preserve options supplied before the subcommand.
        child.add_argument("--state-dir", default=argparse.SUPPRESS)
        child.add_argument("--binary", default=argparse.SUPPRESS)
        child.add_argument("--hubble-binary", default=argparse.SUPPRESS)
        child.add_argument("--base-port", type=int, default=argparse.SUPPRESS)
        if name in ("up", "app", "scenario", "reset"):
            child.add_argument("--profile", choices=PROFILES, required=True)
        if name == "down":
            child.add_argument("--profile", choices=PROFILES, help="Only stop this app; shared clusters continue running")
        if name == "up":
            child.add_argument("--telemetry", action="store_true", help="Explicit optional telemetry extension (never modify vanillaA)")
        if name == "app":
            child.add_argument("--write", action="store_true", help="Allow explicit browser management intent; Kubernetes RBAC still applies")
            child.add_argument("--empty-workspace", action="store_true", help="Do not seed saved harbors; preserves existing user registrations")
            child.add_argument("--replay", choices=("M", "L"), default="M")
            child.add_argument("--harbors", choices=(1, 5, 10, 20), type=int, default=5)
        if name == "scenario":
            child.add_argument("--name", required=True)
        if name == "destroy":
            child.add_argument("--confirm", required=True, help="Exact labId shown by status; no wildcard")
    return result


def main(argv=None):
    os.umask(0o077)
    try:
        args = parser().parse_args(argv)
        lab = Lab(args)
        getattr(lab, args.command)()
        return 0
    except (LabError, OSError, ValueError) as exc:
        print("manual-lab: " + scrub(exc), file=sys.stderr)
        return 2
    except KeyboardInterrupt:
        print("manual-lab: kullanıcı durdurdu; state korundu. status ile gerçek durumu inceleyin", file=sys.stderr)
        return 130


if __name__ == "__main__":
    sys.exit(main())
