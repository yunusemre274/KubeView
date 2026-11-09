import { test, expect } from "./v11-fixtures.js";
import { getOwned, assertOwned, guardScope, resourcePath, cleanupOwned, patchOwnedAnnotation } from "./v11-lab.mjs";
import { chooseScope, enableManagement, findResource, applyAction, confirmDelete, submitActionForm } from "./v11-ui.helpers.js";

test("V11-09 V11-10 owned workload recovery continues resources/restart/replacement/delete after passed create+scale", async ({ page, lab, evidence }, info) => {
  test.skip(info.project.name !== "chromium" || !lab.recoveryDeployment || !lab.recoveryUID,
    "Only an explicitly recorded owned failed-attempt Deployment may be continued");
  test.setTimeout(300000);
  const slot = lab.slots.A, name = lab.recoveryDeployment, uid = lab.recoveryUID;
  const watchedPodAnnotations = new Map();
  page.on("websocket", (socket) => {
    if (new URL(socket.url()).pathname !== "/ws") return;
    socket.on("framereceived", ({ payload }) => {
      try {
        const message = JSON.parse(String(payload)), pod = message.object;
        if (message.type === "RESOURCE_EVENT" && pod?.kind === "Pod" && pod.metadata?.namespace === slot.namespace)
          watchedPodAnnotations.set(pod.metadata.uid, pod.metadata.annotations?.["kubeview.io/v11-draft-watch"]);
      } catch { /* Ignore non-resource frames; never record resource bodies. */ }
    });
  });
  const objectPath = (kind, name) => lab.baseURL + resourcePath(slot, { kind, metadata: { name } });
  const get = async () => { const response = await page.request.get(objectPath("Deployment", name)); expect(response.status()).toBe(200); return response.json(); };
  const pods = async () => {
    const query = new URLSearchParams({ context: slot.context, namespace: slot.namespace, version: "v1", resource: "pods" });
    const response = await page.request.get(`${lab.baseURL}/api/resources?${query}`); expect(response.status()).toBe(200);
    return (await response.json()).items.filter((pod) => pod.metadata.labels?.app === name);
  };
  const ready = async () => {
    await expect.poll(async () => { const value = await get(); return value.metadata.uid === uid && value.spec.replicas === 1 &&
      value.status?.observedGeneration >= value.metadata.generation && value.status?.updatedReplicas === 1 && value.status?.readyReplicas === 1 &&
      (value.status?.unavailableReplicas || 0) === 0; }, { timeout: 90000 }).toBe(true);
    return get();
  };
  let object = assertOwned(lab, slot, await getOwned(lab, slot, "Deployment", name), uid), primaryError;
  try {
    await page.goto(lab.baseURL); await chooseScope(page, slot.context, slot.namespace); await enableManagement(page);
    await findResource(page, "Deployment", name, uid);
    const targetRoute = (url) => url.pathname === "/api/resources" && url.searchParams.get("resource") === "deployments" && url.searchParams.get("name") === name;
    // Header close and ESC must remain usable while the actual initial GET is
    // held. Each form is discarded before the next independent GET is opened.
    for (const closeMethod of ["header", "Escape"]) {
      let release, fetched, completed, holding = true;
      const released = new Promise((resolve) => { release = resolve; });
      const actual = new Promise((resolve) => { fetched = resolve; });
      const done = new Promise((resolve) => { completed = resolve; });
      const handler = async (route) => {
        if (!holding || route.request().method() !== "GET") return route.continue();
        holding = false;
        try {
          const response = await route.fetch(); fetched(response.status()); await released;
          try { await route.fulfill({ response }); } catch { /* Form close aborts the browser request. */ }
        } finally { completed(); }
      };
      await page.route(targetRoute, handler);
      try {
        await page.locator(".resource-details").getByRole("button", { name: "CPU / RAM", exact: true }).click();
        expect(await actual).toBe(200);
        const heldForm = page.locator(".resource-form-dialog");
        await expect(heldForm.locator("fieldset.form-dialog-body")).toHaveAttribute("disabled", "");
        await expect(heldForm.locator("fieldset.form-dialog-body")).toHaveAttribute("aria-busy", "true");
        await expect(heldForm.getByLabel("CPU request", { exact: false }).first()).toBeDisabled();
        await expect(heldForm.getByRole("button", { name: "Formu kapat", exact: true })).toBeEnabled();
        if (closeMethod === "header") await heldForm.getByRole("button", { name: "Formu kapat", exact: true }).click();
        else await page.keyboard.press("Escape");
        await expect(heldForm).toHaveCount(0);
        evidence.check(`Held actual initial GET allows ${closeMethod} close`);
      } finally { release(); await done; await page.unroute(targetRoute, handler); }
    }
    // Delay only the real Go API response; no resource data is invented or edited.
    let releaseInitialGET, markRealResponse, held = true;
    const released = new Promise((resolve) => { releaseInitialGET = resolve; });
    const actualGET = new Promise((resolve) => { markRealResponse = resolve; });
    await page.route(targetRoute, async (route) => {
      if (!held || route.request().method() !== "GET") return route.continue();
      held = false;
      const response = await route.fetch();
      markRealResponse(response.status());
      await released;
      await route.fulfill({ response });
    });
    const initialResponse = page.waitForResponse((response) => targetRoute(new URL(response.url())) && response.request().method() === "GET");
    await page.locator(".resource-details").getByRole("button", { name: "CPU / RAM", exact: true }).click();
    expect(await actualGET, "The held initial GET must come from the actual production Go API").toBe(200);
    const form = page.locator(".resource-form-dialog");
    try {
      await expect(form.getByText("Kaynağın güncel sürümü alınıyor…", { exact: true })).toBeVisible();
      for (const label of ["CPU request", "CPU limit", "Bellek request", "Bellek limit"])
        await expect(form.getByLabel(label, { exact: false }).first()).toBeDisabled();
      await expect(form.getByRole("button", { name: "Server dry-run", exact: true })).toBeDisabled();
      evidence.check("Actual delayed initial GET keeps editable fields and dry-run disabled");
      await evidence.capture("initial-real-get-held-fields-disabled");
    } finally { releaseInitialGET(); }
    expect((await initialResponse).status()).toBe(200);
    await expect(form.getByText("Kaynağın güncel sürümü alınıyor…", { exact: true })).toHaveCount(0);
    await page.unroute(targetRoute);
    const beforeDryRun = await get();
    await submitActionForm(page, async (form) => {
      for (const [label, value] of [["CPU request", "20m"], ["CPU limit", "150m"], ["Bellek request", "24Mi"], ["Bellek limit", "96Mi"]]) {
        const input = form.getByLabel(label, { exact: false }).first(); await input.fill(value); await expect(input).toHaveValue(value);
      }
      for (const [label, value] of [["CPU request", "20m"], ["CPU limit", "150m"], ["Bellek request", "24Mi"], ["Bellek limit", "96Mi"]])
        await expect(form.getByLabel(label, { exact: false }).first()).toHaveValue(value);
      const livePod = (await pods()).find((pod) => !pod.metadata.deletionTimestamp);
      expect(livePod).toBeTruthy();
      const marker = `watch-${Date.now().toString(36)}`;
      const patched = await patchOwnedAnnotation(lab, slot, "Pod", livePod.metadata.name, livePod.metadata.uid,
        "kubeview.io/v11-draft-watch", marker);
      await expect.poll(() => watchedPodAnnotations.get(livePod.metadata.uid), {
        message: "The actual scoped Pod watch must publish the UID-guarded metadata update" }).toBe(marker);
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      for (const [label, value] of [["CPU request", "20m"], ["CPU limit", "150m"], ["Bellek request", "24Mi"], ["Bellek limit", "96Mi"]])
        await expect(form.getByLabel(label, { exact: false }).first()).toHaveValue(value);
      evidence.check("Four dirty quantities survive a real same-UID owned Pod watch update", {
        podUID: patched.metadata.uid, podResourceVersion: patched.metadata.resourceVersion });
    }, { dryRun: true, onPreview: async () => {
      const afterDryRun = await get();
      expect(afterDryRun.spec.template.spec.containers[0].resources || {}).toEqual(beforeDryRun.spec.template.spec.containers[0].resources || {});
      evidence.check("Real resources dry-run did not change the stored workload template");
    } });
    object = await ready();
    expect(object.spec.template.spec.containers[0].resources).toEqual({ requests: { cpu: "20m", memory: "24Mi" }, limits: { cpu: "150m", memory: "96Mi" } });
    expect(object.metadata.labels["kubeview.io/v11-preserve"]).toBe("keep");
    expect(object.spec.template.metadata.annotations["kubeview.io/v11-preserve"]).toBe("keep");
    evidence.check("Normal loaded form resource edit reached Ready and preserved unrelated metadata", { uid });
    const before = (await pods()).filter((pod) => !pod.metadata.deletionTimestamp);
    await findResource(page, "Deployment", name, uid); assertOwned(lab, slot, await getOwned(lab, slot, "Deployment", name), uid);
    await applyAction(page, "Rollout restart"); object = await ready();
    await expect.poll(async () => { const live = (await pods()).filter((pod) => !pod.metadata.deletionTimestamp);
      return live.length === 1 && !before.some((old) => old.metadata.uid === live[0].metadata.uid) &&
        live[0].status.conditions?.some((condition) => condition.type === "Ready" && condition.status === "True"); }, { timeout: 90000 }).toBe(true);
    const restarted = (await pods()).filter((pod) => !pod.metadata.deletionTimestamp)[0];
    expect(restarted.metadata.ownerReferences[0].uid).not.toBe(before[0].metadata.ownerReferences[0].uid);
    evidence.check("Restart reached new ReplicaSet and non-terminating Ready Pod UID", { oldUID: before[0].metadata.uid, newUID: restarted.metadata.uid });
    await findResource(page, "Pod", restarted.metadata.name, restarted.metadata.uid);
    assertOwned(lab, slot, await getOwned(lab, slot, "Pod", restarted.metadata.name), restarted.metadata.uid);
    await confirmDelete(page, restarted.metadata.name);
    await expect.poll(async () => { const live = (await pods()).filter((pod) => !pod.metadata.deletionTimestamp);
      return live.length === 1 && live[0].metadata.uid !== restarted.metadata.uid &&
        live[0].status.conditions?.some((condition) => condition.type === "Ready" && condition.status === "True"); }, { timeout: 90000 }).toBe(true);
    evidence.check("Pod deletion produced actual controller replacement UID");
    await findResource(page, "Deployment", name, uid); await evidence.capture("recovered-workload-ready");
    assertOwned(lab, slot, await getOwned(lab, slot, "Deployment", name), uid); await confirmDelete(page, name);
    await expect.poll(async () => (await page.request.get(objectPath("Deployment", name))).status(), { timeout: 45000 }).toBe(404);
    await expect(page.locator(".resource-details")).toContainText("Bu kaynak silindi");
    evidence.check("Normal Deployment delete observed API404 and deleted old UID panel", { uid });
  } catch (error) {
    primaryError = error; evidence.result.primaryFailure = { name: error.name, message: String(error.message).split(/\nCall log:/)[0] };
    try { await evidence.capture("recovery-primary-failure-before-cleanup"); } catch {} throw error;
  } finally {
    const response = await page.request.get(objectPath("Deployment", name));
    if (response.status() === 404) evidence.check("Recovery owned Deployment cleanup observed404", { uid });
    else if (!primaryError) {
      await chooseScope(page, slot.context, slot.namespace); await enableManagement(page);
      const status = await page.request.get(`${lab.baseURL}/api/connection?${new URLSearchParams({ context: slot.context, namespace: slot.namespace })}`);
      const result = await cleanupOwned(lab, slot, object, page.request, (await status.json()).connectionID); evidence.check("Recovery cleanup", result);
    } else evidence.result.remainingOwnedResource = { kind: "Deployment", name, uid, namespace: slot.namespace, clusterUID: slot.clusterUID };
  }
});
