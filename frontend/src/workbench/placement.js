/** Scheduler placement is applied to PodSpec; nodeName is deliberately never authored. */
export function getPodSpec(object) {
  if (object?.kind === "Pod") return object.spec;
  if (object?.kind === "CronJob")
    return object.spec?.jobTemplate?.spec?.template?.spec;
  return object?.spec?.template?.spec;
}
const copy = (value) => JSON.parse(JSON.stringify(value));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const targetClause = (name) => ({
  key: "metadata.name",
  operator: "In",
  values: [name],
});
const emptyTerm = (term) =>
  !(term?.matchExpressions?.length || term?.matchFields?.length);

export function assertTargetNode(expected, fresh) {
  if (
    !expected?.metadata?.uid ||
    !fresh?.metadata?.uid ||
    fresh.kind !== "Node"
  )
    throw new Error("Hedef Node kimliği doğrulanamadı.");
  if (
    expected.metadata.uid !== fresh.metadata.uid ||
    expected.metadata.name !== fresh.metadata.name
  )
    throw new Error(
      "Hedef gemi yeniden oluşturulmuş veya silinmiş. Aynı adlı yeni Node’a sessizce geçilmedi; gemiyi yeniden seçin.",
    );
  if (fresh.metadata.deletionTimestamp)
    throw new Error("Hedef Node siliniyor. Başka bir gemi seçin.");
  return fresh;
}
function requirementMatches(requirement, source) {
  const exists = Object.prototype.hasOwnProperty.call(source, requirement.key),
    value = source[requirement.key];
  switch (requirement.operator) {
    case "In":
      return exists && (requirement.values || []).includes(value);
    case "NotIn":
      return !exists || !(requirement.values || []).includes(value);
    case "Exists":
      return exists;
    case "DoesNotExist":
      return !exists;
    case "Gt":
      return (
        exists &&
        Number.isFinite(Number(value)) &&
        Number(value) > Number(requirement.values?.[0])
      );
    case "Lt":
      return (
        exists &&
        Number.isFinite(Number(value)) &&
        Number(value) < Number(requirement.values?.[0])
      );
    default:
      throw new Error(
        `Node affinity operator desteklenmiyor: ${requirement.operator}. YAML ve server dry-run ile doğrulayın.`,
      );
  }
}
function termMatches(term, node) {
  if (emptyTerm(term)) return false;
  const labels = node.metadata.labels || {},
    fields = { "metadata.name": node.metadata.name };
  for (const field of term.matchFields || [])
    if (field.key !== "metadata.name")
      throw new Error(
        `Hedef Node için matchFields alanı doğrulanamıyor: ${field.key}`,
      );
  return (
    (term.matchExpressions || []).every((r) => requirementMatches(r, labels)) &&
    (term.matchFields || []).every((r) => requirementMatches(r, fields))
  );
}
export function validateTargetCompatibility(object, node, mode) {
  const spec = getPodSpec(object);
  if (!spec)
    throw new Error("Bu kaynakta yerleşim uygulanacak Pod şablonu yok.");
  if (!["required", "preferred", "scheduler"].includes(mode))
    throw new Error("Geçerli bir yerleşim modu seçin.");
  if (spec.nodeName)
    throw new Error(
      "spec.nodeName scheduler’ı atlar. Bu form spec.nodeName yazmaz; yerleşim seçeneğini kullanmadan önce YAML’daki nodeName alanını kaldırın.",
    );
  if (mode !== "required") return;
  if (!node?.metadata?.uid || !node.metadata.name)
    throw new Error("Zorunlu yerleşim için gerçek bir Node seçin.");
  const conflict = Object.entries(spec.nodeSelector || {}).find(
    ([key, value]) => node.metadata.labels?.[key] !== value,
  );
  if (conflict)
    throw new Error(
      `Mevcut nodeSelector ${conflict[0]}=${conflict[1]}, seçili Node’un label’ları ile çelişiyor. Kural silinmedi; YAML’da gözden geçirin.`,
    );
  const required =
    spec.affinity?.nodeAffinity?.requiredDuringSchedulingIgnoredDuringExecution;
  if (required) {
    const terms = required.nodeSelectorTerms;
    if (!Array.isArray(terms) || !terms.length)
      throw new Error(
        "Mevcut required nodeSelectorTerms boş; Kubernetes hiçbir Node’u eşleştirmez. Yerleşim kuralı eklenmedi.",
      );
    if (terms.some(emptyTerm))
      throw new Error(
        "Mevcut node affinity içinde boş bir OR terimi var. Boş terim hiçbir Node’u eşleştirmez; anlamını değiştirmemek için önce YAML’da düzeltin.",
      );
    if (!terms.some((term) => termMatches(term, node)))
      throw new Error(
        "Seçili Node mevcut required node affinity OR terimlerinin hiçbirini karşılamıyor. Mevcut kısıtlar korunuyor; hedefi veya YAML’ı değiştirin.",
      );
  }
}
/** Remove exactly the clause inserted by this form, never a pre-existing matching clause. */
export function stripPlacement(object, provenance) {
  const next = copy(object);
  if (!provenance) return next;
  const spec = getPodSpec(next),
    affinity = spec?.affinity,
    nodeAffinity = affinity?.nodeAffinity;
  if (!nodeAffinity)
    throw new Error(
      "Formun yerleşim kuralı YAML’da değişmiş. Otomatik kaldırma yapılmadı; yerleşimi YAML’dan gözden geçirin.",
    );
  if (provenance.mode === "preferred") {
    const terms = nodeAffinity.preferredDuringSchedulingIgnoredDuringExecution;
    if (!same(terms?.[provenance.index], provenance.inserted))
      throw new Error(
        "Formun eklediği tercih YAML’da değiştirilmiş veya taşınmış. Mevcut affinity silinmedi; değişikliği YAML’da gözden geçirin.",
      );
    terms.splice(provenance.index, 1);
    if (!terms.length && provenance.createdPreferred)
      delete nodeAffinity.preferredDuringSchedulingIgnoredDuringExecution;
  } else {
    const required =
        nodeAffinity.requiredDuringSchedulingIgnoredDuringExecution,
      terms = required?.nodeSelectorTerms;
    for (const inserted of provenance.clauses) {
      if (
        !same(
          terms?.[inserted.termIndex]?.matchFields?.[inserted.fieldIndex],
          inserted.clause,
        )
      )
        throw new Error(
          "Formun eklediği hedef kuralı YAML’da değiştirilmiş veya taşınmış. Mevcut affinity silinmedi; değişikliği YAML’da gözden geçirin.",
        );
    }
    for (const inserted of provenance.clauses) {
      const term = terms[inserted.termIndex];
      term.matchFields.splice(inserted.fieldIndex, 1);
      if (!term.matchFields.length && inserted.createdFields)
        delete term.matchFields;
    }
    if (
      provenance.createdRequired &&
      terms.length === 1 &&
      emptyTerm(terms[0]) &&
      !Object.keys(terms[0]).length
    )
      delete nodeAffinity.requiredDuringSchedulingIgnoredDuringExecution;
  }
  if (!Object.keys(nodeAffinity).length && provenance.createdNodeAffinity)
    delete affinity.nodeAffinity;
  if (!Object.keys(affinity).length && provenance.createdAffinity)
    delete spec.affinity;
  return next;
}
export function applyPlacement(
  object,
  node,
  mode = "scheduler",
  previousProvenance = null,
) {
  const next = stripPlacement(object, previousProvenance);
  const spec = getPodSpec(next);
  validateTargetCompatibility(next, node, mode);
  if (mode === "scheduler") return { object: next, provenance: null };
  if (!node?.metadata?.uid || !node.metadata.name)
    throw new Error("Yerleşim için gerçek bir Node seçin.");
  const createdAffinity = !spec.affinity,
    createdNodeAffinity = !spec.affinity?.nodeAffinity;
  spec.affinity = {
    ...spec.affinity,
    nodeAffinity: { ...spec.affinity?.nodeAffinity },
  };
  const affinity = spec.affinity.nodeAffinity,
    clause = targetClause(node.metadata.name);
  if (mode === "preferred") {
    const createdPreferred =
      !affinity.preferredDuringSchedulingIgnoredDuringExecution;
    const terms =
      affinity.preferredDuringSchedulingIgnoredDuringExecution || [];
    const inserted = { weight: 100, preference: { matchFields: [clause] } },
      index = terms.length;
    affinity.preferredDuringSchedulingIgnoredDuringExecution = [
      ...terms,
      inserted,
    ];
    return {
      object: next,
      provenance: {
        mode,
        index,
        inserted: copy(inserted),
        createdPreferred,
        createdAffinity,
        createdNodeAffinity,
        nodeUID: node.metadata.uid,
      },
    };
  }
  const createdRequired =
    !affinity.requiredDuringSchedulingIgnoredDuringExecution;
  const existing = affinity.requiredDuringSchedulingIgnoredDuringExecution || {
    nodeSelectorTerms: [{}],
  };
  const clauses = [];
  affinity.requiredDuringSchedulingIgnoredDuringExecution = {
    ...existing,
    nodeSelectorTerms: existing.nodeSelectorTerms.map((term, termIndex) => {
      const matchFields = term.matchFields || [],
        fieldIndex = matchFields.length;
      clauses.push({
        termIndex,
        fieldIndex,
        clause: copy(clause),
        createdFields: !term.matchFields,
      });
      return { ...term, matchFields: [...matchFields, copy(clause)] };
    }),
  };
  return {
    object: next,
    provenance: {
      mode,
      clauses,
      createdRequired,
      createdAffinity,
      createdNodeAffinity,
      nodeUID: node.metadata.uid,
    },
  };
}
