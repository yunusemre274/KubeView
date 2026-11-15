"""Finite offline schema QA helper tests; no build/scanner/network."""
import contextlib
import copy
import importlib.util
import io
import json
from pathlib import Path
import shutil
import socket
import sys
import tempfile
import unittest
from unittest import mock

spec = importlib.util.spec_from_file_location("kubeview_release_schema", Path(__file__).with_name("validate-release-sbom.py"))
qa = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = qa
spec.loader.exec_module(qa)


def minimal():
    return {"bomFormat": "CycloneDX", "specVersion": "1.5", "version": 1,
            "metadata": {"timestamp": "2026-11-15T12:00:00Z", "component": {"type": "application", "name": "KubeView", "version": "1.1.0"}}}


class SchemaGuardTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.bundle = qa.build_validator()

    def errors(self, value):
        return qa.validate_document(value, self.bundle)

    def test_01_minimal_valid(self):
        self.assertEqual(self.errors(minimal()), [])

    def test_02_invalid_enum(self):
        value = minimal(); value["metadata"]["component"]["type"] = "invalid-synthetic-type"
        self.assertTrue(self.errors(value))

    def test_03_invalid_hash(self):
        value = minimal(); value["metadata"]["component"]["hashes"] = [{"alg": "SHA-256", "content": "not-a-hash"}]
        self.assertTrue(self.errors(value))

    def test_04_invalid_timestamp(self):
        value = minimal(); value["metadata"]["timestamp"] = "not-a-timestamp"
        self.assertTrue(self.errors(value))

    def test_05_additional_property_redacted(self):
        value = minimal(); value["SYNTHETIC_PRIVATE_MARKER"] = "SYNTHETIC_SECRET_VALUE"
        errors = self.errors(value); self.assertTrue(errors)
        self.assertNotIn("SYNTHETIC", json.dumps(errors))
        self.assertEqual(set(errors[0]), {"pointer", "schemaField"})

    def test_06_spdx_external_ref(self):
        value = minimal(); value["metadata"]["component"]["licenses"] = [{"license": {"id": "MIT"}}]
        self.assertEqual(self.errors(value), [])
        value["metadata"]["component"]["licenses"][0]["license"]["id"] = "Not-An-SPDX-Identifier"
        self.assertTrue(self.errors(value))
        for scheme in ["http", "https"]:
            for filename in ["bom-1.5.schema.json", "spdx.schema.json", "jsf-0.82.schema.json"]:
                self.assertEqual(self.bundle.registry.resolver().lookup(f"{scheme}://cyclonedx.org/schema/{filename}").contents["$id"], f"http://cyclonedx.org/schema/{filename}")

    def test_07_unknown_ref_no_network(self):
        with mock.patch.object(socket, "create_connection", side_effect=AssertionError("network forbidden")) as network:
            with self.assertRaises(Exception):
                self.bundle.registry.resolver().lookup("https://unregistered.invalid/schema")
            validator = qa.Draft7Validator({"$ref": "https://unregistered.invalid/schema"}, registry=self.bundle.registry)
            errors = qa.ValidatorBundle(validator, self.bundle.registry, set(), set())
            with self.assertRaises(qa.GuardError) as raised:
                qa.validate_document({}, errors)
            self.assertEqual(raised.exception.code, "SCHEMA_RESOLUTION_ERROR")
            self.assertFalse(network.called)

    def test_08_duplicate_json_key(self):
        with self.assertRaises(qa.GuardError) as raised:
            qa.parse_json(b'{"bomFormat":"CycloneDX","bomFormat":"synthetic"}')
        self.assertEqual(raised.exception.code, "DUPLICATE_JSON_KEY")

    def test_09_oversize_file(self):
        with tempfile.TemporaryDirectory() as directory:
            p = Path(directory) / "large.json"; p.write_bytes(b" " * (qa.MAX_BYTES + 1))
            with self.assertRaises(qa.GuardError) as raised: qa.read_regular(p)
            self.assertEqual(raised.exception.code, "INPUT_TOO_LARGE")

    def test_10_nonfinite_json(self):
        for raw in [b'{"a":NaN}', b'{"a":1e999}']:
            with self.assertRaises(qa.GuardError) as raised: qa.parse_json(raw)
            self.assertEqual(raised.exception.code, "NONFINITE_JSON_NUMBER")

    def test_11_symlink_not_regular(self):
        with tempfile.TemporaryDirectory() as directory:
            p = Path(directory); (p / "real.json").write_text("{}")
            (p / "link.json").symlink_to(p / "real.json")
            with self.assertRaises(qa.GuardError) as raised: qa.read_regular(p / "link.json")
            self.assertEqual(raised.exception.code, "INPUT_NOT_REGULAR")

    def assert_tamper_rejected(self, filename):
        with tempfile.TemporaryDirectory() as directory:
            p = Path(directory)
            for name in qa.PINS: shutil.copyfile(qa.DEFAULT_SCHEMAS / name, p / name)
            target = p / filename; target.write_bytes(target.read_bytes() + b"\n")
            # Forging the adjacent audit manifest must not replace hardcoded pins.
            (p / "SOURCES.json").write_text('{"verification":[]}')
            with self.assertRaises(qa.GuardError) as raised: qa.build_validator(p)
            self.assertEqual(raised.exception.code, "SCHEMA_PIN_MISMATCH")

    def test_12_schema_tamper(self):
        self.assert_tamper_rejected("bom-1.5.schema.json")

    def test_13_license_tamper(self):
        self.assert_tamper_rejected("LICENSE")

    def test_14_missing_format_fail_closed(self):
        with self.assertRaises(qa.GuardError) as raised: qa.build_validator(format_checker=qa.FormatChecker(formats=[]))
        self.assertEqual(raised.exception.code, "FORMAT_DEPENDENCY_UNAVAILABLE")

    def test_15_cli_multiple_inputs_safe_result(self):
        with tempfile.TemporaryDirectory() as directory:
            p = Path(directory); good = p / "good.json"; bad = p / "bad.json"
            good.write_text(json.dumps(minimal())); value = minimal(); value["SYNTHETIC_SECRET_MARKER"] = "SYNTHETIC_SECRET_VALUE"; bad.write_text(json.dumps(value))
            output = io.StringIO()
            with contextlib.redirect_stdout(output): code = qa.main([str(good), str(bad)])
            self.assertEqual(code, 1); result = json.loads(output.getvalue())
            self.assertEqual([x["status"] for x in result["results"]], ["PASS", "FAIL"])
            self.assertNotIn(directory, output.getvalue()); self.assertNotIn("SYNTHETIC", output.getvalue())
            self.assertEqual(result["scope"], "OFFLINE_SCHEMA_ONLY_NOT_SOURCE_BINDING_OR_SECURITY")


if __name__ == "__main__":
    unittest.main()
