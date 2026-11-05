import assert from "node:assert/strict";
import { test } from "node:test";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdir, mkdtemp, writeFile, readFile, rm, utimes } from "node:fs/promises";
import path from "node:path";
import lockfile from "proper-lockfile";
import { createPreview, REPO_ROOT } from "../scripts/live-preview/server.mjs";
import { readDocument, digest } from "../scripts/live-preview/document.mjs";

const SOURCE = '<main class="page"><h1>Original name</h1><p>Keep this text</p></main>';
const TMP_ROOT = path.join(REPO_ROOT, "tmp");
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function until(predicate) {
  const deadline = Date.now() + 10000;
  while (!await predicate()) {
    if (Date.now() > deadline) throw new Error("Timed out waiting for preview lifecycle");
    await delay(50);
  }
}
async function request(url, route, data) {
  const response = await fetch(url + route, { signal: AbortSignal.timeout(3000), ...(data === undefined ? {} : {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
  }) });
  const result = await response.json();
  assert.equal(response.status, 200, result.error);
  return result;
}
async function fixture(t) {
  await mkdir(TMP_ROOT, { recursive: true });
  const root = await mkdtemp(path.join(TMP_ROOT, "preview-lifecycle-"));
  const input = path.join(root, "index.html");
  await writeFile(input, SOURCE);
  const runtime = path.join(REPO_ROOT, "live_preview", digest(input).slice(0, 12));
  const lock = path.join(runtime, "lock.json");
  const servers = [], children = [], urls = new Set();
  const start = async (options = {}) => {
    const preview = await createPreview({ input, port: 0, timeout: 0, ...options });
    servers.push(preview.server);
    return preview;
  };
  const launch = (daemon = false) => new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(REPO_ROOT, "scripts/live-preview/server.mjs"), input,
      "--no-browser", "--timeout", "0", "--port", "0", ...(daemon ? ["--daemon"] : [])],
    { cwd: REPO_ROOT, windowsHide: true });
    children.push(child);
    let output = "", errors = "";
    const timer = setTimeout(() => { child.kill(); reject(new Error(output + errors || "Preview launch timed out")); }, 25000);
    child.stdout.on("data", (chunk) => {
      output += chunk;
      const url = output.match(/http:\/\/127\.0\.0\.1:\d+/)?.[0];
      if (url) { clearTimeout(timer); urls.add(url); resolve({ child, url }); }
    });
    child.stderr.on("data", (chunk) => { errors += chunk; });
    child.on("error", (error) => { clearTimeout(timer); reject(error); });
    child.on("close", (code) => { if (!output.includes("http://")) { clearTimeout(timer); reject(new Error(`Preview exited (${code}): ${errors}`)); } });
  });
  const stop = async (url) => {
    await request(url, "/api/shutdown", {});
    await until(() => !lockfile.checkSync(lock, { realpath: false }));
    urls.delete(url);
  };
  t.after(async () => {
    for (const server of servers) if (server.listening) {
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
    }
    for (const url of urls) await stop(url).catch(() => {});
    for (const child of children) if (child.exitCode === null && child.signalCode === null) {
      const closed = once(child, "close"); child.kill(); await closed;
    }
    // Only remove the disposable fixture and its own runtime, never user sources.
    assert.equal(path.dirname(root), TMP_ROOT);
    assert.equal(path.dirname(runtime), path.join(REPO_ROOT, "live_preview"));
    await rm(root, { recursive: true, force: true });
    await rm(runtime, { recursive: true, force: true });
  });
  return { input, runtime, lock, start, launch, stop };
}

test("concurrent foreground and daemon launches share one server and retain both drafts", async (t) => {
  const f = await fixture(t);
  await mkdir(f.runtime, { recursive: true });
  // Hold the lease before discovery is published to exercise the startup window.
  const release = lockfile.lockSync(f.lock, { realpath: false });
  let launched;
  try {
    launched = Promise.all([f.launch(), f.launch(true)]);
    await delay(300);
    assert.equal(await readFile(f.lock, "utf8").catch(() => null), null);
  } finally { release(); }
  const [a, b] = await launched;
  assert.equal(a.url, b.url);
  const page = await request(a.url, "/api/slide/page-1");
  const id = readDocument(page.content).elements.find((node) => node.tagName === "h1").editId;
  const base = { element_id: id, base_digest: page.base_digest };
  assert.equal((await request(a.url, "/api/slide/page-1/edit", { ...base, text: "Both clients survive" })).draft_saved, true);
  assert.equal((await request(b.url, "/api/slide/page-1/edit", { ...base, styles: { color: "#2244aa" } })).draft_saved, true);
  await f.stop(a.url);
  const reopened = await f.start();
  const restored = await request(reopened.url, "/api/slide/page-1");
  assert.ok(restored.content.includes("Both clients survive"));
  assert.ok(restored.content.includes("color: #2244aa"));
  assert.equal(restored.undo_depth, 2);
});

test("a duplicate API start cannot restore or overwrite an active server's draft", async (t) => {
  const f = await fixture(t);
  const preview = await f.start();
  const page = await request(preview.url, "/api/slide/page-1");
  const id = readDocument(page.content).elements.find((node) => node.tagName === "h1").editId;
  await request(preview.url, "/api/slide/page-1/edit", { element_id: id, base_digest: page.base_digest, text: "Acknowledged draft" });
  const draft = await readFile(path.join(f.runtime, "draft.json"), "utf8");
  await assert.rejects(f.start(), { code: "ELOCKED" });
  assert.equal(await readFile(path.join(f.runtime, "draft.json"), "utf8"), draft);
  assert.ok((await request(preview.url, "/api/slide/page-1")).content.includes("Acknowledged draft"));
});

test("failed startup releases its lease and closing cannot delete another discovery record", async (t) => {
  const first = await fixture(t), second = await fixture(t);
  const owner = await first.start();
  await assert.rejects(second.start({ port: new URL(owner.url).port * 1, strictPort: true }), { code: "EADDRINUSE" });
  assert.equal(lockfile.checkSync(second.lock, { realpath: false }), false);
  const recovered = await second.start();
  const replacement = { url: recovered.url, pid: process.pid, input: second.input, instance_id: "another-owner" };
  await writeFile(second.lock, JSON.stringify(replacement));
  recovered.server.closeAllConnections();
  await new Promise((resolve) => recovered.server.close(resolve));
  assert.deepEqual(JSON.parse(await readFile(second.lock, "utf8")), replacement);
});

test("an abandoned stale lease recovers an acknowledged draft after a process crash", async (t) => {
  const f = await fixture(t);
  const { child, url } = await f.launch();
  const page = await request(url, "/api/slide/page-1");
  const id = readDocument(page.content).elements.find((node) => node.tagName === "h1").editId;
  await request(url, "/api/slide/page-1/edit", { element_id: id, base_digest: page.base_digest, text: "Recovered after crash" });
  const closed = once(child, "close"); child.kill("SIGKILL"); await closed;
  // Age only the dead process's lease instead of spending ten seconds in a test.
  await mkdir(f.lock + ".lock", { recursive: true });
  const stale = new Date(Date.now() - 20000);
  await utimes(f.lock + ".lock", stale, stale);
  const recovered = await f.start();
  assert.ok((await request(recovered.url, "/api/slide/page-1")).content.includes("Recovered after crash"));
  assert.equal(recovered.state.startup.restored["page-1"].edits, 1);
});
