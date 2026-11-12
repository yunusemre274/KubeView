PASS — independent offline numeric review only

All40 windows /10 stopped jobs /5 complete paired blocks are included in their predeclared AB,BA,AB,BA,AB order (ABBAABBAAB). Four conditions per build/block are complete, unique and in the planned alternating condition order. No CPU-based filtering or replacement was used. The root reduce.mjs and balanced-summary.json were read, not executed or overwritten.

For every window I independently joined before/after process counters by PID, PPID, OS birth/source, executable, cohort and role, summed CPU-second differences for all browser, renderer, GPU-process, browser-main and backend roles, and divided by actual OS timestamp span in seconds. Denominators span 60.156…60.206 s; nominal60 s and browser-active time were not substituted. All 480 recorded interior samples passed existing tested coverage and a separate identity/counter/time-transition check. Maximum OS/browser clock difference was 136.100 ms, below1000 ms. Observed0 CPU remains0; unknown/missing CPU and zero-event latencies are not invented as0.

Independently recomputed every cell metric, all4condition×13metric distribution/pair rows, all signed within-build open-minus-closed rows, paired B−A differences of those deltas, and every existing comparator table and process-sample CPU/clock field. Total 4786 numeric leaves matched; maximum absolute arithmetic difference 3.55e-14 under the explicit1e-11 relative/absolute scale tolerance. n5 median is the middle observed value; p95/p99 use the existing discrete floor(q*n) rank and equal the sample maximum at n5. Per-window percentile fields were aggregated, not pooled into a population percentile.

Producer planned/applied/received values are exactly0 in20 no-event cells and300 in20 event cells, for6000 total events. Every producer validity, complete canonical consistency and validator canonical verdict passed. No-event producer delay/apply and callback/store/draw-proxy distributions retain n0/null. Canonical object payload sets are not present in these summary artifacts; this independently checks the recorded full-signature guard verdicts and their source, not a new payload-level canonical reconciliation.

Within-build signed browser Δpanel medians (cores):
- No events: A 0.011388775; B 0.003702491. Paired B−A delta median -0.001524362, range -0.016224895…+0.017887670.
- Events: A 0.010467203; B 0.044198528. Paired B−A delta median +0.013224806, range -0.010735054…+0.135489586.

The event paired-difference median +.013225 is the median of the five matched differences; it is not the difference of the two medians (.044199−.010467). Signed negative deltas remain retained. Browser total comparisons are mixed:
- panel-closed: paired B−A median +0.4462% (range -3.6426% … +12.4305%).
- panel-open: paired B−A median -0.8012% (range -2.8849% … +10.1640%).
- panel-closed-events: paired B−A median -4.1644% (range -10.3166% … +1.0014%).
- panel-open-events: paired B−A median -1.1472% (range -2.1366% … +11.0725%).

Reducer-source review: the reducer consumes all ten predeclared jobs, binds frozen build provenance/commonbackend identity and input hashes, uses matching block IDs, preserves signed deltas, and guards finite values/zero percent denominators. Existing panel-compare supplied its first reduction; this review used fresh independent CPU arithmetic and independent rank/delta calculations. Tested processCoverage was reused only for guard verification. All recorded evidence/source hashes still match after review.

RSS remains OPEN. End-of-window largest-single-browser RSS, backend RSS and JS heap numeric rows match the raw inputs, but this review neither explains the memory mechanism nor waives leak/noise/acceptance questions. GPU-process CPU is not GPU utilization. Backend CPU includes the synthetic tracker/producer. OS birth granularity is1second and processes living wholly between snapshots remain unobservable. No-event absence means unknown/not-applicable latency, not0 latency.

Scope is frozen frontend A36d/Bf32 with commonbackend9d, synthetic M20/300/detailed8/120, medium/DPR1/1440×900/FOV38. This does not accept full runtime, real Kubernetes/provider, energy, physical-screen/FPS or continuous soak behavior. Natural panel open/closed differences include scene/label/compositing changes; their cause is not assigned exclusively to panel occlusion. Cleanup is checked from the stopped execution receipt (247 identity refs absent/portfree), not by starting a new runtime probe.

No agents, app/browser, build, tests, cluster, Git/index or ROADMAP edits. One Node offline review process; lightweight report finalization only. All writes are in this new review directory. Started2026-11-12T19:46:46Z; finalized2026-11-12T19:50:24.301566+00:00; 218.3/300 seconds. Verdict PASS_NUMERIC_REVIEW_ONLY; zero numeric/guard failures.

Final explicit validator-object check: all40 recorded consistency objects matched both true canonical booleans, expected0/300 count and valid/complete coverage. All finalization completed 2026-11-12T19:51:32.573455+00:00, 286.6/300 seconds.
