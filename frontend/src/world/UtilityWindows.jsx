import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Anchor,
  ArrowUpRight,
  Building2,
  Search,
  Settings,
  HelpCircle,
  Radio,
  RefreshCw,
  Sun,
  Moon,
  Play,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Copy,
} from "lucide-react";
import Window from "./Window";
import { FACILITIES, facilityFor, scopeResources } from "./registry";
import { OPERATION_LABELS } from "./operations";
import { Events } from "./FacilityWindow";
import { DEFAULT_PREFERENCES, validatePreferences } from "./preferences";
import {
  CHECK_LABELS,
  CHECK_STATUS,
  PERMISSION_LABELS,
  safeConnectionDiagnostics,
} from "./connectionState.js";
const time = (v) =>
  v ? new Date(v).toLocaleString("tr-TR") : "Henüz alınmadı";
export function ConnectionWindow({
  connection,
  namespace,
  onNamespace,
  onClose,
  onEditHarbor,
}) {
  const harbor = connection.workspace?.activeHarbor;
  const {
    contexts,
    context,
    mode,
    selectSource,
    resources,
    watchNamespace,
    errors,
  } = connection;
  const namespaces = [
    ...new Set(
      [
        watchNamespace,
        connection.namespaceHint,
        namespace === "all" ? "" : namespace,
        ...resources.map((r) =>
          r.kind === "Namespace" ? r.metadata.name : r.metadata.namespace,
        ),
      ].filter(Boolean),
    ),
  ].sort();
  const [token, setToken] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const [namespaceName, setNamespaceName] = useState("");
  const [copied, setCopied] = useState(false);
  const scope = `${connection.sourceKey}:${namespace}`;
  const currentScope = useRef(scope);
  currentScope.current = scope;
  useEffect(() => {
    setError("");
    setBusy(false);
    setCopied(false);
    setNamespaceName("");
  }, [scope]);
  return (
    <Window
      title="Bağlantı ve kapsam"
      subtitle={harbor ? `${harbor.name} · ${connection.context} · ${harbor.namespaces.join(", ")}` : "Gerçek context ve namespace seçimi"}
      icon={Radio}
      onClose={onClose}
      className="utility-window connection-window"
      modal
    >
      {connection.authRequired ? (
        <form
          className="connection-login"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              await connection.login(token);
              setToken("");
            } catch (e) {
              setError(e.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <p>
            Bu sunucu erişim anahtarı gerektiriyor. Anahtar tarayıcı deposuna
            kaydedilmez.
          </p>
          <label className="form-field">
            Erişim anahtarı
            <input
              type="password"
              autoComplete="off"
              required
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
          </label>
          {error && (
            <p role="alert" className="inline-alert alert-danger">
              {error}
            </p>
          )}
          <button className="button button-primary" disabled={busy}>
            {busy ? "Bağlanıyor…" : "Oturum aç"}
          </button>
        </form>
      ) : (
        <>
          <p className="connection-intro">
            KubeView, sunucunun güvenilir yerel kubeconfig dosyası veya
            in-cluster ServiceAccount kimliğiyle bağlanır. Kubeconfig ve kimlik
            bilgileri tarayıcıya yüklenmez; global current-context
            değiştirilmez.
          </p>
          <label className="form-field">
            Cluster / context
            <select
              aria-label="Cluster / context"
              value={mode === "demo" ? "__demo__" : context}
              disabled={Boolean(harbor)}
              onChange={(e) => selectSource(e.target.value)}
            >
              {!context && mode !== "demo" && (
                <option value="">Küme seçin</option>
              )}
              {contexts.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
              <option value="__demo__">Demo — örnek veri</option>
            </select>
          </label>
          {harbor && <><p className="muted">Bağlantı ve yönetim onayı bu limanın kayıtlı namespace/label kapsamına bağlıdır. Aşağıdaki namespace seçimi bu kapsam içindeki görünüm filtresidir. Context değiştirmek liman yapılandırmasını açıkça düzenler; yönetim izni yeni kapsama taşınmaz.</p><button className="button" onClick={onEditHarbor}>Liman bağlantısını/kapsamını düzenle</button></>}
          <label className="form-field">
            Namespace kapsamı
            <select
              aria-label="Namespace kapsamı"
              value={namespace}
              onChange={(e) => onNamespace(e.target.value)}
            >
              <option value="all">{harbor ? "Bu limanın tüm namespace'leri" : "Tüm namespace’ler"}</option>
              {namespaces.filter((ns) => !harbor || harbor.namespaces.includes("*") || harbor.namespaces.includes(ns)).map((ns) => (
                <option key={ns}>{ns}</option>
              ))}
            </select>
          </label>
          {mode !== "demo" && (
            <div>
              <label className="form-field">
                Namespace adıyla kapsam
                <input
                  aria-label="Namespace adıyla kapsam"
                  value={namespaceName}
                  placeholder={
                    connection.namespaceHint || "İzinli namespace adı"
                  }
                  onChange={(event) => setNamespaceName(event.target.value)}
                />
              </label>
              <button
                className="button"
                onClick={() => {
                  const value = namespaceName.trim();
                  if (
                    !/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/.test(value) ||
                    value.length > 63
                  ) {
                    setError("Geçerli bir namespace adı yazın.");
                    return;
                  }
                  if (harbor && !harbor.namespaces.includes("*") && !harbor.namespaces.includes(value)) {
                    setError("Bu namespace limanın kayıtlı kapsamında değil. Liman bağlantısını/kapsamını düzenleyin.");
                    return;
                  }
                  setError("");
                  onNamespace(value);
                }}
              >
                Kapsamı uygula
              </button>
              <p className="muted">
                Namespace listeleme izniniz olmasa da bildiğiniz kapsamı
                açabilirsiniz; gerçek okuma/yazma yetkileri backend’de
                denetlenir.
              </p>
              {error && (
                <p className="inline-alert alert-danger" role="alert">
                  {error}
                </p>
              )}
            </div>
          )}
          <dl className="connection-grid">
            <dt>Tarayıcı ↔ backend</dt>
            <dd>
              {connection.isConnected ? "WebSocket açık" : "WebSocket kapalı"}
            </dd>
            <dt>Kubernetes API</dt>
            <dd>
              {mode === "demo"
                ? "Demo; bağlı değil"
                : connection.upstream
                  ? "Erişilebilir"
                  : "Doğrulanamadı / erişilemiyor"}
            </dd>
            <dt>Kaynak senkronizasyonu</dt>
            <dd>
              {mode === "demo"
                ? "Örnek veri"
                : connection.snapshotReady
                  ? "Snapshot alındı"
                  : "Bekleniyor"}
            </dd>
            <dt>Veri güncelliği</dt>
            <dd>
              {mode === "demo"
                ? "Örnek veri"
                : connection.stale
                  ? "Güncel değil"
                  : "Senkronize"}
            </dd>
            <dt>Son kaynak verisi</dt>
            <dd>{time(connection.lastUpdated)}</dd>
            <dt>İşlem modu</dt>
            <dd>
              {mode === "demo" || connection.readOnly
                ? "Salt okunur"
                : "Kubernetes RBAC denetimli"}
            </dd>
          </dl>
          {mode !== "demo" && (
            <>
              <dl
                className="connection-grid connection-checks"
                aria-label="Bağlantı kontrolleri"
                aria-busy={connection.connectionChecking}
              >
                {Object.entries(CHECK_LABELS).map(([key, label]) => {
                  const check = connection.connectionChecks?.checks?.[key];
                  return (
                    <React.Fragment key={key}>
                      <dt>{label}</dt>
                      <dd>
                        {key === "permissions" ? (
                          Object.entries(PERMISSION_LABELS).map(
                            ([resource, label]) => (
                              <span
                                key={resource}
                                className="connection-permission"
                              >
                                {label}:{" "}
                                {CHECK_STATUS[check?.[resource]?.status] ||
                                  "Henüz denetlenmedi"}
                              </span>
                            ),
                          )
                        ) : (
                          <>
                            <strong>
                              {CHECK_STATUS[check?.status] ||
                                "Henüz denetlenmedi"}
                            </strong>
                            {check?.message && <small>{check.message}</small>}
                          </>
                        )}
                      </dd>
                    </React.Fragment>
                  );
                })}
              </dl>
              {!connection.snapshotReady && !contexts.length && (
                <p className="inline-alert alert-info">
                  Sunucuda erişilebilir bir context bulunamadı. Güvenilir
                  kubeconfig ayarını kontrol edin; sonra yeniden bağlanın.
                </p>
              )}
              {connection.snapshotReady &&
                !connection.resources.some(
                  (r) =>
                    r.kind === "Pod" &&
                    (namespace === "all" || r.metadata.namespace === namespace),
                ) && (
                  <p className="inline-alert alert-info">
                    Bu kapsamda gözlenen Pod yok. Boş veya yetkisiz kapsamın
                    ayrıntısı okuma izinlerinde görünür; örnek yük eklenmez.
                  </p>
                )}
              <p className="muted">
                Başlangıç salt okunurdur. Yönetim modunu açmak Kubernetes
                yetkisi vermez; her işlem gerçek API ve RBAC denetiminden geçer.
                Context veya namespace değişince yeniden açmanız gerekir.
              </p>
              <button
                className="button"
                disabled={
                  busy ||
                  !connection.connectionChecks?.connectionID ||
                  (!connection.managementEnabled &&
                    !connection.managementAvailable)
                }
                onClick={async () => {
                  if (busy) return;
                  const captured = scope;
                  setBusy(true);
                  setError("");
                  try {
                    await connection.setManagement(
                      !connection.managementEnabled,
                    );
                  } catch (e) {
                    if (currentScope.current === captured) setError(e.message);
                  } finally {
                    if (currentScope.current === captured) setBusy(false);
                  }
                }}
              >
                {busy
                  ? "İşlem modu denetleniyor…"
                  : connection.managementEnabled
                    ? "Salt okunur moda dön"
                    : "Yönetim modunu aç"}
              </button>
              {!connection.managementAvailable && (
                <p className="muted">
                  Sunucu salt okunur yapılandırılmış; yönetim modu bu sunucuda
                  açılamaz.
                </p>
              )}
            </>
          )}
          {errors.length > 0 && (
            <div className="connection-errors" role="status">
              {errors.slice(0, 10).map((e, i) => (
                <p key={i}>{typeof e === "string" ? e : JSON.stringify(e)}</p>
              ))}
            </div>
          )}
          <button className="button" onClick={connection.refresh}>
            <RefreshCw size={15} />
            Yeniden bağlan
          </button>
          <button
            className="button"
            onClick={async () => {
              const captured = scope;
              try {
                await navigator.clipboard.writeText(
                  JSON.stringify(
                    safeConnectionDiagnostics(connection, namespace),
                    null,
                    2,
                  ),
                );
                if (currentScope.current === captured) setCopied(true);
              } catch {
                if (currentScope.current === captured)
                  setError(
                    "Tanılama panoya kopyalanamadı. Tarayıcının pano iznini kontrol edin.",
                  );
              }
            }}
          >
            <Copy size={15} />
            Tanılamayı kopyala
          </button>
          {copied && (
            <p role="status">
              Güvenli durum özeti kopyalandı; kimlik bilgileri ve hata
              içerikleri dahil edilmedi.
            </p>
          )}
        </>
      )}
    </Window>
  );
}
export function PreferencesWindow({
  preferences,
  onPreferences,
  motion,
  theme,
  onTheme,
  quality,
  onQuality,
  layers = {},
  onLayers,
  reducedMotion,
  onReducedMotion,
  onClose,
  mode,
  onDemoScenario,
  onProviders,
}) {
  const value = validatePreferences(
    preferences || {
      ...DEFAULT_PREFERENCES,
      theme: theme || "system",
      quality: quality || "auto",
      motionPreference: reducedMotion ? "reduced" : "system",
    },
  );
  const change = (key, next) => {
    const validated = validatePreferences({ ...value, [key]: next });
    if (onPreferences) onPreferences(validated);
    else if (key === "theme") onTheme?.(next === "system" ? "light" : next);
    else if (key === "quality") onQuality?.(next === "auto" ? "medium" : next);
    else if (key === "motionPreference") onReducedMotion?.(next === "reduced");
  };
  const toggle = (key, label, description) => (
    <label className="preference-toggle" key={key}>
      <span>
        <strong>{label}</strong>
        <small>{description}</small>
      </span>
      <input
        type="checkbox"
        aria-label={label}
        checked={value[key]}
        onChange={(event) => change(key, event.target.checked)}
      />
    </label>
  );
  return (
    <Window
      title="Görünüm ve ayarlar"
      icon={Settings}
      onClose={onClose}
      className="utility-window preferences-window"
      modal
    >
      <section className="preferences-section">
        <h2>Panel görünümü</h2>
        <p className="muted">
          Mat yüzeyler, belirgin sınırlar ve okunabilir teknik alanlar.
        </p>
        <div className="preferences-grid">
          <label className="form-field">
            <span>Panel teması</span>
            <select
              aria-label="Panel teması"
              value={value.theme}
              onChange={(event) => change("theme", event.target.value)}
            >
              <option value="system">Sistemi izle</option>
              <option value="light">Açık</option>
              <option value="dark">Koyu</option>
            </select>
          </label>
          <label className="form-field">
            <span>Kontrast</span>
            <select
              aria-label="Kontrast"
              value={value.contrast}
              onChange={(event) => change("contrast", event.target.value)}
            >
              <option value="normal">Normal</option>
              <option value="high">Yüksek kontrast</option>
            </select>
          </label>
        </div>
      </section>
      <section className="preferences-section">
        <div className="preferences-heading">
          <div>
            <h2>Liman hareketi</h2>
            <p className="muted">
              Yalnız görsel hareket değişir; Kubernetes kaynakları ve işlem
              sonuçları gerçek veriden izlenir.
            </p>
          </div>
          <button
            className="button"
            aria-pressed={value.paused}
            onClick={() => change("paused", !value.paused)}
          >
            {value.paused
              ? "Görsel hareketi sürdür"
              : "Görsel hareketi duraklat"}
          </button>
        </div>
        <label className="form-field">
          <span>Hareket tercihi</span>
          <select
            aria-label="Hareket tercihi"
            value={value.motionPreference}
            onChange={(event) => change("motionPreference", event.target.value)}
          >
            <option value="system">Sistem tercihini izle</option>
            <option value="reduced">Hareketi azalt</option>
            <option value="full">Tam hareket</option>
          </select>
        </label>
        {(motion?.reduced || motion?.paused) && (
          <p className="motion-preference-status" role="status">
            {motion.paused
              ? "Görsel hareket duraklatıldı."
              : "Hareket azaltma etkin."}{" "}
            Aşağıdaki tercihleriniz saklanır; dekoratif yolculuk, salınım ve su
            hareketi durur.
          </p>
        )}
        {toggle(
          "patrol",
          "Gemi devriyesi",
          "Node gemileri güvenli liman rotalarında ilerler.",
        )}
        <label className="form-field">
          <span>Devriye hızı</span>
          <select
            aria-label="Devriye hızı"
            value={value.speed}
            onChange={(event) => change("speed", event.target.value)}
          >
            <option value="slow">Yavaş</option>
            <option value="normal">Normal</option>
            <option value="fast">Hızlı</option>
          </select>
        </label>
        {toggle(
          "bob",
          "Hafif gemi salınımı",
          "Dalga ile uyumlu yükselme ve yatma. Deniz hareketi kapalıyken salınım da durur; tercihiniz korunur.",
        )}
        {toggle(
          "sea",
          "Deniz yüzeyi hareketi",
          "Dalga ve akıntıyı canlandırır. Kapatınca su, salınım ve köpük durur; gemi devriyesi ve canlı veriler sürer.",
        )}
        <label className="form-field">
          <span>Deniz hareketi şiddeti</span>
          <select
            aria-label="Deniz hareketi şiddeti"
            value={value.seaStrength}
            onChange={(event) => change("seaStrength", event.target.value)}
          >
            <option value="calm">Sakin</option>
            <option value="light">Hafif</option>
            <option value="noticeable">Belirgin</option>
          </select>
        </label>
        {toggle(
          "sunGlint",
          "Güneş yansımaları",
          "Su üzerindeki güneş parlaması. Deniz durduğunda sabit kalır; ayrı kapatarak yansıma efektini kaldırabilirsiniz.",
        )}
        {toggle(
          "wake",
          "Gemi izi",
          "İlerleyen gemilerin arkasında köpük ve dalga izi. Deniz ve devriye açıkken, orta/yüksek kalitede görünür; duran gemi iz üretmez.",
        )}
        <label className="form-field">
          <span>Operasyon animasyonları</span>
          <select
            aria-label="Operasyon animasyonları"
            value={value.operations}
            onChange={(event) => change("operations", event.target.value)}
          >
            <option value="full">Tam · vinç transferleri</option>
            <option value="simple">Sade · kısa durum geçişleri</option>
          </select>
        </label>
      </section>
      <section className="preferences-section">
        <h2>3D kalite</h2>
        <label className="form-field">
          <span>3D kalite</span>
          <select
            aria-label="3D kalite"
            value={value.quality}
            onChange={(event) => change("quality", event.target.value)}
          >
            <option value="auto">Otomatik · cihaz bütçesine göre</option>
            <option value="low">Düşük · gölge kapalı</option>
            <option value="medium">Orta</option>
            <option value="high">Yüksek</option>
          </select>
        </label>
        <p className="muted">
          Otomatik seçim düşük veya orta kaliteyi kullanır. Kaynak verisinin
          kapsamını değiştirmez.
        </p>
      </section>
      <fieldset className="layer-options">
        <legend>Dünya katmanları</legend>
        {[
          ["nodes", "Node gemileri"],
          ["pods", "Pod yükleri"],
          ["storage", "Depolama kaynakları"],
          ["network", "Gerçek selector ilişkileri"],
          ["measuredTraffic", "Ölçülmüş trafik — Hubble"],
          ["controlPlane", "Temsili kontrol düzlemi"],
          ["labels", "Durum etiketleri"],
        ].map(([key, label]) => (
          <label key={key}>
            <input
              type="checkbox"
              checked={
                key === "measuredTraffic"
                  ? layers[key] === true
                  : layers[key] !== false
              }
              onChange={(event) =>
                onLayers?.({ ...layers, [key]: event.target.checked })
              }
            />
            {label}
          </label>
        ))}
        <p>Ağ çizgileri kaynak ilişkileridir; ölçülmüş trafik değildir.</p>
        <p>
          Hubble akışları gerçek sağlayıcı ölçümüdür. Kontrol düzlemi işaretleri
          Kubernetes durumundan türetilmiş temsili süreçtir; gerçek RPC paketi
          ölçümü değildir.
        </p>
      </fieldset>
      {onProviders && (
        <button className="button" onClick={onProviders}>
          <Radio size={15} />
          Sağlayıcı bağlantılarını incele
        </button>
      )}
      {mode === "demo" && (
        <button className="button" onClick={onDemoScenario}>
          <Play size={15} />
          Örnek yük yaşam döngüsünü göster
        </button>
      )}
    </Window>
  );
}
export function HelpWindow({ onClose }) {
  return (
    <Window
      title="Tersaneyi kullanma"
      icon={HelpCircle}
      onClose={onClose}
      className="utility-window help-window"
      modal
    >
      <p className="help-lead">
        Yönetmek istediğiniz nesneye tıklayın. Pencereyi kapattığınızda aynı
        limana dönersiniz.
      </p>
      <div className="help-map">
        {Object.entries(FACILITIES)
          .filter(([id]) => id !== "workloads" && id !== "scheduling")
          .map(([id, f]) => (
            <div key={id}>
              <strong>{f.short}</strong>
              <p>{f.description}</p>
            </div>
          ))}
      </div>
      <div className="help-keys">
        <p>
          <kbd>Sürükle</kbd> Döndür · <kbd>Sağ tuş</kbd> Kaydır ·{" "}
          <kbd>Tekerlek</kbd> Yakınlaştır
        </p>
        <p>
          <kbd>Cmd / Ctrl + K</kbd> Bul · <kbd>Esc</kbd> En üst pencereyi kapat
        </p>
      </div>
      <p className="muted">
        Gemi gerçek Node, palet gerçek Pod, palet içindeki kutular
        container’dır. Sabit tesisler kaynak sayısına eklenmeyen uygulama
        girişleridir. Kubernetes sürümü ve RBAC izinleri kullanılabilir
        işlemleri belirler.
      </p>
    </Window>
  );
}
export function FinderWindow({
  connection,
  namespace,
  onSelect,
  onFacility,
  onClose,
}) {
  const [search, setSearch] = useState(() => connection.workspace?.getView(connection.workspace.activeId)?.search || connection.workspace?.view?.search || ""),
    [kind, setKind] = useState("all"),
    [limit, setLimit] = useState(40),
    [error, setError] = useState("");
  const inputRef = useRef(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  useEffect(() => {
    if (kind === "all" || connection.mode === "demo") return;
    connection.loadKind(kind, namespace).catch((e) => setError(e.message));
  }, [kind, namespace, connection.sourceKey]);
  const q = search.toLocaleLowerCase("tr-TR");
  const list = useMemo(
    () =>
      scopeResources(connection.resources, namespace)
        .filter(
          (r) =>
            (kind === "all" || r.kind === kind) &&
            `${r.metadata.name} ${r.kind} ${r.metadata.namespace || ""} ${JSON.stringify(r.metadata.labels || {})}`
              .toLocaleLowerCase("tr-TR")
              .includes(q),
        )
        .sort((a, b) => a.metadata.name.localeCompare(b.metadata.name)),
    [connection.resources, namespace, q, kind],
  );
  const places = Object.entries(FACILITIES).filter(
    ([id, f]) =>
      kind === "all" &&
      `${f.title} ${f.description}`.toLocaleLowerCase("tr-TR").includes(q),
  );
  return (
    <Window
      title="Dünyada bul"
      subtitle="Bir yeri veya gerçek kaynağı açın"
      icon={Search}
      onClose={onClose}
      className="finder-window"
      modal
    >
      <div className="finder-search">
        <Search size={19} />
        <input
          ref={inputRef}
          data-autofocus
          aria-label="Nesne veya kaynak ara"
          placeholder="Ad, tür, namespace veya label…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            if (connection.workspace?.activeId) connection.workspace.saveView(connection.workspace.activeId, { ...connection.workspace.getView(connection.workspace.activeId), search: e.target.value });
            setLimit(40);
          }}
        />
        <kbd>Esc</kbd>
      </div>
      <label className="finder-kind">
        Tür
        <select
          aria-label="Bulucu kaynak türü"
          value={kind}
          onChange={(e) => {
            setKind(e.target.value);
            setError("");
          }}
        >
          <option value="all">Tüm nesneler ve yerler</option>
          {[
            ...new Set([
              ...connection.resources.map((r) => r.kind),
              ...connection.discovery.map((d) => d.kind),
            ]),
          ]
            .sort()
            .map((k) => (
              <option key={k}>{k}</option>
            ))}
        </select>
      </label>
      {error && <div className="inline-alert alert-danger">{error}</div>}
      <div className="finder-results">
        {places.length > 0 && <h2>Limandaki yerler</h2>}
        {places.map(([id, f]) => (
          <button
            className="finder-result"
            key={id}
            onClick={() => onFacility(id)}
          >
            <span className="finder-place-icon">
              <Building2 size={18} />
            </span>
            <span>
              <strong>{f.short}</strong>
              <small>{f.description}</small>
            </span>
            <ArrowUpRight size={15} />
          </button>
        ))}
        {list.length > 0 && (
          <h2>
            Gerçek kaynaklar <span>{list.length}</span>
          </h2>
        )}
        {list.slice(0, limit).map((r) => (
          <button
            className="finder-result"
            key={r.metadata.uid}
            onClick={() => onSelect(r)}
          >
            <span className="finder-kind-badge">
              {r.kind === "Pod"
                ? "P"
                : r.kind === "Node"
                  ? "N"
                  : r.kind.slice(0, 2)}
            </span>
            <span>
              <strong>{r.metadata.name}</strong>
              <small>
                {r.kind} · {r.metadata.namespace || "Küme kapsamı"}
                {facilityFor(r) ? ` · ${FACILITIES[facilityFor(r)].short}` : ""}
              </small>
            </span>
            <ArrowUpRight size={15} />
          </button>
        ))}
        {!places.length && !list.length && (
          <p className="empty-copy">
            Bu kapsamda eşleşme yok. Cluster bağlantısını veya namespace
            seçimini inceleyin.
          </p>
        )}
        {list.length > limit && (
          <button
            className="button finder-more"
            onClick={() => setLimit((v) => v + 40)}
          >
            Sonraki 40 kaynağı göster
          </button>
        )}
      </div>
    </Window>
  );
}
export function NotificationsWindow({
  operations,
  connection,
  namespace,
  onSelect,
  onClose,
}) {
  const [tab, setTab] = useState(operations.length ? "operations" : "events");
  return (
    <Window
      title="Olaylar ve işlem takibi"
      icon={Activity}
      onClose={onClose}
      className="utility-window notification-window"
      modal
    >
      <nav className="window-tabs" aria-label="Bildirim bölümleri">
        <button
          className={tab === "operations" ? "active" : ""}
          onClick={() => setTab("operations")}
        >
          İşlemler ({operations.length})
        </button>
        <button
          className={tab === "events" ? "active" : ""}
          onClick={() => setTab("events")}
        >
          Kubernetes olayları
        </button>
      </nav>
      {tab === "events" ? (
        <Events
          resources={scopeResources(connection.resources, namespace)}
          onSelect={onSelect}
        />
      ) : (
        <div className="operation-list">
          {!operations.length && (
            <p className="empty-copy">Bu oturumda gönderilmiş bir işlem yok.</p>
          )}
          {operations.map((op) => (
            <article
              className={`operation-item operation-${op.status}`}
              key={op.id}
            >
              <div>
                <span>
                  {op.status === "succeeded" ? (
                    <CheckCircle2 size={18} />
                  ) : (
                    <Activity size={18} />
                  )}
                </span>
                <strong>{op.resource?.metadata?.name || "Toplu işlem"}</strong>
                <time>{new Date(op.at).toLocaleTimeString("tr-TR")}</time>
              </div>
              <p>
                {op.action} · {OPERATION_LABELS[op.status]}
              </p>
              <small>İşlem: {op.id}</small>
              {op.observation && (
                <p className="inline-alert alert-warning">{op.observation}</p>
              )}
              {op.results?.map((row) => (
                <p
                  key={row.resource.metadata.uid}
                  className={row.accepted ? "" : "danger-text"}
                >
                  {row.resource.metadata.name}:{" "}
                  {row.accepted ? "API kabul etti" : row.error}
                </p>
              ))}
              {op.resource && (
                <button
                  className="button"
                  onClick={() => onSelect(op.current || op.resource)}
                >
                  Kaynağı incele
                </button>
              )}
            </article>
          ))}
        </div>
      )}
    </Window>
  );
}
