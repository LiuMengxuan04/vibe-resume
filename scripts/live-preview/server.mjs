// Node/HTML port of PPT Master's svg_editor/server.py protocol and lifecycle.
import http from "node:http";
import path from "node:path";
import { readFile, writeFile, mkdir, rename, unlink, realpath, open } from "node:fs/promises";
import { readFileSync, unlinkSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawn } from "node:child_process";
import lockfile from "proper-lockfile";
import { attr, digest, readDocument, renderDocument, annotationsOf, pageFor, validateEdit } from "./document.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(HERE, "../..");
export const DEFAULT_INPUT = "templates/internship-employment/standard-one-page/index.html";
const TYPES = { ".css": "text/css", ".js": "text/javascript", ".html": "text/html", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".woff2": "font/woff2", ".woff": "font/woff", ".ttf": "font/ttf", ".ico": "image/x-icon" };
const ASSETS = new Set([".css", ".svg", ".png", ".jpg", ".jpeg", ".webp", ".woff2", ".woff", ".ttf", ".ico"]);
const inside = (root, file) => { const rel = path.relative(root, file); return rel !== ".." && !rel.startsWith(`..${path.sep}`) && !path.isAbsolute(rel); };
const iso = () => new Date().toISOString();

export async function atomicWrite(file, content) {
  await mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.${Date.now()}.tmp`;
  try { await writeFile(temporary, content, "utf8"); await rename(temporary, file); }
  finally { await unlink(temporary).catch(() => {}); }
}

export class PreviewState {
  constructor(root, input, runtime) {
    this.root = root; this.input = input; this.runtime = runtime;
    this.pending = {}; this.startup = { restored: {}, conflicts: [] };
  }
  async snapshot() {
    const actual = await realpath(this.input);
    if (!inside(this.root, actual)) throw new Error("Resume source must stay inside the project");
    const source = await readFile(actual, "utf8");
    const doc = readDocument(source);
    if (!doc.pages.length) throw new Error("Waiting for a .page or .resume-page element");
    let revision = source;
    for (const node of doc.elements.filter((node) => node.tagName === "link" && attr(node, "rel") === "stylesheet")) {
      const href = attr(node, "href");
      if (!href || /^(?:[a-z]+:|\/\/)/i.test(href)) continue;
      const file = path.resolve(path.dirname(this.input), href.split(/[?#]/)[0]);
      if (inside(this.root, file)) revision += await readFile(file, "utf8").catch(() => "");
    }
    return { doc, digest: digest(source), revision: digest(revision) };
  }
  async restore() {
    let saved;
    try { saved = JSON.parse(await readFile(path.join(this.runtime, "draft.json"), "utf8")); }
    catch (error) { if (error.code === "ENOENT") return; saved = null; }
    const snapshot = await this.snapshot().catch(() => null);
    if (saved?.input === this.input && saved.pages && typeof saved.pages === "object" && snapshot) {
      for (const [page, entry] of Object.entries(saved.pages)) {
        try {
          if (entry.digest !== snapshot.digest) throw new Error("Source changed");
          this.validatePage(snapshot.doc, page);
          if (!Array.isArray(entry.edits) || !entry.annotations || typeof entry.annotations !== "object") throw new Error("Invalid draft");
          for (const edit of entry.edits) validateEdit(snapshot.doc, edit);
          for (const [id, text] of Object.entries(entry.annotations)) this.validateAnnotation(snapshot.doc, page, id, text);
          this.pending[page] = entry;
          this.startup.restored[page] = { edits: entry.edits.length, annotations: entry.annotationDirty };
        } catch { this.startup.conflicts.push(page); }
      }
    } else { this.startup.unreadable = true; }
    if (this.startup.conflicts.length || this.startup.unreadable) {
      const name = `draft_conflict_${Date.now()}.json`;
      await rename(path.join(this.runtime, "draft.json"), path.join(this.runtime, name));
      this.startup.conflict_file = name;
    }
    await this.persist();
  }
  validatePage(doc, page) {
    const index = Number(/^page-(\d+)$/.exec(page)?.[1]) - 1;
    if (!doc.pages[index]) throw new Error("Page not found");
    return index;
  }
  validateAnnotation(doc, page, id, text) {
    const index = this.validatePage(doc, page);
    if (typeof id !== "string" || id.length > 200 || pageFor(doc, doc.byId.get(id)) !== index) throw new Error("Annotation target not found");
    if (typeof text !== "string" || !text.trim() || text.length > 10000) throw new Error("Invalid annotation");
  }
  entry(snapshot, page, baseDigest) {
    const index = this.validatePage(snapshot.doc, page);
    if (baseDigest !== snapshot.digest) throw new Error("HTML changed on disk; reload the page before editing");
    for (const entry of Object.values(this.pending)) if (entry.digest !== snapshot.digest) throw new Error("HTML changed after staging; discard the conflicting draft before editing");
    if (!this.pending[page]) this.pending[page] = {
      digest: snapshot.digest, edits: [], annotationDirty: false,
      annotations: Object.fromEntries(annotationsOf(snapshot.doc).filter((annotation) => pageFor(snapshot.doc, snapshot.doc.byId.get(annotation.element_id)) === index).map((annotation) => [annotation.element_id, annotation.annotation])),
    };
    return this.pending[page];
  }
  allAnnotations(doc) {
    const result = Object.fromEntries(annotationsOf(doc).map((a) => [a.element_id, a.annotation]));
    for (const [page, entry] of Object.entries(this.pending)) {
      const index = this.validatePage(doc, page);
      for (const id of Object.keys(result)) if (pageFor(doc, doc.byId.get(id)) === index) delete result[id];
      Object.assign(result, entry.annotations);
    }
    return result;
  }
  async persist() {
    const pages = Object.fromEntries(Object.entries(this.pending).filter(([, entry]) => entry.edits.length || entry.annotationDirty));
    if (!Object.keys(pages).length) { await unlink(path.join(this.runtime, "draft.json")).catch(() => {}); return true; }
    try {
      await atomicWrite(path.join(this.runtime, "draft.json"), JSON.stringify({ input: this.input, pages }, null, 2));
      return true;
    } catch (error) { console.warn(`Draft remains in memory: ${error.message}`); return false; }
  }
  async stage(page, data, kind) {
    const snapshot = await this.snapshot();
    const target = snapshot.doc.byId.get(data.element_id);
    if (kind === "edit") {
      validateEdit(snapshot.doc, data);
      if (pageFor(snapshot.doc, target) !== this.validatePage(snapshot.doc, page)) throw new Error("Element belongs to another page");
    } else this.validateAnnotation(snapshot.doc, page, data.element_id, data.annotation);
    const entry = this.entry(snapshot, page, data.base_digest);
    if (kind === "edit") {
      const edit = { element_id: data.element_id, ...(data.text !== undefined ? { text: data.text } : {}), ...(data.styles ? { styles: data.styles } : {}) };
      const signature = (item) => JSON.stringify([item.element_id, item.text !== undefined, Object.keys(item.styles || {}).sort()]);
      if (entry.edits.length && signature(entry.edits.at(-1)) === signature(edit)) entry.edits[entry.edits.length - 1] = edit;
      else entry.edits.push(edit);
    } else { entry.annotations[data.element_id] = data.annotation; entry.annotationDirty = true; }
    return { status: "ok", undo_depth: entry.edits.length, draft_saved: await this.persist() };
  }
  async log(name, records) {
    if (!records.length) return;
    try {
      await mkdir(this.runtime, { recursive: true });
      const handle = await open(path.join(this.runtime, name), "a");
      try { await handle.writeFile(records.map((record) => JSON.stringify(record)).join("\n") + "\n"); }
      finally { await handle.close(); }
    } catch (error) { console.warn(`Preview history could not be written: ${error.message}`); }
  }
  async save() {
    const snapshot = await this.snapshot();
    const entries = Object.values(this.pending).filter((entry) => entry.edits.length || entry.annotationDirty);
    if (!entries.length) return { status: "ok", files_modified: [], draft_saved: true };
    if (entries.some((entry) => entry.digest !== snapshot.digest)) throw new Error("HTML changed on disk after staging; changes were not written. Restart preview to preserve the conflicting draft and reload.");
    const edits = entries.flatMap((entry) => entry.edits);
    const annotations = this.allAnnotations(snapshot.doc);
    const output = renderDocument(snapshot.doc, edits, annotations);
    // Check once more immediately before the atomic replacement.
    if (digest(await readFile(this.input, "utf8")) !== snapshot.digest) throw new Error("HTML changed while saving; retry after reloading");
    await atomicWrite(this.input, output);
    const file = path.relative(this.root, this.input).replaceAll("\\", "/");
    await this.log("edits.jsonl", edits.map((edit) => ({ ts: iso(), file, action: "edit", ...edit })));
    await this.log("annotations.jsonl", entries.flatMap((entry) => Object.entries(entry.annotations).map(([element_id, text]) => ({ ts: iso(), file, element_id, action: "annotation_saved", new: text }))));
    this.pending = {};
    return { status: "ok", files_modified: [file], draft_saved: await this.persist() };
  }
}

async function bodyOf(req) {
  let body = "";
  for await (const chunk of req) { body += chunk; if (body.length > 100000) throw new Error("Request too large"); }
  return body ? JSON.parse(body) : {};
}

export async function createPreview({ root = REPO_ROOT, input = DEFAULT_INPUT, port = 4173, strictPort = false, timeout = 7200 } = {}) {
  root = await realpath(root);
  input = path.resolve(root, input);
  if (!inside(root, input) || path.extname(input) !== ".html") throw new Error("Choose an HTML file inside the project");
  input = await realpath(input).catch((error) => { if (error.code === "ENOENT") return input; throw error; });
  if (!inside(root, input)) throw new Error("Resume source must stay inside the project");
  const runtime = path.join(root, "live_preview", digest(input).slice(0, 12));
  await mkdir(runtime, { recursive: true });
  const lock = path.join(runtime, "lock.json");
  // Acquire the process-wide lease before restore() can rewrite a shared draft.
  const release = lockfile.lockSync(lock, { realpath: false });
  const instanceId = randomUUID();
  let released = false;
  const releaseInstance = () => {
    if (released) return;
    released = true;
    try {
      if (JSON.parse(readFileSync(lock, "utf8")).instance_id === instanceId) unlinkSync(lock);
    } catch (error) { if (error.code !== "ENOENT") console.warn(`Preview discovery cleanup failed: ${error.message}`); }
    release();
  };
  const state = new PreviewState(root, input, runtime);
  try {
    await state.restore();
    return await listenPreview(state, { port, strictPort, timeout, lock, instanceId, releaseInstance });
  } catch (error) { releaseInstance(); throw error; }
}

async function listenPreview(state, { port, strictPort, timeout, lock, instanceId, releaseInstance }) {
  const { root, input, runtime } = state;
  let mutations = Promise.resolve();
  let lastActivity = Date.now();
  let url;
  const server = http.createServer((req, res) => {
    const run = async () => {
      lastActivity = Date.now();
      const expectedHost = new URL(url).host;
      if (req.headers.host !== expectedHost && req.headers.host !== expectedHost.replace("127.0.0.1", "localhost")) { res.writeHead(403).end(); return; }
      if ((req.headers.origin && req.headers.origin !== `http://${req.headers.host}`) || req.headers["sec-fetch-site"] === "cross-site") { res.writeHead(403).end(); return; }
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("X-Content-Type-Options", "nosniff");
      const send = (value, status = 200) => { res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" }); res.end(JSON.stringify(value)); };
      const sendFile = async (file) => { const bytes = await readFile(file); res.writeHead(200, { "Content-Type": `${TYPES[path.extname(file)] || "application/octet-stream"}${/\.(?:html|css|js|svg)$/.test(file) ? "; charset=utf-8" : ""}` }); res.end(bytes); };
      try {
        const route = decodeURIComponent(new URL(req.url, url).pathname);
        if (req.method === "GET" && route === "/") return await sendFile(path.join(HERE, "static/index.html"));
        if (req.method === "GET" && /^\/static\/(?:app\.js|html-canvas\.js|style\.css)$/.test(route)) return await sendFile(path.join(HERE, route.slice(1)));
        if (req.method === "GET" && route.startsWith("/source/")) {
          const file = await realpath(path.resolve(root, route.slice(8)));
          if (!inside(root, file) || !ASSETS.has(path.extname(file).toLowerCase()) || path.relative(root, file).split(path.sep).some((part) => part.startsWith(".") || ["node_modules", "live_preview"].includes(part))) return send({ error: "Asset not allowed" }, 403);
          return await sendFile(file);
        }
        if (req.method === "GET" && route === "/api/health") return send({ service: "vibe_resume_preview", input, pid: process.pid });
        if (req.method === "GET" && route === "/api/config") return send({ live: true, draft: { pending: Object.fromEntries(Object.entries(state.pending).map(([name, entry]) => [name, { edits: entry.edits.length, annotations: entry.annotationDirty }])), startup: state.startup } });
        if (req.method === "POST" && route === "/api/shutdown") { send({ status: "ok" }); setTimeout(() => server.close(), 50); return; }
        if (req.method === "GET" && route === "/api/slides") {
          try {
            const snapshot = await state.snapshot();
            return send({ slides: snapshot.doc.pages.map((_, index) => ({ name: `page-${index + 1}`, mtime: snapshot.revision, ok: true, annotation_count: Object.keys(state.pending[`page-${index + 1}`]?.annotations || Object.fromEntries(annotationsOf(snapshot.doc).filter((a) => pageFor(snapshot.doc, snapshot.doc.byId.get(a.element_id)) === index).map((a) => [a.element_id, a.annotation]))).length })) });
          } catch (error) { return send({ slides: [], waiting: error.message }); }
        }
        const match = /^\/api\/slide\/(page-\d+)(?:\/(edit|annotate|undo)(?:\/([^/]+))?)?$/.exec(route);
        if (match) {
          const [, page, action, id] = match;
          if (req.method === "GET" && !action) {
            const snapshot = await state.snapshot();
            const index = state.validatePage(snapshot.doc, page);
            const conflict = Object.values(state.pending).some((entry) => entry.digest !== snapshot.digest);
            if (conflict) return send({ error: "Source changed while changes were staged. Restart preview to preserve the conflicting draft and reload." }, 409);
            const edits = Object.values(state.pending).flatMap((entry) => entry.edits);
            const annotations = state.allAnnotations(snapshot.doc);
            const folder = path.relative(root, path.dirname(input)).split(path.sep).filter(Boolean).map(encodeURIComponent).join("/");
            return send({ content: renderDocument(snapshot.doc, edits, annotations, { preview: true }), page_index: index, base_digest: snapshot.digest, mtime: snapshot.revision, base_url: `/source/${folder ? `${folder}/` : ""}`, annotations: Object.entries(annotations).filter(([id]) => pageFor(snapshot.doc, snapshot.doc.byId.get(id)) === index).map(([element_id, annotation]) => ({ element_id, annotation })), undo_depth: state.pending[page]?.edits.length || 0 });
          }
          if (req.method === "POST" && ["edit", "annotate"].includes(action)) return send(await state.stage(page, await bodyOf(req), action));
          if (req.method === "DELETE" && action === "annotate" && id) {
            const snapshot = await state.snapshot();
            const data = await bodyOf(req);
            const entry = state.entry(snapshot, page, data.base_digest);
            delete entry.annotations[id]; entry.annotationDirty = true;
            return send({ status: "ok", draft_saved: await state.persist() });
          }
          if (req.method === "POST" && action === "undo") {
            const entry = state.pending[page];
            if (entry) {
              entry.edits.pop();
              if (!entry.edits.length && !entry.annotationDirty) delete state.pending[page];
            }
            return send({ status: entry ? "ok" : "empty", undo_depth: entry?.edits.length || 0, draft_saved: await state.persist() });
          }
        }
        if (req.method === "POST" && route === "/api/save-all") return send(await state.save());
        send({ error: "Not found" }, 404);
      } catch (error) { send({ error: error.message }, /changed|conflict/i.test(error.message) ? 409 : 400); }
    };
    const task = mutations.then(run);
    mutations = task.catch((error) => { if (!res.headersSent) res.writeHead(500).end(JSON.stringify({ error: error.message })); else res.end(); });
  });
  while (true) {
    try { await new Promise((resolve, reject) => { server.once("error", reject); server.listen(port, "127.0.0.1", () => { server.removeListener("error", reject); resolve(); }); }); break; }
    catch (error) { if (error.code !== "EADDRINUSE" || strictPort || port === 0) throw error; port++; }
  }
  url = `http://127.0.0.1:${server.address().port}`;
  let watchdog;
  server.on("close", () => { clearInterval(watchdog); releaseInstance(); });
  try { await atomicWrite(lock, JSON.stringify({ url, pid: process.pid, input, instance_id: instanceId }, null, 2)); }
  catch (error) { await new Promise((resolve) => server.close(resolve)); throw error; }
  watchdog = timeout ? setInterval(() => { if (Date.now() - lastActivity > timeout * 1000) server.close(); }, 1000) : null;
  watchdog?.unref();
  return { server, state, url, runtime };
}

async function runningPreview(runtime, input) {
  const lock = await readFile(path.join(runtime, "lock.json"), "utf8").then(JSON.parse).catch(() => null);
  if (lock?.input !== input || !/^http:\/\/127\.0\.0\.1:\d+$/.test(lock.url)) return null;
  try {
    const health = await fetch(`${lock.url}/api/health`, { signal: AbortSignal.timeout(1500) }).then((res) => res.json());
    if (health.service === "vibe_resume_preview" && health.input === input && health.pid === lock.pid) return lock;
  } catch {}
  return null;
}

async function cli() {
  const args = process.argv.slice(2);
  const value = (flag, fallback) => args.includes(flag) ? args[args.indexOf(flag) + 1] : fallback;
  let input = path.resolve(REPO_ROOT, args.find((arg, index) => !arg.startsWith("--") && !["--port", "--timeout"].includes(args[index - 1])) || DEFAULT_INPUT);
  input = await realpath(input).catch((error) => { if (error.code === "ENOENT") return input; throw error; });
  if (!inside(REPO_ROOT, input)) throw new Error("HTML must be inside VibeResume");
  const runtime = path.join(REPO_ROOT, "live_preview", digest(input).slice(0, 12));
  const running = await runningPreview(runtime, input);
  if (args.includes("--shutdown")) {
    if (running) await fetch(`${running.url}/api/shutdown`, { method: "POST" });
    console.log(running ? "Preview stopped." : "No preview running."); return;
  }
  if (running) { console.log(`Preview already running: ${running.url}`); return; }
  if (args.includes("--daemon")) {
    await mkdir(runtime, { recursive: true });
    const log = await open(path.join(runtime, "server.log"), "a");
    const child = spawn(process.execPath, [fileURLToPath(import.meta.url), ...args.filter((arg) => arg !== "--daemon"), "--no-browser"], { detached: true, windowsHide: true, stdio: ["ignore", log.fd, log.fd], cwd: REPO_ROOT });
    child.unref(); await log.close();
    const deadline = Date.now() + 20000;
    while (Date.now() < deadline) {
      const ready = await runningPreview(runtime, input);
      if (ready) { console.log(`Live preview: ${ready.url}`); if (!args.includes("--no-browser")) openBrowser(ready.url); return; }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error(`Preview did not start; see ${path.join(runtime, "server.log")}`);
  }
  const port = Number(value("--port", 4173));
  const timeout = Number(value("--timeout", 7200));
  if (!Number.isInteger(port) || port < 0 || port > 65535 || !Number.isFinite(timeout) || timeout < 0) throw new Error("Invalid port or timeout");
  const deadline = Date.now() + 20000;
  while (true) {
    try {
      const preview = await createPreview({ input, port, strictPort: args.includes("--port"), timeout });
      console.log(`Live preview: ${preview.url}\nHTML source: ${input}\nApply changes saves HTML; ask AI to apply annotations and export PDF.`);
      if (!args.includes("--no-browser")) openBrowser(preview.url);
      return;
    } catch (error) {
      if (error.code !== "ELOCKED") throw error;
      const running = await runningPreview(runtime, input);
      if (running) { console.log(`Preview already running: ${running.url}`); return; }
      if (Date.now() >= deadline) throw new Error("Another preview is still starting; retry shortly.");
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
}

function openBrowser(url) {
  const executable = process.platform === "win32" ? "rundll32.exe" : process.platform === "darwin" ? "open" : "xdg-open";
  const args = process.platform === "win32" ? ["url.dll,FileProtocolHandler", url] : [url];
  const child = spawn(executable, args, { detached: true, windowsHide: true, stdio: "ignore" });
  child.on("error", () => {}); child.unref();
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) cli().catch((error) => { console.error(error.message); process.exitCode = 1; });
