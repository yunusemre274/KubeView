// Facilities are application entry points, never synthetic Kubernetes objects.
export const FACILITIES = {
  center: {
    title: "Liman Yönetim Merkezi",
    short: "Yönetim Merkezi",
    description:
      "İş yükleri, kaynak kataloğu, küme olayları ve bağlantı yetkileri.",
    icon: "Building2",
    kinds: [
      "Deployment",
      "Pod",
      "StatefulSet",
      "DaemonSet",
      "ReplicaSet",
      "HorizontalPodAutoscaler",
      "PodDisruptionBudget",
    ],
    create: "Deployment",
  },
  workloads: {
    title: "Sefer Emirleri",
    short: "Sefer panosu",
    description:
      "Uygulama oluşturun, replica sayısını değiştirin ve rollout izleyin.",
    icon: "ClipboardList",
    kinds: [
      "Deployment",
      "StatefulSet",
      "DaemonSet",
      "ReplicaSet",
      "Pod",
      "HorizontalPodAutoscaler",
      "PodDisruptionBudget",
    ],
    create: "Deployment",
  },
  schedule: {
    title: "Sefer Tarifesi",
    short: "Takvim ve görevler",
    description:
      "Job ve CronJob oluşturma, zamanlama ve gerçek çalışma sonuçları.",
    icon: "CalendarClock",
    kinds: ["CronJob", "Job"],
    create: "CronJob",
  },
  scheduling: {
    title: "Yükleme ve Yerleştirme",
    short: "Yükleme vinçleri",
    description:
      "Bekleyen Pod yükleri ve Kubernetes scheduler tarafından bildirilen nedenler.",
    icon: "Construction",
    kinds: ["Pod"],
    create: "Pod",
  },
  storage: {
    title: "Depo ve Tahsisler",
    short: "Depo / ambar",
    description:
      "PV, PVC ve StorageClass; gerçek kapasite ve tahsis sözleşmeleri.",
    icon: "Warehouse",
    kinds: ["PersistentVolumeClaim", "PersistentVolume", "StorageClass"],
    create: "PersistentVolumeClaim",
  },
  config: {
    title: "Sevkiyat Talimatları",
    short: "Talimat panosu",
    description: "ConfigMap, namespace, quota ve limit yapılandırması.",
    icon: "FileSliders",
    kinds: ["ConfigMap", "Namespace", "ResourceQuota", "LimitRange"],
    create: "ConfigMap",
  },
  secrets: {
    title: "Kilitli Kasa",
    short: "Secret kasası",
    description:
      "Secret metadata ve izinli, amaçlı içerik okuma; değerler sahneye aktarılmaz.",
    icon: "LockKeyhole",
    kinds: ["Secret"],
    create: "Secret",
  },
  network: {
    title: "Ağ Yönlendirme Tesisi",
    short: "Ağ tesisi",
    description:
      "Service, EndpointSlice ve gerçek selector ilişkileri; trafik telemetrisi değildir.",
    icon: "Network",
    kinds: ["Service", "EndpointSlice", "NetworkPolicy"],
    create: "Service",
  },
  ingress: {
    title: "Giriş Rıhtımı ve Fener",
    short: "Giriş feneri",
    description:
      "Ingress ve cluster discovery içinde bulunan Gateway API kaynakları.",
    icon: "TowerControl",
    kinds: [
      "Ingress",
      "Gateway",
      "GatewayClass",
      "HTTPRoute",
      "TCPRoute",
      "TLSRoute",
      "GRPCRoute",
    ],
    create: "Ingress",
  },
  identity: {
    title: "Personel ve Yetkiler",
    short: "Kimlik bölümü",
    description: "ServiceAccount, gerçek Role kuralları ve binding ilişkileri.",
    icon: "ShieldCheck",
    kinds: [
      "ServiceAccount",
      "Role",
      "ClusterRole",
      "RoleBinding",
      "ClusterRoleBinding",
    ],
    create: "ServiceAccount",
  },
};
export function facilityFor(resource) {
  if (!resource) return "center";
  if (resource.kind === "Node" || resource.kind === "Pod") return null;
  return (
    Object.entries(FACILITIES).find(
      ([id, f]) => id !== "center" && f.kinds.includes(resource.kind),
    )?.[0] || "center"
  );
}
export function ownerNode(resource, resources) {
  if (resource?.kind === "Node") return resource;
  return (
    resources.find(
      (r) => r.kind === "Node" && r.metadata.name === resource?.spec?.nodeName,
    ) || null
  );
}
export const descriptorKey = (d) =>
  `${d.group ? d.group + "/" : ""}${d.version}|${d.resource}`;
export const apiVersionOf = (d) =>
  `${d.group ? d.group + "/" : ""}${d.version}`;
export function scopeResources(resources, namespace) {
  return resources.filter(
    (r) =>
      namespace === "all" ||
      !r.metadata.namespace ||
      r.metadata.namespace === namespace,
  );
}
