export function focusElement(element, fallback = null) {
  const target =
    element?.isConnected &&
    !["BODY", "HTML"].includes(element.tagName) &&
    !element.disabled &&
    typeof element.focus === "function"
      ? element
      : fallback;
  target?.focus();
  return target;
}
