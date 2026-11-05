import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, mkdir, writeFile, readFile, rm, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readDocument, renderDocument, annotationsOf, textOf, digest } from "../scripts/live-preview/document.mjs";
import { createPreview } from "../scripts/live-preview/server.mjs";
import { scanAnnotations } from "../scripts/check-annotations.mjs";

const SOURCE = '<!doctype html>\n<html><head><link rel="stylesheet" href="styles.css"></head><body>\n<main class="resume-book"><article class="resume-page"><h1>A &amp; B</h1><p>Keep <strong>nested</strong> <a href="mailto:demo@example.com">link</a></p><svg viewBox="0 0 24 24"><path d="M1 2h3"/></svg></article><article class="resume-page"><h2>Second page</h2></article></main></body></html>\n';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../tmp");

test("HTML edits preserve untouched source bytes, inline SVG and nested links", () => {
  const doc = readDocument(SOURCE);
  assert.equal(renderDocument(doc), SOURCE);
  const title = doc.elements.find((node) => node.tagName === "h1");
  const output = renderDocument(doc, [{ element_id: title.editId, text: '<New> & title', styles: { color: '#123456' } }], { [title.editId]: 'Keep "quotes" & <markup>' });
  const after = readDocument(output);
  assert.equal(textOf(after.byId.get(title.editId)), '<New> & title');
  assert.equal(annotationsOf(after)[0].annotation, 'Keep "quotes" & <markup>');
  assert.ok(output.includes('<svg viewBox="0 0 24 24"><path d="M1 2h3"/></svg>'));
  assert.ok(output.includes('<p>Keep <strong>nested</strong> <a href="mailto:demo@example.com">link</a></p>'));
  assert.ok(output.endsWith('</body></html>\n'));
  const paragraph = doc.elements.find((node) => node.tagName === "p");
  assert.throws(() => renderDocument(doc, [{ element_id: paragraph.editId, text: 'flatten' }]), /nested markup/);
  assert.throws(() => renderDocument(doc, [{ element_id: title.editId, styles: { color: 'url(javascript:alert(1))' } }]), /Invalid style/);
});

test("preview keeps existing ids unique and removes annotation markers only when requested", () => {
  const source = '<main class="page"><h1 id="_edit_1" data-edit-target="true" data-edit-annotation="Revise">Title</h1><p>Text</p></main>';
  const doc = readDocument(source);
  const preview = readDocument(renderDocument(doc, [], null, { preview: true }));
  assert.equal(preview.elements.length, preview.byId.size);
  assert.equal(annotationsOf(preview).length, 1);
  assert.equal(annotationsOf(readDocument(renderDocument(doc, [], {}))).length, 0);
});

test("undoing all direct edits allows external HTML updates without losing staged annotations", async (t) => {
  await mkdir(ROOT, { recursive: true });
  const root = await mkdtemp(path.join(ROOT, "preview-undo-test-"));
  const input = path.join(root, "index.html");
  await writeFile(input, SOURCE);
  const preview = await createPreview({ root, input, port: 0, timeout: 0 });
  t.after(async () => {
    preview.server.closeAllConnections();
    await new Promise((resolve) => preview.server.close(resolve));
    await rm(root, { recursive: true, force: true });
  });
  const request = async (route, data) => {
    const response = await fetch(preview.url + route, data === undefined ? undefined : {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    });
    return { status: response.status, data: await response.json() };
  };
  let page = (await request('/api/slide/page-1')).data;
  const id = readDocument(page.content).elements.find((node) => node.tagName === 'h1').editId;
  let edit = { element_id: id, base_digest: page.base_digest, text: 'Temporary edit' };
  assert.equal((await request('/api/slide/page-1/edit', edit)).status, 200);
  assert.equal((await request('/api/slide/page-1/undo', {})).data.undo_depth, 0);

  // With nothing left to apply, an AI source edit must reload without a restart.
  await writeFile(input, SOURCE.replace('A &amp; B', 'External AI edit'));
  const refreshed = await request('/api/slide/page-1');
  assert.equal(refreshed.status, 200);
  page = refreshed.data;
  assert.ok(page.content.includes('External AI edit'));
  edit = { ...edit, base_digest: page.base_digest };
  assert.equal((await request('/api/slide/page-1/edit', edit)).status, 200);

  // Undo only the direct edit; pending annotations must still survive and save.
  assert.equal((await request('/api/slide/page-1/annotate', { ...edit, annotation: 'Keep this instruction' })).status, 200);
  assert.equal((await request('/api/slide/page-1/undo', {})).data.undo_depth, 0);
  assert.equal((await request('/api/slide/page-1')).data.annotations[0].annotation, 'Keep this instruction');
  assert.equal((await request('/api/save-all', {})).status, 200);
  assert.equal((await scanAnnotations(input))[0].annotation, 'Keep this instruction');
  assert.ok((await readFile(input, 'utf8')).includes('External AI edit'));
});

test("staging, undo, save, AI handoff, restart recovery and conflict guard through HTTP", async (t) => {
  await mkdir(ROOT, { recursive: true });
  const root = await mkdtemp(path.join(ROOT, "preview-test-"));
  const input = path.join(root, "index.html");
  await writeFile(input, SOURCE);
  await writeFile(path.join(root, "styles.css"), '.resume-page { width: 1080px; }');
  let preview = await createPreview({ root, input, port: 0, timeout: 0 });
  const stop = async () => { preview.server.closeAllConnections(); await new Promise((resolve) => preview.server.close(resolve)); };
  t.after(async () => { await stop(); await rm(root, { recursive: true, force: true }); });
  const request = async (route, data, method = "POST") => {
    const response = await fetch(preview.url + route, data === undefined ? undefined : { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    return { status: response.status, data: await response.json() };
  };
  let page = (await request('/api/slide/page-1')).data;
  const doc = readDocument(page.content);
  const id = doc.elements.find((node) => node.tagName === "h1").editId;
  const body = { element_id: id, base_digest: page.base_digest };
  assert.equal((await request('/api/slides')).data.slides.length, 2);
  assert.equal((await request('/api/slide/page-1/edit', { ...body, text: 'Staged name' })).status, 200);
  assert.equal(await readFile(input, 'utf8'), SOURCE);
  assert.equal((await request('/api/slide/page-1/edit', { ...body, text: 'Latest name' })).data.undo_depth, 1);
  assert.equal((await request('/api/slide/page-1/undo', {})).data.undo_depth, 0);
  assert.equal((await request('/api/slide/page-1/edit', { ...body, text: 'Saved name' })).status, 200);
  assert.equal((await request('/api/slide/page-1/annotate', { ...body, annotation: 'Make this more concise' })).status, 200);
  assert.equal((await request('/api/slide/page-2/edit', { ...body, text: 'Wrong page' })).status, 400);
  const config = (await request('/api/config')).data;
  assert.equal(config.draft.pending['page-1'].edits, 1);
  await stop();
  preview = await createPreview({ root, input, port: 0, timeout: 0 });
  assert.equal((await request('/api/config')).data.draft.startup.restored['page-1'].edits, 1);
  assert.equal((await request('/api/save-all', {})).status, 200);
  assert.equal((await scanAnnotations(input))[0].annotation, 'Make this more concise');
  assert.ok((await readFile(input, 'utf8')).includes('Saved name'));
  assert.equal((await request('/api/config')).data.draft.pending['page-1'], undefined);
  page = (await request('/api/slide/page-1')).data;
  assert.equal((await request('/api/slide/page-1/annotate/' + id, { base_digest: page.base_digest }, 'DELETE')).status, 200);
  await request('/api/save-all', {});
  assert.equal((await scanAnnotations(input)).length, 0);
  page = (await request('/api/slide/page-1')).data;
  const changedId = readDocument(page.content).elements.find((node) => node.tagName === 'h1').editId;
  await request('/api/slide/page-1/edit', { element_id: changedId, base_digest: page.base_digest, styles: { color: '#ff0000' } });
  const external = (await readFile(input, 'utf8')).replace('Saved name', 'External AI edit');
  await writeFile(input, external);
  assert.equal((await request('/api/save-all', {})).status, 409);
  assert.equal(await readFile(input, 'utf8'), external);
  await stop();
  preview = await createPreview({ root, input, port: 0, timeout: 0 });
  assert.ok((await request('/api/config')).data.draft.startup.conflict_file);
  assert.ok((await readdir(preview.runtime)).some((name) => name.startsWith('draft_conflict_')));
  const unsafe = await fetch(preview.url + '/api/save-all', { method: 'POST', headers: { Origin: 'https://example.com' }, body: '{}' });
  assert.equal(unsafe.status, 403);
  const secret = await fetch(preview.url + '/source/.env');
  assert.notEqual(secret.status, 200);
  const initial = (await request('/api/slides')).data.slides[0].mtime;
  await writeFile(path.join(root, 'styles.css'), '.resume-page{color:blue}');
  assert.notEqual((await request('/api/slides')).data.slides[0].mtime, initial);
});
