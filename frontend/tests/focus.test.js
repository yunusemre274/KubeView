import test from "node:test";
import assert from "node:assert/strict";
import { focusElement } from "../src/world/focus.js";

const dom = () => {
  const document = { activeElement: null };
  const node = (tagName, id) => ({
    tagName,
    id,
    isConnected: true,
    focus() {
      document.activeElement = this;
    },
  });
  document.body = node("BODY");
  document.activeElement = document.body;
  return { document, node };
};

test("a mouse activation that leaves BODY active records the actual button before opening a window", () => {
  const { document, node } = dom();
  const button = node("BUTTON", "world-find"),
    input = node("INPUT");
  assert.equal(document.activeElement, document.body);
  const savedTrigger = focusElement(button);
  const previous = document.activeElement;
  input.focus();
  focusElement(previous, button);
  assert.equal(savedTrigger, button);
  assert.equal(document.activeElement, button);
});

test("keyboard activation preserves its focused trigger when the window closes", () => {
  const { document, node } = dom();
  const button = node("BUTTON", "settings"),
    fallback = node("BUTTON", "world-find");
  button.focus();
  const previous = focusElement(document.activeElement);
  node("INPUT").focus();
  focusElement(previous, fallback);
  assert.equal(document.activeElement, button);
});

test("document roots, removed and disabled controls restore the finder fallback", () => {
  const { document, node } = dom();
  const fallback = node("BUTTON", "world-find");
  for (const previous of [
    document.body,
    node("HTML"),
    { ...node("BUTTON"), isConnected: false },
    { ...node("BUTTON"), disabled: true },
    null,
  ]) {
    assert.equal(focusElement(previous, fallback), fallback);
    assert.equal(document.activeElement, fallback);
  }
  assert.equal(focusElement(document.body), null);
});
