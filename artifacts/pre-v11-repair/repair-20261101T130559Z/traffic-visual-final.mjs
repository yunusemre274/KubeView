// REAL Hubble UI/window proof. The old protocol-vs-transport failed evidence is
// preserved. No Pod/Node/CNP creation/deletion or provider restart in this job.
import fs from "node:fs/promises";
import assert from "node:assert/strict";
import { launch, dir, ns, runtime, get, kubectl, poll, sleep } from "./repair-ui.mjs";
const prefix = "traffic-visual-final", output = `${dir}/${prefix}.json`;
await fs.writeFile(output, "{}", { flag: "wx" });
const fixtureRecord = JSON.parse(await fs.readFile(`${dir}/traffic-fixtures-final.json`, "utf8"));
assert.equal(fixtureRecord.clusterUID, runtime.clusterUID);
const fixtures = [];
for (const expected of fixtureRecord.fixtures) {
 const pod = await get("pod", expected.name); assert.equal(pod.metadata.uid, expected.uid); assert.equal(pod.status.podIP, expected.ip); assert.equal(pod.spec.nodeName, expected.nodeName);
 assert(pod.status.conditions.some((c) => c.type === "Ready" && c.status === "True")); fixtures.push({ ...expected });
}
const client = fixtures.find((f) => f.name === "flow-client"), same = fixtures.find((f) => f.name === "flow-same"), cross = fixtures.find((f) => f.name === "flow-cross");
assert.equal(client.nodeName, same.nodeName); assert.notEqual(client.uid, same.uid); assert.notEqual(client.nodeName, cross.nodeName); assert.notEqual(client.uid, cross.uid);
const ui = await launch(prefix), { page, result } = ui; result.fixtures = fixtures; result.source = "REAL owned distinct same-Node/cross-Node Pod HTTP clients → actual Hubble mTLS provider → API scoped window → normal 3D arrow and semantic network FlowList UI"; result.phases = []; result.providerSnapshots = []; result.actions = []; result.limits = ["Flow-event counts are not packets/bytes/bandwidth", "JS submit/render diagnostics are not presented FPS", "This job does not test provider disconnect or DNS; root has separate jobs"];
let latest, producing = null;
const known = (flow) => [same.uid, cross.uid].some((target) => flow.source?.uid === client.uid && flow.destination?.uid === target || flow.destination?.uid === client.uid && flow.source?.uid === target);
const rows = (snapshot = latest) => (snapshot?.flows || []).filter(known);
page.on("response", async (response) => {
 if (response.request().method() !== "GET" || !response.url().includes("/api/flows")) return;
 try { const body = await response.json(); latest = body; const render = await page.locator("canvas").evaluate((c) => c.__harbor.stats().measuredTraffic); result.providerSnapshots.push({ at: new Date().toISOString(), ...body, render }); } catch {}
});
async function producer(rate, seconds) {
 const attempts = rate * seconds;
 const script = 'i=0; while [ "$i" -lt "$5" ]; do a=$(wget -q -T 2 -O - "http://$1:8080/") || exit 31; test "$a" = "$2" || exit 32; b=$(wget -q -T 2 -O - "http://$3:8080/") || exit 33; test "$b" = "$4" || exit 34; i=$((i+1)); sleep "$6"; done; printf "completed_pairs=%s same_success=%s cross_success=%s\\n" "$i" "$i" "$i"';
 return kubectl(["exec", "-n", ns, client.name, "-c", "app", "--", "sh", "-c", script, "kv-owned-http", same.ip, same.name, cross.ip, cross.name, String(attempts), String(1 / rate)]);
}
async function phase(name, rate, seconds) {
 const before = result.providerSnapshots.length, start = new Date().toISOString();
 if (rate) producing = producer(rate, seconds);
 await sleep(seconds * 1000); const producerOutput = producing ? await producing : null; producing = null;
 const producerCompletedAt = new Date().toISOString(); await sleep(1000);
 const samples = result.providerSnapshots.slice(before).map((s) => ({ at: s.at, status: s.status, observedAt: s.observedAt, updatedAt: s.updatedAt, knownGroups: rows(s).length, knownEvents: rows(s).reduce((n, f) => n + (f.eventCount || 0), 0), perTarget: [same, cross].map((target) => ({ targetUID: target.uid, events: rows(s).filter((f) => f.source?.uid === target.uid || f.destination?.uid === target.uid).reduce((n, f) => n + (f.eventCount || 0), 0) })), render: s.render }));
 const record = { name, start, end: new Date().toISOString(), ratePairsPerSecond: rate, plannedPairs: rate * seconds, producerOutput, producerCompletedAt, samples }; result.phases.push(record); await ui.capture(name); await ui.save(); return record;
}
async function checkDialog(flow, origin) {
 const dialog = page.getByRole("dialog", { name: "Ölçülmüş ağ akışı", exact: true }); await dialog.waitFor({ timeout: 1500 });
 const text = await dialog.innerText();
 assert(text.includes(flow.source.uid) && text.includes(flow.destination.uid), "Flow detail endpoint UID pair differs from selected flow");
 result.actions.push({ at: new Date().toISOString(), origin, id: flow.id, sourceUID: flow.source.uid, destinationUID: flow.destination.uid, protocol: flow.protocol, transportProtocol: flow.transportProtocol, panel: text });
 await ui.capture(`${origin}-exact-endpoints`); await dialog.getByRole("button", { name: "Pencereyi kapat", exact: true }).click();
}
try {
 await ui.start(); await page.getByRole("button", { name: "Görünüm ve ayarlar", exact: true }).click(); await page.getByLabel("Ölçülmüş trafik — Hubble", { exact: true }).check(); await ui.close();
 await poll(() => latest?.status === "live", 20000); result.initialKnownFlows = rows().length;
 const low = await phase("known-same-cross-low", 1, 8); const high = await phase("known-same-cross-high", 5, 8);
 assert(/completed_pairs=8/.test(low.producerOutput)); assert(/completed_pairs=40/.test(high.producerOutput));
 const knownRows = rows(); result.verifiedPairs = knownRows;
 for (const target of [same, cross]) {
  const targetFlows = knownRows.filter((f) => f.source.uid === target.uid || f.destination.uid === target.uid); assert(targetFlows.length, `No measured ${target.name} traffic`);
  assert(targetFlows.some((f) => f.transportProtocol === "TCP"), "Known TCP transport absent");
 }
 for (const flow of knownRows) if (flow.protocol === "HTTP") assert(flow.httpProtocol != null || flow.httpCode != null, "HTTP claim lacks real HTTP observation fields");
 result.protocols = [...new Set(knownRows.map((f) => `${f.protocol}/${f.transportProtocol}`))];
 result.windowIncrease = { lowMax: Math.max(0, ...low.samples.map((s) => s.knownEvents)), highMax: Math.max(0, ...high.samples.map((s) => s.knownEvents)) };
 assert(result.windowIncrease.highMax > result.windowIncrease.lowMax, "Measured known event window did not react to increased requests");
 // Fresh read-only projected arrow hit tests, bounded eight tries; all clicks
 // are real R3F pointer events, with exact endpoint UID validation afterwards.
 let physical;
 for (let attempt = 0; attempt < 8 && !physical; attempt++) {
  const map = new Map(rows().map((f) => [f.id, f]));
  const targets = await page.locator("canvas").evaluate((c) => c.__harbor.projectTargets({ type: "measured-flow" }));
  const target = targets.find((t) => t.visible && map.has(t.uid));
  if (!target) { if (attempt === 3) { await ui.find(client.name, "Pod"); await page.getByRole("button", { name: "Sahnede göster", exact: true }).click(); } await sleep(100); continue; }
  await page.mouse.click(target.x, target.y);
  if (await page.getByRole("dialog", { name: "Ölçülmüş ağ akışı", exact: true }).count()) { physical = map.get(target.uid); await checkDialog(physical, "actual-3d-arrow"); }
  else await sleep(100);
 }
 assert(physical, "No actual known flow arrow could be selected in bounded pointer attempts");
 await page.getByRole("button", { name: "Limana dön", exact: true }).click(); await ui.world({ type: "facility", id: "network" }); await page.getByRole("button", { name: "Ölçülmüş trafik", exact: true }).click();
 await page.getByLabel("Ölçülmüş akışlarda ara", { exact: true }).fill(cross.uid);
 const button = page.locator(".measured-flow-list tbody tr").getByRole("button", { name: /Akışı incele:/ }).first(); await button.waitFor({ timeout: 2500 });
 const label = await button.getAttribute("aria-label");
 const candidate = rows().find((f) => label.includes(f.source.uid) && label.includes(f.destination.uid) && (f.source.uid === cross.uid || f.destination.uid === cross.uid)); assert(candidate, "Semantic record is not the known cross-Node pair");
 await button.focus(); await page.keyboard.press("Enter"); await checkDialog(candidate, "semantic-list-enter");
 assert.equal(await page.getByLabel("Ölçülmüş akışlarda ara", { exact: true }).inputValue(), cross.uid); await ui.close();
 result.trafficStoppedAt = high.producerCompletedAt; await phase("stopped-known-flows-expired", 0, 12);
 const remaining = rows().filter((f) => Date.parse(f.lastObserved) > Date.now() - 10000); assert.equal(remaining.length, 0, "Known stopped traffic remains in live10s window");
 result.finalKnownFlows = remaining.length; result.finalRender = await page.locator("canvas").evaluate((c) => c.__harbor.stats().measuredTraffic); result.status = "PASSED";
} catch (error) { result.status = "FAILED"; result.error = error.stack; await ui.capture("failed").catch(() => {}); }
finally { if (producing) await producing.catch(() => {}); result.endedAt = new Date().toISOString(); await ui.finish(); }
console.log(JSON.stringify({ status: result.status, error: result.error?.split("\n")[0], protocols: result.protocols, increase: result.windowIncrease, selected: result.actions.map((a) => a.origin), finalKnownFlows: result.finalKnownFlows, pageErrors: result.errors, evidence: output }));
if (result.status !== "PASSED") process.exitCode = 1;
