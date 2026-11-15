#!/usr/bin/env python3
"""Offline QA validation against pinned CycloneDX1.5 schemas.

Requires a QA environment with jsonschema[format]==4.26.0 and referencing.
This is not an application/build runtime dependency. Schema validity does not
prove dependency completeness, source binding, vulnerability status or signing.
"""
from __future__ import annotations

import argparse
from dataclasses import dataclass
import hashlib
import json
import math
import os
from pathlib import Path
import stat
import sys

MAX_BYTES = 2 << 20
SCHEMA_COMMIT = "c320fc0f0b46873864927d9d5684eea7ba439728"
# Independently pinned from the exact upstream Git blobs. Never trust mutable
# SOURCES.json as the authority at validation time.
PINS = {
    "bom-1.5.schema.json": (164769, "067f7824b08653839ea050ae9e09ca48375eadc2652b0e2a299476e7db90335b"),
    "jsf-0.82.schema.json": (8058, "8bae002c25e723db7ee1f26afde680ae1a2b1a8f6b4b4b0fd65dc3becb090aae"),
    "spdx.schema.json": (12322, "4f6e2b05c05d26a4f2dc5879fbc2fca94b0a28db46289d0c51345621b71cfbfc"),
    "LICENSE": (11341, "6c29f22a4a7385285c6f579ec9f33c5e989f00739d6b257243a0b082ec9447ae"),
}
DEFAULT_SCHEMAS = Path(__file__).resolve().parent.parent / "testdata" / "sbom-schema"
try:
    from jsonschema import Draft7Validator, FormatChecker
    from jsonschema.exceptions import ValidationError
    from referencing import Registry, Resource
    from referencing.exceptions import NoSuchResource
    from referencing.jsonschema import DRAFT7
    DEPENDENCIES_AVAILABLE = True
except ImportError:
    DEPENDENCIES_AVAILABLE = False


class GuardError(ValueError):
    def __init__(self, code: str):
        self.code = code
        super().__init__(code)


def read_regular(file: Path, limit: int = MAX_BYTES) -> bytes:
    try:
        expected = file.lstat()
        if not stat.S_ISREG(expected.st_mode) or stat.S_ISLNK(expected.st_mode):
            raise GuardError("INPUT_NOT_REGULAR")
        if expected.st_size > limit:
            raise GuardError("INPUT_TOO_LARGE")
        fd = os.open(file, os.O_RDONLY | getattr(os, "O_NOFOLLOW", 0))
        with os.fdopen(fd, "rb") as stream:
            actual = os.fstat(stream.fileno())
            if not stat.S_ISREG(actual.st_mode) or (expected.st_dev, expected.st_ino) != (actual.st_dev, actual.st_ino):
                raise GuardError("INPUT_CHANGED")
            raw = stream.read(limit + 1)
        if len(raw) > limit:
            raise GuardError("INPUT_TOO_LARGE")
        return raw
    except GuardError:
        raise
    except OSError:
        raise GuardError("INPUT_UNREADABLE") from None


def parse_json(raw: bytes):
    def pairs(items):
        value = {}
        for key, item in items:
            if key in value:
                raise GuardError("DUPLICATE_JSON_KEY")
            value[key] = item
        return value

    def constant(_value):
        raise GuardError("NONFINITE_JSON_NUMBER")

    def finite(value):
        number = float(value)
        if not math.isfinite(number):
            raise GuardError("NONFINITE_JSON_NUMBER")
        return number

    if len(raw) > MAX_BYTES:
        raise GuardError("INPUT_TOO_LARGE")
    try:
        return json.loads(raw.decode("utf-8"), object_pairs_hook=pairs, parse_constant=constant, parse_float=finite)
    except GuardError:
        raise
    except (UnicodeError, ValueError, RecursionError):
        raise GuardError("INVALID_JSON") from None


def load_schemas(directory: Path = DEFAULT_SCHEMAS):
    schemas = {}
    for filename, (size, digest) in PINS.items():
        raw = read_regular(directory / filename)
        if len(raw) != size or hashlib.sha256(raw).hexdigest() != digest:
            raise GuardError("SCHEMA_PIN_MISMATCH")
        if filename.endswith(".json"):
            schemas[filename] = parse_json(raw)
    return schemas


def schema_fields_and_formats(schemas):
    fields, formats = set(), set()

    def walk(value):
        if isinstance(value, dict):
            if isinstance(value.get("properties"), dict):
                fields.update(value["properties"])
            if isinstance(value.get("format"), str):
                formats.add(value["format"])
            for child in value.values():
                walk(child)
        elif isinstance(value, list):
            for child in value:
                walk(child)

    walk(schemas)
    return fields, formats


@dataclass
class ValidatorBundle:
    validator: object
    registry: object
    known_fields: set
    formats: set


def build_validator(directory: Path = DEFAULT_SCHEMAS, *, format_checker=None) -> ValidatorBundle:
    schemas = load_schemas(directory)
    if not DEPENDENCIES_AVAILABLE:
        raise GuardError("QA_DEPENDENCY_UNAVAILABLE")
    checker = format_checker if format_checker is not None else FormatChecker()
    fields, required_formats = schema_fields_and_formats(schemas)
    if not required_formats.issubset(checker.checkers):
        # jsonschema silently ignores unregistered optional formats. Refuse
        # that weaker result rather than calling a timestamp/URI unchecked PASS.
        raise GuardError("FORMAT_DEPENDENCY_UNAVAILABLE")

    def deny_unregistered(uri):
        raise NoSuchResource(ref=uri)

    registry = Registry(retrieve=deny_unregistered)
    for filename, schema in schemas.items():
        expected = f"http://cyclonedx.org/schema/{filename}"
        if schema.get("$id") != expected:
            raise GuardError("SCHEMA_ID_MISMATCH")
        resource = Resource.from_contents(schema, default_specification=DRAFT7)
        registry = registry.with_resource(expected, resource).with_resource(expected.replace("http:", "https:", 1), resource)
    try:
        for schema in schemas.values():
            Draft7Validator.check_schema(schema)
    except Exception:
        raise GuardError("PINNED_SCHEMA_INVALID") from None
    validator = Draft7Validator(schemas["bom-1.5.schema.json"], registry=registry, format_checker=checker)
    return ValidatorBundle(validator, registry, fields, required_formats)


def safe_pointer(parts, fields: set) -> str:
    values = []
    for part in parts:
        if isinstance(part, int):
            values.append(str(part))
        elif isinstance(part, str) and part in fields:
            values.append(part.replace("~", "~0").replace("/", "~1"))
        else:
            values.append("redacted-key")
    return ("/" + "/".join(values))[:512] if values else ""


def validate_document(document, bundle: ValidatorBundle):
    try:
        bundle.validator.validate(document)
        return []
    except ValidationError as error:
        # Never serialize error.message, instance, value or untrusted property.
        keyword = error.validator if isinstance(error.validator, str) and error.validator.isidentifier() else "schema"
        return [{"pointer": safe_pointer(error.absolute_path, bundle.known_fields), "schemaField": keyword[:64]}]
    except RecursionError:
        raise GuardError("VALIDATION_LIMIT") from None
    except Exception:
        raise GuardError("SCHEMA_RESOLUTION_ERROR") from None


class SafeArgumentParser(argparse.ArgumentParser):
    def error(self, _message):
        print(json.dumps({"status": "ERROR", "code": "USAGE_ERROR"}))
        raise SystemExit(2)


def main(argv=None):
    parser = SafeArgumentParser(description=__doc__)
    parser.add_argument("--schema-dir", type=Path, default=DEFAULT_SCHEMAS, help="Pinned public schemas directory; all four file hashes must match")
    parser.add_argument("files", nargs="+", type=Path, help="One or more CycloneDX1.5 JSON SBOMs")
    args = parser.parse_args(argv)
    try:
        bundle = build_validator(args.schema_dir)
    except GuardError as error:
        print(json.dumps({"status": "ERROR", "code": error.code, "hint": "Use a separate QA environment with jsonschema[format]==4.26.0 and referencing; pinned schemas must be intact."}))
        return 2
    results, status = [], "PASS"
    for index, file in enumerate(args.files, 1):
        try:
            raw = read_regular(file)
            document = parse_json(raw)
            errors = validate_document(document, bundle)
            row = {"input": index, "sha256": hashlib.sha256(raw).hexdigest(), "bytes": len(raw), "status": "FAIL" if errors else "PASS"}
            if errors:
                row["errors"] = errors
                status = "FAIL"
        except GuardError as error:
            row = {"input": index, "status": "ERROR", "code": error.code}
            status = "FAIL"
        results.append(row)
    print(json.dumps({"status": status, "scope": "OFFLINE_SCHEMA_ONLY_NOT_SOURCE_BINDING_OR_SECURITY", "schemaCommit": SCHEMA_COMMIT,
                      "formatsChecked": sorted(bundle.formats), "results": results}, separators=(",", ":")))
    return 0 if status == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
