import assert from 'node:assert/strict';
import http from 'node:http';
import { cp, mkdir, mkdtemp, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { chromium } from 'playwright-core';
import { pageFor, readDocument } from '../scripts/live-preview/document.mjs';
import { createPreview } from '../scripts/live-preview/server.mjs';
import { scanAnnotations } from '../scripts/check-annotations.mjs';

const ARTIFACTS = path.resolve('tmp/pr5-review-fixes-20261103');
const STANDARD = 'templates/internship-employment/standard-one-page/index.html';
const DENSE = 'templates/internship-employment/dense-two-page/index.html';
const phase = process.env.PR5_PHASE || 'run';

async function fixture(input) {
  await mkdir(ARTIFACTS, { recursive: true });
  const root = await mkdtemp(path.join(ARTIFACTS, 'fixture-'));
  await cp(path.dirname(input), path.join(root, path.dirname(input)), { recursive: true });
  await cp('assets', path.join(root, 'assets'), { recursive: true });
  const preview = await createPreview({ root, input, port: 0, timeout: 0 });
  return { root, input: path.join(root, input), preview };
}

async function stop(preview) {
  if (!preview.server.listening) return;
  preview.server.closeAllConnections();
  await new Promise((resolve) => preview.server.close(resolve));
}

async function api(preview, route, data, method = 'POST') {
  const res = await fetch(preview.url + route, data === undefined ? undefined : {
    method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  });
  const result = await res.json();
  assert.equal(res.status, 200, result.error);
  return result;
}

async function browserTest(label, input, run, before) {
  const f = await fixture(input);
  let browser, page;
  try {
    if (before) await before(f);
    browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, headless: true });
    page = await browser.newPage({ viewport: { width: 1500, height: 1000 }, locale: 'zh-CN' });
    await page.goto(f.preview.url);
    await waitPage(page, 1);
    await run({ ...f, page });
  } catch (error) {
    if (page) await page.screenshot({ path: path.join(ARTIFACTS, `${phase}-${label}.png`), fullPage: true });
    throw error;
  } finally {
    if (browser) await browser.close();
    await stop(f.preview);
  }
}

async function waitPage(page, number) {
  await page.waitForFunction((n) => {
    const doc = document.querySelector('iframe')?.contentDocument;
    const pages = doc?.querySelectorAll('.resume-page,.page');
    return document.querySelector('#nav-name').textContent === `page-${n}` &&
      pages?.[n - 1] && getComputedStyle(pages[n - 1]).display !== 'none';
  }, number);
  return page.frames().find((frame) => frame.parentFrame());
}

async function save(page) {
  await page.locator('#btn-save').click();
  await page.locator('#modal-confirm').click();
  await page.waitForFunction(() => /保存|saved/i.test(document.querySelector('#modal-message').textContent));
  await page.locator('#modal-overlay').click({ position: { x: 10, y: 10 } });
}

async function delayResponse(page, urlPattern, method) {
  let arrived, release, finished;
  const seen = new Promise((resolve) => { arrived = resolve; });
  const gate = new Promise((resolve) => { release = resolve; });
  const done = new Promise((resolve) => { finished = resolve; });
  let held = false;
  await page.route(urlPattern, async (route) => {
    if (held || route.request().method() !== method) return route.continue();
    held = true;
    const response = await route.fetch();
    arrived(response.status());
    await gate;
    await route.fulfill({ response });
    finished();
  });
  return { seen, release, done };
}

for (const [label, input] of [['standard', STANDARD], ['dense', DENSE]]) {
  test(`right-click overlap picker keeps the chosen parent selected (${label})`, { skip: !process.env.CHROME_PATH }, async () => {
    await browserTest(`overlap-${label}`, input, async ({ page }) => {
      const frame = await waitPage(page, 1);
      await frame.locator('h1').first().click({ button: 'right' });
      const buttons = frame.locator('.overlap-picker button');
      assert.ok(await buttons.count() >= 2);
      const chosen = await buttons.nth(1).textContent();
      await buttons.nth(1).click();
      console.log(`${label} parent=${chosen}; selected=${await page.locator('#selected-element').textContent()}`);
      assert.equal(await page.locator('#annotation-input').isVisible(), true);
      assert.equal(await frame.locator('.svg-selected').count(), 1);
      assert.ok(chosen.startsWith(await page.locator('#selected-element .el-tag').textContent()));
    });
  });
}

test('delayed annotation addition remains on its original page and saves there', { skip: !process.env.CHROME_PATH }, async () => {
  await browserTest('annotation-add', DENSE, async ({ page, preview, input }) => {
    let frame = await waitPage(page, 1);
    await frame.locator('h1').first().click();
    await page.locator('#annotation-text').fill('第一页延迟标注');
    const delayed = await delayResponse(page, '**/api/slide/page-1/annotate', 'POST');
    try {
      await page.locator('#btn-add-annotation').click();
      assert.equal(await delayed.seen, 200);
      await page.locator('#nav-next').click();
      frame = await waitPage(page, 2);
      await frame.locator('.page-two-section h3').first().click();
      await page.locator('#annotation-text').fill('第二页未提交的文字');
      delayed.release(); await delayed.done;
      await page.waitForTimeout(200);
      console.log(`after add response: page=${await page.locator('#nav-name').textContent()}; list=${await page.locator('#annotations').textContent()}; pending=${await page.locator('#pending-status').textContent()}`);
      assert.equal((await page.locator('#annotations').textContent()).includes('第一页延迟标注'), false);
      assert.equal(await page.locator('#annotation-text').inputValue(), '第二页未提交的文字');
      assert.match(await page.locator('#pending-status').textContent(), /page-1/);
      assert.doesNotMatch(await page.locator('#pending-status').textContent(), /page-2/);
      assert.equal((await api(preview, '/api/slide/page-1')).annotations[0].annotation, '第一页延迟标注');
      await page.locator('#nav-prev').click(); await waitPage(page, 1);
      assert.match(await page.locator('#annotations').textContent(), /第一页延迟标注/);
      await save(page);
      assert.equal((await scanAnnotations(input))[0].annotation, '第一页延迟标注');
    } finally { delayed.release(); }
  });
});

test('delayed annotation deletion tracks its original page and saves the deletion', { skip: !process.env.CHROME_PATH }, async () => {
  await browserTest('annotation-delete', DENSE, async ({ page, input }) => {
    const delayed = await delayResponse(page, '**/api/slide/page-1/annotate/*', 'DELETE');
    try {
      await page.locator('.ann-remove').click();
      assert.equal(await delayed.seen, 200);
      await page.locator('#nav-next').click(); await waitPage(page, 2);
      delayed.release(); await delayed.done;
      await page.waitForTimeout(200);
      console.log(`after delete response: page=${await page.locator('#nav-name').textContent()}; list=${await page.locator('#annotations').textContent()}; pending=${await page.locator('#pending-status').textContent()}`);
      assert.match(await page.locator('#annotations').textContent(), /第二页已有标注/);
      assert.match(await page.locator('#pending-status').textContent(), /page-1/);
      assert.doesNotMatch(await page.locator('#pending-status').textContent(), /page-2/);
      await page.locator('#nav-prev').click(); await waitPage(page, 1);
      assert.equal(await page.locator('.annotation-item').count(), 0);
      await save(page);
      const annotations = await scanAnnotations(input);
      assert.deepEqual(annotations.map((a) => [a.page, a.annotation]), [[2, '第二页已有标注']]);
    } finally { delayed.release(); }
  }, async ({ preview }) => {
    for (const [number, text] of [[1, '第一页已有标注'], [2, '第二页已有标注']]) {
      const page = await api(preview, `/api/slide/page-${number}`);
      const doc = readDocument(page.content);
      const id = doc.elements.find((node) => node.tagName === (number === 1 ? 'h1' : 'h3') && pageFor(doc, node) === number - 1).editId;
      await api(preview, `/api/slide/page-${number}/annotate`, { element_id: id, annotation: text, base_digest: page.base_digest });
    }
    await api(preview, '/api/save-all', {});
  });
});

test('chunked HTTP annotation decodes UTF-8 across request chunks', async () => {
  const { preview, input } = await fixture(STANDARD);
  try {
    const page = await api(preview, '/api/slide/page-1');
    const id = readDocument(page.content).elements.find((node) => node.tagName === 'h1').editId;
    const body = Buffer.from(JSON.stringify({ element_id: id, base_digest: page.base_digest, annotation: '简历测试' }));
    const split = body.indexOf(Buffer.from('简')) + 1;
    const chunks = [];
    preview.server.prependListener('request', (req) => {
      if (req.url !== '/api/slide/page-1/annotate') return;
      const iterate = req[Symbol.asyncIterator];
      req[Symbol.asyncIterator] = async function* () {
        for await (const chunk of iterate.call(this)) { chunks.push(Buffer.from(chunk)); yield chunk; }
      };
    });
    const response = await new Promise((resolve, reject) => {
      const req = http.request(preview.url + '/api/slide/page-1/annotate', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Transfer-Encoding': 'chunked' } }, (res) => {
        let data = ''; res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(data) }));
      });
      req.on('error', reject);
      req.write(body.subarray(0, split));
      setTimeout(() => req.end(body.subarray(split)), 100);
    });
    assert.equal(response.status, 200);
    assert.ok(chunks.length >= 2 && chunks[0].at(-1) === Buffer.from('简')[0], 'the UTF-8 code point must be split across received HTTP chunks');
    await api(preview, '/api/save-all', {});
    const saved = (await scanAnnotations(input))[0].annotation;
    console.log(`received chunk lengths=${chunks.map((chunk) => chunk.length)}; saved=${saved}`);
    assert.equal(saved, '简历测试');
    const tooLarge = await fetch(preview.url + '/api/slide/page-1/annotate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ element_id: id, base_digest: page.base_digest, annotation: 'x'.repeat(100001) }),
    });
    assert.equal(tooLarge.status, 400);
    assert.equal((await tooLarge.json()).error, 'Request too large');
  } finally { await stop(preview); }
});

test('source conflict keeps the preview and offers recovery while preserving the draft', { skip: !process.env.CHROME_PATH }, async () => {
  await browserTest('conflict', DENSE, async ({ page, preview, input, root }) => {
    const frame = await waitPage(page, 1);
    await frame.locator('h1').first().click();
    await page.locator('.prop-edit-content').fill('暂存名字');
    await page.locator('.prop-edit-content').dispatchEvent('change');
    await page.waitForFunction(() => document.querySelector('#btn-undo').textContent.includes('(1)'));
    const selected = await page.locator('#selected-element').textContent();
    const original = await readFile(input, 'utf8');
    const external = original.replace('<h1>沈知遥</h1>', '<h1>外部修改</h1>');
    assert.notEqual(external, original);
    await writeFile(input, external);
    await page.locator('#reload-banner').waitFor();
    await page.locator('#reload-banner').click();
    await page.waitForTimeout(300);
    const banner = page.locator('#reload-banner');
    console.log(`conflict: canvas=${await page.locator('#svg-content').isVisible()}; placeholder=${await page.locator('#svg-placeholder').textContent()}; selected=${await page.locator('#selected-element').textContent()}; banner=${await banner.count() ? await banner.textContent() : '(none)'}`);
    assert.equal(await page.locator('#svg-content').isVisible(), true);
    assert.equal(await page.locator('#selected-element').textContent(), selected);
    assert.match(await page.locator('#reload-banner').textContent(), /重新启动|重启|restart/i);
    assert.match(await page.locator('#reload-banner').textContent(), /草稿|draft/i);
    assert.equal(await readFile(input, 'utf8'), external);
    assert.ok((await readFile(path.join(preview.runtime, 'draft.json'), 'utf8')).includes('暂存名字'));
    await page.screenshot({ path: path.join(ARTIFACTS, `${phase}-conflict-recovery.png`), fullPage: true });
    const failedSave = await fetch(preview.url + '/api/save-all', { method: 'POST' });
    assert.equal(failedSave.status, 409);
    assert.equal(await readFile(input, 'utf8'), external);
    await page.locator('.slide-item[data-name="page-2"]').click();
    await page.waitForTimeout(200);
    assert.equal(await page.locator('#nav-name').textContent(), 'page-1');
    assert.equal(await page.locator('.slide-item.active').getAttribute('data-name'), 'page-1');
    assert.equal(await page.locator('#svg-content').isVisible(), true);

    const delayed = await delayResponse(page, '**/api/slide/page-2', 'GET');
    try {
      await page.locator('.slide-item[data-name="page-2"]').click();
      assert.equal(await delayed.seen, 409);
      await writeFile(input, original);
      await page.locator('.slide-item[data-name="page-2"]').click();
      await waitPage(page, 2);
      delayed.release(); await delayed.done;
      await page.waitForTimeout(200);
      assert.equal(await page.locator('#nav-name').textContent(), 'page-2');
      assert.equal(await page.locator('#svg-content').isVisible(), true);
      assert.equal(await page.locator('#reload-banner').count(), 0);
    } finally { delayed.release(); }
    await writeFile(input, external);
    await stop(preview);
    const reopened = await createPreview({ root, input, port: 0, timeout: 0 });
    try {
      const archived = reopened.state.startup.conflict_file;
      assert.ok(archived);
      assert.ok((await readFile(path.join(reopened.runtime, archived), 'utf8')).includes('暂存名字'));
      assert.equal(await readFile(input, 'utf8'), external);
      console.log(`conflicting draft archived as ${archived}; external source preserved`);
    } finally { await stop(reopened); }
  });
});

test('temporary source rewrite shows waiting and recovers when the file returns', { skip: !process.env.CHROME_PATH }, async () => {
  await browserTest('temporary-rewrite', STANDARD, async ({ page, input }) => {
    const writing = input + '.writing';
    await rename(input, writing);
    try {
      await page.locator('.slide-item[data-name="page-1"]').click();
      await page.waitForFunction(() => document.querySelector('#svg-placeholder').getAttribute('data-i18n') === 'placeholder_slide_writing');
      assert.equal(await page.locator('#svg-content').isVisible(), false);
      console.log(`temporary rewrite: ${await page.locator('#svg-placeholder').textContent()}`);
    } finally { await rename(writing, input); }
    await waitPage(page, 1);
    await page.locator('#svg-content').waitFor({ state: 'visible' });
  });
});
