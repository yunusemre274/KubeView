# Five open-panel/event pairs: second review

**PASS for this bounded frontend/browser evidence family.** Ten windows completed in940.337 seconds, using the predeclared AB/BA/AB/BA/AB order (three AB, two BA), with30-second warm-up and60-second measurement per window. All ten exited0 and retained all five pairs. No new workload was run during this review.

Independent offline calculations from OS-before/after counters reproduce all ten CPU/RSS cells and all13 metric distributions, signed B−A pair differences and pair percentages in [paired-summary.json](../perf-open-events-five-pairs-root/paired-summary.json). Raw frame intervals, callback/store/draw distributions and counts also match. Each window contains300 distinct events:15 ADD,15 DELETE and270 UPDATE. Matching A/B pairs have identical event sequence/action/UID/version/planned-time tuples. All3,000 planned events were applied and received.

| Metric | A median | B median | Median paired B−A |
|---|---:|---:|---:|
| Browser CPU, cores |0.686613|0.682294|−0.00048472|
| Largest single browser PID RSS, MiB |387.156|396.859|+9.390625|
| Page heap used, MiB |41.340|43.267|−1.916|

CPU paired percentage median is−0.073972%, with pair differences−0.062801..+0.020399 cores. Subtracting the two CPU medians instead gives−0.00431937 cores (−0.629083%); these are different statistics. Neither establishes an optimization. RSS increases in every pair, +4.53125..+22.0625MiB, and the largest process is a renderer in all ten windows. This observation remains open: current evidence establishes neither a cause nor a leak, leak-free state or retained9MiB cache. Used and total JS heap snapshots vary in both directions. RSS here is the maximum across PIDs at the final OS sample, not a time-series peak or unique physical RAM.

Source attribution binds invocation3278451b to frozen frontend A36d5b8f9 and Bf32d6b23, with common backend SHA `9d35acc901bcbe6f8488042dd093a83e8a74c2d62cc77a9ef744f6ed48ee84a8`. Both sets of98 frozen source files, source aggregate hashes, six built assets each, index identities and backend links verify. The six execution-frozen harness files and five additional fixture/probe/build sources still match3278451b.

**PERF-REVIEW-01 was corrected offline.** The original reducer produced null sourceCommit because build provenance lacks that field. Original summary/source remain preserved. The corrected reducer checks frozen side/tag/index/backend/provenance and records sourceCommit separately from invocationCommit. Independently comparing old/new output confirms that all metrics, statistics and other cell content remain unchanged; no measurement was added.

Quality and actual starting state match exactly across all windows: one registered harbor; canonical20 Node/300 Pod; visible8 Node/120 Pod; node-0/worker-001/Özet panel and identical content; camera/FOV38, fleet phase, medium quality, shadows/water/patrol, DPR1 and1440×900 framebuffer. Initial draw footprint is426 calls/71,170 triangles. No FPS cap, adaptive quality, profiler, video, stale state or context loss appears. Per-window browser energy saver was explicitly0. This controlled view does not establish production FOV24 or two-detailed-harbor16/240 equivalence.

All14 accounting snapshots per window preserve PID/birth/parent/command/cohort identity with monotonic CPU counters; clock differences are127.2–139.4ms, within1,000ms. Full-object canonical equality checks against client/upstream/planned state are true in every run. Source canonicalizes all nested fields, rather than only counts; final objects themselves are not retained in raw snapshots, so this is a review of recorded live verdicts and source.

The101 power records stay on battery59–62%, with recorded low-power mode0/settings equal. Disk remains above422GiB; sampled summed browser RSS stays below1,330MiB and backend below51MiB. Preflight records owned lab stopped/workers idle, while ambient user processes remain. Cleanup and later postflight agree:125 captured identities absent, port5192 free, backend unchanged. These are recorded receipts, not a new live probe by this reviewer. Ten gzip files verify against indexed compressed hashes, decompressed hashes and original bytes:5,090,511→306,253 bytes.

Closed-panel/zero-event cells and signed Δpanel remain unmeasured. Full-runtime A/B, V11–18, native Safari/Retina, physical presented FPS/latency, GPU utilization, energy savings and real Kubernetes/provider acceptance remain outside this result. All reviewed input hashes and detailed projections are in result.json. No product, Git/index or roadmap file was written.
