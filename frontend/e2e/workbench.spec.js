import { test, expect } from "@playwright/test";

async function openFacility(page, query) {
  await page.getByRole("button", { name: "Bul", exact: true }).click();
  await page.getByLabel("Nesne veya kaynak ara", { exact: true }).fill(query);
  await page.locator(".finder-result").first().click();
  await expect(page.locator(".facility-window")).toBeVisible();
}
async function selectSource(page, context) {
  await page
    .getByRole("button", {
      name: "Bağlantı ve cluster kapsamını aç",
      exact: true,
    })
    .click();
  await page
    .getByLabel("Cluster / context", { exact: true })
    .selectOption(context);
  await page
    .getByRole("button", { name: "Pencereyi kapat", exact: true })
    .click();
}
async function demoResources(page) {
  await page.goto("/");
  await selectSource(page, "__demo__");
  await expect(page.locator(".world-brand-control")).toContainText(
    "Demo — örnek veri",
  );
  await openFacility(page, "Yönetim Merkezi");
  await page
    .locator(".resource-kind-tabs")
    .getByRole("button", { name: /^Pod(?:\s|\d|$)/ })
    .click();
  await expect(page.locator(".resource-name").first()).toBeVisible();
}

test("YAML round trip preserves unmapped fields while form updates image; invalid YAML stays visible", async ({
  page,
}) => {
  await demoResources(page);
  await page
    .getByRole("button", { name: "Uygulama oluştur", exact: true })
    .click();
  const dialog = page.locator(".resource-form-dialog");
  await dialog
    .getByLabel("Kaynak adı", { exact: true })
    .fill("preserve-fields");
  await dialog.getByLabel("Ana container image").fill("nginx:1.27-alpine");
  await dialog.getByRole("button", { name: "YAML", exact: true }).click();
  const editor = dialog.getByLabel("Kaynak YAML", { exact: true });
  const yaml = await editor.inputValue();
  // A valid nested PodSpec field absent from the simple form must survive.
  await editor.fill(
    yaml.replace(
      "    spec:\n",
      "    spec:\n      terminationGracePeriodSeconds: 45\n",
    ),
  );
  await dialog.getByRole("button", { name: "Form", exact: true }).click();
  await dialog.getByLabel("Ana container image").fill("nginx:stable-alpine");
  await dialog.getByRole("button", { name: "YAML", exact: true }).click();
  await expect(editor).toHaveValue(/terminationGracePeriodSeconds: 45/);
  await expect(editor).toHaveValue(/nginx:stable-alpine/);
  await editor.fill("apiVersion: [\n");
  await dialog.getByRole("button", { name: "Form", exact: true }).click();
  await expect(editor).toBeVisible();
  await expect(dialog.locator("[role=alert]").first()).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "Oluştur", exact: true }),
  ).toBeDisabled();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("alertdialog", { name: "Kaydedilmemiş değişiklikler" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Taslağı bırak ve kapat", exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator(".resource-form-dialog")).toHaveCount(0);
});

test("CPU sorting is numeric and a noninteractive row cell selects the same UID", async ({
  page,
}) => {
  await demoResources(page);
  const table = page.locator(".resource-table");
  await table.getByRole("button", { name: "CPU", exact: true }).click();
  const numbers = await table.locator("tbody tr").evaluateAll((rows) =>
    rows.map((row) => {
      const value = row.children[7].textContent.trim();
      return value.endsWith("m")
        ? Number(value.slice(0, -1)) / 1000
        : Number(value.replace(" CPU", ""));
    }),
  );
  expect(numbers.every(Number.isFinite)).toBeTruthy();
  expect(numbers).toEqual([...numbers].sort((a, b) => a - b));
  const row = table.locator("tbody tr").nth(2);
  const name = await row.locator(".resource-name").innerText();
  await row.locator("td").nth(2).click();
  await expect(page.locator(".resource-details h2")).toHaveText(name);
  await expect(page.locator(".container-contents")).toBeVisible();
  await expect(page.locator(".resource-details")).toHaveCount(1);
});

test("dedicated namespace: bulk deletion keeps refused UID and reports partial acceptance per resource", async ({
  page,
  request,
}, info) => {
  test.skip(
    process.env.KUBEVIEW_TEST_CONTEXT !== "kubeview-test" ||
      process.env.KUBEVIEW_TEST_NAMESPACE !== "kubeview-qa",
    "Explicit dedicated test cluster and namespace are required",
  );
  test.skip(
    info.project.name !== "chromium",
    "Mutations run once; browser-independent read flows run in both projects",
  );
  const base =
    "/api/resources?context=kubeview-test&group=&version=v1&resource=configmaps&namespace=kubeview-qa";
  const prefix = `bulk-ui-${Date.now()}`,
    names = [`${prefix}-a`, `${prefix}-b`];
  const cleanup = async () => {
    for (const name of names) {
      const response = await request.get(`${base}&name=${name}`);
      if (response.ok()) {
        const resource = await response.json();
        await request.delete(`${base}&name=${name}`, {
          data: {
            uid: resource.metadata.uid,
            resourceVersion: resource.metadata.resourceVersion,
          },
        });
      }
    }
  };
  try {
    for (const name of names) {
      const response = await request.post(base, {
        data: {
          object: {
            apiVersion: "v1",
            kind: "ConfigMap",
            metadata: { name, namespace: "kubeview-qa" },
            data: { purpose: "bulk-partial-qa" },
          },
        },
      });
      expect(response.ok(), await response.text()).toBeTruthy();
    }
    await page.goto("/");
    await selectSource(page, "kubeview-test");
    await expect(page.locator(".world-brand-control")).toContainText("Canlı");
    await openFacility(page, "Sevkiyat Talimatları");
    await page.getByLabel("Tabloda ara", { exact: true }).fill(prefix);
    for (const name of names)
      await page
        .getByRole("checkbox", { name: `${name} seç`, exact: true })
        .check();
    // Deterministic 403 injection verifies the UI failure path; the other DELETE is real.
    await page.route("**/api/resources?**", (route) => {
      const url = new URL(route.request().url());
      return route.request().method() === "DELETE" &&
        url.searchParams.get("name") === names[1]
        ? route.fulfill({
            status: 403,
            json: { error: "QA controlled denial; object retained" },
          })
        : route.continue();
    });
    await page
      .getByRole("button", { name: "2 kaynağı sil", exact: true })
      .click();
    const dialog = page.locator(".resource-form-dialog");
    await dialog
      .getByLabel("Onaylamak için “2 kaynak” yazın", { exact: true })
      .fill("2 kaynak");
    await dialog
      .getByRole("button", { name: "Silmeyi onayla", exact: true })
      .click();
    await page.getByRole("button", { name: /Olaylar ve işlemler:/ }).click();
    await page.getByRole("button", { name: /^İşlemler \(/ }).click();
    await expect(page.locator(".notification-window")).toContainText(
      "Kısmi sonuç",
    );
    await expect(page.locator(".notification-window")).toContainText(
      "QA controlled denial; object retained",
    );
    await expect(page.locator(".resource-name")).toHaveText([names[1]]);
    const remaining = await request.get(`${base}&name=${names[1]}`);
    expect(remaining.ok()).toBeTruthy();
  } finally {
    await cleanup();
  }
});

test("dedicated namespace: ship Pod form validates fresh UID twice and schedules with metadata.name affinity", async ({
  page,
  request,
}, info) => {
  test.skip(
    process.env.KUBEVIEW_TEST_CONTEXT !== "kubeview-test" ||
      process.env.KUBEVIEW_TEST_NAMESPACE !== "kubeview-qa",
    "Explicit dedicated cluster and namespace required",
  );
  test.skip(
    info.project.name !== "chromium",
    "Real mutation once; read and form flows run in both browser projects",
  );
  test.setTimeout(90000);
  const nodesResponse = await request.get(
    "/api/resources?context=kubeview-test&group=&version=v1&resource=nodes",
  );
  expect(nodesResponse.ok()).toBeTruthy();
  const node = (await nodesResponse.json()).items.find(
    (n) =>
      !n.spec?.unschedulable &&
      n.status?.conditions?.some(
        (c) => c.type === "Ready" && c.status === "True",
      ),
  );
  expect(node).toBeTruthy();
  const name = `ship-ui-${Date.now()}`;
  const podPath = `/api/resources?context=kubeview-test&group=&version=v1&resource=pods&namespace=kubeview-qa&name=${name}`;
  const sent = [];
  page.on("request", (r) => {
    if (r.method() === "POST" && r.url().includes("/api/resources?"))
      sent.push(r.postDataJSON());
  });
  const staleNode = async (route) => {
    const url = new URL(route.request().url());
    if (
      route.request().method() === "GET" &&
      url.searchParams.get("resource") === "nodes" &&
      url.searchParams.get("name") === node.metadata.name
    )
      return route.fulfill({
        json: {
          ...node,
          metadata: { ...node.metadata, uid: "recreated-node-uid" },
        },
      });
    return route.continue();
  };
  try {
    await page.goto("/");
    await selectSource(page, "kubeview-test");
    await expect(page.locator(".world-brand-control")).toContainText("Canlı");
    await page.getByRole("button", { name: "Bul", exact: true }).click();
    await page.getByLabel("Nesne veya kaynak ara").fill(node.metadata.name);
    await page
      .locator(".finder-result")
      .filter({
        has: page
          .locator("strong")
          .getByText(node.metadata.name, { exact: true }),
      })
      .first()
      .click();
    await expect(page.locator(".resource-details h2")).toHaveText(
      node.metadata.name,
    );
    await page
      .getByRole("button", { name: "Bu gemiye Pod ekle", exact: true })
      .click();
    const form = page.locator(".resource-form-dialog");
    await expect(form.getByLabel("Pod yerleşimi", { exact: true })).toHaveValue(
      "required",
    );
    await form.getByLabel("Kaynak adı", { exact: true }).fill(name);
    await form.getByLabel("Ana container image").fill("nginx:1.27-alpine");
    await form.getByPlaceholder("Örn. 250m").fill("20m");
    await form.getByPlaceholder("Örn. 1", { exact: true }).fill("100m");
    await form.getByPlaceholder("Örn. 128Mi").fill("16Mi");
    await form.getByPlaceholder("Örn. 512Mi").fill("64Mi");
    await form.getByRole("button", { name: "YAML", exact: true }).click();
    const yaml = await form
      .getByLabel("Kaynak YAML", { exact: true })
      .inputValue();
    expect(yaml).toContain("key: metadata.name");
    expect(yaml).toContain(node.metadata.name);
    expect(yaml).not.toContain("nodeName:");
    await page.route("**/api/resources?**", staleNode);
    await form
      .getByRole("button", { name: "Server dry-run", exact: true })
      .click();
    await expect(form.locator("[role=alert]")).toContainText(
      "Hedef gemi yeniden oluşturulmuş",
    );
    expect(sent).toHaveLength(0);
    await page.unroute("**/api/resources?**", staleNode);
    await form
      .getByRole("button", { name: "Server dry-run", exact: true })
      .click();
    await expect(form).toContainText("Server dry-run başarılı");
    expect(sent).toHaveLength(1);
    expect(sent[0].targetNode).toEqual({
      name: node.metadata.name,
      uid: node.metadata.uid,
      mode: "required",
    });
    expect((await request.get(podPath)).status()).toBe(404);
    await page.route("**/api/resources?**", staleNode);
    await form.getByRole("button", { name: "Oluştur", exact: true }).click();
    await expect(form.locator("[role=alert]")).toContainText(
      "Hedef gemi yeniden oluşturulmuş",
    );
    expect(sent).toHaveLength(1);
    await page.unroute("**/api/resources?**", staleNode);
    await form.getByRole("button", { name: "Oluştur", exact: true }).click();
    await expect(form).toHaveCount(0);
    await expect(page.locator(".resource-details h2")).toHaveText(name);
    await expect
      .poll(async () => {
        const r = await request.get(podPath);
        return r.ok() ? (await r.json()).spec.nodeName : "";
      })
      .toBe(node.metadata.name);
    expect(sent[1].object.spec.nodeName).toBeUndefined();
    expect(sent[1].targetNode.uid).toBe(node.metadata.uid);
  } finally {
    const response = await request.get(podPath);
    if (response.ok()) {
      const pod = await response.json();
      await request.delete(podPath, {
        data: {
          uid: pod.metadata.uid,
          resourceVersion: pod.metadata.resourceVersion,
        },
      });
    }
  }
});

test("dedicated namespace: Secret edit uses purposeful reveal, preserves real values, and operation state stays metadata-only", async ({
  page,
  request,
}, info) => {
  test.skip(
    process.env.KUBEVIEW_TEST_CONTEXT !== "kubeview-test" ||
      process.env.KUBEVIEW_TEST_NAMESPACE !== "kubeview-qa",
    "Explicit dedicated test cluster and namespace required",
  );
  test.skip(
    info.project.name !== "chromium",
    "Real mutation once; Secret sanitization also has pure tests",
  );
  const name = `secret-ui-${Date.now()}`;
  const path = `/api/resources?context=kubeview-test&group=&version=v1&resource=secrets&namespace=kubeview-qa&name=${name}`;
  const dummyBefore = "QA fixture only, no credentials",
    dummyAfter = "QA edited fixture only, no credentials";
  const beforeEncoded = Buffer.from(dummyBefore).toString("base64"),
    afterEncoded = Buffer.from(dummyAfter).toString("base64");
  const created = await request.post(path, {
    data: {
      object: {
        apiVersion: "v1",
        kind: "Secret",
        type: "Opaque",
        metadata: { name, namespace: "kubeview-qa" },
        stringData: { payload: dummyBefore },
      },
    },
  });
  expect(created.ok()).toBeTruthy();
  const denyReveal = (route) =>
    route.fulfill({ status: 403, json: { error: "QA reveal forbidden" } });
  try {
    await page.goto("/");
    await selectSource(page, "kubeview-test");
    await expect(page.locator(".world-brand-control")).toContainText("Canlı");
    await page.getByRole("button", { name: "Bul", exact: true }).click();
    await page.getByLabel("Nesne veya kaynak ara").fill(name);
    await page.locator(".finder-result").filter({ hasText: name }).click();
    const edit = page.getByRole("button", {
      name: "Gizli içeriği düzenle",
      exact: true,
    });
    await expect(edit).toBeEnabled();
    // A denied purpose-specific reveal never falls back to sanitized data or enables save.
    await page.route("**/api/secrets/reveal?**", denyReveal);
    await edit.click();
    let form = page.locator(".resource-form-dialog");
    await expect(form.locator("[role=alert]")).toContainText(
      "QA reveal forbidden",
    );
    await expect(
      form.getByRole("button", { name: "Server dry-run", exact: true }),
    ).toBeDisabled();
    await expect(
      form.getByRole("button", { name: "Uygula", exact: true }),
    ).toBeDisabled();
    await form
      .getByRole("button", { name: "Formu kapat", exact: true })
      .click();
    await page.unroute("**/api/secrets/reveal?**", denyReveal);
    await edit.click();
    form = page.locator(".resource-form-dialog");
    const editor = form.getByLabel("Kaynak YAML", { exact: true });
    await expect(editor).toHaveValue(
      new RegExp(beforeEncoded.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    );
    const raw = await editor.inputValue();
    await editor.fill(raw.replace(beforeEncoded, afterEncoded));
    await form
      .getByRole("button", { name: "Server dry-run", exact: true })
      .click();
    await expect(form).toContainText("Server dry-run başarılı");
    await form.getByRole("button", { name: "Uygula", exact: true }).click();
    await expect(form).toHaveCount(0);
    // Authoritative verification uses only the separate reveal endpoint.
    const reveal = await request.get(
      `/api/secrets/reveal?context=kubeview-test&namespace=kubeview-qa&name=${name}`,
    );
    expect(reveal.ok()).toBeTruthy();
    expect((await reveal.json()).data.payload === afterEncoded).toBeTruthy();
    const metadata = await request.get(path);
    const safe = await metadata.json();
    expect(safe.data).toBeUndefined();
    expect(safe.stringData).toBeUndefined();
    await page
      .getByRole("button", { name: "Ayrıntı panelini kapat", exact: true })
      .click();
    const history = page.getByRole("button", { name: /Olaylar ve işlemler:/ });
    if (await history.count()) await history.click();
    const operationText = await page
      .locator(".notification-window")
      .count()
      .then((count) =>
        count
          ? page.locator(".notification-window").innerText()
          : page.locator("body").innerText(),
      );
    expect(
      operationText.includes(dummyBefore) ||
        operationText.includes(dummyAfter) ||
        operationText.includes(beforeEncoded) ||
        operationText.includes(afterEncoded),
    ).toBeFalsy();
  } finally {
    const response = await request.get(path);
    if (response.ok()) {
      const object = await response.json();
      await request.delete(path, {
        data: {
          uid: object.metadata.uid,
          resourceVersion: object.metadata.resourceVersion,
        },
      });
    }
  }
});

test("mocked Secret purpose flow rejects forbidden reveal and never sends masked metadata", async ({
  page,
}) => {
  const safe = {
    apiVersion: "v1",
    kind: "Secret",
    type: "Opaque",
    metadata: {
      name: "qa-purpose-only",
      namespace: "qa",
      uid: "qa-secret-uid",
      resourceVersion: "rv-1",
    },
    keyNames: ["payload"],
  };
  const raw = {
    apiVersion: "v1",
    kind: "Secret",
    type: "Opaque",
    metadata: { ...safe.metadata },
    data: {
      payload: Buffer.from("dummy test content only").toString("base64"),
    },
  };
  let denied = true,
    actualWrites = 0,
    badPayload = false,
    live;
  await page.route("**/api/contexts", (route) =>
    route.fulfill({
      json: {
        contexts: [{ name: "qa-purpose-context" }],
        current: "qa-purpose-context",
        namespace: "qa",
        readOnly: false,
        configured: true,
      },
    }),
  );
  await page.route("**/api/discovery?**", (route) =>
    route.fulfill({
      json: {
        resources: [
          {
            group: "",
            version: "v1",
            resource: "secrets",
            kind: "Secret",
            namespaced: true,
            verbs: ["get", "list", "watch", "update"],
          },
        ],
        errors: [],
      },
    }),
  );
  await page.route("**/api/metrics?**", (route) =>
    route.fulfill({
      json: {
        available: false,
        source: "qa fixture",
        error: "No fixture measurements",
      },
    }),
  );
  await page.route("**/api/capabilities?**", (route) =>
    route.fulfill({
      json: {
        readOnly: false,
        verbs: { get: true, update: true },
        subresources: {},
        actions: {},
      },
    }),
  );
  await page.route("**/api/secrets/reveal?**", (route) =>
    denied
      ? route.fulfill({ status: 403, json: { error: "Purpose reveal denied" } })
      : route.fulfill({ json: raw }),
  );
  await page.route("**/api/resources?**", async (route) => {
    const request = route.request();
    if (request.method() === "GET")
      return route.fulfill({
        json: new URL(request.url()).searchParams.get("name")
          ? safe
          : { apiVersion: "v1", kind: "SecretList", items: [safe] },
      });
    const body = request.postDataJSON();
    if (
      body.object?.keyNames ||
      !body.object?.data ||
      body.object?.metadata?.uid !== raw.metadata.uid
    )
      badPayload = true;
    if (!body.dryRun) {
      actualWrites++;
      live?.send(
        JSON.stringify({
          type: "RESOURCE_EVENT",
          generation: "qa-purpose",
          action: "UPDATE",
          object: {
            ...safe,
            metadata: { ...safe.metadata, resourceVersion: "rv-2" },
          },
        }),
      );
    }
    return route.fulfill({
      json: {
        object: {
          ...safe,
          metadata: {
            ...safe.metadata,
            resourceVersion: body.dryRun ? "rv-1" : "rv-2",
          },
        },
        operation: {
          id: "qa-secret-operation",
          status: body.dryRun ? "validated" : "accepted",
        },
      },
    });
  });
  await page.routeWebSocket("**/ws?**", (socket) => {
    live = socket;
    socket.send(
      JSON.stringify({
        type: "SNAPSHOT",
        generation: "qa-purpose",
        resources: [safe],
        synced: true,
        upstream: true,
      }),
    );
  });
  await page.goto("/");
  await expect(page.locator(".world-brand-control")).toContainText("Canlı");
  await page.getByRole("button", { name: "Bul", exact: true }).click();
  await page.getByLabel("Nesne veya kaynak ara").fill(safe.metadata.name);
  await page
    .locator(".finder-result")
    .filter({ hasText: safe.metadata.name })
    .click();
  const edit = page.getByRole("button", {
    name: "Gizli içeriği düzenle",
    exact: true,
  });
  await expect(edit).toBeEnabled();
  await edit.click();
  let form = page.locator(".resource-form-dialog");
  await expect(form.locator("[role=alert]")).toContainText(
    "Purpose reveal denied",
  );
  await expect(
    form.getByRole("button", { name: "Server dry-run", exact: true }),
  ).toBeDisabled();
  expect(actualWrites).toBe(0);
  await form.getByRole("button", { name: "Formu kapat", exact: true }).click();
  denied = false;
  await edit.click();
  form = page.locator(".resource-form-dialog");
  await expect
    .poll(async () =>
      (
        await form.getByLabel("Kaynak YAML", { exact: true }).inputValue()
      ).includes(raw.data.payload),
    )
    .toBeTruthy();
  await form
    .getByRole("button", { name: "Server dry-run", exact: true })
    .click();
  await expect(form).toContainText("Server dry-run başarılı");
  await form.getByRole("button", { name: "Uygula", exact: true }).click();
  await expect(form).toHaveCount(0);
  expect(actualWrites).toBe(1);
  expect(badPayload).toBeFalsy();
  await page
    .getByRole("button", { name: "Ayrıntı panelini kapat", exact: true })
    .click();
  const history = page.getByRole("button", { name: /Olaylar ve işlemler:/ });
  if (await history.count()) await history.click();
  expect(
    (await page.locator("body").innerText()).includes(raw.data.payload),
  ).toBeFalsy();
});
