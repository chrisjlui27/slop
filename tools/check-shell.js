#!/usr/bin/env node
/**
 * Node port of tools/check-shell.ps1, so the check runs as part of `npm test`
 * rather than only on a Windows machine before a deploy.
 *
 * It exists because the failure it catches is silent in both directions: the
 * install handler swallows per-entry errors on purpose, so a file missing from
 * SHELL produces a service worker that installs cleanly, reports success, and
 * then cannot open the game offline. Nothing surfaces until a phone loses
 * signal — which, for an installed app, is the normal case rather than the
 * edge case.
 *
 * Run: node tools/check-shell.js   (or npm test)
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const sw = fs.readFileSync(path.join(ROOT, "sw.js"), "utf8");

const m = sw.match(/const SHELL = \[([\s\S]*?)\];/);
if (!m) { console.log("FAIL  could not find the SHELL array in sw.js"); process.exit(1); }

// '.' is the start_url and has no file of its own.
const declared = (m[1].match(/'[^']+'/g) || []).map(s => s.slice(1, -1)).filter(e => e !== ".");

const problems = [];
for (const rel of declared) {
  if (!fs.existsSync(path.join(ROOT, rel))) problems.push("MISSING ON DISK: " + rel);
}

// The other direction: everything the browser actually requests at runtime.
// Extensions rather than a list of names, so adding a module or a font is
// caught without anyone remembering to update this file too.
const RUNTIME = new Set([".js", ".css", ".woff2", ".woff", ".png", ".svg"]);
const walk = (dir) => fs.existsSync(dir)
  ? fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
      const p = path.join(dir, e.name);
      return e.isDirectory() ? walk(p) : RUNTIME.has(path.extname(e.name)) ? [p] : [];
    })
  : [];

const onDisk = [
  ...walk(path.join(ROOT, "src")),
  ...walk(path.join(ROOT, "styles")),
  ...walk(path.join(ROOT, "assets")),
  ...fs.readdirSync(ROOT).filter(f => /\.(js|png)$/.test(f)).map(f => path.join(ROOT, f)),
].map(p => path.relative(ROOT, p).split(path.sep).join("/"))
 .filter(rel => rel !== "sw.js" && !rel.startsWith("tools/"));

for (const rel of onDisk) {
  if (!declared.includes(rel)) problems.push("NOT IN SHELL: " + rel);
}

if (problems.length) {
  console.log(`sw.js SHELL is out of sync (${problems.length} problem(s)):`);
  problems.forEach(p => console.log("  " + p));
  console.log("\nFix SHELL in sw.js, then bump CACHE so phones pick the change up.");
  process.exit(1);
}
console.log(`  ok   sw.js SHELL is in sync: ${declared.length} files, all present.`);
