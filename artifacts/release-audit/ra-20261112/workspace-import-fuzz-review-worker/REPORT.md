# Import fuzz evidence second review

PASS within the bounded data-model source/evidence scope; no new execution. Raw Go JSON confirms3 unit top-level tests+9 subtests PASS, zero fail/skip events, packagePASS (0.334s; outer1.157s). The separate fuzz targetPASS took11.01s (package11.273s; outer12.320s), with8/8 baseline seeds,563506 engine executions and17 new interesting inputs (total25).

Engine executions include malformed/parse-rejected inputs; parsed or successful import counts are unknown. Inputs>64KiB explicitly Skip/exclude; absence of top-level skip events does not prove no excluded fuzz input. No large-body guarantee follows.

Independent hashing verified all36 input manifest entries,17 retained corpus sizes/SHAs, six literal seed hashes and two generator-expression hashes. The two generated seed byte streams were not separately captured; source/expressions are pinned. Current new source exactly equals the archived source and both job plans. Both receipts record successful before/after source guards. All four historical source hashes match recomputed current bytes; this permits original-target reuse of the111850 historical Validate/Export result, with no rerun or expanded ImportInto claim.

The tests provide meaningful assertions beyond mirroring append implementation: source byte immutability; unchanged invalid destination; preservation of existing trusted state; imported Context/Bound stripping; fresh IDs and exact reference remapping; configured/user-imported relation provenance; mutation-based source alias detection. The capacity test imports64 valid connections into an existing one, proves the merged document invalid, then exercises actual Store.Update and checks unchanged disk/snapshot/revision/source and reopened state. ImportInto-alone capacity rollback is correctly not claimed.

Validity classification uses production Export/Validate, so shared policy defects remain outside this oracle. It is not a complete imported display-field preservation oracle. Both cleanup receipts mark all captured2/5 owned birth+command identities absent; this is not an exhaustive census of unsampled processes. No blocking source/evidence discrepancy found. No HTTP/YAML, Kubernetes, UI, final binary or blanket fuzz/security acceptance follows. No files outside this review output were modified.

Reviewed source: release_import_fuzz_test.go:31 (invariants),:119 (nine negatives),:150 (positive),:158 (transaction),:192 (fuzz/cap). Review finalized within120s; detailed hashes and machine verdicts are in result.json.
