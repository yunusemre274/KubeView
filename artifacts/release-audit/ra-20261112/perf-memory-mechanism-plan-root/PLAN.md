# Bounded follow-up: renderer RSS mechanism

PLANNED, NOT RUN. Created while the balanced CPU matrix is running; no profiler,
application, browser, worker, build, scan or Kubernetes process is started here.

## Question and existing observation

The earlier open-only five-pair family reports B minus A largest browser process
end RSS positive in all five pairs: median +9.390625 MiB, range +4.53125 to
+22.0625 MiB. Those processes are renderers. Page JS used/total heap signs differ.
This is neither a retained-heap measurement nor evidence of a leak, harmless
noise, a nine-megabyte cache, or total physical application RAM.

First finish and preserve the independent balanced forty-cell matrix. Use its
RSS/heap results as additional observations without pooling unequal scenarios.
No decision based on intermediate CPU values and no automatic extra repeats.

## Source hypotheses, not findings

Frozen A36d and Bf32 differ in five runtime frontend files. New label positioning
in `ResourceLabel`/`resourceLabelPosition` computes transient arrays and closures;
selected/hovered labels also inspect a bounded nameplate set. Cached dimensions
are read on mount/content/viewport changes, not in that frame calculation.
`sceneNameplates` uses a WeakMap per scene and explicit entry cleanup. These facts
alone establish neither dominant allocation cost nor retained-object growth.

Node/Pod Html labels already exist in A. Inspect actual DOM counts, visible
labels, layout/paint and retained objects before attributing RSS to label code.
Source scope/selection guards are correctness boundaries and must not be removed
to reduce a benchmark number. GPU geometry counts do not measure raster memory.

## Finite diagnostic order after CPU isolation ends

1. Recheck completed matrix, exact source/assets/common backend, port5192 free,
   captured process cleanup and power. Never run this concurrently with CPU work.
2. Existing runner `--profile-alloc`, one A and one B Node0-summary/open-events
   window with 30-second warmup and 15-second sample. Use the same M20/300,
   detailed8/120, medium, DPR1,1440x900,FOV38, water/patrol/shadows and input/phase
   lock. Profile is explicitly diagnostic, not a normal CPU comparison.
3. The installed runner requests V8 allocation sampling at32768 bytes and includes
   objects collected by major/minor GC. Therefore sampled allocation totals are
   estimates of churn, not retained heap or precise all-allocation totals.
4. Review sampled self-allocation call paths and map hot minified locations to
   each exact frozen asset. Do not rebuild sources with different optimizations
   and present them as these exact assets. Preserve raw trace and source hashes.
5. Only if allocation leaves the RSS question open, use a separate diagnostic
   capture of DOM/node/listener counts, heap usage and explicit-GC checkpoints
   on both sides. Forced GC remains outside normal CPU/latency runs. State the
   before/after phase and retained data quantity. Native RSS cannot be explained
   solely by JS heap; keep native/raster distinctions unresolved if unmeasured.
6. A CPU or frame timeline is allowed only to answer a specific hot-path question
   raised by those samples. At most one A/B pair per selected profiler initially;
   do not sweep all profilers. Never call the trace share total machine CPU.

Each initial allocation job has a two-minute wall budget including cleanup,
zero automatic retries, app2GiB/browser-summed6GiB/disk10GiB safety limits,
exact owned PID birth/executable cleanup and port-free verification. Keep power
conditions recorded. No provider/lab installation, product mutation or old
unsafe long-log baseline. Hardware energy and native Safari are not inferred.

## Candidate decision

Implement a small product candidate only after a meaningful unnecessary cost is
identified. Preserve label visibility/placement, Soft UI, canonical freshness,
UID scope and all scene quality/motion settings. Profile samples alone do not
prove total CPU savings. An accepted product change needs the relevant balanced
normal-production comparison and functional/visual regression evidence. Reject
or revert an unhelpful candidate without touching user changes. No technology
migration is justified by the present observation alone.

Root owns Git/ROADMAP and final decision. A reviewer may independently inspect
the finite diagnostic after the CPU family stops. CAT17 and long stability gates
remain open until the relevant work actually completes.
