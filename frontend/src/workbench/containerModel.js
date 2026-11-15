export function podContainers(resource) {
  const spec = resource?.spec || {},
    status = resource?.status || {};
  return [
    ...(spec.containers || []).map((container) => ({
      ...container,
      role: "Uygulama container’ı",
      roleKey: "app",
      observed: status.containerStatuses?.find(
        (s) => s.name === container.name,
      ),
    })),
    ...(spec.initContainers || []).map((container) => ({
      ...container,
      role:
        container.restartPolicy === "Always"
          ? "Native sidecar"
          : "Init container",
      roleKey: container.restartPolicy === "Always" ? "sidecar" : "init",
      observed: status.initContainerStatuses?.find(
        (s) => s.name === container.name,
      ),
    })),
    ...(spec.ephemeralContainers || []).map((container) => ({
      ...container,
      role: "Geçici debug container",
      roleKey: "ephemeral",
      observed: status.ephemeralContainerStatuses?.find(
        (s) => s.name === container.name,
      ),
    })),
  ];
}
