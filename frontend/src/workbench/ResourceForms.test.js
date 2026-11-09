import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";

// Exercise the component's actual event handlers and effects without a browser.
// Native fieldset/focus behavior is verified separately by production UI E2E.
const compiled = await build({
  stdin: {
    contents:
      'export { default as Form } from "./ResourceForms.jsx"; export { default as React } from "react";',
    resolveDir: new URL(".", import.meta.url).pathname,
  },
  bundle: true,
  platform: "node",
  format: "esm",
  write: false,
  banner: {
    js: `import { createRequire } from "node:module"; const require = createRequire(${JSON.stringify(import.meta.url)});`,
  },
  loader: { ".css": "empty" },
  define: { "process.env.NODE_ENV": '"production"' },
});
const { Form, React } = await import(
  `data:text/javascript;base64,${Buffer.from(`${compiled.outputFiles[0].text}\n//# sourceURL=ResourceForms-unit.js`).toString("base64")}`
);
const dispatcher =
  React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
    .ReactCurrentDispatcher;
const equalDeps = (a, b) =>
  a && b && a.length === b.length && a.every((x, i) => Object.is(x, b[i]));
const nodes = (node) => {
  if (Array.isArray(node)) return node.flatMap(nodes);
  if (!node || typeof node !== "object") return [];
  return [node, ...nodes(node.props?.children)];
};
const content = (node) => {
  if (Array.isArray(node)) return node.map(content).join("");
  if (node && typeof node === "object") return content(node.props?.children);
  return node == null || typeof node === "boolean" ? "" : String(node);
};
function mount(props) {
  const hooks = [];
  let cursor, pending, changed, tree;
  const oldDocument = globalThis.document;
  globalThis.document = {
    activeElement: null,
    addEventListener() {},
    removeEventListener() {},
    querySelector() {
      return null;
    },
  };
  const hookDispatcher = {
    useState(initial) {
      const index = cursor++;
      if (!hooks[index])
        hooks[index] = {
          value: typeof initial === "function" ? initial() : initial,
        };
      return [
        hooks[index].value,
        (update) => {
          const next =
            typeof update === "function" ? update(hooks[index].value) : update;
          if (!Object.is(next, hooks[index].value)) {
            hooks[index].value = next;
            changed = true;
          }
        },
      ];
    },
    useRef(value) {
      const index = cursor++;
      return (hooks[index] ||= { current: value });
    },
    useMemo(fn, deps) {
      const index = cursor++;
      if (!hooks[index] || !equalDeps(hooks[index].deps, deps))
        hooks[index] = { value: fn(), deps };
      return hooks[index].value;
    },
    useEffect(fn, deps) {
      const index = cursor++;
      const previous = hooks[index];
      if (!previous || !equalDeps(previous.deps, deps)) {
        hooks[index] = { deps, cleanup: previous?.cleanup };
        pending.push(() => {
          hooks[index].cleanup?.();
          hooks[index].cleanup = fn();
        });
      }
    },
  };
  const render = (patch = {}) => {
    props = { ...props, ...patch };
    let passes = 0;
    do {
      assert.ok(
        ++passes < 20,
        "form effects must settle without a render loop",
      );
      cursor = 0;
      pending = [];
      changed = false;
      const previous = dispatcher.current;
      dispatcher.current = hookDispatcher;
      try {
        tree = Form(props);
      } finally {
        dispatcher.current = previous;
      }
      pending.forEach((effect) => effect());
    } while (changed);
    return tree;
  };
  const find = (predicate) => nodes(tree).find(predicate);
  const button = (label) =>
    find((node) => node.type === "button" && content(node) === label);
  render();
  return {
    render,
    find,
    button,
    text: () => content(tree),
    async settle() {
      await new Promise((resolve) => setImmediate(resolve));
      render();
    },
    close() {
      hooks.forEach((hook) => hook.cleanup?.());
      globalThis.document = oldDocument;
    },
  };
}
const base = {
  apiVersion: "apps/v1",
  kind: "Deployment",
  metadata: {
    uid: "original",
    name: "app",
    namespace: "alpha",
    resourceVersion: "opaque-a",
  },
  spec: {
    replicas: 0,
    template: {
      spec: {
        containers: [
          {
            name: "app",
            image: "busybox:1.36",
            resources: {
              requests: { cpu: "10m", memory: "16Mi" },
              limits: { cpu: "100m", memory: "64Mi" },
            },
          },
        ],
      },
    },
  },
};
const edited = {
  requests: { cpu: "25m", memory: "28Mi" },
  limits: { cpu: "175m", memory: "112Mi" },
};
const copy = (value) => structuredClone(value);
const options = (resource, api, extra = {}) => ({
  action: "resources",
  resource,
  api,
  cluster: "A",
  sourceKey: "live:A:1",
  readOnly: false,
  onClose() {},
  ...extra,
});
const resourceFields = (form) =>
  form.find((node) => node.type?.name === "ContainerResources");
const yamlField = (form) =>
  form.find((node) => node.props?.["aria-label"] === "Kaynak YAML");

test("same-UID stale/live GET keeps all dirty values and invalidates the previous dry-run", async () => {
  const writes = [];
  const api = {
    resourcePath: () => "/resource",
    request: async (_path, request) => {
      if (request.method) {
        writes.push(request.body.object);
        return { object: request.body.object };
      }
      return copy(base);
    },
  };
  const form = mount(options(base, api));
  try {
    assert.equal(
      form.find((node) => node.type === "fieldset").props.disabled,
      true,
    );
    await form.settle();
    const fields = resourceFields(form);
    fields.props.onChange({ ...fields.props.container, resources: edited });
    form.render();
    await form.button("Server dry-run").props.onClick();
    form.render();
    assert.ok(form.find((node) => node.props?.className === "dry-run-preview"));
    form.render({ readOnly: true });
    form.render({ readOnly: false });
    await form.settle();
    assert.deepEqual(resourceFields(form).props.container.resources, edited);
    assert.equal(
      form.find((node) => node.props?.className === "dry-run-preview"),
      undefined,
    );
    await form.button("Server dry-run").props.onClick();
    assert.equal(writes.at(-1).metadata.resourceVersion, "opaque-a");
    assert.deepEqual(
      writes.at(-1).spec.template.spec.containers[0].resources,
      edited,
    );
  } finally {
    form.close();
  }
});

test("revalidation keeps invalid YAML and the reviewed RV until explicit user review", async () => {
  let current = copy(base);
  const writes = [];
  const api = {
    resourcePath: () => "/resource",
    request: async (_path, request) => {
      if (request.method) {
        writes.push(request.body.object);
        return { object: request.body.object };
      }
      return copy(current);
    },
  };
  const form = mount(options(base, api, { action: "edit" }));
  try {
    await form.settle();
    form.button("YAML").props.onClick();
    form.render();
    const dirtyYAML = yamlField(form).props.value.replace("10m", "25m");
    yamlField(form).props.onChange({
      target: { value: `${dirtyYAML}\nbroken: [` },
    });
    form.render();
    current.metadata.resourceVersion = "opaque-b";
    form.render({ readOnly: true });
    form.render({ readOnly: false });
    await form.settle();
    assert.equal(yamlField(form).props.value, `${dirtyYAML}\nbroken: [`);
    assert.match(form.text(), /resourceVersion.*Taslağınız korundu/);
    yamlField(form).props.onChange({ target: { value: dirtyYAML } });
    form.render();
    await form.button("Server dry-run").props.onClick();
    form.render();
    assert.equal(writes.at(-1).metadata.resourceVersion, "opaque-a");
    // The explicit review action updates only RV; the user's fields survive.
    form.render({ readOnly: true });
    form.render({ readOnly: false });
    await form.settle();
    await form.button("Güncel sürümü al ve gözden geçir").props.onClick();
    form.render();
    await form.button("Server dry-run").props.onClick();
    assert.equal(writes.at(-1).metadata.resourceVersion, "opaque-b");
    assert.equal(
      writes.at(-1).spec.template.spec.containers[0].resources.requests.cpu,
      "25m",
    );
  } finally {
    form.close();
  }
});

test("different UID or source never adopts the old target's dirty draft", async () => {
  let current = copy(base);
  const api = {
    resourcePath: () => "/resource",
    request: async () => copy(current),
  };
  const form = mount(options(base, api));
  try {
    await form.settle();
    let fields = resourceFields(form);
    fields.props.onChange({ ...fields.props.container, resources: edited });
    form.render();
    current.metadata.uid = "replacement";
    form.render({ readOnly: true });
    form.render({ readOnly: false });
    await form.settle();
    assert.match(form.text(), /Kaynak UID değişti/);
    assert.deepEqual(resourceFields(form).props.container.resources, edited);
    form.render({
      resource: copy(current),
      sourceKey: "live:B:2",
      cluster: "B",
    });
    await form.settle();
    assert.deepEqual(
      resourceFields(form).props.container.resources,
      base.spec.template.spec.containers[0].resources,
    );
  } finally {
    form.close();
  }
});

test("dirty Secret reveal revalidates before reuse, fails closed on error, and clears on close", async () => {
  const secret = {
    apiVersion: "v1",
    kind: "Secret",
    metadata: {
      uid: "secret",
      name: "config",
      namespace: "alpha",
      resourceVersion: "v1",
    },
    data: { value: "original" },
  };
  let fail = false,
    closed = 0;
  const api = {
    request: async () => {
      if (fail) throw new Error("reveal forbidden");
      return copy(secret);
    },
  };
  const form = mount(
    options(secret, api, {
      action: "edit",
      secretEdit: true,
      onClose() {
        ++closed;
      },
    }),
  );
  try {
    await form.settle();
    const dirtyYAML = yamlField(form).props.value.replace("original", "edited");
    yamlField(form).props.onChange({ target: { value: dirtyYAML } });
    form.render();
    form.render({ readOnly: true });
    assert.equal(form.button("Server dry-run").props.disabled, true);
    fail = true;
    form.render({ readOnly: false });
    assert.equal(
      form.find((node) => node.type === "fieldset").props.disabled,
      true,
    );
    await form.settle();
    assert.equal(yamlField(form).props.value, dirtyYAML);
    assert.equal(form.button("Server dry-run").props.disabled, true);
    fail = false;
    form.render({ api: { ...api } });
    await form.settle();
    assert.equal(yamlField(form).props.value, dirtyYAML);
    assert.equal(form.button("Server dry-run").props.disabled, false);
    form
      .find((node) => node.props?.["aria-label"] === "Formu kapat")
      .props.onClick();
    form.render();
    form.button("Taslağı bırak ve kapat").props.onClick();
    form.render();
    assert.equal(closed, 1);
    assert.equal(yamlField(form).props.value, "");
  } finally {
    form.close();
  }
});
