import React, { useEffect, useState } from "react";
import { Compass, Plus, Link2, Download, Upload } from "lucide-react";
import Window from "./Window.jsx";
import { harborPosition, nextHarborPosition, normalizeNamespaces, sharedResources, workspaceRelations } from "./workspace.js";
import { saveHarborConfiguration } from "./workspaceMutations.js";
import "./workspace.css";

const namespaceText = (harbor) => (harbor.namespaces || ["*"]).join(", ");
const initialForm = (workspace, harbor) => ({
  id: harbor?.id || crypto.randomUUID(), name: harbor?.name || "",
  connectionRef: harbor?.connectionRef || workspace.connections.find((c) => c.bound)?.id || "__new__",
  context: "", namespaces: harbor ? namespaceText(harbor) : "default",
  selector: harbor?.selector || "", environment: harbor?.environment || "",
  color: harbor?.color || "#bd7951", position: harbor ? harborPosition(harbor, workspace.harbors.indexOf(harbor)) : nextHarborPosition(workspace.harbors),
});
export default function WorkspaceWindow({ workspace, onSelect, onClose, onOverview, first = false, editHarborId }) {
  const { record, contexts, registry } = workspace;
  const [editing, setEditing] = useState(first || editHarborId ? initialForm(record, record.harbors.find((harbor) => harbor.id === editHarborId)) : null),
    [preview, setPreview] = useState(null), [busy, setBusy] = useState(false),
    [error, setError] = useState(null), [remove, setRemove] = useState(null),
    [ack, setAck] = useState(false), [importText, setImportText] = useState(null),
    [rebind, setRebind] = useState({}), [revision, setRevision] = useState(0),
    [relationSource, setRelationSource] = useState(workspace.activeId || record.harbors[0]?.id || ""), [relationTarget, setRelationTarget] = useState("");
  useEffect(() => {
    const listener = () => setRevision((value) => value + 1);
    registry.listeners.add(listener);
    return () => registry.listeners.delete(listener);
  }, [registry]);
  const snapshots = registry.snapshots();
  const shared = sharedResources(record.harbors, snapshots, registry.connections(record.connections));
  const relations = workspaceRelations(record, snapshots, registry.connections(record.connections));
  const update = (key, value) => { setEditing((form) => ({ ...form, [key]: value })); setPreview(null); setError(null); };
  const perform = async (callback) => {
    if (busy) return;
    setBusy(true); setError(null);
    try { await callback(); } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  };
  const scopeBody = () => ({ ...(editing.connectionRef === "__new__" ? { context: editing.context } : { connectionRef: editing.connectionRef }), namespaces: normalizeNamespaces(editing.namespaces.split(",")), selector: editing.selector.trim() });
  const validate = () => perform(async () => {
    const value = await workspace.request("/api/workspace/preview", { method: "POST", body: scopeBody() });
    setPreview(value);
  });
  const save = () => perform(async () => {
    if (!preview?.valid) throw new Error("Önce gerçek bağlantıyı ve kapsamı doğrulayın.");
    const saved = await saveHarborConfiguration(workspace, editing);
    setEditing(null); setPreview(null); onSelect(saved.harbor.id);
  });
  const exportWorkspace = () => perform(async () => {
    const data = await workspace.request("/api/workspace/export");
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "kubeview-workspace.json"; anchor.click(); URL.revokeObjectURL(url);
  });
  return <Window title={editing ? (record.harbors.some((h) => h.id === editing.id) ? "Limanı düzenle" : "Liman ekle") : "Limanlar"} subtitle={`${record.name} · Workspace yapılandırması · Kubernetes kaynakları değişmez`} icon={Compass} onClose={onClose} modal className="workspace-window">
    {error && <p className="inline-alert alert-danger" role="alert">{error}</p>}
    {editing ? <form onSubmit={(event) => { event.preventDefault(); save(); }}>
      <fieldset disabled={busy} className="workspace-form">
        <label className="form-field">Liman adı<input aria-label="Liman adı" data-autofocus value={editing.name} onChange={(e) => update("name", e.target.value)} required /></label>
        <label className="form-field">Güvenilir bağlantı<select aria-label="Güvenilir bağlantı" value={editing.connectionRef} onChange={(e) => update("connectionRef", e.target.value)}>
          {record.connections.filter((c) => c.bound).map((c) => <option key={c.id} value={c.id}>{c.name} · {c.context}</option>)}<option value="__new__">Yeni güvenilir context bağlantısı</option>
        </select></label>
        {editing.connectionRef === "__new__" && <label className="form-field">Cluster / context<select aria-label="Cluster / context" value={editing.context} onChange={(e) => update("context", e.target.value)} required><option value="">Güvenilir context seçin</option>{contexts.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}</select></label>}
        <label className="form-field">Namespace kapsamı (virgülle)<input aria-label="Namespace kapsamı (virgülle)" value={editing.namespaces} onChange={(e) => update("namespaces", e.target.value)} placeholder="proje-a, proje-b veya *" required /></label>
        <p className="muted">Namespace LIST izni olmadan izinli adı elle girebilirsiniz. * yalnız bu kimliğin izinli tüm kapsamını ister. Label görünümü Kubernetes güvenlik izolasyonu değildir.</p>
        <label className="form-field">Label seçicisi<input aria-label="Label seçicisi" value={editing.selector} onChange={(e) => update("selector", e.target.value)} placeholder="app=web,environment=dev" /></label>
        <div className="form-grid"><label className="form-field">Ortam etiketi<input aria-label="Ortam etiketi" value={editing.environment} onChange={(e) => update("environment", e.target.value)} placeholder="Geliştirme" /></label><label className="form-field">Vurgu rengi<input aria-label="Vurgu rengi" type="color" value={editing.color} onChange={(e) => update("color", e.target.value)} /></label></div>
        <p className="inline-alert">Yeni liman salt okunur bağlanır. Kubernetes yazma izni daha sonra bu liman ve sekme için ayrıca açılır. Kaydetmek workload, label, namespace veya Node yaratmaz.</p>
        <button type="button" className="button" onClick={validate}>Bağlantıyı dene ve kapsamı önizle</button>
        {preview && <section className="workspace-preview" aria-label="Gerçek kapsam önizlemesi"><strong>{preview.valid ? "Bağlantı ve kapsam doğrulandı" : "Kapsam doğrulanamadı"}</strong><p>{preview.identity?.confidence === "verified" ? "Cluster kimliği doğrulandı" : "Cluster kimliği doğrulanamadı; bağlantılar ayrı tutulur"}</p><dl>{Object.entries(preview.counts || {}).map(([kind, count]) => <div key={kind}><dt>{kind}</dt><dd>{count ?? "Bilinmiyor / izin yok"}</dd></div>)}</dl>{Object.entries(preview.checks || {}).map(([key, value]) => <p key={key}>{key}: {value?.status || String(value)}</p>)}{preview.overlaps?.length > 0 && <p>Örtüşen limanlar: {preview.overlaps.map((entry) => record.harbors.find((h) => h.id === entry.harborId)?.name || entry.harborId).join(", ")}. Aynı gerçek kaynak çoğaltılmaz.</p>}{preview.errors?.map((value, index) => <p key={index}>{typeof value === "string" ? value : value.message || value.status}</p>)}</section>}
        <div className="workspace-actions"><button type="button" className="button" onClick={() => { setEditing(null); setPreview(null); }}>Vazgeç</button><button className="button button-primary" disabled={!preview?.valid}>Limanı kaydet</button></div>
      </fieldset>
    </form> : <>
      <div className="workspace-actions"><button className="button button-primary" onClick={() => { setEditing(initialForm(record, null)); setPreview(null); }}><Plus size={15} />Liman ekle</button><button className="button" onClick={exportWorkspace} disabled={busy}><Download size={15} />Güvenli dışa aktar</button><button className="button" onClick={() => setImportText("")}><Upload size={15} />Workspace içe aktar</button></div>
      <button className="button" onClick={onOverview}>Denizi uzaktan gör</button>
      <p className="muted">Tekil gözlenen Kubernetes kaynakları: {shared.physical.size}. Tekil gözlenen Node kayıtları: {[...shared.physical.values()].filter((resource) => resource.kind === "Node").length}. Aynı doğrulanmış Node UID'sinin birden çok liman görünümü ikinci sunucu sayılmaz; doğrulanamayan bağlantılar ayrı tutulur. Henüz gözlenmeyen/yetkisiz kapsam toplamı değildir.</p>
      <p className="muted">Kapasite toplamı hesaplanmıyor. Gerçek Node allocatable ile bu limanın izinli Pod kullanımı ayrıntı panelinde ayrı incelenir.</p>
      <div className="workspace-map" aria-label="Deniz haritası">
        {record.harbors.map((harbor) => {
          const connection = record.connections.find((c) => c.id === harbor.connectionRef), state = snapshots.get(harbor.id);
          return <article key={harbor.id} className="workspace-port" style={{ "--harbor-accent": harbor.color || "#b97a50" }}><button className="workspace-port-select" onClick={() => onSelect(harbor.id)}><Compass size={20} /><strong>{harbor.name}</strong><span>{connection?.context || "Bağlantı yeniden doğrulanmalı"}</span><span>{namespaceText(harbor)}{harbor.selector ? ` · ${harbor.selector}` : ""}</span><span>{state?.isConnected && state.snapshotReady && !state.stale ? "Canlı gözlem" : state?.lastUpdated ? "Son bilinen veri · yeniden senkronizasyon" : "Henüz gözlenmedi / bağlı değil"}</span></button><div className="workspace-actions"><button className="button" onClick={() => { setEditing(initialForm(record, harbor)); setPreview(null); }}>Limanı düzenle</button><button className="button" onClick={() => { setRemove(harbor); setAck(false); }}>Limanı kaldır</button></div></article>;
        })}
      </div>
      {record.connections.filter((c) => !c.bound).map((connection) => <section className="workspace-preview" key={connection.id}><strong>{connection.name} · Bağlantı yeniden doğrulanmalı</strong><p>İçe aktarılan kayıt güvenilir yerel context'e açıkça bağlanmadan Kubernetes'e erişmez.</p><label className="form-field">{connection.name} için güvenilir context<select value={rebind[connection.id] || ""} onChange={(e) => setRebind((old) => ({ ...old, [connection.id]: e.target.value }))}><option value="">Context seçin</option>{contexts.map((c) => <option key={c.name}>{c.name}</option>)}</select></label><button className="button" disabled={busy || !rebind[connection.id]} onClick={() => perform(async () => { const validated = await workspace.request("/api/workspace/validate", { method: "POST", body: { context: rebind[connection.id], namespaces: normalizeNamespaces(record.harbors.filter((harbor) => harbor.connectionRef === connection.id).flatMap((harbor) => harbor.namespaces).length ? record.harbors.filter((harbor) => harbor.connectionRef === connection.id).flatMap((harbor) => harbor.namespaces) : ["default"]) } }); if (!validated.valid) throw new Error("Bağlantı doğrulanamadı."); await workspace.mutate(`/api/workspace/connections/${encodeURIComponent(connection.id)}`, { method: "PATCH", body: { connection: { ...connection, context: rebind[connection.id] } } }); })}>Bağlantıyı doğrula ve bağla</button></section>)}
      <section className="workspace-preview"><h2>Liman ilişkileri</h2><p>Ortak altyapı, yapılandırılmış ilişki ve ölçülmüş trafik farklıdır. Farklı kümeler arasında telemetri yoksa bu kümeler arasında doğrulanmış bağlantı yoktur.</p>{relations.map((relation) => <div key={relation.id}><p><Link2 size={14} /> {record.harbors.find((h) => h.id === relation.sourceHarbor)?.name} → {record.harbors.find((h) => h.id === relation.targetHarbor)?.name} · {relation.type === "infrastructure" ? "Doğrulanmış ortak Node altyapısı" : relation.origin === "observed-endpointslice" ? "Gözlenen Service / EndpointSlice ilişkisi" : "Kullanıcı tarafından yapılandırılmış ilişki"} · {relation.origin} · trafik kanıtı değildir</p>{record.relations.some((saved) => saved.id === relation.id) && <button className="button" disabled={busy} onClick={() => perform(() => workspace.mutate(`/api/workspace/relations/${encodeURIComponent(relation.id)}`, { method: "DELETE", body: {} }))}>Yapılandırılmış ilişkiyi kaldır</button>}</div>)}<p className="muted">En fazla 512 ilişki gösterilir. Node paylaşımı veya kullanıcı tanımı ölçülmüş iletişim, scheduler havuzu birleşimi veya CPU transferi değildir.</p><div className="form-grid"><label className="form-field">İlişki kaynak limanı<select aria-label="İlişki kaynak limanı" value={relationSource} onChange={(event) => setRelationSource(event.target.value)}><option value="">Kaynak seçin</option>{record.harbors.map((harbor) => <option key={harbor.id} value={harbor.id}>{harbor.name}</option>)}</select></label><label className="form-field">İlişki hedef limanı<select aria-label="İlişki hedef limanı" value={relationTarget} onChange={(event) => setRelationTarget(event.target.value)}><option value="">Hedef seçin</option>{record.harbors.filter((harbor) => harbor.id !== relationSource).map((harbor) => <option key={harbor.id} value={harbor.id}>{harbor.name}</option>)}</select></label></div><button className="button" disabled={busy || !relationSource || !relationTarget || relationSource === relationTarget} onClick={() => perform(async () => { await workspace.mutate("/api/workspace/relations", { method: "POST", body: { relation: { type: "configured", origin: "user", sourceHarbor: relationSource, targetHarbor: relationTarget } } }); setRelationTarget(""); })}>Yapılandırılmış ilişki ekle</button></section>
      {remove && <section className="workspace-preview"><strong>{remove.name} liman kaydı kaldırılacak</strong><p>Yalnız KubeView kaydı ve aboneliği kaldırılır. Kubernetes namespace, Node ve workload'lar silinmez.</p><label><input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} />Yalnız uygulama kaydını kaldırmayı onaylıyorum</label><button className="button" disabled={!ack || busy} onClick={() => perform(async () => { await workspace.mutate(`/api/workspace/harbors/${encodeURIComponent(remove.id)}`, { method: "DELETE", body: {} }); setRemove(null); })}>Liman kaydını kaldır</button></section>}
      {importText !== null && <section className="workspace-preview"><label className="form-field">Güvenli workspace JSON<textarea aria-label="Güvenli workspace JSON" rows={8} value={importText} onChange={(e) => setImportText(e.target.value.slice(0, 262144))} /></label><p>Bağlantılar otomatik güvenilmez; içe aktarımdan sonra güvenilir context açıkça doğrulanır. Yönetim izni taşınmaz.</p><button className="button" disabled={busy || !importText.trim()} onClick={() => perform(async () => { await workspace.mutate("/api/workspace/import", { method: "POST", body: { workspace: JSON.parse(importText) } }); setImportText(null); })}>Güvenli yapılandırmayı içe aktar</button></section>}
    </>}
  </Window>;
}
