"""Ownership/concurrency contracts. No cluster, network, process start or Git."""
import argparse
import contextlib
import datetime
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import Mock, patch

SPEC = importlib.util.spec_from_file_location("manual_lab", Path(__file__).resolve().parents[2] / "scripts/manual_lab.py")
runner = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(runner)


class RunnerContracts(unittest.TestCase):
    def args(self, state):
        return runner.parser().parse_args(["status", "--state-dir", str(state)])

    def test_options_before_and_after_subcommand(self):
        before = runner.parser().parse_args(["--state-dir", "/tmp/lab", "status"])
        after = runner.parser().parse_args(["status", "--state-dir", "/tmp/lab"])
        self.assertEqual(before.state_dir, after.state_dir)

    def test_corrupt_state_is_not_replaced(self):
        with tempfile.TemporaryDirectory() as directory:
            state = Path(directory)
            file = state / "lab.json"
            file.write_text("{broken")
            file.chmod(0o600)
            with self.assertRaises(runner.LabError):
                runner.Lab(self.args(state))
            self.assertEqual(file.read_text(), "{broken")

    def test_nonempty_unknown_state_not_adopted(self):
        with tempfile.TemporaryDirectory() as directory:
            state = Path(directory)
            (state / "user-file").write_text("preserve")
            lab = runner.Lab(self.args(state))
            with self.assertRaises(runner.LabError):
                with lab.lock(initialize=True):
                    self.fail("must not acquire unknown state")
            self.assertFalse((state / "lab.json").exists())

    def test_atomic_state_permissions(self):
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / "private/state.json"
            runner.atomic(target, {"schemaVersion": 1})
            self.assertEqual(target.stat().st_mode & 0o777, 0o600)
            self.assertEqual(target.parent.stat().st_mode & 0o777, 0o700)

    def test_pid_reuse_is_never_killed(self):
        with tempfile.TemporaryDirectory() as directory:
            lab = runner.Lab(self.args(directory))
            lab.state = {"processes": {"02-ortak-kume": {"pid": 999999, "identity": "old birth command", "dataDir": "/private/owned", "binary": "/owned/kubeview", "port": 19702}}}
            with patch.object(runner, "process_identity", return_value="new birth unrelated"), patch.object(runner.os, "kill") as kill:
                with self.assertRaises(runner.LabError):
                    lab.stop_process("02-ortak-kume")
                kill.assert_not_called()

    def test_same_name_foreign_namespace_not_adopted(self):
        with tempfile.TemporaryDirectory() as directory:
            lab = runner.Lab(self.args(directory))
            lab.state = {"labId": "kvml-123456789abc", "profiles": {"02-ortak-kume": {"namespaces": []}}}
            with patch.object(lab, "guard_cluster"), patch.object(lab, "get", return_value={"metadata": {"uid": "foreign", "labels": {}}}), patch.object(lab, "kubectl") as mutate:
                with self.assertRaises(runner.LabError):
                    lab.ensure_namespace("02-ortak-kume", "a", "same-name")
                mutate.assert_not_called()

    def test_delete_sends_real_uid_and_resource_version_preconditions(self):
        with tempfile.TemporaryDirectory() as directory:
            lab = runner.Lab(self.args(directory))
            obj = {"apiVersion": "v1", "kind": "Pod", "metadata": {"name": "fixture", "namespace": "owned", "uid": "uid-1", "resourceVersion": "opaque-rv"}}
            record = {"name": "fixture"}
            lab.state = {"profiles": {"05-ariza-toparlanma": {"objects": [record]}}}
            with patch.object(lab, "guard_object", return_value=obj), patch.object(lab, "kubectl") as mutate, patch.object(lab, "get", return_value=None), patch.object(lab, "object_record", return_value=record), patch.object(lab, "save"):
                lab.delete_owned("05-ariza-toparlanma", "a", obj)
                options = mutate.call_args.kwargs["obj"]
                self.assertEqual(options["preconditions"], {"uid": "uid-1", "resourceVersion": "opaque-rv"})
                self.assertIn("--raw", mutate.call_args.args[1])

    def test_profiles_replay_and_empty_are_explicit(self):
        self.assertEqual(len(runner.PROFILES), 7)
        self.assertEqual(runner.PROFILES["01-bos-baslangic"]["harbors"], 0)
        self.assertEqual(runner.PROFILES["07-yuk-ve-gecis"]["clusterKeys"], [])

    def test_initial_harbors_clear_the_full_active_world(self):
        with tempfile.TemporaryDirectory() as directory:
            lab = runner.Lab(self.args(directory))
            lab.state = {"labId": "kvml-123456789abc", "clusters": {"a": {"name": "lab-a", "worker": "lab-a-m02"}}}
            _, _, seeds = lab.desired("02-ortak-kume")
            self.assertEqual(len(seeds), 2)
            self.assertGreaterEqual(abs(seeds[1]["position"][0] - seeds[0]["position"][0]), 1000)
            self.assertEqual(seeds[0]["namespaces"], ["kvml-56789abc-02-p1"])
            self.assertEqual(seeds[1]["namespaces"], ["kvml-56789abc-02-p2"])

    def test_empty_collection_is_distinct_from_offline_and_missing_object(self):
        with tempfile.TemporaryDirectory() as directory:
            lab = runner.Lab(self.args(directory))
            lab.state = {"clusters": {"a": {"name": "owned"}}}
            with patch.object(lab, "kubectl", return_value=(0, "", "")):
                self.assertEqual(lab.get("a", "pods", ns="empty")["items"], [])
                self.assertIsNone(lab.get("a", "pod", "absent", "empty"))
            with patch.object(lab, "kubectl", side_effect=runner.LabError("offline")):
                with self.assertRaises(runner.LabError):
                    lab.get("a", "pods", ns="empty")

    def test_docker_network_never_resolves_as_a_container(self):
        with tempfile.TemporaryDirectory() as directory:
            lab = runner.Lab(self.args(directory))
            with patch.object(runner, "run", return_value=(1, "", "not a container")) as call:
                self.assertIsNone(lab.inspect_container("same-name-network"))
                self.assertEqual(call.call_args.args[0][:3], ["docker", "container", "inspect"])

    def test_worker_alias_repair_is_guarded_append_once(self):
        with tempfile.TemporaryDirectory() as directory:
            lab = runner.Lab(self.args(directory))
            cp, worker = {"name": "owned-a", "id": "cp-id"}, {"name": "owned-a-m02", "id": "worker-id"}
            cluster = {"name": "owned-a", "containers": [cp, worker], "network": {"name": "owned-net", "id": "net-id", "subnet": "172.29.9.0/24"}, "nodeUids": {"owned-a-m02": "node-uid"}}
            host_file = ["127.0.0.1 localhost\n"]
            writes = []
            def inspect(_, record):
                return {"NetworkSettings": {"Networks": {"owned-net": {"NetworkID": "net-id", "IPAddress": "172.29.9.2" if record is cp else "172.29.9.3"}}}}
            def command(argv, **kwargs):
                if argv[-2:] == ["cat", "/etc/hosts"]:
                    return 0, host_file[0], ""
                if argv[-1] == "cat >> /etc/hosts":
                    writes.append(kwargs["payload"]); host_file[0] += kwargs["payload"]
                    return 0, "", ""
                if argv[-3:] == ["getent", "hosts", "control-plane.minikube.internal"]:
                    return 0, "172.29.9.2 control-plane.minikube.internal\n", ""
                self.fail("Unexpected command")
            with patch.object(lab, "guard_cluster", return_value=cluster), patch.object(lab, "check_container", side_effect=inspect), patch.object(lab, "get", return_value={"metadata": {"uid": "node-uid"}}), patch.object(runner, "run", side_effect=command):
                self.assertTrue(lab.repair_owned_worker_hosts("a"))
                self.assertFalse(lab.repair_owned_worker_hosts("a"))
            self.assertEqual(writes, ["\n172.29.9.2\tcontrol-plane.minikube.internal\n"])

    def test_telemetry_refuses_existing_vanilla_before_dependencies(self):
        with tempfile.TemporaryDirectory() as directory:
            lab = runner.Lab(self.args(directory))
            lab.args.profile = "06-limanlar-arasi-ag"
            lab.state = {"clusters": {"a": {"cni": "kindnet"}}}
            telemetry = lab.telemetry()
            with patch.object(telemetry, "dependencies") as deps:
                with self.assertRaises(runner.LabError):
                    telemetry.configure()
                deps.assert_not_called()

    def test_token_refresh_uses_server_expiration_not_requested_hour(self):
        with tempfile.TemporaryDirectory() as directory:
            lab = runner.Lab(self.args(directory))
            profile = "04-kisitli-yetki"
            lab.state = {"profiles": {profile: {"namespaces": [{"name": "owned"}]}}, "clusters": {"a": {"name": "lab-a"}}}
            wanted = {"kind": "ServiceAccount", "metadata": {"name": "reader", "namespace": "owned"}}
            expiry = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=15)
            # Inert fixture text, never a usable credential.
            response = {"status": {"token": "TEST-ONLY-INERT-TOKEN", "expirationTimestamp": expiry.isoformat()}}
            config = {"users": [], "contexts": [{"context": {"cluster": "cluster-a"}}]}
            with patch.object(lab, "desired", return_value=([], [("a", wanted)], [])), patch.object(lab, "guard_object", return_value=wanted) as guard, patch.object(lab, "kubectl", return_value=(0, json.dumps(response), "")) as api, patch.object(lab, "save"):
                lab.refresh_reader(profile, config)
                self.assertEqual(guard.call_count, 2)
                self.assertEqual(api.call_args.args[1][-2:], ["-o", "json"])
            actual = lab.state["profiles"][profile]
            self.assertEqual(actual["readerTokenExpiresAt"], expiry.isoformat())
            self.assertEqual(datetime.datetime.fromisoformat(actual["readerTokenRefreshBefore"]), expiry-datetime.timedelta(minutes=5))

    def test_missing_process_tools_fails_before_starting_a_child(self):
        with tempfile.TemporaryDirectory() as directory:
            lab = runner.Lab(self.args(directory))
            lab.args.profile = "02-ortak-kume"
            lab.state = {"profiles": {"02-ortak-kume": {}}}
            with patch.object(lab, "lock", return_value=contextlib.nullcontext()), patch.object(runner.shutil, "which", return_value=None), patch.object(runner.subprocess, "Popen") as child:
                with self.assertRaises(runner.LabError):
                    lab.app()
                child.assert_not_called()

    def test_keyboard_interrupt_terminates_only_created_child_group(self):
        child = Mock(pid=999999)
        child.communicate.side_effect = [KeyboardInterrupt(), (b"", b"")]
        with patch.object(runner.subprocess, "Popen", return_value=child), patch.object(runner.os, "killpg") as signal:
            with self.assertRaises(KeyboardInterrupt):
                runner.run(["owned-fixture-command"])
            signal.assert_called_once_with(999999, runner.signal.SIGTERM)

    def test_empty_admin_auth_is_rejected_before_api_process(self):
        with tempfile.TemporaryDirectory() as directory:
            lab = runner.Lab(self.args(directory))
            lab.state = {"clusters": {"a": {"name": "owned-a"}}}
            broken = {"contexts": [{"name": "owned-a", "context": {"cluster": "owned-a", "user": "owned-a"}}], "clusters": [{"name": "owned-a", "cluster": {"server": "https://127.0.0.1:54321"}}], "users": [{"name": "owned-a", "user": {}}]}
            with patch.object(lab, "admin_document", return_value=broken), patch.object(runner, "run") as process:
                with self.assertRaisesRegex(runner.LabError, "auth/CA"):
                    lab.kubectl("a", ["get", "pods"])
                process.assert_not_called()

    def test_owned_auth_repair_preserves_other_cluster_and_reader(self):
        with tempfile.TemporaryDirectory() as directory:
            lab = runner.Lab(self.args(directory))
            cluster = {"name": "owned-a", "network": {"name": "owned-net", "id": "net-id"}, "containers": [{"name": "owned-a", "id": "cp-id"}]}
            lab.state = {"clusters": {"a": cluster}}
            old_b = {"name": "owned-b", "cluster": {"server": "https://127.0.0.1:54322", "certificate-authority-data": "TEST-ONLY-B-CA"}}
            old_b_user = {"name": "owned-b", "user": {"client-certificate-data": "TEST-ONLY-B-CERT", "client-key-data": "TEST-ONLY-B-KEY"}}
            old_reader = {"name": "owned-reader", "user": {"token": "TEST-ONLY-INERT-READER"}}
            old_reader_context = {"name": "owned-reader", "context": {"cluster": "owned-a", "user": "owned-reader", "namespace": "reader-scope"}}
            config = {"apiVersion": "v1", "kind": "Config", "current-context": "owned-reader", "clusters": [{"name": "owned-a", "cluster": {}}, old_b], "users": [{"name": "owned-a", "user": {}}, old_b_user, old_reader], "contexts": [{"name": "owned-a", "context": {"cluster": "owned-a", "user": "owned-a"}}, old_reader_context]}
            # Clearly inert file fixtures, never usable credentials.
            files = {"minikube/.minikube/ca.crt": "TEST-ONLY-CA", "minikube/.minikube/profiles/owned-a/client.crt": "TEST-ONLY-CERT", "minikube/.minikube/profiles/owned-a/client.key": "TEST-ONLY-KEY"}
            for relative, data in files.items():
                path = lab.root / relative; path.parent.mkdir(parents=True, exist_ok=True); path.write_text(data)
            inspected = {"NetworkSettings": {"Networks": {"owned-net": {"NetworkID": "net-id"}}, "Ports": {"8443/tcp": [{"HostIp": "127.0.0.1", "HostPort": "54323"}]}}}
            with patch.object(lab, "guard_cluster", return_value=cluster), patch.object(lab, "check_container", return_value=inspected), patch.object(lab, "admin_document", return_value=config), patch.object(lab, "validate_admin_auth") as verify:
                lab.refresh_admin_server("a")
                verify.assert_called_once_with("a")
            result = json.loads((lab.root / "private/admin.json").read_text())
            self.assertIn(old_b, result["clusters"])
            self.assertIn(old_b_user, result["users"])
            self.assertIn(old_reader, result["users"])
            self.assertIn(old_reader_context, result["contexts"])
            self.assertEqual(result["current-context"], "owned-reader")
            self.assertEqual(next(c["cluster"]["server"] for c in result["clusters"] if c["name"] == "owned-a"), "https://127.0.0.1:54323")
            self.assertEqual((lab.root / "private/admin.json").stat().st_mode & 0o777, 0o600)


if __name__ == "__main__":
    unittest.main()
