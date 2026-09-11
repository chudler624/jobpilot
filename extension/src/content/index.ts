import { categorizeField } from "../lib/field-detection";
import type { ContentRequest, ContentResponse, DetectedField } from "../lib/messages";

const FIELD_ID_ATTR = "data-jobpilot-field-id";

type FormField = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

// Radio buttons and checkboxes are skipped entirely for this phase — many
// yes/no questions (sponsorship, work authorization, skill checks) are
// implemented as radio groups or custom-styled toggles rather than a
// plain <select>, and reliably picking "the right option in a group" is
// meaningfully harder than filling a single field. Honest limitation,
// not silently glossed over: those questions simply won't be detected
// yet if rendered that way.
const SKIPPED_INPUT_TYPES = new Set([
  "hidden",
  "submit",
  "button",
  "reset",
  "file",
  "image",
  "checkbox",
  "radio",
]);

function isFillable(el: Element): el is FormField {
  if (el instanceof HTMLInputElement) return !SKIPPED_INPUT_TYPES.has(el.type);
  return el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement;
}

function isVisible(el: HTMLElement): boolean {
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).visibility !== "hidden";
}

function collectSignalText(el: FormField): string {
  const parts: string[] = [];

  if (el.id) {
    const label = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
    if (label?.textContent) parts.push(label.textContent);
  }

  const wrappingLabel = el.closest("label");
  if (wrappingLabel?.textContent) parts.push(wrappingLabel.textContent);

  const ariaLabel = el.getAttribute("aria-label");
  if (ariaLabel) parts.push(ariaLabel);

  const ariaLabelledBy = el.getAttribute("aria-labelledby");
  if (ariaLabelledBy) {
    const referenced = document.getElementById(ariaLabelledBy);
    if (referenced?.textContent) parts.push(referenced.textContent);
  }

  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    if (el.placeholder) parts.push(el.placeholder);
  }

  if (el.name) parts.push(el.name.replace(/[_-]/g, " "));
  if (el.id) parts.push(el.id.replace(/[_-]/g, " "));

  return parts.join(" ").replace(/\s+/g, " ").trim();
}

// Detection is on-demand only (invoked via a popup-triggered message, not
// a persistent content_scripts injection) — nothing here runs unless the
// user explicitly asks on this specific tab.
function detectFields(): DetectedField[] {
  const candidates = Array.from(
    document.querySelectorAll<FormField>("input, textarea, select")
  ).filter((el) => isFillable(el) && isVisible(el));

  const detected: DetectedField[] = [];
  let counter = 0;

  for (const el of candidates) {
    const signalText = collectSignalText(el);
    const categorization = categorizeField(signalText);
    if (!categorization) continue;

    const fieldId = `jp-field-${counter++}`;
    el.setAttribute(FIELD_ID_ATTR, fieldId);

    detected.push({
      id: fieldId,
      label: signalText.slice(0, 120),
      category: categorization.category,
      technology: categorization.technology,
      confidence: categorization.confidence,
    });
  }

  return detected;
}

// React (and similar frameworks) override the native value setter on
// controlled inputs, so a plain `el.value = x` is silently dropped by
// their internal state. Calling the native setter directly, then
// dispatching input/change, is the standard workaround.
function setNativeValue(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  setter?.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

// Only ever sets a value on a field the user reviewed and triggered a
// fill for — there is no code path here (or anywhere in this extension)
// that submits a form or clicks a submit-typed element.
function fillField(fieldId: string, value: string): boolean {
  const el = document.querySelector<FormField>(`[${FIELD_ID_ATTR}="${CSS.escape(fieldId)}"]`);
  if (!el) return false;

  if (el instanceof HTMLSelectElement) {
    // A boolean answer's display value ("Yes"/"No") rarely matches a
    // select's actual option `value` attribute — match by option value
    // or visible text first, fall back to a raw set.
    const target = value.toLowerCase();
    const match = Array.from(el.options).find(
      (o) => o.value.toLowerCase() === target || o.textContent?.trim().toLowerCase() === target
    );
    el.value = match ? match.value : value;
    el.dispatchEvent(new Event("change", { bubbles: true }));
  } else {
    setNativeValue(el, value);
  }
  return true;
}

chrome.runtime.onMessage.addListener(
  (message: ContentRequest, _sender, sendResponse: (response: ContentResponse) => void) => {
    if (message.type === "DETECT_FIELDS") {
      try {
        sendResponse({ type: "FIELDS_DETECTED", fields: detectFields() });
      } catch (err) {
        sendResponse({ type: "ERROR", error: err instanceof Error ? err.message : "Detection failed" });
      }
      return;
    }
    if (message.type === "FILL_FIELD") {
      const ok = fillField(message.fieldId, message.value);
      sendResponse(ok ? { type: "FILL_DONE" } : { type: "ERROR", error: "Field not found" });
      return;
    }
  }
);
