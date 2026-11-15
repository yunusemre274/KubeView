# Submitted-work comparator guard — BENCH-RENDER-001

**Harness fix verified; no product or benchmark runtime change.** comparePanels now reviews the same block/scenario pair's before/after calls, triangles, lines and points, plus summary calls/triangles p50/p95/p99/min/max. Sample n must be positive; unequal frame totals do not trigger a mismatch. Missing/nonfinite metadata yields UNKNOWN, preserving null instead of inventing zero.

Differing submitted counters produce REQUIRES_RENDER_EQUIVALENCE_REVIEW and stop automatic comparable=true acceptance. Unknown data also fails automatic eligibility. Numeric table, signed deltas, process samples and input identities are still computed and retained. This is a request for external semantic/visual review: legitimate batching changes do not receive an automatic regression or quality verdict. Matching counters prove only this guard's scope.

Renderer geometry/texture inventory is reported separately. Allocation-only differences remain observations and do not establish extra active work, retained JS or a leak. They do not independently prevent matched-counter eligibility.

After root GO, RED against the preserved original comparator produced5 passes/7 expected failures, including old true!==false acceptance of extra submitted work and missing metadata. The original negative-delta/positive fixture test remains; it was extended with finite real counter shapes. The corrected targeted panel suite and justified metrics/generic-comparator neighbors passed49/49, skip0, in0.797 seconds. No dependencies or tooling were installed.

A separate offline read of the immutable40-cell family reproduced original comparable=true, then corrected comparable=false/REQUIRES_RENDER_EQUIVALENCE_REVIEW. The known p3-B open-events426→427 calls and60→72 lines are explicitly detected. All table/delta/sample/input JSON values equal the original result. All178 captured historical files remain byte-identical. Only new output files were written; no old family summary/reducer was rerun in place and no performance window was repeated.

Source-before/after hashes, exact diff, RED/GREEN outputs and commands, offline script and both comparator outputs are preserved here. Remaining RSS/event-delta variance and the physical source of the historical extra draw remain open. No full-runtime, V11–18, native Safari/Retina, energy, physical presentation or continuous-soak acceptance follows.
