CAT13.01/13.10 bounded correctness evidence, source `49999815cf27ca47888fdc5d62cb1f7caf3bbd11`. The root's global-camera UI changes were not edited or included in the isolated reducer copy. No production source changed; all copied frontend and reviewed workspace Go source hashes were checked again at completion.

The existing `FuzzWorkspaceDocument` passed with Go 1.26.11, GOMAXPROCS=2, `go test -p=1 -parallel=1 -run '^$' -fuzz '^FuzzWorkspaceDocument$' -fuzztime=10s -timeout=60s ./pkg/workspace`. Outer bound was 90 seconds; no timeout occurred. Total command time was 42.924 seconds including instrumented compilation, with the package reporting 11.269 seconds. No separate build command was run.

Three source seeds cover valid-document, future-schema and unsafe-preference inputs. Go logged 68 baseline coverage inputs, consistent with those three seeds plus 65 pre-existing cache corpus entries. The after-run cache inventory confirms 65 files with mtimes preceding this run and 50 new files. Fuzzing used one worker, executed 111,850 cases and reported 50 new interesting inputs (118 total including seeds). There was no repository testdata corpus and no failing corpus was created. `fuzz-corpus-manifest.json` records corpus entry names, hashes, sizes and mtimes without copying payloads.

The fuzz property checks that documents accepted by Validate remain valid after Export and that exported connections have empty Context and Bound=false. Inputs above 2 MiB skip. Invalid-input seeds do not independently assert rejection; this is not broad validation/security fuzz coverage or a long fuzz campaign.

Native Node tests then ran serially in four isolated copies under `.git/release-audit/fuzz-mutation-49999815`, each containing only the existing resourceStore.js, resourceScopes.js and store.test.js plus a module-mode package declaration. No node_modules, dependency installation, transpilation or mutation framework was required. Each run used `node --test --test-concurrency=1 tests/store.test.js` with a 30-second bound.

| Case | Result | Meaning |
|---|---|---|
| Unmodified isolated baseline | 17 PASS / 0 FAIL | Existing test file works in the isolated copy. |
| Disable generation mismatch rejection | 15 PASS / 2 assertion FAIL | Existing generation/session and cross-scope tests reject accepting an old generation event. |
| DELETE by address instead of UID | 14 PASS / 3 assertion FAIL | Existing same-name recreation, delayed old DELETE and deletion-cache tests reject removal of the replacement UID. |
| Equivalent constant expression, 1000→10 ** 3 | 17 PASS / 0 FAIL | Equivalent control; not counted as a surviving behavioral mutant. |

Both behavioral mutants were killed by ERR_ASSERTION failures, not syntax/load errors. The generation mutant failed `generation rejects previous session messages and resync removes vanished resources` and `namespace/GVR authority and connection identity do not leak across scopes or contexts`. The deletion mutant failed `same-name recreation, delayed DELETE, and opaque resourceVersion remain safe`, the corresponding custom-resource recreation test, and `scope and tombstone identities stay stable on unrelated normal updates; deletion cache is bounded`.

`mutations.patch` and mutation-source-manifest.json preserve exact edits and source identity. Raw logs and command manifests retain test names, exit codes, timeouts and durations. `mutation-results.json` explicitly separates two non-equivalent killed mutants from the equivalent control. This proves sensitivity of these existing assertions to two selected wrong behaviors; no repository-wide mutation score, UI correctness or cluster evidence is claimed. No production bug was found and no production fix was written.
