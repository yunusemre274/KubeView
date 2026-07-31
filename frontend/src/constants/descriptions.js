// -----------------------------------------------------------------------------
// OBJECT_DESCRIPTIONS (3D Scene Object Hover Tooltip Dictionary)
// Provides clear, 1-sentence "What is this?" tooltips consistent with METAPHOR.md.
// -----------------------------------------------------------------------------

export const OBJECT_DESCRIPTIONS = {
  CRANE: {
    title: '🤖 Kube-scheduler (Liman Vinci)',
    description: 'Kube-scheduler — Yeni Pod\'ları hangi Node gemisine yükleyeceğine kaynak skorlarına göre karar verir.'
  },
  INGRESS: {
    title: '🗼 Ingress Gateway (Deniz Feneri)',
    description: 'Ingress — Dışarıdan gelen HTTP/HTTPS trafiğinin ilk uğrak noktası, yönlendirme kurallarına göre doğru Service\'e aktarır.'
  },
  KUBE_PROXY: {
    title: '⚡ Kube-proxy (Ağ İstasyonu)',
    description: 'Kube-proxy — Service trafiğini küme içinde doğru hedef Pod IP\'lerine (Endpoints) yönlendirir.'
  },
  JOB: {
    title: '⛵ Job (Geçici Görev Şalupası)',
    description: 'Job — Tek seferlik bir görevi veya toplu veri işlemini tamamlamak için oluşturulan geçici iş teknesi.'
  },
  SECRET: {
    title: '🔐 Secret (Kilitli Çelik Kasa)',
    description: 'Secret — Şifre, API token ve sertifika gibi hassas verileri güvenli saklar (içerik değerleri gizlidir).'
  },
  CONFIG_MAP: {
    title: '📋 ConfigMap (Sevkiyat Föyü Panosu)',
    description: 'ConfigMap — Şifrelenmemiş konfigürasyon ayarlarını ve ortam değişkenlerini panoda açık tutar.'
  },
  STORAGE_DEPOT: {
    title: '🏭 PV / PVC (Kiralanmış Depo Ambarı)',
    description: 'PersistentVolume — Pod silinse bile verilerin kalıcı tutulduğu karadaki bağımsız depolama ambarı.'
  },
  MASTER: {
    title: '🏢 Control Plane (Yönetim Binası)',
    description: 'Control Plane — API Server, etcd ve denetleyicilerin bulunduğu küme genel yönetim merkezi.'
  },
  SHIP: {
    title: '🚢 Worker Node (Kargo Gemisi)',
    description: 'Worker Node — Pod konteynırlarını taşıyan ve çalıştıran fiziki veya sanal sunucu gemisi.'
  },
  POD: {
    title: '📦 Pod (Kargo Konteynırı)',
    description: 'Pod — Uygulama konteynırlarının ve sidecar bileşenlerinin çalıştığı en küçük Kubernetes birimi.'
  },
  STATEFUL_SET: {
    title: '⚓ StatefulSet (Sabit Demirli Numaralı Gemi)',
    description: 'StatefulSet — Durum bilgisi saklayan, sabit numaralı (#0, #1) ve sıralı kimliğe sahip gemi filosu.'
  },
  DAEMON_SET: {
    title: '📡 DaemonSet (Gemi Direği Anteni)',
    description: 'DaemonSet — Tüm Worker Node gemilerinin direğinde otomatik çalışan arka plan izleme ekipmanı.'
  }
}
