# Frontend STATUS failure merge: second review

Source review PASS for the documented typed protocol, with coverage limits. Root's eight manifest entries verify; current store/scopes/new-test hashes equal GREEN. Original store SHA independently matches2be79c84. RED2fail/1pass and GREEN46pass/0fail/0skip are preserved evidence; no test or UI ran in this review.

The diff copies only failed-scope metadata and forces authoritative=false. Canonical resources/UID references, tombstones/outOfScope, other namespace scope entries and prior state remain unchanged. Explicit context/generation guards run first. Healthy STATUS cannot restore failed scope authority; successful snapshot recovery is covered. Global heartbeat connection flags remain separate from per-resource scope authority.

No material blocker was identified for typed backend scope arrays. Coverage limits: non-array/null scope entries can throw from the new filter; malformed schema is untested. New tests directly cover empty tombstones rather than existing tombstones/outOfScope, wildcard overlaps, missing-generation legacy messages or multiple failed scopes. Source preserves the state fields, but broad parser acceptance is not established.

The root report correctly claims synthetic reducer behavior only. Real browser/RoleBinding/WS E2E, heap erasure, instantaneous revoke, CPU gain and final package acceptance remain outside scope. Backend WIP was ignored; only these review artifacts were written.
