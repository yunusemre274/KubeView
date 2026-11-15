"""TLS boundary contracts; no cluster/Secret/network/process is accessed."""
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import call, patch

from test_runner import runner


class TelemetryTLSContracts(unittest.TestCase):
    def lab(self, directory, cni="false"):
        args = runner.parser().parse_args(["status", "--state-dir", directory])
        lab = runner.Lab(args)
        lab.state = {"labId": "kvml-123456789abc", "basePort": 19900, "processes": {},
            "clusters": {"a": {"name": "owned-a", "uid": "cluster-uid", "cni": cni}},
            "telemetry": {"enabled": True, "mode": "separate-A-only", "hubbleBinary": "TEST-ONLY/hubble", "installIntent": "test-intent",
                "resourceUids": {"Secret/hubble-relay-client-certs": "client-uid", "Secret/hubble-relay-server-certs": "server-uid"}}}
        return lab

    def test_template_requires_both_tls_hops_and_mutual_relay_auth(self):
        values = json.loads((runner.ASSETS / "templates/telemetry-values.json").read_text())
        self.assertTrue(values["hubble"]["tls"]["enabled"])
        self.assertEqual(values["hubble"]["tls"]["auto"]["method"], "helm")
        self.assertTrue(values["hubble"]["relay"]["tls"]["server"]["enabled"])
        self.assertTrue(values["hubble"]["relay"]["tls"]["server"]["mtls"])

    def test_default_vanilla_lab_is_rejected_before_secret_read(self):
        with tempfile.TemporaryDirectory() as directory:
            lab = self.lab(directory, cni="kindnet")
            with patch.object(lab, "get") as read:
                with self.assertRaises(runner.LabError):
                    lab.telemetry().tls_material()
                read.assert_not_called()

    def test_unpinned_secret_uid_cannot_write_private_material(self):
        with tempfile.TemporaryDirectory() as directory:
            lab = self.lab(directory)
            telemetry = lab.telemetry()
            def secret(uid):
                return {"metadata": {"uid": uid, "labels": {runner.OWNER: lab.state["labId"], "manual.kubeview.local/install-intent": "test-intent"}, "annotations": {"meta.helm.sh/release-name": "kv-manual-cilium"}}, "data": {}}
            with patch.object(telemetry, "guard_resources"), patch.object(lab, "get", side_effect=[secret("replacement-uid"), secret("server-uid")]) as read, patch.object(telemetry, "write_pem") as write:
                with self.assertRaises(runner.LabError):
                    telemetry.tls_material()
                self.assertEqual(read.call_args_list, [call("a", "Secret", "hubble-relay-client-certs", "kube-system"), call("a", "Secret", "hubble-relay-server-certs", "kube-system")])
                write.assert_not_called()

    def test_backend_env_requires_mtls_without_plaintext_fallback(self):
        with tempfile.TemporaryDirectory() as directory:
            lab = self.lab(directory)
            telemetry = lab.telemetry()
            paths = {"ca": Path("TEST-ONLY/ca.crt"), "cert": Path("TEST-ONLY/client.crt"), "key": Path("TEST-ONLY/client.key")}
            with patch.object(telemetry, "dependencies"), patch.object(telemetry, "tls_material", return_value=paths):
                env = telemetry.provider_env()
            self.assertEqual(env["KV_HUBBLE_SERVER"], "tls://127.0.0.1:19908")
            self.assertEqual(env["KV_HUBBLE_ALLOW_LOOPBACK_PLAINTEXT"], "false")
            self.assertEqual(env["KV_HUBBLE_TLS_SERVER_NAME"], "ui.hubble-relay.cilium.io")
            self.assertEqual(env["KV_HUBBLE_TLS_CA"], str(paths["ca"]))
            self.assertEqual(env["KV_HUBBLE_TLS_CERT"], str(paths["cert"]))
            self.assertEqual(env["KV_HUBBLE_TLS_KEY"], str(paths["key"]))


if __name__ == "__main__":
    unittest.main()
