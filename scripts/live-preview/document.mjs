// HTML adaptation of PPT Master's svg_editor/annotations.py and staged editing.
// Source offsets keep untouched HTML, SVG icons, whitespace and links intact.
import { parse } from "parse5";
import { createHash } from "node:crypto";

export const digest = (text) => createHash("sha256").update(text).digest("hex");
const escapeAttr = (value) => String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const escapeText = (value) => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
export const attr = (node, name) => node.attrs?.find((item) => item.name === name)?.value;
const hasClass = (node, name) => (attr(node, "class") || "").split(/\s+/).includes(name);
export function walk(node, fn) {
  fn(node);
  for (const child of node.childNodes || []) walk(child, fn);
}
export function textOf(node) {
  return node.nodeName === "#text" ? node.value : (node.childNodes || []).map(textOf).join("");
}

export function readDocument(source) {
  const root = parse(source, { sourceCodeLocationInfo: true });
  const elements = [];
  walk(root, (node) => {
    if (node.tagName && node.sourceCodeLocation?.startTag) elements.push(node);
  });
  const occupied = new Set(elements.map((node) => attr(node, "id")).filter(Boolean));
  const byId = new Map();
  let next = 0;
  for (const node of elements) {
    let id = attr(node, "id");
    if (!id) {
      do { id = `_edit_${next++}`; } while (occupied.has(id));
      occupied.add(id);
    }
    if (byId.has(id)) throw new Error(`Duplicate element id: ${id}`);
    node.editId = id;
    byId.set(id, node);
  }
  const explicit = elements.filter((node) => hasClass(node, "resume-page"));
  const pages = explicit.length ? explicit : elements.filter((node) => hasClass(node, "page"));
  return { source, root, elements, byId, pages };
}

export function annotationsOf(doc) {
  return doc.elements.filter((node) => attr(node, "data-edit-target") === "true").map((node) => ({
    element_id: node.editId, tag: node.tagName,
    annotation: attr(node, "data-edit-annotation") || "",
    content_preview: textOf(node).trim().slice(0, 100),
  }));
}

const STYLE_RULES = {
  color: /^(?:#[a-f\d]{3,8}|[a-z]+|rgba?\([\d.,%\s]+\)|hsla?\([\d.,%\s]+\))$/i,
  "background-color": /^(?:#[a-f\d]{3,8}|[a-z]+|rgba?\([\d.,%\s]+\))$/i,
  "font-size": /^(?:\d+(?:\.\d+)?)(?:px|pt|em|rem|%)$/,
  "font-family": /^[\p{L}\p{N}\s,'"_.-]+$/u,
  "font-weight": /^(?:normal|bold|[1-9]00)$/,
  "line-height": /^(?:normal|\d+(?:\.\d+)?(?:px|em|rem|%)?)$/,
  "text-align": /^(?:left|right|center|justify|start|end)$/,
  "letter-spacing": /^(?:normal|-?\d+(?:\.\d+)?(?:px|em))$/,
  width: /^(?:auto|\d+(?:\.\d+)?(?:px|%))$/,
  height: /^(?:auto|\d+(?:\.\d+)?px)$/,
  translate: /^-?\d+(?:\.\d+)?px\s+-?\d+(?:\.\d+)?px$/,
  position: /^(?:relative|absolute|fixed|sticky)$/,
  left: /^-?\d+(?:\.\d+)?px$/,
  top: /^-?\d+(?:\.\d+)?px$/,
  opacity: /^(?:0(?:\.\d+)?|1(?:\.0+)?)$/,
};

export function validateEdit(doc, edit) {
  const target = doc.byId.get(edit.element_id);
  if (!target || !doc.pages.some((page) => contains(page, target))) throw new Error("Element not found on a resume page");
  if (edit.text === undefined && !edit.styles) throw new Error("Nothing to edit");
  if (edit.text !== undefined) {
    if (typeof edit.text !== "string" || edit.text.length > 20000) throw new Error("Invalid or too-long text");
    // HTML has nested emphasis, links and icons. Never flatten that structure.
    if ((target.childNodes || []).some((child) => child.tagName) || !target.sourceCodeLocation.endTag || target.namespaceURI !== "http://www.w3.org/1999/xhtml") {
      throw new Error("Select a leaf text element; this element contains nested markup");
    }
  }
  if (edit.styles !== undefined) {
    if (!edit.styles || typeof edit.styles !== "object" || Array.isArray(edit.styles)) throw new Error("styles must be an object");
    for (const [key, value] of Object.entries(edit.styles)) {
      if (!STYLE_RULES[key] || typeof value !== "string" || !STYLE_RULES[key].test(value) || value.length > 300) throw new Error(`Invalid style: ${key}`);
    }
  }
}

function contains(parent, target) {
  for (let node = target; node; node = node.parentNode) if (node === parent) return true;
  return false;
}
export function pageFor(doc, target) { return doc.pages.findIndex((page) => contains(page, target)); }

function patched(source, patches) {
  let end = source.length;
  for (const patch of patches.sort((a, b) => b.start - a.start || b.end - a.end)) {
    if (patch.end > end) throw new Error("Overlapping HTML edits");
    source = source.slice(0, patch.start) + patch.value + source.slice(patch.end);
    end = patch.start;
  }
  return source;
}

export function renderDocument(doc, edits = [], annotations = null, { preview = false } = {}) {
  const changes = new Map();
  const forNode = (node) => {
    if (!changes.has(node)) changes.set(node, { attrs: new Map(), styles: {}, text: undefined });
    return changes.get(node);
  };
  if (preview) for (const node of doc.elements) forNode(node).attrs.set("id", node.editId);
  for (const edit of edits) {
    validateEdit(doc, edit);
    const node = doc.byId.get(edit.element_id);
    const change = forNode(node);
    if (edit.text !== undefined) change.text = edit.text;
    Object.assign(change.styles, edit.styles || {});
  }
  if (annotations !== null) {
    for (const node of doc.elements) {
      if (attr(node, "data-edit-target") !== undefined || attr(node, "data-edit-annotation") !== undefined) {
        const change = forNode(node);
        change.attrs.set("data-edit-target", null);
        change.attrs.set("data-edit-annotation", null);
      }
    }
    for (const [id, text] of Object.entries(annotations)) {
      const node = doc.byId.get(id);
      if (!node || pageFor(doc, node) < 0) throw new Error(`Annotation target not found: ${id}`);
      const change = forNode(node);
      change.attrs.set("id", id);
      change.attrs.set("data-edit-target", "true");
      change.attrs.set("data-edit-annotation", text);
    }
  }
  const patches = [];
  for (const [node, change] of changes) {
    if (Object.keys(change.styles).length) {
      // Append declarations: existing shorthands and custom properties remain intact.
      const original = attr(node, "style") || "";
      const extra = Object.entries(change.styles).map(([key, value]) => `${key}: ${value} !important;`).join(" ");
      change.attrs.set("style", `${original}${original && !original.trimEnd().endsWith(";") ? ";" : ""} ${extra}`.trim());
    }
    for (const [name, value] of change.attrs) {
      const existing = node.sourceCodeLocation.attrs?.[name];
      if (existing) {
        patches.push({ start: existing.startOffset, end: existing.endOffset, value: value === null ? "" : `${name}="${escapeAttr(value)}"` });
      } else if (value !== null) {
        // Coalesce insertions at the same start-tag boundary.
        const start = node.sourceCodeLocation.startTag.endOffset - (doc.source[node.sourceCodeLocation.startTag.endOffset - 2] === "/" ? 2 : 1);
        const prior = patches.find((patch) => patch.start === start && patch.end === start);
        if (prior) prior.value += ` ${name}="${escapeAttr(value)}"`;
        else patches.push({ start, end: start, value: ` ${name}="${escapeAttr(value)}"` });
      }
    }
    if (change.text !== undefined) patches.push({ start: node.sourceCodeLocation.startTag.endOffset, end: node.sourceCodeLocation.endTag.startOffset, value: escapeText(change.text) });
  }
  return patched(doc.source, patches);
}
