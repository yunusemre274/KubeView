# Workspace JSON parser guard result

PASS for this bounded in-process handler group. Three top-level tests and nine named rejection subtests passed, with zero skips/failures on the approved corrected-fixture run. Go package time is recorded in `attempt02/go-test.jsonl`; outer execution took 2.781s. One initial RED is preserved in `attempt01/` with its exact source and SHA manifest.

The nine original rejects verify malformed JSON400, second JSON value400, future import schema422, nested credential preference422, bogus harbor connection reference422, preference depth beyond10→422, one2097435-byte body400 (above2MiB, below4MiB), non-JSON MIME415 and wrong workspace nonce403. Every rejection checks full Store.Snapshot (including revision), all persisted workspace/backup bytes and directory entries unchanged. The additional duplicate-object request also rejects422 without changes.

The initial200 expectation for repeated preferences was a fixture mistake: Go decoding merges repeated object/map entries, so an earlier credential key survives and production validation safely rejects it. Repeated scalar revision uses the last value. The corrected positive verifies scalar0→current revision, safe preferences and ignored unknown fields accepted200; synthetic credential/authority fields are absent from current and backup files. It retains the original unsafe duplicate-map case as an explicit422 check.

Normal JSON mutation with the real workspace nonce returns200. Registered resource routing returns exactly the allowed namespace/selector Pod UID from three fake fixtures. Valid import returns200, regenerates connection/harbor IDs, remaps the connection reference and destination workspace ID, and clears imported Context/Bound. It does not restore imported authority; the existing bound connection remains intact.

No product files changed. Five read input source files and the test file stayed byte-identical during each run (hashes in execution/result). Absolute Go1.26.11, GOMAXPROCS2, -p1/-parallel1, GOMEMLIMIT1GiB, Go timeout60s and outer90s were used. Peak sampled owned RSS was663.2MiB (limit1536MiB), with>10GiB free disk. No guard fired; owned process group was empty afterward. Existing Go cleanup closes each fixture server and removes private TempDirs. No HTTP listener, real Kubernetes, credentials, browser, release build or broad fuzz run was used.

This supplies negative workspace-parser controls for TEST13.01 and partial JSON coverage for TEST12.03. It does not establish YAML/anchor, all-parser/all-endpoint, fuzz-complete or release security acceptance. The previous111850 Validate→Export fuzz was not rerun; the other worker's Import fuzz is separate evidence.

Source map: `server.go:226` decode; `workspace.go:246` handler/`:460` error status; `store.go:176` Update, `:257` safePreferences, `:299` Validate, `:376` ImportInto. The job finalized at 2026-11-12T21:42:56.435872+00:00 (379.8s of600s; code/test completed by307s).
