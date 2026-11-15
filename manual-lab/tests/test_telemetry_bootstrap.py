"""Exact relay bootstrap repair contracts; no process, cluster or Secret access."""
import copy
import json
import tempfile
import unittest
from unittest.mock import patch

from test_telemetry_tls import TelemetryTLSContracts, runner


class TelemetryBootstrapContracts(unittest.TestCase):
    def fixture(self, directory, *, ip="10.244.0.2", endpoint=False):
        lab = TelemetryTLSContracts().lab(directory)
        lab.state["clusters"]["a"]["nodeUids"] = {"worker": "node-uid"}
        lab.state["telemetry"]["resourceUids"]["Deployment/hubble-relay"] = "deployment-uid"
        pod = {"metadata": {"name": "relay-owned", "uid": "pod-uid", "resourceVersion": "7",
            "labels": {runner.OWNER: lab.state["labId"], "manual.kubeview.local/install-intent": "test-intent"},
            "ownerReferences": [{"kind": "ReplicaSet", "name": "relay-rs", "uid": "rs-uid", "controller": True}]},
            "spec": {"nodeName": "worker"}, "status": {"phase": "Running", "podIP": ip}}
        rs = {"metadata": {"uid": "rs-uid", "ownerReferences": [{"kind": "Deployment", "uid": "deployment-uid", "controller": True}]}}
        cep = {"metadata": {"uid": "endpoint-uid", "ownerReferences": [{"kind": "Pod", "uid": "pod-uid"}]}} if endpoint else None
        def get(cluster, kind, name=None, ns=None):
            return {"ReplicaSet": rs, "CiliumEndpoint": cep, "Pod": pod, "Node": {"metadata": {"uid": "node-uid"}, "spec": {"podCIDR": "10.244.1.0/24"}}}.get(kind)
        def kubectl(cluster, args, **kwargs):
            value = {"items": [pod]} if args[1] == "pods" else get(cluster, args[1])
            return (0, json.dumps(value) if args[0] == "get" else "", "")
        telemetry = lab.telemetry()
        return lab, telemetry, pod, get, kubectl

    def test_invalid_cidr_unmanaged_relay_delete_has_exact_uid_and_rv(self):
        with tempfile.TemporaryDirectory() as directory:
            lab, telemetry, pod, get, kubectl = self.fixture(directory)
            with patch.object(telemetry, "guard_resources"), patch.object(telemetry, "cilium_network", return_value={"worker": {"podCIDR": "10.244.1.0/24", "nodeUid": "node-uid"}}), patch.object(lab, "get", side_effect=get), patch.object(lab, "save"), patch.object(lab, "kubectl", side_effect=kubectl) as command:
                telemetry.relay_network(repair=True)
                deletion = [c for c in command.call_args_list if c.args[1][0] == "delete"]
                self.assertEqual(len(deletion), 1)
                self.assertEqual(deletion[0].args[1], ["delete", "--raw", "/api/v1/namespaces/kube-system/pods/relay-owned", "-f", "-"])
                self.assertEqual(deletion[0].kwargs["obj"]["preconditions"], {"uid": "pod-uid", "resourceVersion": "7"})
                self.assertEqual(lab.state["telemetry"]["relayBootstrapRepair"]["oldPodUid"], "pod-uid")

    def test_unknown_owner_is_rejected_before_delete(self):
        with tempfile.TemporaryDirectory() as directory:
            lab, telemetry, pod, get, kubectl = self.fixture(directory)
            pod["metadata"]["labels"][runner.OWNER] = "another-lab"
            with patch.object(telemetry, "guard_resources"), patch.object(telemetry, "cilium_network", return_value={"worker": {"podCIDR": "10.244.1.0/24", "nodeUid": "node-uid"}}), patch.object(lab, "get", side_effect=get), patch.object(lab, "kubectl", side_effect=kubectl) as command:
                with self.assertRaises(runner.LabError):
                    telemetry.relay_network(repair=True)
                self.assertFalse(any(c.args[1][0] == "delete" for c in command.call_args_list))

    def test_valid_ip_without_endpoint_is_not_blindly_restarted(self):
        with tempfile.TemporaryDirectory() as directory:
            lab, telemetry, pod, get, kubectl = self.fixture(directory, ip="10.244.1.2")
            with patch.object(telemetry, "guard_resources"), patch.object(telemetry, "cilium_network", return_value={"worker": {"podCIDR": "10.244.1.0/24", "nodeUid": "node-uid"}}), patch.object(lab, "get", side_effect=get), patch.object(lab, "kubectl", side_effect=kubectl) as command:
                with self.assertRaises(runner.LabError):
                    telemetry.relay_network(repair=True)
                self.assertFalse(any(c.args[1][0] == "delete" for c in command.call_args_list))

    def test_valid_cilium_endpoint_needs_no_delete(self):
        with tempfile.TemporaryDirectory() as directory:
            lab, telemetry, pod, get, kubectl = self.fixture(directory, ip="10.244.1.2", endpoint=True)
            with patch.object(telemetry, "guard_resources"), patch.object(telemetry, "cilium_network", return_value={"worker": {"podCIDR": "10.244.1.0/24", "nodeUid": "node-uid"}}), patch.object(lab, "get", side_effect=get), patch.object(lab, "save"), patch.object(lab, "kubectl", side_effect=kubectl) as command:
                telemetry.relay_network(repair=True)
                self.assertEqual(lab.state["telemetry"]["relayNetworkProof"]["podUid"], "pod-uid")
                self.assertFalse(any(c.args[1][0] == "delete" for c in command.call_args_list))

    def test_active_bridge_plugin_rejects_network_proof(self):
        with tempfile.TemporaryDirectory() as directory:
            lab = TelemetryTLSContracts().lab(directory)
            lab.state["clusters"]["a"].update(nodeUids={"worker": "node-uid"}, containers=[{"name": "worker", "id": "container-id"}])
            telemetry = lab.telemetry()
            node = {"metadata": {"name": "worker", "uid": "node-uid"}, "spec": {"podCIDR": "10.244.1.0/24"}}
            with patch.object(lab, "guard_cluster", return_value=lab.state["clusters"]["a"]), patch.object(lab, "get", return_value={"items": [node]}), patch.object(lab, "check_container", return_value={"State": {"Running": True}}), patch.object(telemetry, "run", side_effect=[(0, "10-bridge.conf\n", ""), (0, '{"type":"bridge"}', "")]) as command:
                with self.assertRaises(runner.LabError):
                    telemetry.cilium_network()
                self.assertTrue(all(c.args[0][2] == "container-id" for c in command.call_args_list))

    def startup_wait(self, directory, next_pod=None):
        lab, telemetry, pod, get, kubectl = self.fixture(directory, ip="10.244.1.2", endpoint=True)
        pod["status"] = {"phase": "Pending"}
        clock = [0.0]
        def sleep(seconds):
            clock[0] += seconds
        def command(cluster, args, **kwargs):
            if args[:2] == ["get", "Pod"] and next_pod is not None:
                return (0, json.dumps(next_pod), "")
            return kubectl(cluster, args, **kwargs)
        return lab, telemetry, pod, get, command, clock, sleep

    def test_startup_empty_ip_becomes_valid_on_same_uid_without_delete(self):
        with tempfile.TemporaryDirectory() as directory:
            lab, telemetry, pod, get, command, clock, sleep = self.startup_wait(directory)
            ready = copy.deepcopy(pod)
            ready["status"] = {"phase": "Running", "podIP": "10.244.1.2"}
            def respond(cluster, args, **kwargs):
                return (0, json.dumps(ready), "") if args[:2] == ["get", "Pod"] else command(cluster, args, **kwargs)
            timer = telemetry.relay_network.__func__.__globals__["time"]
            with patch.object(timer, "monotonic", side_effect=lambda: clock[0]), patch.object(timer, "sleep", side_effect=sleep), patch.object(telemetry, "guard_resources"), patch.object(telemetry, "cilium_network", return_value={"worker": {"podCIDR": "10.244.1.0/24", "nodeUid": "node-uid"}}), patch.object(lab, "get", side_effect=get), patch.object(lab, "save"), patch.object(lab, "kubectl", side_effect=respond) as calls:
                telemetry.relay_network(repair=True)
                self.assertEqual(lab.state["telemetry"]["relayNetworkProof"]["podUid"], "pod-uid")
                self.assertGreater(clock[0], 0)
                self.assertFalse(any(c.args[1][0] == "delete" for c in calls.call_args_list))

    def test_startup_empty_ip_times_out_without_delete(self):
        with tempfile.TemporaryDirectory() as directory:
            lab, telemetry, pod, get, command, clock, sleep = self.startup_wait(directory)
            timer = telemetry.relay_network.__func__.__globals__["time"]
            with patch.object(timer, "monotonic", side_effect=lambda: clock[0]), patch.object(timer, "sleep", side_effect=sleep), patch.object(telemetry, "guard_resources"), patch.object(telemetry, "cilium_network", return_value={"worker": {"podCIDR": "10.244.1.0/24", "nodeUid": "node-uid"}}), patch.object(lab, "get", side_effect=get), patch.object(lab, "kubectl", side_effect=command) as calls:
                with self.assertRaises(runner.LabError):
                    telemetry.relay_network(repair=True)
                self.assertEqual(clock[0], 45)
                self.assertFalse(any(c.args[1][0] == "delete" for c in calls.call_args_list))

    def test_startup_new_uid_aborts_without_delete(self):
        with tempfile.TemporaryDirectory() as directory:
            lab, telemetry, pod, get, command, clock, sleep = self.startup_wait(directory)
            replacement = copy.deepcopy(pod)
            replacement["metadata"]["uid"] = "replacement-uid"
            replacement["status"] = {"phase": "Running", "podIP": "10.244.1.2"}
            def respond(cluster, args, **kwargs):
                return (0, json.dumps(replacement), "") if args[:2] == ["get", "Pod"] else command(cluster, args, **kwargs)
            timer = telemetry.relay_network.__func__.__globals__["time"]
            with patch.object(timer, "monotonic", side_effect=lambda: clock[0]), patch.object(timer, "sleep", side_effect=sleep), patch.object(telemetry, "guard_resources"), patch.object(telemetry, "cilium_network", return_value={"worker": {"podCIDR": "10.244.1.0/24", "nodeUid": "node-uid"}}), patch.object(lab, "get", side_effect=get), patch.object(lab, "kubectl", side_effect=respond) as calls:
                with self.assertRaises(runner.LabError):
                    telemetry.relay_network(repair=True)
                self.assertGreater(clock[0], 0)
                self.assertLess(clock[0], 45)
                self.assertFalse(any(c.args[1][0] == "delete" for c in calls.call_args_list))


if __name__ == "__main__":
    unittest.main()
