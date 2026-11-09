import React, { useMemo, useState } from "react";
import {
  Construction,
  Radio,
  Network,
  RefreshCw,
  Plus,
  Square,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Window from "./Window";
import { provisionTerminal } from "./useWorldProviders.js";

const dash = (value) => (value == null || value === "" ? "Bilinmiyor" : value);
const at = (value) =>
  value && Number.isFinite(Date.parse(value))
    ? new Date(value).toLocaleString("tr-TR")
    : "Bilinmiyor";
const phaseLabels = {
  accepted: "API kabul etti",
  preparing: "Sağlayıcı hazırlığı",
  provisioning: "Worker sağlanıyor",
  reconciling: "Gerçek envanter uzlaştırılıyor",
  registered: "Node kaydı gözlendi",
  "node-registered": "Node kaydı gözlendi",
  "waiting-ready": "Node Ready bekleniyor",
  ready: "Node Ready doğrulandı",
  succeeded: "Gözlenen sonuç başarılı",
  failed: "İşlem başarısız",
  cancelled: "İptal edildi",
  canceled: "İptal edildi",
  cancelling: "İptal sonucu uzlaştırılıyor",
  "timed-out": "Zaman aşımı · envanter denetlenmeli",
  unknown: "Sonuç henüz doğrulanamadı",
};
const phase = (value) => phaseLabels[value] || value || "Bilinmiyor";
const sourceLabels = {
  "verified-profile-and-kubernetes-inventory":
    "Profil ve Kubernetes envanteri doğrulandı",
  "minikube-worker-add-running": "Minikube worker ekleme komutu çalışıyor",
  "minikube-command-confirmed-worker-name": "Sağlayıcı worker adını doğruladı",
  "minikube-profile-and-kubelet-node-observation":
    "Profil ve gerçek kubelet/Node kaydı gözlendi",
};
function Row({ label, children }) {
  return (
    <div className="detail-row">
      <dt>{label}</dt>
      <dd className="break-value">{children ?? "Bilinmiyor"}</dd>
    </div>
  );
}
const run = (callback, ...args) =>
  Promise.resolve(callback?.(...args)).catch(() => {});

const FLOW_PAGE_SIZE = 25,
  FLOW_LIST_LIMIT = 512;
const flowEndpointName = (endpoint) =>
  [endpoint?.namespace, endpoint?.name || endpoint?.ip || "Bilinmiyor"]
    .filter(Boolean)
    .join("/");
const flowDescription = (flow) =>
  `${flowEndpointName(flow.source)} (UID ${flow.source?.uid || "eşleşmedi"}) → ${flowEndpointName(flow.destination)} (UID ${flow.destination?.uid || "eşleşmedi"}); ${flow.protocol || "protokol bilinmiyor"}, ${flow.verdict || "verdict bilinmiyor"}; ${at(flow.lastObserved)}; ${flow.eventCount ?? "bilinmeyen"} flow olayı`;

/** Contextual semantic access to the same authorized records used by 3D arrows. */
export function FlowList({
  measuredFlows,
  enabled = false,
  onEnable,
  onSelectFlow,
  mode = "live",
}) {
  const [search, setSearch] = useState(""),
    [page, setPage] = useState(0);
  const records = measuredFlows?.flows || [];
  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return records.slice(0, FLOW_LIST_LIMIT).filter(
      (flow) =>
        !query ||
        [
          flow.id,
          flow.protocol,
          flow.transportProtocol,
          flow.verdict,
          flow.direction,
          ...[flow.source, flow.destination].flatMap((endpoint) =>
            endpoint
              ? [
                  endpoint.name,
                  endpoint.namespace,
                  endpoint.uid,
                  endpoint.nodeName,
                  endpoint.nodeUID,
                  endpoint.ip,
                  endpoint.port,
                ]
              : [],
          ),
        ]
          .filter((value) => value != null)
          .join(" ")
          .toLowerCase()
          .includes(query),
    );
  }, [records, search]);
  const pages = Math.max(1, Math.ceil(rows.length / FLOW_PAGE_SIZE)),
    currentPage = Math.min(page, pages - 1);
  const visible = rows.slice(
    currentPage * FLOW_PAGE_SIZE,
    (currentPage + 1) * FLOW_PAGE_SIZE,
  );
  const omitted =
    (measuredFlows?.clientOmitted || 0) +
    Math.max(0, records.length - FLOW_LIST_LIMIT);
  const live = measuredFlows?.status === "live";
  const endpoint = (value) => (
    <>
      <span
        className="cell-truncate"
        style={{ maxWidth: 230, display: "block" }}
      >
        {flowEndpointName(value)}
      </span>
      <details>
        <summary style={{ fontSize: 12 }}>
          Pod UID{value?.uid ? "" : " · eşleşmedi"}
        </summary>
        <code className="break-value">
          {value?.uid || "Bilinmiyor; IP/porttan Pod kimliği varsayılmaz"}
        </code>
      </details>
    </>
  );
  return (
    <section
      className="resource-table-panel measured-flow-list"
      aria-label="Ölçülmüş trafik akışları"
    >
      <div className="facility-copy" style={{ flexShrink: 0 }}>
        <h2>Ölçülmüş trafik — Hubble</h2>
        {!enabled ? (
          <>
            <p>
              {mode === "demo"
                ? "Demo modunda gerçek Hubble trafiği okunmaz."
                : "Trafik katmanı kapalı. Yalnız yetkili context/namespace kapsamındaki gerçek sağlayıcı gözlemleri açılır; Service selector çizgileri ayrı topolojidir."}
            </p>
            <button
              className="button"
              disabled={mode === "demo" || !onEnable}
              onClick={onEnable}
            >
              Ölçülmüş trafik katmanını aç
            </button>
          </>
        ) : (
          <>
            <p role="status">
              Sağlayıcı: Hubble ·{" "}
              {live
                ? "Canlı sağlayıcı gözlemi"
                : measuredFlows?.status || "Durum doğrulanıyor"}{" "}
              · Pencere: {measuredFlows?.windowSeconds ?? "Bilinmiyor"} saniye ·
              Son veri:{" "}
              {at(measuredFlows?.updatedAt || measuredFlows?.observedAt)}
            </p>
            {!live && (
              <p className="inline-alert alert-warning">
                Güncel trafik doğrulanamadı; varsa son gözlemler tarihleriyle
                gösterilir.{" "}
                {measuredFlows?.error ||
                  "Bağlantı/izin bilgisi sağlayıcı yanıtından alınır."}
              </p>
            )}
            <p className="muted">
              {records.length} alınan /{" "}
              {measuredFlows?.totalFlowGroups ?? "bilinmeyen"} toplam grup ·
              Sağlayıcı penceresinde gösterilmeyen:{" "}
              {measuredFlows?.omittedGroups ?? "bilinmiyor"} · İstemcide
              gösterilmeyen: {omitted}. Flow olayı sayısı paket, byte veya bant
              genişliği değildir.
            </p>
            <details>
              <summary>Ölçüm sınırları ve kayıplar</summary>
              <p>
                Filtrelenen {measuredFlows?.filteredEvents ?? "bilinmiyor"} ·
                Sağlayıcı kaybı{" "}
                {measuredFlows?.providerLostEvents ?? "bilinmiyor"} · Kimlik
                eşlemesi kaybı {measuredFlows?.mappingDropped ?? "bilinmiyor"} ·
                Kuyrukta düşen {measuredFlows?.dropped ?? "bilinmiyor"} ·
                Özetlenen {measuredFlows?.summarized ?? "bilinmiyor"}. Protokol
                ve UID yalnız sağlayıcı tarafından bildirilen/eşleştirilen
                alanlardır; eksik bilgi bilinmiyor kalır.
              </p>
            </details>
          </>
        )}
      </div>
      {enabled && (
        <>
          <div className="table-toolbar">
            <label className="form-field" style={{ flex: 1, margin: 0 }}>
              Akışlarda ara
              <input
                aria-label="Ölçülmüş akışlarda ara"
                value={search}
                placeholder="Kaynak, hedef, namespace, UID, protokol veya verdict"
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(0);
                }}
              />
            </label>
          </div>
          <div
            className="table-scroll"
            tabIndex={0}
            aria-label="Akış tablosu; yatay kaydırılabilir"
          >
            <table className="resource-table">
              <caption className="sr-only">
                Hubble gözlemleri; akış inceleme düğmeleri klavyeyle açılabilir
              </caption>
              <thead>
                <tr>
                  {[
                    "Kaynak",
                    "Hedef",
                    "Protokol",
                    "Port (kaynak / hedef)",
                    "Verdict",
                    "Son gözlem",
                    "Flow olayı",
                    "İncele",
                  ].map((heading) => (
                    <th key={heading} scope="col">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((flow) => (
                  <tr key={flow.id}>
                    <td>{endpoint(flow.source)}</td>
                    <td>{endpoint(flow.destination)}</td>
                    <td>
                      {flow.protocol || "Bilinmiyor"}
                      <small style={{ display: "block" }}>
                        {flow.transportProtocol ||
                          "Taşıma protokolü bilinmiyor"}
                      </small>
                    </td>
                    <td>
                      {flow.source?.port ?? "?"} /{" "}
                      {flow.destination?.port ?? "?"}
                    </td>
                    <td>{flow.verdict || "Bilinmiyor"}</td>
                    <td>{at(flow.lastObserved)}</td>
                    <td>{flow.eventCount ?? "Veri yok"}</td>
                    <td>
                      <button
                        className="button"
                        aria-label={`Akışı incele: ${flowDescription(flow)}`}
                        onClick={() => onSelectFlow?.(flow)}
                        disabled={!onSelectFlow}
                      >
                        Akışı incele
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!rows.length && (
              <p className="empty-copy">
                {search
                  ? "Bu aramayla eşleşen gözlem yok."
                  : live
                    ? "Bu ölçüm penceresinde yetkili kapsama ait akış gözlenmedi."
                    : "Gösterilebilen gerçek akış gözlemi yok."}
              </p>
            )}
          </div>
          <div className="table-footer">
            <span>
              {rows.length ? currentPage * FLOW_PAGE_SIZE + 1 : 0}–
              {Math.min((currentPage + 1) * FLOW_PAGE_SIZE, rows.length)} /{" "}
              {rows.length} eşleşen akış · sayfa başına {FLOW_PAGE_SIZE}
            </span>
            <div>
              <button
                className="icon-button"
                aria-label="Önceki akış sayfası"
                disabled={currentPage === 0}
                onClick={() => setPage(currentPage - 1)}
              >
                <ChevronLeft size={16} />
              </button>
              <span>
                {currentPage + 1} / {pages}
              </span>
              <button
                className="icon-button"
                aria-label="Sonraki akış sayfası"
                disabled={currentPage + 1 >= pages}
                onClick={() => setPage(currentPage + 1)}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

export function ProviderWindow({
  providers,
  provisionOperations = [],
  busy = false,
  error = "",
  context,
  readOnly = false,
  onRefresh,
  onAddWorker,
  onCancelWorker,
  onClose,
  harborName,
  sharedImpactRequired = false,
}) {
  const [impactAcknowledged, setImpactAcknowledged] = useState(false);
  const local = providers?.minikube,
    hubble = providers?.hubble;
  const config = local?.configuration;
  const uncertain = providers?.clientRequest?.uncertain === true;
  const active = provisionOperations.some(
    (operation) => !provisionTerminal(operation),
  );
  const canAdd =
    (!sharedImpactRequired || impactAcknowledged) &&
    !readOnly &&
    !busy &&
    (uncertain || (local?.available && local?.canAdd && !active));
  return (
    <Window
      title="Sağlayıcılar ve worker ekleme"
      subtitle={`${harborName ? `${harborName} · ` : ""}${context || "Bağlı context yok"} · Gerçek yerel sağlayıcı işlemleri`}
      icon={Construction}
      onClose={onClose}
      className="utility-window providers-window"
      modal
    >
      <section className="detail-section">
        <h2>Minikube worker</h2>
        <p>
          Yalnız sunucuda önceden izin verilmiş profile gerçek worker eklenir.
          Tarayıcıdan komut veya bağlantı sırrı alınmaz.
        </p>
        {!providers && <p role="status">Sağlayıcı bilgisi henüz alınmadı.</p>}
        <dl>
          <Row label="Profil">{dash(config?.profile)}</Row>
          <Row label="Context">{dash(config?.context)}</Row>
          <Row label="Küme kimliği">
            {config?.clusterUID ? (
              <code>{config.clusterUID}</code>
            ) : (
              "Doğrulanamadı"
            )}
          </Row>
          <Row label="Driver">{dash(config?.driver)}</Row>
          <Row label="Node üst sınırı">{dash(config?.maxNodes)}</Row>
          <Row label="Worker ekleme">
            {readOnly
              ? "Salt okunur bağlantı"
              : local?.canAdd
                ? "Sunucu denetimine uygun"
                : "Kullanılamıyor"}
          </Row>
        </dl>
        {local?.reason && (
          <p className="inline-alert alert-info" role="status">
            {local.reason}
          </p>
        )}
        {readOnly && (
          <p className="inline-alert alert-warning">
            Yerel operatör izni ve backend yazma modu gerekir. Bu kontrol Node
            cordon veya Pod ölçekleme değildir.
          </p>
        )}
        {uncertain && (
          <p className="inline-alert alert-warning" role="status">
            Önceki isteğin sonucu belirsiz. Aynı istek anahtarı korunur; yeni
            worker isteği otomatik gönderilmez. Aşağıdaki eylem mevcut isteği
            uzlaştırır.
          </p>
        )}
        <div className="terminal-actions">
          {sharedImpactRequired && <label><input type="checkbox" checked={impactAcknowledged} onChange={(event) => setImpactAcknowledged(event.target.checked)} />Worker eklemenin ortak cluster altyapısını etkilemesini açıkça onaylıyorum</label>}
          <button
            className="button button-primary"
            disabled={!canAdd}
            onClick={() => run(onAddWorker, { acknowledged: impactAcknowledged })}
          >
            <Plus size={16} />
            {busy
              ? "İstek gönderiliyor…"
              : uncertain
                ? "Aynı isteği uzlaştır"
                : "Worker ekle"}
          </button>
          <button
            className="button"
            disabled={busy}
            onClick={() => run(onRefresh)}
          >
            <RefreshCw size={15} />
            Yenile
          </button>
        </div>
        <p className="muted">
          İstek/taslak gerçek Node sayısına girmez. CLI sonucu tek başına Ready
          değildir; gerçek kubelet kaydı ve Ready durumu ayrıca gözlenir.
        </p>
        {error && (
          <div className="inline-alert alert-danger" role="alert">
            {error}
          </div>
        )}
      </section>
      <section className="detail-section">
        <h2>İşlem kaydı</h2>
        {!provisionOperations.length && (
          <p className="empty-copy">
            Bu context için sağlayıcı işlemi gözlenmedi.
          </p>
        )}
        {provisionOperations.map((operation) => (
          <article className="container-card" key={operation.id}>
            <div>
              <strong>{phase(operation.status)}</strong>
              <Construction size={17} />
            </div>
            <dl>
              <Row label="İşlem kimliği">
                <code>{operation.id}</code>
              </Row>
              <Row label="Gözlenen aşama">
                {operation.stage
                  ? phase(operation.stage)
                  : sourceLabels[operation.stageSource] ||
                    phase(operation.status)}
              </Row>
              <Row label="Aşama kaynağı">{dash(operation.stageSource)}</Row>
              <Row label="Profil / context">
                {[operation.profile, operation.context]
                  .filter(Boolean)
                  .join(" / ") || "Bilinmiyor"}
              </Row>
              <Row label="Son güncelleme">
                {at(
                  operation.updatedAt ||
                    operation.finishedAt ||
                    operation.startedAt ||
                    operation.createdAt,
                )}
              </Row>
              {operation.nodeName && (
                <Row label="Node">{operation.nodeName}</Row>
              )}
              {operation.expectedName && !operation.nodeUID && (
                <Row label="İstek / beklenen worker">
                  {operation.expectedName} · gerçek Node kaydı henüz
                  doğrulanmadı
                </Row>
              )}
              {operation.nodeUID && (
                <Row label="Node UID">
                  <code>{operation.nodeUID}</code>
                </Row>
              )}
              {(operation.nodes || []).map((node, index) => (
                <Row key={node.uid || node.name || index} label="Gözlenen Node">
                  {dash(node.name)} · UID {dash(node.uid)} · Ready{" "}
                  {dash(node.ready == null ? null : String(node.ready))}
                </Row>
              ))}
            </dl>
            {(operation.message || operation.reason) && (
              <p>{operation.message || operation.reason}</p>
            )}
            {operation.cancelRequested && (
              <p className="inline-alert alert-warning">
                İptal istendi; sağlayıcının kısmi sonucu ve envanter
                uzlaştırması bekleniyor.
              </p>
            )}
            {!!operation.history?.length && (
              <details>
                <summary>Gerçek aşama geçmişi</summary>
                <ol>
                  {operation.history.map((row, index) => (
                    <li key={`${row.timestamp}:${index}`}>
                      {at(row.timestamp)} · {phase(row.stage || row.status)}
                      {row.message ? ` · ${row.message}` : ""}
                    </li>
                  ))}
                </ol>
              </details>
            )}
            {!provisionTerminal(operation) && (
              <button
                className="button"
                disabled={busy || readOnly}
                onClick={() => run(onCancelWorker, operation.id)}
              >
                <Square size={14} />
                İptal isteği
              </button>
            )}
          </article>
        ))}
        <p className="muted">
          İptal mevcut kümeyi veya yeni oluşmuş worker'ı otomatik silmez. Kısmi
          sonuç gerçek envanterle uzlaştırılmalıdır. Bu pencereyi kapatmak kabul
          edilmiş sağlayıcı işlemini iptal etmez.
        </p>
      </section>
      <section className="detail-section">
        <h2>
          <Radio size={18} /> Hubble trafik kaynağı
        </h2>
        <dl>
          <Row label="Yapılandırma">
            {hubble?.configured
              ? "Backend’de yapılandırıldı"
              : "Yapılandırılmamış / doğrulanamadı"}
          </Row>
          <Row label="Backend okuma adaptörü">
            {hubble?.available
              ? "Yapılandırıldı; gerçek erişim ve güncellik akış isteğinde denetlenir"
              : "Kullanılamıyor"}
          </Row>
          <Row label="Sağlayıcı durumu">{dash(hubble?.status)}</Row>
        </dl>
        {hubble?.reason && (
          <p className="inline-alert alert-info">{hubble.reason}</p>
        )}
        <p className="muted">
          TLS ve erişim bilgileri backend’de kalır. Ölçülmüş trafik katmanını
          Görünüm ve ayarlar’dan açın; selector çizgileri ayrı yapılandırma
          ilişkileridir.
        </p>
      </section>
    </Window>
  );
}

function FlowEndpoint({ title, endpoint = {}, onSelectResource, harbor }) {
  return (
    <section className="detail-section">
      <h2>
        {title}: {endpoint.name || endpoint.ip || "Bilinmiyor"}
      </h2>
      <dl>
        {harbor && <Row label="Liman">{harbor.harborName} · {harbor.harborId}</Row>}
        <Row label="Namespace">{dash(endpoint.namespace)}</Row>
        <Row label="Pod UID">
          {endpoint.uid ? (
            <code>{endpoint.uid}</code>
          ) : (
            "Bilinmiyor / eşleşmedi"
          )}
        </Row>
        <Row label="Node">{dash(endpoint.nodeName)}</Row>
        <Row label="Node UID">
          {endpoint.nodeUID ? <code>{endpoint.nodeUID}</code> : "Bilinmiyor"}
        </Row>
        <Row label="IP / port">
          {dash(endpoint.ip)} / {dash(endpoint.port)}
        </Row>
        <Row label="Container">{dash(endpoint.containerName)}</Row>
        <Row label="Kimlik eşlemesi">{dash(endpoint.identityStatus)}</Row>
      </dl>
      {endpoint.uid && onSelectResource && (
        <button
          className="button"
          onClick={() => onSelectResource(endpoint.uid)}
        >
          <ExternalLink size={14} />
          Kaynağı incele
        </button>
      )}
    </section>
  );
}
export function FlowWindow({
  flow,
  measuredFlows,
  context,
  onSelectResource,
  onClose,
  endpointHarbors,
}) {
  const sampleAt = Date.parse(measuredFlows?.observedAt || ""),
    lastAt = Date.parse(flow?.lastObserved || "");
  const windowSeconds = measuredFlows?.windowSeconds;
  const inWindow =
    Number.isFinite(sampleAt) &&
    Number.isFinite(lastAt) &&
    typeof windowSeconds === "number" &&
    windowSeconds > 0
      ? lastAt <= sampleAt && lastAt >= sampleAt - windowSeconds * 1000
      : null;
  return (
    <Window
      title="Ölçülmüş ağ akışı"
      subtitle={`${context || "Context bilinmiyor"} · Hubble gözlemi`}
      icon={Network}
      onClose={onClose}
      className="utility-window flow-window"
      modal
    >
      {!flow ? (
        <p className="empty-copy">Seçili akış bulunamadı.</p>
      ) : (
        <>
          <section className="detail-section">
            <h2>
              {flow.protocol || "Bilinmeyen protokol"} ·{" "}
              {flow.verdict || "Verdict bilinmiyor"}
            </h2>
            <dl>
              <Row label="Yön">{dash(flow.direction)}</Row>
              <Row label="Taşıma protokolü">{dash(flow.transportProtocol)}</Row>
              <Row label="İlk / son gözlem">
                {at(flow.firstObserved)} / {at(flow.lastObserved)}
              </Row>
              <Row label="Toplama penceresi">
                {measuredFlows?.windowSeconds == null
                  ? "Bilinmiyor"
                  : `${measuredFlows.windowSeconds} saniye`}
              </Row>
              <Row label="Gözlenen flow olayı">{dash(flow.eventCount)}</Row>
              <Row label="L7 olay/yanıt gecikmesi">
                {flow.latencyMs == null ? "Ölçüm yok" : `${flow.latencyMs} ms`}
              </Row>
              {(flow.httpProtocol != null || flow.httpCode != null) && (
                <Row label="Ölçülmüş HTTP protokolü / kodu">
                  {dash(flow.httpProtocol)} / {dash(flow.httpCode)}
                </Row>
              )}
              {flow.dnsRcode != null && (
                <Row label="Ölçülmüş DNS yanıt kodu">{flow.dnsRcode}</Row>
              )}
              {flow.dropReason && (
                <Row label="Drop gerekçesi">{flow.dropReason}</Row>
              )}
              <Row label="Sağlayıcı durumu">
                Hubble / {dash(measuredFlows?.status)}
              </Row>
              <Row label="Seçili akışın gözlemi">
                {inWindow === true
                  ? `${measuredFlows?.status === "live" ? "Güncel" : "Son sağlanan"} ${windowSeconds} saniyelik ölçüm penceresinde`
                  : inWindow === false
                    ? "Tarihsel gözlem · güncel pencere dışında"
                    : "Gözlem zamanı / pencere doğrulanamadı"}
              </Row>
              <Row label="Son sağlayıcı verisi">
                {at(measuredFlows?.updatedAt || measuredFlows?.observedAt)}
              </Row>
              <Row label="Düşürülen / özetlenen kayıt">
                {dash(measuredFlows?.dropped)} /{" "}
                {dash(measuredFlows?.summarized)}
              </Row>
              <Row label="Toplam / gösterilmeyen akış grubu">
                {dash(measuredFlows?.totalFlowGroups)} /{" "}
                {dash(measuredFlows?.omittedGroups)}
              </Row>
              <Row label="Filtrelenen / yinelenen olay">
                {dash(measuredFlows?.filteredEvents)} /{" "}
                {dash(measuredFlows?.duplicateEvents)}
              </Row>
              <Row label="Sağlayıcı kaybı / kimlik eşlenemeyen">
                {dash(measuredFlows?.providerLostEvents)} /{" "}
                {dash(measuredFlows?.mappingDropped)}
              </Row>
              <Row label="Ölçüm birimi">{dash(measuredFlows?.units)}</Row>
            </dl>
            <p className="muted">
              Olay sayısı paket, byte veya bant genişliği değildir. L7 gecikmesi
              bütün TCP bağlantısının RTT’si değildir. Porttan protokol veya
              şifreli mesaj içeriği çıkarılmaz; sağlayıcının vermediği alanlar
              bilinmiyor kalır.
            </p>
            {measuredFlows?.error && (
              <div className="inline-alert alert-warning" role="status">
                {measuredFlows.error} Son gözlemin zamanı yukarıdadır; güncel
                trafik doğrulanamadı.
              </div>
            )}
            {!!measuredFlows?.clientOmitted && (
              <p role="status">
                Görünüm sınırı: {measuredFlows.clientOmitted} ek kayıt bu
                pencerede özetlendi; olay veya kaynak sayısı değiştirilmedi.
              </p>
            )}
          </section>
          <FlowEndpoint
            title="Kaynak"
            endpoint={flow.source}
            harbor={endpointHarbors?.get(flow.source?.uid)}
            onSelectResource={onSelectResource}
          />
          <FlowEndpoint
            title="Hedef"
            endpoint={flow.destination}
            harbor={endpointHarbors?.get(flow.destination?.uid)}
            onSelectResource={onSelectResource}
          />
        </>
      )}
    </Window>
  );
}
