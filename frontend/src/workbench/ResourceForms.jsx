import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Eye,
  FileCode2,
  Minus,
  Plus,
  X,
} from "lucide-react";
import { parse, stringify } from "yaml";
import {
  cloneResource,
  editableResource,
  validateResources,
} from "./resourceUtils";
import "./workbench.css";
import {
  secretMetadataOnly,
  secretSafeSubmission,
  validateRevealedSecret,
} from "./secretPayload";
import { applyPlacement, assertTargetNode } from "./placement";

const TYPES = [
  "Deployment",
  "Pod",
  "Job",
  "CronJob",
  "Service",
  "Diğer kaynak / YAML",
];
const TITLES = {
  create: "Kaynak oluştur",
  edit: "Kaynağı düzenle",
  resources: "CPU ve bellek kaynakları",
  scale: "Replica sayısını değiştir",
  restart: "Rollout restart",
  delete: "Kaynağı sil",
  "delete-many": "Seçili kaynakları sil",
  cordon: "Node’u scheduling için kapat",
  uncordon: "Node scheduling’i aç",
  resize: "Bu Pod’u yerinde yeniden boyutlandır",
  rollback: "Deployment revision geri al",
  "run-now": "CronJob’u şimdi çalıştır",
  suspend: "CronJob’u askıya al",
  resume: "CronJob zamanlamasını sürdür",
  drain: "Node bakım tahliyesi",
};
function template(kind, namespace) {
  const container = {
      name: "app",
      image: "",
      resources: { requests: {}, limits: {} },
    },
    pod = { containers: [container] };
  const object = {
    apiVersion: ["Deployment", "StatefulSet", "DaemonSet"].includes(kind)
      ? "apps/v1"
      : ["Job", "CronJob"].includes(kind)
        ? "batch/v1"
        : "v1",
    kind,
    metadata: {
      name: "",
      namespace: namespace && namespace !== "all" ? namespace : "default",
      labels: {},
    },
  };
  if (kind === "Deployment")
    object.spec = {
      replicas: 1,
      selector: { matchLabels: { app: "" } },
      template: { metadata: { labels: { app: "" } }, spec: pod },
    };
  else if (kind === "Pod") object.spec = pod;
  else if (kind === "Job")
    object.spec = {
      template: { spec: { ...pod, restartPolicy: "Never" } },
      backoffLimit: 3,
    };
  else if (kind === "CronJob")
    object.spec = {
      schedule: "0 * * * *",
      jobTemplate: {
        spec: { template: { spec: { ...pod, restartPolicy: "Never" } } },
      },
    };
  else if (kind === "Service")
    object.spec = {
      type: "ClusterIP",
      selector: { app: "" },
      ports: [{ port: 80, targetPort: 80, protocol: "TCP" }],
    };
  else if (kind === "Diğer kaynak / YAML")
    return {
      apiVersion: "v1",
      kind: "ConfigMap",
      metadata: object.metadata,
      data: {},
    };
  else {
    const versions = {
      ReplicaSet: "apps/v1",
      StatefulSet: "apps/v1",
      DaemonSet: "apps/v1",
      Ingress: "networking.k8s.io/v1",
      NetworkPolicy: "networking.k8s.io/v1",
      StorageClass: "storage.k8s.io/v1",
      Role: "rbac.authorization.k8s.io/v1",
      ClusterRole: "rbac.authorization.k8s.io/v1",
      RoleBinding: "rbac.authorization.k8s.io/v1",
      ClusterRoleBinding: "rbac.authorization.k8s.io/v1",
      HorizontalPodAutoscaler: "autoscaling/v2",
      PodDisruptionBudget: "policy/v1",
      EndpointSlice: "discovery.k8s.io/v1",
      CustomResourceDefinition: "apiextensions.k8s.io/v1",
    };
    object.apiVersion = versions[kind] || "v1";
    if (
      [
        "Node",
        "Namespace",
        "PersistentVolume",
        "StorageClass",
        "ClusterRole",
        "ClusterRoleBinding",
        "CustomResourceDefinition",
      ].includes(kind)
    )
      delete object.metadata.namespace;
    return object;
  }
  return object;
}
function mergeInitial(defaults, supplied) {
  if (!supplied || typeof supplied !== "object" || Array.isArray(supplied))
    return cloneResource(supplied);
  const result = {
    ...cloneResource(defaults || {}),
    ...cloneResource(supplied),
  };
  for (const key of Object.keys(supplied))
    if (
      supplied[key] &&
      typeof supplied[key] === "object" &&
      !Array.isArray(supplied[key])
    )
      result[key] = mergeInitial(defaults?.[key], supplied[key]);
  return result;
}
function podSpec(object) {
  return object?.kind === "Pod"
    ? object.spec
    : object?.kind === "CronJob"
      ? object.spec?.jobTemplate?.spec?.template?.spec
      : object?.spec?.template?.spec;
}
function Field({ label, hint, children }) {
  return (
    <label className="form-field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
function ContainerResources({ container, onChange }) {
  return (
    <fieldset className="container-resource-fields">
      <legend>{container.name}</legend>
      <div className="form-grid">
        {[
          ["requests", "cpu", "CPU request", "Örn. 250m"],
          ["limits", "cpu", "CPU limit", "Örn. 1"],
          ["requests", "memory", "Bellek request", "Örn. 128Mi"],
          ["limits", "memory", "Bellek limit", "Örn. 512Mi"],
        ].map(([group, key, label, placeholder]) => (
          <Field
            key={`${group}-${key}`}
            label={label}
            hint={
              key === "cpu"
                ? "m veya core · 500m = 0.5 CPU"
                : "Mi veya Gi · 1Gi = 1024Mi"
            }
          >
            <input
              value={container.resources?.[group]?.[key] || ""}
              placeholder={placeholder}
              onChange={(e) => {
                const next = {
                  ...container,
                  resources: {
                    ...container.resources,
                    [group]: { ...container.resources?.[group] },
                  },
                };
                if (e.target.value.trim())
                  next.resources[group][key] = e.target.value;
                else delete next.resources[group][key];
                onChange(next);
              }}
            />
          </Field>
        ))}
      </div>
    </fieldset>
  );
}
export default function ResourceForms({
  action,
  resource,
  cluster,
  namespace = "default",
  api: connectionAPI,
  onClose,
  onSubmitted,
  readOnly = true,
  resources = [],
  createKind,
  targetNode,
  placementMode: requestedPlacementMode,
  initialObject,
  secretEdit = false,
}) {
  const requestScope = useMemo(() => new AbortController(), [connectionAPI]);
  useEffect(() => () => requestScope.abort(), [requestScope]);
  const api = useMemo(
    () => ({
      ...connectionAPI,
      request: (path, options = {}) => {
        const abort = new AbortController();
        const cancel = () => abort.abort();
        const signals = [requestScope.signal, options.signal].filter(Boolean);
        for (const signal of signals) {
          if (signal.aborted) abort.abort();
          signal.addEventListener("abort", cancel, { once: true });
        }
        return connectionAPI
          .request(path, { ...options, signal: abort.signal })
          .finally(() =>
            signals.forEach((signal) =>
              signal.removeEventListener("abort", cancel),
            ),
          );
      },
    }),
    [connectionAPI, requestScope],
  );
  const actionType =
    typeof action === "string" ? action : action?.type || "create";
  const purposeSecretEdit =
    actionType === "edit" && resource?.kind === "Secret" && secretEdit;
  const [secretReady, setSecretReady] = useState(false);
  const initialKind =
    initialObject?.kind ||
    (createKind === "YAML" ? "Diğer kaynak / YAML" : createKind) ||
    (typeof action === "object" ? action.kind : null) ||
    "Pod";
  const batch =
    actionType === "delete-many"
      ? Array.isArray(resource)
        ? resource
        : []
      : [];
  const initialDraft = useRef(null);
  if (!initialDraft.current) {
    const base = initialObject
      ? mergeInitial(template(initialKind, namespace), initialObject)
      : resource && !Array.isArray(resource)
        ? editableResource(resource)
        : template(initialKind, namespace);
    const initialMode =
      requestedPlacementMode || (targetNode ? "required" : "scheduler");
    try {
      initialDraft.current = targetNode
        ? applyPlacement(base, targetNode, initialMode)
        : { object: base, provenance: null };
    } catch (e) {
      initialDraft.current = {
        object: base,
        provenance: null,
        error: e.message,
      };
    }
  }
  const [placementMode, setPlacementMode] = useState(
      requestedPlacementMode || (targetNode ? "required" : "scheduler"),
    ),
    [placementProvenance, setPlacementProvenance] = useState(
      initialDraft.current.provenance,
    ),
    [dirty, setDirty] = useState(false),
    [discardPrompt, setDiscardPrompt] = useState(false);
  const [kind, setKind] = useState(initialObject?.kind || initialKind),
    [object, setObject] = useState(initialDraft.current.object),
    [mode, setMode] = useState(
      purposeSecretEdit ||
        !TYPES.includes(initialKind) ||
        initialKind === "Diğer kaynak / YAML"
        ? "yaml"
        : "form",
    ),
    [yamlText, setYAMLText] = useState(() =>
      stringify(initialDraft.current.object),
    ),
    [yamlError, setYAMLError] = useState(""),
    [replicas, setReplicas] = useState(resource?.spec?.replicas ?? 1),
    [confirmation, setConfirmation] = useState(""),
    [error, setError] = useState(initialDraft.current.error || ""),
    [preview, setPreview] = useState(null),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(false),
    [bulkResults, setBulkResults] = useState(null),
    [reviewedVersion, setReviewedVersion] = useState(null),
    [revision, setRevision] = useState(0),
    [drainPreview, setDrainPreview] = useState(null),
    [fieldErrors, setFieldErrors] = useState({}),
    [schemaHelp, setSchemaHelp] = useState(null),
    [schemaLoading, setSchemaLoading] = useState(false);
  const [uncertain, setUncertain] = useState(false),
    [reconciliation, setReconciliation] = useState("");
  const uncertainTarget = useRef(null);
  const dialog = useRef(null),
    errorRef = useRef(null),
    previousFocus = useRef(null),
    submitted = useRef(false),
    busyRef = useRef(busy),
    closeRef = useRef(onClose),
    discardRef = useRef(discardPrompt);
  const clearSecretDraft = () => {
    if (purposeSecretEdit || object.kind === "Secret") {
      setObject(secretMetadataOnly(object));
      setYAMLText("");
      setPreview(null);
      setSecretReady(false);
    }
  };
  const closeForm = () => {
    clearSecretDraft();
    onClose();
  };
  const attemptClose = () => {
    if (busy) return;
    if (dirty && !submitted.current) setDiscardPrompt(true);
    else closeForm();
  };
  busyRef.current = busy;
  closeRef.current = attemptClose;
  discardRef.current = discardPrompt;
  useEffect(() => {
    previousFocus.current = document.activeElement;
    const node = dialog.current;
    node?.querySelector("input,select,textarea,button")?.focus();
    const key = (e) => {
      if (e.key === "Escape" && !busyRef.current) {
        e.preventDefault();
        e.stopPropagation();
        if (discardRef.current) setDiscardPrompt(false);
        else closeRef.current();
      }
      if (e.key === "Tab" && node) {
        const scope = node.querySelector(".discard-confirmation") || node;
        const elements = [
          ...scope.querySelectorAll(
            'button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]',
          ),
        ].filter((x) => x.offsetParent !== null);
        if (!elements.length) return;
        const first = elements[0],
          last = elements[elements.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      (previousFocus.current?.isConnected
        ? previousFocus.current
        : document.querySelector(
            ".world-tools button, .create-wrapper > button",
          )
      )?.focus?.();
    };
  }, []);
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);
  useEffect(() => {
    if (
      !["edit", "resources", "resize"].includes(actionType) ||
      !resource ||
      !api ||
      readOnly
    )
      return;
    if (resource.kind === "Secret" && !purposeSecretEdit) {
      setError(
        "Secret içeriği yalnız ayrı ve yetkili düzenleme akışında açılır.",
      );
      return;
    }
    let active = true;
    const abort = new AbortController();
    setLoading(true);
    setSecretReady(false);
    if (purposeSecretEdit) {
      setObject(secretMetadataOnly(resource));
      setYAMLText("");
      setPreview(null);
      setDirty(false);
      setReviewedVersion(null);
    }
    let path;
    try {
      path = purposeSecretEdit
        ? `/api/secrets/reveal?${new URLSearchParams({ namespace: resource.metadata.namespace, name: resource.metadata.name })}`
        : api.resourcePath(resource);
    } catch (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    api
      .request(path, { signal: abort.signal })
      .then((value) => {
        if (!active) return;
        if (purposeSecretEdit) validateRevealedSecret(resource, value);
        else if (value.metadata?.uid !== resource.metadata?.uid)
          throw new Error(
            "Kaynak UID değişti. Yeni kaynağı seçmek için paneli yeniden açın.",
          );
        const draft = editableResource(value);
        setObject(draft);
        if (purposeSecretEdit) {
          setYAMLText(stringify(draft));
          setSecretReady(true);
        }
      })
      .catch((error) => {
        if (active && error.name !== "AbortError") setError(error.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      abort.abort();
    };
  }, [
    resource?.metadata?.uid,
    actionType,
    api,
    readOnly,
    purposeSecretEdit,
    cluster,
  ]);
  const isCreate = actionType === "create",
    isEdit = actionType === "edit",
    isResources = ["resources", "resize"].includes(actionType),
    isDelete = ["delete", "delete-many"].includes(actionType);
  const targetEnvelope =
    targetNode && placementMode !== "scheduler"
      ? {
          targetNode: {
            name: targetNode.metadata.name,
            uid: targetNode.metadata.uid,
            mode: placementMode,
          },
        }
      : {};
  const hpa = resources.find(
    (r) =>
      r.kind === "HorizontalPodAutoscaler" &&
      r.metadata?.namespace === resource?.metadata?.namespace &&
      r.spec?.scaleTargetRef?.kind === resource?.kind &&
      r.spec?.scaleTargetRef?.name === resource?.metadata?.name,
  );
  const containers = podSpec(object)?.containers || [];
  const update = (fn) => {
    setDirty(true);
    setObject((current) => {
      const next = cloneResource(current);
      fn(next);
      return next;
    });
    setPreview(null);
    setError("");
  };
  const changeKind = (value) => {
    setDirty(true);
    setKind(value);
    let next = template(value, object.metadata?.namespace || namespace);
    next.metadata.name = object.metadata?.name || "";
    const previousSpec = podSpec(object),
      nextSpec = podSpec(next);
    if (previousSpec && nextSpec)
      Object.assign(nextSpec, cloneResource(previousSpec));
    if (targetNode && ["Pod", "Deployment", "Job", "CronJob"].includes(value)) {
      try {
        const placed = applyPlacement(
          next,
          targetNode,
          placementMode,
          previousSpec && nextSpec ? placementProvenance : null,
        );
        next = placed.object;
        setPlacementProvenance(placed.provenance);
      } catch (e) {
        setError(e.message);
      }
    } else setPlacementProvenance(null);
    setObject(next);
    setPreview(null);
    setYAMLError("");
    setFieldErrors({});
    setMode(value === "Diğer kaynak / YAML" ? "yaml" : "form");
    setYAMLText(stringify(next));
  };
  const changeName = (name) =>
    update((next) => {
      next.metadata = {
        ...next.metadata,
        labels: { ...next.metadata?.labels },
      };
      const previous = next.metadata.name;
      next.metadata.name = name;
      if (next.kind === "Deployment") {
        if (
          next.spec?.selector?.matchLabels &&
          (!next.spec.selector.matchLabels.app ||
            next.spec.selector.matchLabels.app === previous)
        )
          next.spec.selector.matchLabels.app = name;
        if (
          next.spec?.template?.metadata?.labels &&
          (!next.spec.template.metadata.labels.app ||
            next.spec.template.metadata.labels.app === previous)
        )
          next.spec.template.metadata.labels.app = name;
      }
      if (!next.metadata.labels.app || next.metadata.labels.app === previous)
        next.metadata.labels.app = name;
    });
  const changeContainer = (index, value) =>
    update((next) => {
      podSpec(next).containers[index] = value;
    });
  const switchMode = (value) => {
    if (value === "yaml") setYAMLText(stringify(object));
    else if (
      !object.metadata ||
      typeof object.metadata !== "object" ||
      Array.isArray(object.metadata) ||
      (object.spec != null &&
        (typeof object.spec !== "object" || Array.isArray(object.spec)))
    ) {
      setError(
        "Form görünümü için metadata ve spec nesne olmalı. YAML alanlarını düzeltin; geçerli ek alanlar korunur.",
      );
      return;
    } else if (yamlError) {
      setError(
        "Form görünümüne geçmeden önce YAML sözdizimi hatasını düzeltin.",
      );
      return;
    }
    setMode(value);
  };
  const parseYAML = (value) => {
    setDirty(true);
    setYAMLText(value);
    setPreview(null);
    try {
      const next = parse(value);
      if (!next || typeof next !== "object" || Array.isArray(next))
        throw new Error("Tek bir Kubernetes kaynak nesnesi bekleniyor.");
      setObject(next);
      setYAMLError("");
      setFieldErrors({});
    } catch (e) {
      setYAMLError(e.message);
    }
  };
  const changePlacement = (value) => {
    try {
      const next = applyPlacement(
        object,
        targetNode,
        value,
        placementProvenance,
      );
      setObject(next.object);
      setPlacementProvenance(next.provenance);
      setPlacementMode(value);
      setDirty(true);
      setPreview(null);
      setYAMLText(stringify(next.object));
      setError("");
    } catch (e) {
      setError(e.message);
    }
  };
  const prepareObject = async () => {
    if (!targetNode) return object;
    const fresh = await api.request(api.resourcePath(targetNode));
    assertTargetNode(targetNode, fresh);
    return applyPlacement(object, fresh, placementMode, placementProvenance)
      .object;
  };
  const validate = () => {
    if (
      isEdit &&
      object.kind === "Secret" &&
      (!purposeSecretEdit || !secretReady)
    )
      throw new Error(
        "Yetkili Secret içeriği henüz alınmadı. Maskelenmiş metadata kaydedilmez.",
      );
    if (purposeSecretEdit) validateRevealedSecret(resource, object);
    if (yamlError) throw new Error(yamlError);
    if (Object.keys(fieldErrors).length)
      throw new Error(Object.values(fieldErrors).join(" "));
    if (
      (isCreate || isEdit || isResources) &&
      (!object.apiVersion || !object.kind || !object.metadata?.name)
    )
      throw new Error("apiVersion, kind ve metadata.name zorunludur.");
    if (
      isCreate &&
      !/^[a-z0-9]([-a-z0-9.]*[a-z0-9])?$/.test(object.metadata.name)
    )
      throw new Error(
        "Ad küçük harf, sayı, nokta ve tire içeren geçerli bir Kubernetes adı olmalı.",
      );
    if (isCreate && containers.some((c) => !c.name || !c.image))
      throw new Error("Her container için ad ve image zorunludur.");
    if (isResources || isCreate || isEdit) {
      const errors = validateResources(containers);
      if (errors.length) throw new Error(errors.join(" "));
    }
    if (
      actionType === "scale" &&
      (!Number.isInteger(Number(replicas)) || Number(replicas) < 0)
    )
      throw new Error("Replica sayısı sıfır veya pozitif bir tam sayı olmalı.");
    if (actionType === "scale" && hpa)
      throw new Error(
        `${hpa.metadata.name} HPA bu workload’u yönetiyor. HPA min/max/target alanlarını düzenleyin.`,
      );
    if (
      isDelete &&
      confirmation !==
        (batch.length ? `${batch.length} kaynak` : resource.metadata.name)
    )
      throw new Error("Silme onayı için gösterilen adı aynen yazın.");
    if (
      actionType === "drain" &&
      (!drainPreview || confirmation !== resource.metadata.name)
    )
      throw new Error(
        "Önce etkilenen Pod’ları önizleyin, sonra Node adını yazarak onaylayın.",
      );
    if (readOnly)
      throw new Error(
        "Bu bağlantı salt okunur. Mutasyonlar backend yapılandırmasında açılmalıdır; demo kaynağı değiştirilemez.",
      );
  };
  const dryRun = async () => {
    if (busyRef.current || submitted.current) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    setPreview(null);
    try {
      validate();
      const preparedObject = await prepareObject();
      const result =
        actionType === "resize"
          ? await api.request("/api/actions", {
              method: "POST",
              body: {
                ...Object.fromEntries(
                  new URL(api.resourcePath(resource), window.location.origin)
                    .searchParams,
                ),
                context: cluster,
                action: "resize",
                uid: resource.metadata.uid,
                resourceVersion:
                  reviewedVersion || object.metadata.resourceVersion,
                containers: containers.map((c) => ({
                  name: c.name,
                  resources: c.resources || {},
                })),
                dryRun: true,
              },
            })
          : await api.request(api.resourcePath(object), {
              method: isCreate ? "POST" : "PUT",
              body: { object: preparedObject, dryRun: true, ...targetEnvelope },
            });
      setPreview(secretMetadataOnly(result.object || result));
    } catch (e) {
      setError(e.message);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };
  const submit = async (e) => {
    e?.preventDefault();
    if (submitted.current || busyRef.current || uncertain) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    let mutationSent = false;
    try {
      validate();
      if ((isCreate || isEdit || isResources) && !preview)
        throw new Error(
          "Önce “Server dry-run” ile kaynağı Kubernetes API üzerinde doğrulayın.",
        );
      if (batch.length) {
        const results = [];
        for (const item of batch) {
          try {
            const result = await api.request(api.resourcePath(item), {
              method: "DELETE",
              body: {
                uid: item.metadata.uid,
                resourceVersion: item.metadata.resourceVersion,
              },
            });
            results.push({ resource: item, accepted: true, result });
          } catch (err) {
            results.push({
              resource: item,
              accepted: false,
              error: err.message,
            });
          }
          setBulkResults([...results]);
        }
        submitted.current = true;
        onSubmitted?.(
          {
            results,
            operation: {
              status: results.every((r) => r.accepted) ? "accepted" : "partial",
              message: `${results.filter((r) => r.accepted).length}/${results.length} silme isteği kabul edildi.`,
            },
          },
          { action: actionType, resources: batch },
        );
        return;
      }
      const preparedObject = await prepareObject();
      uncertainTarget.current = isCreate ? preparedObject : resource;
      let result;
      mutationSent = true;
      if (isCreate || isEdit)
        result = await api.request(api.resourcePath(preparedObject), {
          method: isCreate ? "POST" : "PUT",
          body: { object: preparedObject, dryRun: false, ...targetEnvelope },
        });
      else if (isDelete)
        result = await api.request(api.resourcePath(resource), {
          method: "DELETE",
          body: {
            uid: resource.metadata.uid,
            resourceVersion:
              reviewedVersion || resource.metadata.resourceVersion,
          },
        });
      else {
        const path = new URL(
          api.resourcePath(resource),
          window.location.origin,
        );
        const address = Object.fromEntries(path.searchParams);
        result = await api.request("/api/actions", {
          method: "POST",
          body: {
            ...address,
            context: cluster,
            action: actionType,
            uid: resource.metadata.uid,
            resourceVersion:
              reviewedVersion ||
              (isResources
                ? object.metadata.resourceVersion
                : resource.metadata.resourceVersion),
            ...(actionType === "scale" ? { replicas: Number(replicas) } : {}),
            ...(actionType === "rollback"
              ? { revision: Number(revision) }
              : {}),
            ...(isResources
              ? {
                  containers: containers.map((c) => ({
                    name: c.name,
                    resources: c.resources || {},
                  })),
                }
              : {}),
          },
        });
      }
      submitted.current = true;
      const safeSubmission = secretSafeSubmission(result, {
        action: actionType,
        resource,
        object: preparedObject,
        targetNode: targetNode
          ? {
              name: targetNode.metadata.name,
              uid: targetNode.metadata.uid,
              mode: placementMode,
            }
          : undefined,
        placementMode,
        targetReplicas: actionType === "scale" ? Number(replicas) : undefined,
      });
      clearSecretDraft();
      onSubmitted?.(safeSubmission.result, safeSubmission.meta);
    } catch (err) {
      setError(err.message);
      if (
        mutationSent &&
        (!err.status || err.status >= 500 || err.status === 408)
      )
        setUncertain(true);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };
  const reconcileUncertain = async () => {
    if (busyRef.current || !uncertainTarget.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      const current = await api.request(
        api.resourcePath(uncertainTarget.current),
      );
      if (
        resource?.metadata?.uid &&
        current.metadata?.uid !== resource.metadata.uid
      ) {
        setReconciliation(
          "Aynı ad artık farklı UID’ye ait. Eski işlem bu kaynağa tekrar gönderilmeyecek.",
        );
      } else {
        setReconciliation(
          `Gerçek API kaydı gözlendi: ${current.kind} ${current.metadata?.namespace || ""}/${current.metadata?.name} · UID ${current.metadata?.uid} · resourceVersion ${current.metadata?.resourceVersion}. Kaynağı yeniden açıp gerçek durumu inceleyin; bu gözlem önceki isteğin kabul edildiğini tek başına kanıtlamaz.`,
        );
      }
    } catch (error) {
      setReconciliation(
        error.status === 404
          ? "Gerçek API şu anda 404 döndürüyor. Önceki isteğin nihai sonucu belirsiz; istek otomatik tekrarlanmadı."
          : error.message,
      );
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };
  const previewDrain = async () => {
    setBusy(true);
    setError("");
    try {
      const address = Object.fromEntries(
        new URL(api.resourcePath(resource), window.location.origin)
          .searchParams,
      );
      const result = await api.request("/api/actions", {
        method: "POST",
        body: {
          ...address,
          context: cluster,
          action: "drain-preview",
          uid: resource.metadata.uid,
          resourceVersion: reviewedVersion || resource.metadata.resourceVersion,
        },
      });
      setDrainPreview(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  const loadSchema = async () => {
    setSchemaLoading(true);
    setError("");
    try {
      const openapi = await api.request("/api/openapi");
      const found = Object.values(openapi.definitions || {}).find((def) =>
        def["x-kubernetes-group-version-kind"]?.some(
          (item) =>
            item.kind === object.kind &&
            `${item.group ? item.group + "/" : ""}${item.version}` ===
              object.apiVersion,
        ),
      );
      setSchemaHelp(
        found
          ? {
              title: `${object.apiVersion} · ${object.kind}`,
              description: found.description,
              required: found.required || [],
              properties: Object.entries(found.properties || {}).map(
                ([name, definition]) => ({
                  name,
                  description: definition.description || "",
                  type:
                    definition.type ||
                    definition.$ref?.split(".").at(-1) ||
                    "object",
                }),
              ),
            }
          : {
              title: `${object.apiVersion} · ${object.kind}`,
              description:
                "Bu kaynak için OpenAPI v2 şeması bulunamadı. YAML/JSON inceleme ve server dry-run yine kullanılabilir.",
              properties: [],
              required: [],
            },
      );
    } catch (err) {
      setError(`Şema alınamadı: ${err.message}`);
    } finally {
      setSchemaLoading(false);
    }
  };
  const refreshVersion = async () => {
    if (!resource || Array.isArray(resource)) return;
    setBusy(true);
    setError("");
    try {
      const current = await api.request(api.resourcePath(resource));
      if (current.metadata?.uid !== resource.metadata.uid)
        throw new Error(
          "Aynı ad artık farklı UID’ye ait. Paneli kapatıp yeni kaynağı seçin.",
        );
      setObject((previous) => ({
        ...previous,
        metadata: {
          ...previous.metadata,
          resourceVersion: current.metadata.resourceVersion,
        },
      }));
      setReviewedVersion(current.metadata.resourceVersion);
      setPreview(null);
      setError(
        "Güncel resourceVersion alındı. Düzenlediğiniz alanları yeniden gözden geçirin ve tekrar doğrulayın.",
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  const targetName = batch.length
    ? `${batch.length} kaynak`
    : resource?.metadata?.name;
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) attemptClose();
      }}
    >
      <section
        onWheel={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        className={`resource-form-dialog ${isDelete ? "dialog-danger" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="resource-form-title"
        ref={dialog}
      >
        <header className="form-dialog-header">
          <div>
            <span className="eyebrow">
              {cluster || "Bağlantı yok"} ·{" "}
              {resource?.metadata?.namespace || namespace || "Küme kapsamı"}
            </span>
            <h2 id="resource-form-title">
              {isCreate && targetNode
                ? "Bu gemiye Pod ekle"
                : TITLES[actionType] || "Kaynak işlemi"}
            </h2>
            <p>
              {isCreate
                ? "Kubernetes API ile oluştur, gerçek watch verisiyle takip et."
                : `${resource?.kind || ""} ${targetName || ""}`}
            </p>
          </div>
          <button
            className="icon-button"
            aria-label="Formu kapat"
            onClick={attemptClose}
            disabled={busy}
          >
            <X size={20} />
          </button>
        </header>
        <form onSubmit={submit}>
          <div className="form-dialog-body">
            {readOnly && (
              <div className="inline-alert alert-warning">
                Salt okunur bağlantı. Formu inceleyebilirsiniz; gerçek mutasyon
                için backend yazma erişimi gerekir.
              </div>
            )}
            {error && (
              <div
                className="inline-alert alert-danger"
                role="alert"
                tabIndex={-1}
                ref={errorRef}
              >
                <AlertCircle size={18} />
                <span>{error}</span>
                {purposeSecretEdit &&
                  /409|Conflict|çatış|değişti|resourceVersion/i.test(error) && (
                    <span>
                      Secret sürümü değişti. Taslak korunuyor; güncel içeriği
                      yüklemek için düzenlemeyi kapatıp yeniden açın. Sürüm
                      otomatik ilerletilmedi.
                    </span>
                  )}
                {!purposeSecretEdit &&
                  /409|Conflict|çatış|değişti|resourceVersion/i.test(error) && (
                    <button
                      type="button"
                      className="button"
                      disabled={busy}
                      onClick={refreshVersion}
                    >
                      Güncel sürümü al ve gözden geçir
                    </button>
                  )}
              </div>
            )}
            {loading && <p role="status">Kaynağın güncel sürümü alınıyor…</p>}
            {uncertain && (
              <div className="inline-alert alert-warning" role="status">
                <span>
                  Gönderimin sonucu belirsiz. Çift işlem oluşturmamak için
                  yeniden gönderim kapalı; gerçek kaynağı sorgulayın ve paneli
                  yeniden açarak gözden geçirin.
                </span>
                <button
                  type="button"
                  className="button"
                  disabled={busy}
                  onClick={reconcileUncertain}
                >
                  Gerçek kaynak durumunu sorgula
                </button>
                {reconciliation && <p>{reconciliation}</p>}
              </div>
            )}
            {isCreate && targetNode && (
              <section className="placement-section">
                <h3>Hedef gemi · {targetNode.metadata.name}</h3>
                <Field label="Pod yerleşimi">
                  <select
                    aria-label="Pod yerleşimi"
                    value={placementMode}
                    onChange={(e) => changePlacement(e.target.value)}
                  >
                    <option value="required">
                      Bu gemide çalışması zorunlu
                    </option>
                    <option value="preferred">Bu gemiyi tercih et</option>
                    <option value="scheduler">Scheduler karar versin</option>
                  </select>
                </Field>
                <p className="muted">
                  {placementMode === "required"
                    ? "Kaynak veya scheduling koşulları uygun değilse Pod bu gemiyi bekler."
                    : placementMode === "preferred"
                      ? "Scheduler başka bir Node seçebilir; mevcut zorunlu kısıtlar korunur."
                      : "Bu formun hedef tercihi kaldırılır; mevcut YAML kısıtları korunur."}
                </p>
                <details className="placement-technical">
                  <summary>Yerleşim kuralını incele</summary>
                  <p>
                    Node UID <code>{targetNode.metadata.uid}</code>. Kimlik hem
                    dry-run hem oluşturma öncesinde yeniden doğrulanır.
                  </p>
                  <p>
                    {placementMode === "required"
                      ? "metadata.name node affinity, mevcut her OR terimine AND olarak eklenir."
                      : placementMode === "preferred"
                        ? "Ağırlık 100 node affinity tercihi eklenir."
                        : "Yalnız bu formun eklediği kural kaldırılır."}{" "}
                    spec.nodeName yazılmaz.
                  </p>
                </details>
              </section>
            )}
            {purposeSecretEdit && (
              <div className="inline-alert alert-warning">
                Gerçek Secret değerleri yalnız bu yerel YAML formuna ayrı bir
                yetkili istekle alınır. data alanı base64 içerir; okunur
                değerler için stringData kullanılabilir. İşlem kaydı ve kaynak
                akışı yalnız metadata alır.
              </div>
            )}
            {(isCreate || isEdit) && (
              <>
                <div className="form-topline">
                  {isCreate ? (
                    <Field label="Kaynak türü">
                      <select
                        aria-label="Kaynak türü"
                        value={kind}
                        onChange={(e) => changeKind(e.target.value)}
                      >
                        {[
                          ...new Set([
                            kind,
                            ...(targetNode
                              ? [
                                  "Pod",
                                  "Deployment",
                                  "Job",
                                  "CronJob",
                                  "Diğer kaynak / YAML",
                                ]
                              : TYPES),
                          ]),
                        ].map((value) => (
                          <option key={value}>{value}</option>
                        ))}
                      </select>
                    </Field>
                  ) : (
                    <span>{object.kind}</span>
                  )}
                  <div className="segmented-control">
                    <button
                      type="button"
                      className={mode === "form" ? "active" : ""}
                      disabled={purposeSecretEdit}
                      onClick={() => switchMode("form")}
                    >
                      Form
                    </button>
                    <button
                      type="button"
                      className={mode === "yaml" ? "active" : ""}
                      onClick={() => switchMode("yaml")}
                    >
                      <FileCode2 size={14} />
                      YAML
                    </button>
                  </div>
                </div>
                {isCreate && kind === "Deployment" && (
                  <div className="inline-alert alert-info">
                    Uzun ömürlü uygulamalar için Deployment önerilir.
                    Controller, istenen replica sayısını korur.
                  </div>
                )}
                {isCreate &&
                  kind === "Pod" &&
                  (targetNode ? (
                    <p className="muted">
                      Bağımsız Pod controller tarafından yeniden oluşturulmaz.
                      Kalıcı uygulama için merkezden Deployment oluşturun.
                    </p>
                  ) : (
                    <div className="inline-alert alert-warning">
                      Bağımsız Pod controller tarafından yeniden oluşturulmaz.
                      Uzun ömürlü bir uygulama için Deployment seçin.
                    </div>
                  ))}
                {mode === "yaml" ? (
                  <>
                    <label className="form-field">
                      <span>Kaynak YAML</span>
                      <textarea
                        aria-label="Kaynak YAML"
                        className="yaml-editor"
                        spellCheck={false}
                        rows={22}
                        value={yamlText}
                        onChange={(e) => parseYAML(e.target.value)}
                      />
                    </label>
                    {yamlError && (
                      <div role="alert" className="inline-alert alert-danger">
                        {yamlError}
                      </div>
                    )}
                    <p className="muted">
                      Form ve YAML aynı nesneyi düzenler; formda bulunmayan
                      geçerli alanlar korunur.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="form-grid">
                      <Field label="Namespace">
                        <input
                          value={object.metadata?.namespace || ""}
                          disabled={
                            !isCreate ||
                            [
                              "Node",
                              "Namespace",
                              "PersistentVolume",
                              "ClusterRole",
                              "ClusterRoleBinding",
                              "StorageClass",
                              "CustomResourceDefinition",
                            ].includes(object.kind)
                          }
                          onChange={(e) =>
                            update((next) => {
                              next.metadata = {
                                ...next.metadata,
                                namespace: e.target.value,
                              };
                            })
                          }
                        />
                      </Field>
                      <Field label="Kaynak adı">
                        <input
                          value={object.metadata?.name || ""}
                          placeholder="ör. web-frontend"
                          disabled={!isCreate}
                          onChange={(e) => changeName(e.target.value)}
                        />
                      </Field>
                    </div>
                    {containers.length > 0 && (
                      <>
                        <Field
                          label="Ana container image"
                          hint="Registry, image adı ve tercihen sabit bir tag veya digest."
                        >
                          <input
                            value={containers[0]?.image || ""}
                            placeholder="nginx:1.27-alpine"
                            onChange={(e) =>
                              changeContainer(0, {
                                ...containers[0],
                                image: e.target.value,
                              })
                            }
                          />
                        </Field>
                        {["Deployment", "StatefulSet", "ReplicaSet"].includes(
                          object.kind,
                        ) && (
                          <Field label="Replica sayısı">
                            <input
                              type="number"
                              min={0}
                              step={1}
                              value={object.spec?.replicas ?? 1}
                              onChange={(e) =>
                                update((next) => {
                                  next.spec.replicas = Number(e.target.value);
                                })
                              }
                            />
                          </Field>
                        )}
                        {object.kind === "CronJob" && (
                          <Field
                            label="Cron zamanlaması"
                            hint="Beş alanlı standart Cron ifadesi; saat dilimi için gelişmiş YAML kullanın."
                          >
                            <input
                              value={object.spec?.schedule || ""}
                              onChange={(e) =>
                                update((next) => {
                                  next.spec.schedule = e.target.value;
                                })
                              }
                            />
                          </Field>
                        )}
                        <ContainerResources
                          container={containers[0]}
                          onChange={(value) => changeContainer(0, value)}
                        />
                        <details className="advanced-form">
                          <summary>
                            Container’lar ve gelişmiş seçenekler
                            <ChevronDown size={15} />
                          </summary>
                          {containers.map((c, index) => (
                            <div className="container-form-card" key={index}>
                              <div className="form-grid">
                                <Field label="Container adı">
                                  <input
                                    value={c.name || ""}
                                    onChange={(e) =>
                                      changeContainer(index, {
                                        ...c,
                                        name: e.target.value,
                                      })
                                    }
                                  />
                                </Field>
                                {index > 0 && (
                                  <Field label="Image">
                                    <input
                                      value={c.image || ""}
                                      onChange={(e) =>
                                        changeContainer(index, {
                                          ...c,
                                          image: e.target.value,
                                        })
                                      }
                                    />
                                  </Field>
                                )}
                                <Field label="Container portu">
                                  <input
                                    type="number"
                                    min={1}
                                    max={65535}
                                    placeholder="Tanımsız"
                                    value={c.ports?.[0]?.containerPort || ""}
                                    onChange={(e) =>
                                      changeContainer(index, {
                                        ...c,
                                        ports: e.target.value
                                          ? [
                                              {
                                                ...(c.ports?.[0] || {}),
                                                containerPort: Number(
                                                  e.target.value,
                                                ),
                                              },
                                              ...(c.ports?.slice(1) || []),
                                            ]
                                          : c.ports?.slice(1) || [],
                                      })
                                    }
                                  />
                                </Field>
                              </div>
                              <Field
                                label="Komut (JSON dizi)"
                                hint='Örn. ["/bin/sh", "-c"] · boş değer varsayılan image komutunu kullanır.'
                              >
                                <input
                                  defaultValue={
                                    c.command ? JSON.stringify(c.command) : ""
                                  }
                                  onBlur={(e) => {
                                    try {
                                      const value = e.target.value
                                        ? JSON.parse(e.target.value)
                                        : undefined;
                                      if (
                                        value &&
                                        (!Array.isArray(value) ||
                                          value.some(
                                            (v) => typeof v !== "string",
                                          ))
                                      )
                                        throw new Error(
                                          "Komut string dizisi olmalı.",
                                        );
                                      const next = { ...c };
                                      value
                                        ? (next.command = value)
                                        : delete next.command;
                                      changeContainer(index, next);
                                      setFieldErrors((prev) => {
                                        const copy = { ...prev };
                                        delete copy[`command-${index}`];
                                        return copy;
                                      });
                                    } catch (err) {
                                      setError(err.message);
                                      setFieldErrors((prev) => ({
                                        ...prev,
                                        [`command-${index}`]: err.message,
                                      }));
                                    }
                                  }}
                                />
                              </Field>
                              <Field label="Argümanlar (JSON dizi)">
                                <input
                                  defaultValue={
                                    c.args ? JSON.stringify(c.args) : ""
                                  }
                                  onBlur={(e) => {
                                    try {
                                      const value = e.target.value
                                        ? JSON.parse(e.target.value)
                                        : undefined;
                                      if (
                                        value &&
                                        (!Array.isArray(value) ||
                                          value.some(
                                            (v) => typeof v !== "string",
                                          ))
                                      )
                                        throw new Error(
                                          "Argümanlar string dizisi olmalı.",
                                        );
                                      const next = { ...c };
                                      value
                                        ? (next.args = value)
                                        : delete next.args;
                                      changeContainer(index, next);
                                      setFieldErrors((prev) => {
                                        const copy = { ...prev };
                                        delete copy[`args-${index}`];
                                        return copy;
                                      });
                                    } catch (err) {
                                      setError(err.message);
                                      setFieldErrors((prev) => ({
                                        ...prev,
                                        [`args-${index}`]: err.message,
                                      }));
                                    }
                                  }}
                                />
                              </Field>
                              <Field
                                label="Environment ve referanslar (YAML dizi)"
                                hint="name/value veya valueFrom.secretKeyRef/configMapKeyRef kullanılabilir."
                              >
                                <textarea
                                  rows={4}
                                  defaultValue={stringify(c.env || [])}
                                  spellCheck={false}
                                  onBlur={(e) => {
                                    try {
                                      const env = parse(e.target.value);
                                      if (!Array.isArray(env))
                                        throw new Error(
                                          "Environment bir YAML dizi olmalı.",
                                        );
                                      changeContainer(index, { ...c, env });
                                      setFieldErrors((prev) => {
                                        const copy = { ...prev };
                                        delete copy[`env-${index}`];
                                        return copy;
                                      });
                                    } catch (err) {
                                      setError(err.message);
                                      setFieldErrors((prev) => ({
                                        ...prev,
                                        [`env-${index}`]: err.message,
                                      }));
                                    }
                                  }}
                                />
                              </Field>
                              {index > 0 && (
                                <ContainerResources
                                  container={c}
                                  onChange={(value) =>
                                    changeContainer(index, value)
                                  }
                                />
                              )}
                              {index > 0 && (
                                <button
                                  type="button"
                                  className="button button-danger"
                                  onClick={() =>
                                    update((next) => {
                                      podSpec(next).containers.splice(index, 1);
                                    })
                                  }
                                >
                                  Container’ı kaldır
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            type="button"
                            className="button"
                            onClick={() =>
                              update((next) => {
                                podSpec(next).containers.push({
                                  name: `sidecar-${containers.length}`,
                                  image: "",
                                });
                              })
                            }
                          >
                            <Plus size={15} />
                            Ek container
                          </button>
                          <Field label="ServiceAccount">
                            <input
                              value={podSpec(object)?.serviceAccountName || ""}
                              placeholder="default"
                              onChange={(e) =>
                                update((next) => {
                                  if (e.target.value)
                                    podSpec(next).serviceAccountName =
                                      e.target.value;
                                  else delete podSpec(next).serviceAccountName;
                                })
                              }
                            />
                          </Field>
                          <p className="muted">
                            Probe, volume, affinity/toleration, label/annotation
                            ve update strategy alanlarını YAML görünümünde
                            düzenleyebilirsiniz. Bu alanlar form görünümüne
                            dönüşte korunur.
                          </p>
                        </details>
                      </>
                    )}
                    {object.kind === "Service" && (
                      <>
                        <Field label="Service türü">
                          <select
                            value={object.spec?.type || "ClusterIP"}
                            onChange={(e) =>
                              update((next) => {
                                next.spec.type = e.target.value;
                              })
                            }
                          >
                            {["ClusterIP", "NodePort", "LoadBalancer"].map(
                              (t) => (
                                <option key={t}>{t}</option>
                              ),
                            )}
                          </select>
                        </Field>
                        <Field label="Selector app">
                          <input
                            value={object.spec?.selector?.app || ""}
                            onChange={(e) =>
                              update((next) => {
                                next.spec.selector = {
                                  ...next.spec.selector,
                                  app: e.target.value,
                                };
                              })
                            }
                          />
                        </Field>
                        <div className="form-grid">
                          <Field label="Service portu">
                            <input
                              type="number"
                              min={1}
                              max={65535}
                              value={object.spec?.ports?.[0]?.port || 80}
                              onChange={(e) =>
                                update((next) => {
                                  next.spec.ports[0].port = Number(
                                    e.target.value,
                                  );
                                })
                              }
                            />
                          </Field>
                          <Field label="Hedef port">
                            <input
                              value={object.spec?.ports?.[0]?.targetPort || 80}
                              onChange={(e) =>
                                update((next) => {
                                  next.spec.ports[0].targetPort = /^\d+$/.test(
                                    e.target.value,
                                  )
                                    ? Number(e.target.value)
                                    : e.target.value;
                                })
                              }
                            />
                          </Field>
                        </div>
                      </>
                    )}
                    {!containers.length && object.kind !== "Service" && (
                      <p className="muted">
                        Bu türün alanlarını YAML görünümünden düzenleyin. API
                        sunucusu şema ve immutable alan doğrulamasını yapar.
                      </p>
                    )}
                  </>
                )}
              </>
            )}
            {isResources && (
              <>
                {actionType === "resize" ? (
                  <div className="inline-alert alert-warning">
                    Yalnız {resource.metadata.name} UID’sinin istenen container
                    kaynakları pods/resize ile değişir. Owner workload şablonu
                    değişmez. Deferred, Infeasible, Pending veya InProgress
                    sonucu ayrıntı panelinden izlenir.
                  </div>
                ) : (
                  <div className="inline-alert alert-info">
                    {resource.kind}/{resource.metadata.name} workload şablonu
                    güncellenecek.{" "}
                    {resource.kind === "DaemonSet"
                      ? `${resource.status?.desiredNumberScheduled ?? "Gözlenen"} Node yerleşimi`
                      : `${resource.spec?.replicas ?? 1} replica`}{" "}
                    etkilenir. Update strategy’ye göre rollout beklenir.
                  </div>
                )}
                <p>
                  Request, scheduling için ayrılan miktardır. Limit üst
                  sınırdır; boş limit “tanımlı değil” anlamına gelir. Gerçek
                  kullanım ayrı bir metrik olarak gösterilir.
                </p>
                {containers.map((c, i) => (
                  <ContainerResources
                    key={c.name}
                    container={c}
                    onChange={(value) => changeContainer(i, value)}
                  />
                ))}
                <p className="muted">
                  {actionType === "resize"
                    ? "API kabulü, kubelet’in yeni kaynakları uyguladığı anlamına gelmez. İstenen spec ile container status kaynaklarını karşılaştırın. Kullanılamıyorsa Pod silinmez."
                    : "Node’un fiziksel kapasitesi değiştirilmez. Bu akış Pod’u yerinde resize etmez; pods/resize ayrı bir API yeteneğidir."}
                </p>
                {!containers.length && (
                  <div className="inline-alert alert-danger">
                    Bu kaynakta düzenlenebilir workload container şablonu
                    bulunamadı.
                  </div>
                )}
              </>
            )}
            {actionType === "scale" && (
              <>
                <div className="replica-summary">
                  <div>
                    <span>Mevcut</span>
                    <strong>{resource.status?.replicas ?? 0}</strong>
                  </div>
                  <div>
                    <span>İstenen</span>
                    <strong>{resource.spec?.replicas ?? 1}</strong>
                  </div>
                  <div>
                    <span>Hazır</span>
                    <strong>{resource.status?.readyReplicas ?? 0}</strong>
                  </div>
                </div>
                {hpa && (
                  <div className="inline-alert alert-warning">
                    Bu workload {hpa.metadata.name} HPA tarafından yönetiliyor.
                    Min: {hpa.spec?.minReplicas ?? 1}, max:{" "}
                    {hpa.spec?.maxReplicas}. Manuel scale kapalı; HPA kaynağını
                    düzenleyin.
                  </div>
                )}
                <Field label="Yeni replica sayısı">
                  <div className="replica-stepper">
                    <button
                      type="button"
                      className="button"
                      aria-label="Replica azalt"
                      disabled={Number(replicas) <= 0 || !!hpa}
                      onClick={() => {
                        setDirty(true);
                        setReplicas((n) => Math.max(0, Number(n) - 1));
                      }}
                    >
                      <Minus size={18} />
                    </button>
                    <input
                      aria-label="Yeni replica sayısı"
                      type="number"
                      min={0}
                      step={1}
                      disabled={!!hpa}
                      value={replicas}
                      onChange={(e) => {
                        setDirty(true);
                        setReplicas(e.target.value);
                      }}
                    />
                    <button
                      type="button"
                      className="button"
                      aria-label="Replica artır"
                      disabled={!!hpa}
                      onClick={() => {
                        setDirty(true);
                        setReplicas((n) => Number(n) + 1);
                      }}
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </Field>
                <p className="change-summary">
                  İstenen replica:{" "}
                  <strong>
                    {resource.spec?.replicas ?? 1} → {replicas}
                  </strong>
                  . İşlem gerçek scale alt kaynağına gönderilir; hazır duruma
                  geçiş watch verisinden izlenir.
                </p>
                {resource.kind === "StatefulSet" && (
                  <p className="muted">
                    StatefulSet ordinal kimliği ve sıralı oluşturma/sonlandırma
                    kuralları controller tarafından korunur.
                  </p>
                )}
              </>
            )}
            {actionType === "restart" && (
              <>
                <div className="inline-alert alert-warning">
                  Pod template restart annotation’ı güncellenir. Yeni/eski
                  Pod’ların geçişi{" "}
                  {resource.spec?.strategy?.type ||
                    resource.spec?.updateStrategy?.type ||
                    "controller update strategy"}{" "}
                  ile yönetilir.
                </div>
                {resource.spec?.updateStrategy?.type === "OnDelete" && (
                  <p>
                    OnDelete stratejisinde controller mevcut Pod’ları otomatik
                    değiştirmez. Restart annotation tek başına tamamlanmış
                    rollout anlamına gelmez.
                  </p>
                )}
                <p>
                  Replica hedefi değiştirilmez. İşlem yalnız API kabulü ile
                  tamamlanmış sayılmaz; gözlenen Pod ve Ready durumları takip
                  edilir.
                </p>
              </>
            )}
            {isDelete && (
              <>
                <div className="inline-alert alert-danger">
                  <AlertCircle size={18} />
                  <span>
                    {batch.length
                      ? `${batch.length} kaynak için ayrı silme isteği gönderilecek. Kısmi başarısızlıklar kaynak bazında gösterilir.`
                      : `${resource.kind} kaynağı ${cluster} kümesinden silinecek.`}{" "}
                    Normal grace period ve finalizer davranışı korunur.
                  </span>
                </div>
                {batch.length ? (
                  <div className="delete-resource-list">
                    {batch.map((r) => (
                      <p key={r.metadata.uid}>
                        <strong>
                          {r.kind}/{r.metadata.name}
                        </strong>
                        <span>{r.metadata.namespace || "Küme kapsamı"}</span>
                      </p>
                    ))}
                  </div>
                ) : (
                  <dl className="delete-summary">
                    <dt>Ad</dt>
                    <dd>{resource.metadata.name}</dd>
                    <dt>Tür</dt>
                    <dd>{resource.kind}</dd>
                    <dt>Namespace</dt>
                    <dd>{resource.metadata.namespace || "Küme kapsamı"}</dd>
                    <dt>Cluster</dt>
                    <dd>{cluster}</dd>
                    <dt>UID</dt>
                    <dd className="break-value">{resource.metadata.uid}</dd>
                  </dl>
                )}
                {resource?.kind === "Pod" &&
                  resource.metadata?.ownerReferences?.length > 0 && (
                    <div className="inline-alert alert-warning">
                      Bu Pod bir controller’a bağlı. Silinen Pod yerine yeni UID
                      ile başka bir Pod oluşturulabilir. Workload’u küçültmek
                      için sahibinin replica sayısını değiştirin.
                    </div>
                  )}
                {resource?.kind === "CustomResourceDefinition" && (
                  <div className="inline-alert alert-danger">
                    CRD tanımını silmek bu türe ait custom resource
                    instance’larını da etkiler. Bu işlem tek bir instance
                    silmekten farklıdır.
                  </div>
                )}
                <Field label={`Onaylamak için “${targetName}” yazın`}>
                  <input
                    value={confirmation}
                    autoComplete="off"
                    onChange={(e) => setConfirmation(e.target.value)}
                  />
                </Field>
                {bulkResults && (
                  <div className="bulk-results">
                    {bulkResults.map((row) => (
                      <div
                        key={row.resource.metadata.uid}
                        className={`inline-alert ${row.accepted ? "alert-info" : "alert-danger"}`}
                      >
                        <strong>{row.resource.metadata.name}</strong>
                        <span>
                          {row.accepted
                            ? "API silmeyi kabul etti · kaybolması bekleniyor"
                            : row.error}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
            {actionType === "rollback" && (
              <>
                <div className="inline-alert alert-warning">
                  Deployment’ın kendi ReplicaSet revision geçmişindeki Pod
                  template’i geri yüklenir. Replica hedefi korunur; yeni rollout
                  gerçek watch durumundan izlenir. Silinmiş revision geçmişi
                  geri alınamaz.
                </div>
                <Field
                  label="Hedef revision"
                  hint="0: bir önceki revision. İlgili ReplicaSet’i YAML sekmesinden inceleyebilirsiniz."
                >
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={revision}
                    onChange={(e) => setRevision(e.target.value)}
                  />
                </Field>
                <div className="revision-list">
                  {resources
                    .filter(
                      (r) =>
                        r.kind === "ReplicaSet" &&
                        r.metadata?.ownerReferences?.some(
                          (o) => o.uid === resource.metadata.uid,
                        ),
                    )
                    .map((r) => (
                      <p key={r.metadata.uid}>
                        Revision{" "}
                        {r.metadata.annotations?.[
                          "deployment.kubernetes.io/revision"
                        ] || "—"}{" "}
                        · {r.metadata.name} ·{" "}
                        {r.spec?.template?.spec?.containers
                          ?.map((c) => c.image)
                          .join(", ")}
                      </p>
                    ))}
                </div>
              </>
            )}
            {["run-now", "suspend", "resume"].includes(actionType) && (
              <>
                <div className="inline-alert alert-info">
                  {actionType === "run-now"
                    ? "CronJob jobTemplate’inden gerçek, ayrı bir Job oluşturulur. CronJob zamanlaması değiştirilmez; Job’un Pod’ları watch verisiyle izlenir."
                    : actionType === "suspend"
                      ? "CronJob suspend=true olur. Başlamış Job’lar sonlandırılmaz; yalnız sonraki zamanlanmış çalıştırmalar durur."
                      : "CronJob suspend=false olur. Kaçırılmış zamanlamalar concurrency ve startingDeadlineSeconds kurallarına göre controller tarafından değerlendirilir."}
                </div>
                <p>
                  Zamanlama: <code>{resource.spec?.schedule}</code> · Aktif Job:{" "}
                  {resource.status?.active?.length || 0}
                </p>
              </>
            )}
            {actionType === "drain" && (
              <>
                <div className="inline-alert alert-warning">
                  Gerçek pods/eviction API’si kullanılır; PodDisruptionBudget
                  reddi her Pod için korunur. Doğrudan silmeye veya zorla
                  tahliyeye düşülmez.
                </div>
                <button
                  type="button"
                  className="button"
                  disabled={busy || readOnly}
                  onClick={previewDrain}
                >
                  Etkilenen Pod’ları önizle
                </button>
                {drainPreview && (
                  <>
                    <p>
                      Kapsam: {drainPreview.scope || "Küme geneli"} ·{" "}
                      {drainPreview.affected?.length || 0} gözlenen Pod
                    </p>
                    {drainPreview.partialScope && (
                      <div className="inline-alert alert-danger">
                        Bağlantı belirli namespace ile sınırlı. Node’un bütün
                        Pod’ları görülemediği için güvenli drain uygulanamaz.
                      </div>
                    )}
                    {!resource.spec?.unschedulable && (
                      <div className="inline-alert alert-warning">
                        Önce bu Node’a Cordon uygulayın. Drain kendiliğinden
                        cordon veya namespace kapsamını genişletmez.
                      </div>
                    )}
                    <div className="drain-preview-list">
                      {(drainPreview.affected || []).map((p) => (
                        <div key={p.uid}>
                          <strong>
                            {p.namespace}/{p.name}
                          </strong>
                          <span>
                            {p.evictable
                              ? "Eviction adayı"
                              : "Atlanır / engelli"}{" "}
                            ·{" "}
                            {p.reason ||
                              "PDB, eviction sırasında API tarafından denetlenir."}
                          </span>
                          {p.pdbBlocked && (
                            <span className="status-warning">
                              PDB şu anda tahliyeye izin vermiyor.
                            </span>
                          )}
                          {p.pdbInspectionError && (
                            <span className="status-warning">
                              PDB incelenemedi: {p.pdbInspectionError}
                            </span>
                          )}
                          {(p.pdbs || []).map((pdb) => (
                            <span key={`${pdb.namespace}/${pdb.name}`}>
                              PDB {pdb.name} · disruptionsAllowed{" "}
                              {pdb.disruptionsAllowed} · healthy{" "}
                              {pdb.currentHealthy}/{pdb.desiredHealthy}
                            </span>
                          ))}
                        </div>
                      ))}
                    </div>
                    <Field
                      label={`Onaylamak için “${resource.metadata.name}” yazın`}
                    >
                      <input
                        value={confirmation}
                        onChange={(e) => setConfirmation(e.target.value)}
                      />
                    </Field>
                    <p className="muted">
                      API kabulü tahliyenin tamamlandığı anlamına gelmez. İşlem
                      panelinde her Pod’un kabul/red sonucu gösterilir.
                    </p>
                  </>
                )}
              </>
            )}
            {["cordon", "uncordon"].includes(actionType) && (
              <>
                <div className="inline-alert alert-warning">
                  {actionType === "cordon"
                    ? "Yeni normal Pod atamaları durdurulur. Mevcut Pod’lar silinmez ve taşınmaz; drain yapılmaz."
                    : "Node yeni normal Pod atamalarına yeniden açılır. Diğer taint ve scheduling koşulları geçerli kalır."}
                </div>
                <p>
                  Bu Node üzerinde{" "}
                  {
                    resources.filter(
                      (r) =>
                        r.kind === "Pod" &&
                        r.spec?.nodeName === resource.metadata.name,
                    ).length
                  }{" "}
                  gözlenen Pod var. Fiziksel Node kapasitesi ve mevcut
                  container’lar değiştirilmez.
                </p>
              </>
            )}
            {(isCreate || isEdit) && (
              <details className="schema-help">
                <summary>Kubernetes OpenAPI şema yardımı</summary>
                <button
                  type="button"
                  className="button"
                  disabled={schemaLoading || readOnly}
                  onClick={loadSchema}
                >
                  {schemaLoading
                    ? "Şema alınıyor…"
                    : "Bu kaynak türünün gerçek şemasını yükle"}
                </button>
                {schemaHelp && (
                  <>
                    <h3>{schemaHelp.title}</h3>
                    <p>{schemaHelp.description}</p>
                    <p>
                      Zorunlu üst alanlar:{" "}
                      {schemaHelp.required.join(", ") || "Belirtilmedi"}
                    </p>
                    {schemaHelp.properties.map((property) => (
                      <details key={property.name}>
                        <summary>
                          <code>{property.name}</code> · {property.type}
                        </summary>
                        <p>{property.description || "Açıklama sunulmadı."}</p>
                      </details>
                    ))}
                  </>
                )}
              </details>
            )}
            {preview && (
              <section className="dry-run-preview">
                <div className="inline-alert alert-success">
                  <CheckCircle2 size={18} />
                  <span>
                    Server dry-run başarılı. Kaynak henüz uygulanmadı.
                  </span>
                </div>
                {resource && !Array.isArray(resource) && (
                  <details>
                    <summary>Önceki kaynak</summary>
                    <pre className="yaml-output">
                      {stringify(editableResource(resource))}
                    </pre>
                  </details>
                )}
                <details open>
                  <summary>Uygulanacak kaynak önizlemesi</summary>
                  <pre className="yaml-output">{stringify(preview)}</pre>
                </details>
              </section>
            )}
          </div>
          <footer className="form-dialog-footer">
            <p>Gönderiliyor → API kabulü → uygulanıyor → gözlenen sonuç</p>
            <div>
              <button
                type="button"
                className="button"
                disabled={busy}
                onClick={attemptClose}
              >
                {bulkResults ? "Kapat" : "Vazgeç"}
              </button>
              {(isCreate || isEdit || isResources) && (
                <button
                  type="button"
                  className="button"
                  disabled={
                    busy ||
                    loading ||
                    readOnly ||
                    (isEdit && resource?.kind === "Secret" && !secretReady) ||
                    !!yamlError
                  }
                  onClick={dryRun}
                >
                  <Eye size={15} />
                  {busy ? "Doğrulanıyor…" : "Server dry-run"}
                </button>
              )}
              <button
                type="submit"
                className={`button ${isDelete ? "button-danger" : "button-primary"}`}
                disabled={
                  busy ||
                  loading ||
                  readOnly ||
                  (purposeSecretEdit && !secretReady) ||
                  !!yamlError ||
                  (actionType === "scale" && !!hpa) ||
                  submitted.current ||
                  uncertain ||
                  (isResources && !containers.length) ||
                  (actionType === "drain" &&
                    (!drainPreview ||
                      drainPreview.partialScope ||
                      !resource.spec?.unschedulable)) ||
                  ((isCreate || isEdit || isResources) && !preview)
                }
              >
                {busy
                  ? "Gönderiliyor…"
                  : isCreate
                    ? "Oluştur"
                    : isDelete
                      ? "Silmeyi onayla"
                      : "Uygula"}
              </button>
            </div>
          </footer>
        </form>
        {discardPrompt && (
          <div
            className="discard-confirmation"
            role="alertdialog"
            aria-modal="true"
            aria-label="Kaydedilmemiş değişiklikler"
          >
            <h3>Değişiklikler kaydedilmedi</h3>
            <p>
              Formu kapatırsanız bu taslak ve dry-run önizlemesi kaybolur.
              Kubernetes’e henüz gönderilmedi.
            </p>
            <div>
              <button
                type="button"
                className="button"
                autoFocus
                onClick={() => setDiscardPrompt(false)}
              >
                Düzenlemeye devam et
              </button>
              <button
                type="button"
                className="button button-danger"
                onClick={closeForm}
              >
                Taslağı bırak ve kapat
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
