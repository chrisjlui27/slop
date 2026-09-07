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

/**
 * One definition, handed out fresh so the /g lastIndex of one caller cannot
 * affect another. It used to be written out twice — once for the dependency
 * walk and once for stripping — and the two agreeing was load-bearing but
 * unenforced.
 *
 * `[^;]*?` spans newlines so a multi-line `import { a, b } from "x"` is
 * matched, while the excluded semicolon stops the match running past the end
 * of the statement into unrelated code. The line-anchored version this
 * replaces failed on multi-line imports in both roles at once: it left the
 * `import` keyword in the output *and* skipped the dependency entirely, so the
 * bundle was missing a module rather than merely malformed.
 */
const importRe = () => /^[ \t]*import\s+(?:[^;]*?from\s*)?["']([^"']+)["'][ \t]*;?[ \t]*$/gm;

/** Depth-first walk so dependencies are emitted before their dependents. */
function walk(file) {
  const abs = path.resolve(file);
  if (seen.has(abs)) return;
  seen.add(abs);

  const src = fs.readFileSync(abs, "utf8");
  const dir = path.dirname(abs);

  const re = importRe();
  let m;
  while ((m = re.exec(src)) !== null) {
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

  out = out.replace(importRe(), "");
  out = out.replace(/^\s*export\s+default\s+/m, `const ${name} = `);
  out = out.replace(/^\s*export\s+(const|let|function|class)\s+/gm, "$1 ");

  // A surviving module keyword means the bundle is broken in a way that only
  // shows up when something tries to run it. Fail here, where the message can
  // name the file, rather than as a jsdom stack trace in the smoke test.
  const leftover = out.match(/^[ \t]*(import|export)\b.*$/m);
  if (leftover) {
    throw new Error(
      `Unstripped module syntax in ${path.relative(ROOT, file.abs)}:\n  ${leftover[0].trim()}`
    );
  }

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
