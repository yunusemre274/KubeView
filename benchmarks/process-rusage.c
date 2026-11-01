// macOS one-shot CPU sampler. No argv/env/command-line or memory collection.
// ri_* CPU counters are Mach ticks on this API; convert via mach_timebase_info.
#include <errno.h>
#include <inttypes.h>
#include <limits.h>
#include <stdio.h>
#include <stdlib.h>
#ifdef __APPLE__
#include <libproc.h>
#include <mach/mach_time.h>
#include <string.h>
#include <sys/resource.h>
#include <time.h>
#define LIMIT 128
static uint64_t ns(uint64_t ticks, mach_timebase_info_data_t tb) {
    return (uint64_t)(((unsigned __int128)ticks * tb.numer) / tb.denom);
}
static int usage(pid_t pid, struct rusage_info_v4 *r) {
    memset(r, 0, sizeof(*r));
    return proc_pid_rusage(pid, RUSAGE_INFO_V4, (rusage_info_t *)r);
}
static int bsd(pid_t pid, struct proc_bsdinfo *b) {
    return proc_pidinfo(pid, PROC_PIDTBSDINFO, 0, b, sizeof(*b)) == sizeof(*b);
}
static int compare(const void *a, const void *b) {
    pid_t x = *(const pid_t *)a, y = *(const pid_t *)b;
    return (x > y) - (x < y);
}
static int failure(pid_t pid, const char *reason) {
    printf("{\"status\":\"error\",\"complete\":false,\"pid\":%d,\"reason\":\"%s\",\"errno\":%d}\n", pid, reason, errno);
    return 2;
}
int main(int argc, char **argv) {
    char *end = NULL; errno = 0;
    long parsed = argc == 2 ? strtol(argv[1], &end, 10) : 0;
    if (argc != 2 || errno || !end || *end || parsed <= 0 || parsed > INT_MAX)
        return failure(0, "one_positive_pid_required");
    pid_t pid = (pid_t)parsed; mach_timebase_info_data_t tb;
    if (mach_timebase_info(&tb) != KERN_SUCCESS || !tb.denom) return failure(pid, "timebase_unavailable");
    for (int attempt = 1; attempt <= 4; attempt++) {
        struct rusage_info_v4 before, after; struct proc_bsdinfo parent;
        pid_t children[LIMIT + 1] = {0}, final[LIMIT + 1] = {0};
        uint64_t live_u = 0, live_s = 0; int missing = 0;
        if (usage(pid, &before)) return failure(pid, "parent_rusage_unavailable");
        int n = proc_listchildpids(pid, children, sizeof(children)); // PID count, not bytes.
        if (n < 0 || n > LIMIT) return failure(pid, "child_list_unavailable_or_over_128");
        qsort(children, n, sizeof(pid_t), compare);
        for (int i = 0; i < n; i++) {
            struct proc_bsdinfo first, last; struct rusage_info_v4 child;
            if (!bsd(children[i], &first) || first.pbi_ppid != (uint32_t)pid || usage(children[i], &child) ||
                !bsd(children[i], &last) || last.pbi_ppid != (uint32_t)pid ||
                first.pbi_start_tvsec != last.pbi_start_tvsec || first.pbi_start_tvusec != last.pbi_start_tvusec) { missing++; continue; }
            live_u += child.ri_user_time; live_s += child.ri_system_time;
        }
        int m = proc_listchildpids(pid, final, sizeof(final));
        if (m < 0 || m > LIMIT) return failure(pid, "final_child_list_unavailable_or_over_128");
        qsort(final, m, sizeof(pid_t), compare);
        if (usage(pid, &after) || !bsd(pid, &parent)) return failure(pid, "parent_disappeared");
        // Reaping between reads would otherwise lose or double-count a short CLI.
        if (missing || n != m || memcmp(children, final, n * sizeof(pid_t)) ||
            before.ri_proc_start_abstime != after.ri_proc_start_abstime ||
            before.ri_child_user_time != after.ri_child_user_time || before.ri_child_system_time != after.ri_child_system_time) continue;
        uint64_t ou = ns(after.ri_user_time, tb), os = ns(after.ri_system_time, tb);
        uint64_t ru = ns(after.ri_child_user_time, tb), rs = ns(after.ri_child_system_time, tb);
        uint64_t lu = ns(live_u, tb), ls = ns(live_s, tb), collector = ru + rs + lu + ls;
        struct timespec now; clock_gettime(CLOCK_MONOTONIC, &now);
        printf("{\"status\":\"ok\",\"complete\":true,\"pid\":%d,\"birthStartTimeUs\":%" PRIu64 ",\"birthStartAbstime\":%" PRIu64 ","
            "\"sampleMonotonicNs\":%" PRIu64 ",\"timebaseNumer\":%u,\"timebaseDenom\":%u,\"attempts\":%d,\"childLimit\":128,\"liveChildren\":%d,\"liveDepth\":1,"
            "\"ownUserNs\":%" PRIu64 ",\"ownSystemNs\":%" PRIu64 ",\"ownCpuNs\":%" PRIu64 ",\"reapedChildUserNs\":%" PRIu64 ",\"reapedChildSystemNs\":%" PRIu64 ","
            "\"liveChildUserNs\":%" PRIu64 ",\"liveChildSystemNs\":%" PRIu64 ",\"collectorCpuNs\":%" PRIu64 ",\"totalFamilyCpuNs\":%" PRIu64 "}\n",
            pid, parent.pbi_start_tvsec * 1000000 + parent.pbi_start_tvusec, after.ri_proc_start_abstime,
            (uint64_t)now.tv_sec * 1000000000 + now.tv_nsec, tb.numer, tb.denom, attempt, n, ou, os, ou + os, ru, rs, lu, ls, collector, ou + os + collector);
        return 0;
    }
    return failure(pid, "unstable_reap_or_child_identity_after_4_attempts");
}
#else
int main(void) {
    puts("{\"status\":\"N/A\",\"complete\":false,\"reason\":\"macOS_libproc_required\"}");
    return 0;
}
#endif
