# Offline CycloneDX schema QA helper — finite worker result

Status: IMPLEMENTED; fixture validation PASS. This does not close TEST-20.13 or prove actual release SBOM/source binding, dependency completeness, vulnerability status, signing, or package readiness.

Owned changes: `scripts/validate-release-sbom.py` and `scripts/test_validate_release_sbom.py` only. No product runtime/build dependency was added; Python/jsonschema are an explicit separate QA requirement. No Node/npm/Go/build/browser/scanner/cluster/network command ran in this task.

## Behavior

The helper validates one or more regular, non-symlink files (each at most 2 MiB), rejects duplicate JSON keys and non-finite numbers, and verifies hardcoded SHA256/size pins for the three official CycloneDX1.5 schemas plus LICENSE. Upstream schema commit is `c320fc0f0b46873864927d9d5684eea7ba439728`; mutable SOURCES.json cannot replace those pins. Draft7Validator plus FormatChecker performs the full pinned schema validation. Only exact HTTP/HTTPS aliases for the three pinned schema IDs enter the registry; unknown references fail closed with no network retrieval. Required optional format validators must be installed or validation returns an explicit setup error. Errors omit instance values/messages/filenames and expose only redacted JSON pointers and schema keywords.

## Attempts (all preserved)

1. `attempt01-result.json`: FAIL, 0 unit tests, setUpClass `FORMAT_DEPENDENCY_UNAVAILABLE`, 0.073110 s. Supervisor accidentally resolved the venv interpreter symlink using Path.resolve(), thereby invoking the global interpreter. `preflight-attempt01.json` records `/Library/Frameworks/Python.framework/Versions/3.13/bin/python3.13`, and its format/freeze evidence contains the global packages. This was a test launcher error, not a validator policy failure. No source or expectation was loosened.
2. `attempt02-result.json`: PASS, 15/15 unit methods, 0 fail/0 skip, unittest 0.035 s; subprocess wall 0.114781 s. The corrected supervisor kept the lexical venv interpreter path. Source hashes are unchanged between attempts and after execution. `qa-environment-attempt02.json` and `qa-freeze-attempt02.txt` identify jsonschema 4.26.0, referencing 0.37.0 and all required date-time/idn-email/iri-reference/uri formats.
3. `normal-python-negative.json`: a separate CLI negative probe, exit 2 with `FORMAT_DEPENDENCY_UNAVAILABLE`, no stderr. This confirms the ordinary Python environment cannot silently report a weaker schema PASS.

The 15 methods cover minimal valid BOM; invalid enum/hash/timestamp/additional property with redacted synthetic marker; valid and invalid SPDX external references; six HTTP/HTTPS schema aliases; unregistered reference with a socket canary not called; duplicate keys; over-2MiB file; NaN/overflow; symlink; schema and license tampering even with forged SOURCES; missing format support; and actual multi-input CLI safe output. No actual release SBOM was passed to this worker.

## Reproduce

```sh
.git/release-audit/sbom-schema-qa-venv/bin/python scripts/test_validate_release_sbom.py -v
.git/release-audit/sbom-schema-qa-venv/bin/python scripts/validate-release-sbom.py PATH_TO_GO_BOM PATH_TO_FRONTEND_BOM
```

Keep the venv interpreter path intact; resolving its symlink bypasses the venv. The QA environment needs `jsonschema[format]==4.26.0` plus its referencing/format dependencies. Missing setup returns exit 2; invalid input returns 1; all inputs schema-valid returns 0. This helper does not launch an app or modify the input BOM/schema files.

## Scope / next owner

Root must independently review the two scripts, run this full schema QA on the actual generated package SBOMs, validate package/source/asset binding and semantic completeness separately, and decide CI/packaging integration. Provider image SBOMs and signing remain distinct. No third-party pentest claim. No Git, ROADMAP, workflow, schema pins file, product source, or another worker file was modified. No process remains running.
