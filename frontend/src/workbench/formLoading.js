export function requiresResourceDraftLoad({
  action,
  resource,
  api,
  readOnly = true,
  secretEdit = false,
}) {
  if (
    !["edit", "resources", "resize"].includes(action) ||
    !resource ||
    Array.isArray(resource) ||
    readOnly ||
    typeof api?.request !== "function"
  )
    return false;
  if (resource.kind === "Secret") return action === "edit" && secretEdit;
  return typeof api.resourcePath === "function";
}
