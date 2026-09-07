#!/usr/bin/env node
/**
 * Bundles the ES module graph + CSS into one self-contained dist/slop.html
 * that runs from file:// with no server and no dependencies.
 *
 * This is a deliberately tiny hand-rolled bundler (~100 lines) rather than a
 * toolchain. The module graph is small, acyclic, and uses only default/named
 * exports of plain objects — so a topological concat with the import/export
 * keywords stripped is sufficient and keeps the repo dependency-free.
 *
 * If the project ever grows past that (dynamic imports, npm deps, minification),
 * replace this with esbuild rather than extending it.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const ENTRY = path.join(ROOT, "src/main.js");
const OUT_DIR = path.join(ROOT, "dist");
const OUT = path.join(OUT_DIR, "slop.html");

const seen = new Set();
const ordered = [];

/** Depth-first walk so dependencies are emitted before their dependents. */
function walk(file) {
  const abs = path.resolve(file);
  if (seen.has(abs)) return;
  seen.add(abs);

  const src = fs.readFileSync(abs, "utf8");
  const dir = path.dirname(abs);

  const importRe = /^\s*import\s+(?:.+?\s+from\s+)?["'](.+?)["'];?\s*$/gm;
  let m;
  while ((m = importRe.exec(src)) !== null) {
    if (m[1].startsWith(".")) walk(path.join(dir, m[1]));
  }
  ordered.push({ abs, src });
}

/**
 * Strip module syntax. `export default {...}` in a microgame becomes a
 * `const <basename> = {...}` binding, which is exactly the name the generated
 * registry in modules/index.js already refers to.
 */
function strip(file) {
  const name = path.basename(file.abs, ".js");
  let out = file.src;

  out = out.replace(/^\s*import\s+(?:.+?\s+from\s+)?["'].+?["'];?\s*$/gm, "");
  out = out.replace(/^\s*export\s+default\s+/m, `const ${name} = `);
  out = out.replace(/^\s*export\s+(const|let|function|class)\s+/gm, "$1 ");

  return `\n/* ===== ${path.relative(ROOT, file.abs)} ===== */\n${out.trim()}\n`;
}

function build() {
  walk(ENTRY);

  const js = ordered.map(strip).join("\n");
  const css = fs.readFileSync(path.join(ROOT, "styles/main.css"), "utf8");
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");

  // Pull just the <body> contents out of index.html.
  const bodyMatch = html.match(/<body>([\s\S]*?)<script/i);
  if (!bodyMatch) throw new Error("Could not locate <body> content in index.html");
  const body = bodyMatch[1].trim();

  const head = html.match(/<head>([\s\S]*?)<\/head>/i)[1]
    .replace(/<link rel="stylesheet" href="\.\/styles\/main\.css">\s*/i, "");

  const bundled = `<!DOCTYPE html>
<html lang="en">
<head>
${head.trim()}
<style>
${css.trim()}
</style>
</head>
<body>
${body}
<script>
(function(){
"use strict";
${js}
window.SLOP = Game;
})();
</script>
</body>
</html>
`;

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT, bundled);

  const kb = (Buffer.byteLength(bundled) / 1024).toFixed(1);
  console.log(`built dist/slop.html  (${ordered.length} modules, ${kb} KB)`);
}

build();
