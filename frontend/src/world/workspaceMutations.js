import { normalizeNamespaces, safeHarborView } from "./workspace.js";

export async function saveHarborConfiguration(workspace, editing) {
  const record = workspace.record, namespaces = normalizeNamespaces(editing.namespaces.split(","));
  if (!editing.name.trim() || !namespaces.length) throw new Error("Liman adı ve namespace kapsamı gereklidir.");
  let connectionRef = editing.connectionRef;
  if (connectionRef === "__new__") {
    const known = new Set(record.connections.map((connection) => connection.id));
    const updated = await workspace.mutate("/api/workspace/connections", { method: "POST", body: { connection: { name: editing.context, context: editing.context } } });
    const created = updated.connections.filter((connection) => !known.has(connection.id));
    if (created.length !== 1 || created[0].context !== editing.context) throw new Error("Sunucunun oluşturduğu bağlantı kimliği doğrulanamadı; liman isteği gönderilmedi.");
    connectionRef = created[0].id;
  }
  const existing = record.harbors.find((harbor) => harbor.id === editing.id);
  const harbor = { ...existing, workspaceId: record.id, name: editing.name.trim(), connectionRef,
    namespaces, selector: editing.selector.trim(), environment: editing.environment.trim(), color: editing.color, position: editing.position, view: safeHarborView(existing?.view) };
  const known = new Set(record.harbors.map((value) => value.id));
  const updated = await workspace.mutate(`/api/workspace/harbors${existing ? `/${encodeURIComponent(existing.id)}` : ""}`, { method: existing ? "PATCH" : "POST", body: { harbor } });
  const created = existing ? [updated.harbors.find((value) => value.id === existing.id)] : updated.harbors.filter((value) => !known.has(value.id));
  if (created.length !== 1 || !created[0] || created[0].connectionRef !== connectionRef) throw new Error("Sunucunun liman kimliği doğrulanamadı; workspace'i yeniden okuyun.");
  return { workspace: updated, harbor: created[0] };
}
