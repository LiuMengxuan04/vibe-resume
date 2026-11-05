// HTML counterpart of PPT Master's check_annotations.py; read-only AI handoff.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { readDocument, annotationsOf, pageFor, digest } from "./live-preview/document.mjs";

export async function scanAnnotations(input) {
  const doc = readDocument(await readFile(input, "utf8"));
  return annotationsOf(doc).map((item) => ({ ...item, page: pageFor(doc, doc.byId.get(item.element_id)) + 1 }));
}

async function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const input = path.resolve(root, process.argv[2] || "templates/internship-employment/standard-one-page/index.html");
  const annotations = await scanAnnotations(input);
  const history = path.join(root, "live_preview", digest(input).slice(0, 12), "annotations.jsonl");
  if (process.argv.includes("--json")) console.log(JSON.stringify({ file: input, history, annotations }, null, 2));
  else {
    console.log(annotations.length ? `Found ${annotations.length} annotation(s) in ${input}:` : "[OK] No annotations found.");
    if (annotations.length) console.log(`Applied-annotation history: ${history}`);
    for (const item of annotations) console.log(`\n  Page ${item.page} → <${item.tag} id="${item.element_id}"> ${item.content_preview}\n      → ${item.annotation}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
