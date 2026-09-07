#!/usr/bin/env node
/**
 * Static checks on the unbundled `npm run dev` path, which the smoke test
 * cannot cover (jsdom does not support <script type="module">).
 *
 * Verifies:
 *   1. every relative import resolves to a file that exists
 *   2. every named import is actually exported by its target
 *   3. every microgame in src/modules/ is registered in the registry
 *   4. every DOM id game.js resolves via $() exists in index.html
 *
 * Run: npm run check   (or as part of npm test)
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "src");

let failures = 0;
const fail = (msg) => { console.log(` FAIL  ${msg}`); failures++; };
const ok = (msg) => console.log(`  ok   ${msg}`);

const walkJs = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walkJs(p) : p.endsWith(".js") ? [p] : [];
  });

const files = walkJs(SRC);

// ---- 1 & 2: imports resolve, and named imports exist ----
let importCount = 0;
for (const file of files) {
  const src = fs.readFileSync(file, "utf8");
  const re = /import\s+(?:([\w$]+)|\{([^}]+)\})\s+from\s+["'](\.[^"']+)["']/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    const [, defaultName, namedList, spec] = m;
    const target = path.resolve(path.dirname(file), spec);
    importCount++;

    if (!fs.existsSync(target)) {
      fail(`${path.relative(ROOT, file)} imports missing file ${spec}`);
      continue;
    }
    const targetSrc = fs.readFileSync(target, "utf8");

    if (defaultName && !/export\s+default/.test(targetSrc)) {
      fail(`${path.relative(ROOT, target)} has no default export (wanted by ${path.basename(file)})`);
    }
    if (namedList) {
      for (const rawName of namedList.split(",")) {
        const name = rawName.trim().split(/\s+as\s+/)[0].trim();
        if (!name) continue;
        const exported = new RegExp(`export\\s+(?:const|let|var|function|class)\\s+${name}\\b`).test(targetSrc);
        if (!exported) {
          fail(`${path.relative(ROOT, target)} does not export "${name}" (wanted by ${path.basename(file)})`);
        }
      }
    }
  }
}
if (!failures) ok(`${importCount} imports resolve, all named exports present`);

// ---- 3: every microgame file is registered ----
const moduleFiles = fs
  .readdirSync(path.join(SRC, "modules"))
  .filter((f) => f.endsWith(".js") && f !== "index.js")
  .map((f) => path.basename(f, ".js"));
const registry = fs.readFileSync(path.join(SRC, "modules/index.js"), "utf8");
const unregistered = moduleFiles.filter(
  (m) => !new RegExp(`import\\s+${m}\\s+from`).test(registry)
);
if (unregistered.length) {
  fail(`microgames not registered in modules/index.js: ${unregistered.join(", ")}`);
} else {
  ok(`all ${moduleFiles.length} microgames registered`);
}

// ---- 4: DOM id contract ----
const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const htmlIds = new Set([...html.matchAll(/id="([^"]+)"/g)].map((m) => m[1]));
const gameSrc = fs.readFileSync(path.join(SRC, "game.js"), "utf8");
const wanted = new Set([
  ...[...gameSrc.matchAll(/\$\('([^']+)'\)/g)].map((m) => m[1]),
  ...[...gameSrc.matchAll(/getElementById\('([^']+)'\)/g)].map((m) => m[1]),
]);
const missingIds = [...wanted].filter((id) => !htmlIds.has(id));
if (missingIds.length) {
  fail(`game.js references ids missing from index.html: ${missingIds.join(", ")}`);
} else {
  ok(`all ${wanted.size} referenced DOM ids exist in index.html`);
}

console.log(
  failures === 0 ? "\nModule graph OK." : `\n${failures} graph problem(s).`
);
process.exit(failures === 0 ? 0 : 1);
