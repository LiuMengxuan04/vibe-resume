import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = path.join(root, "templates", "internship-employment", "english-one-page");
const html = readFileSync(path.join(dir, "index.html"), "utf8");

test("english one-page template is marked as English", () => {
  assert.match(html, /<html lang="en">/);
});

test("english one-page template has the standard resume sections", () => {
  for (const heading of ["Education", "Experience", "Projects", "Skills"]) {
    assert.match(html, new RegExp(`</svg>${heading}</h2>`), `missing section: ${heading}`);
  }
});

test("english one-page template omits the ID photo", () => {
  assert.doesNotMatch(html, /avatar\.png|profile-photo/);
});

test("english one-page template references only existing local files", () => {
  const refs = [...html.matchAll(/(?:src|href)="([^"#:]+)"/g)].map((match) => match[1]);
  assert.ok(refs.length > 0);
  for (const ref of refs) {
    assert.ok(existsSync(path.join(dir, ref)), `missing local file: ${ref}`);
  }
});

test("english one-page template has an npm export script", () => {
  const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
  assert.match(pkg.scripts["export:pdf:english-one-page"], /english-one-page\/index\.html/);
});
