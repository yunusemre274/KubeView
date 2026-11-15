/** Secret content stays inside its purpose-specific editor, never operation state. */
export function secretMetadataOnly(resource) {
  if (!resource || resource.kind !== "Secret") return resource;
  const { data, stringData, ...safe } = resource;
  return {
    ...safe,
    metadata: { ...resource.metadata, annotations: undefined },
    keyNames: [
      ...new Set([
        ...(resource.keyNames || []),
        ...Object.keys(data || {}),
        ...Object.keys(stringData || {}),
      ]),
    ].sort(),
  };
}
export function validateRevealedSecret(expected, revealed) {
  if (
    revealed?.kind !== "Secret" ||
    Object.prototype.hasOwnProperty.call(revealed, "keyNames")
  )
    throw new Error(
      "Gerçek Secret içeriği alınamadı; maskelenmiş metadata düzenleme için geri yazılmaz.",
    );
  if (
    !expected?.metadata?.uid ||
    revealed.metadata?.uid !== expected.metadata.uid ||
    revealed.metadata?.name !== expected.metadata.name ||
    revealed.metadata?.namespace !== expected.metadata.namespace
  )
    throw new Error(
      "Secret UID veya adresi değişti. Aynı adlı yeni kaynağa geçilmedi; paneli yeniden açın.",
    );
  if (!revealed.metadata?.resourceVersion)
    throw new Error("Secret resourceVersion önkoşulu bulunamadı.");
  return revealed;
}
export function secretSafeSubmission(result, meta) {
  return {
    result: { ...result, object: secretMetadataOnly(result?.object) },
    meta: {
      ...meta,
      resource: secretMetadataOnly(meta?.resource),
      object: secretMetadataOnly(meta?.object),
    },
  };
}
