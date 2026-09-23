# CLAUDE.md

Project instructions for Claude Code working in this repo.

## What this is

**SLOP — A Chronicle of Unfinished Things.** A browser CRPG built as a
WarioWare-style microgame chassis with a narrative layer on top. Vanilla JS,
ES modules, zero runtime dependencies. No framework, no TypeScript, no CSS
preprocessor. Keep it that way unless explicitly asked.

## Where this is going

**The delivery target is an installed Android app** — a PWA on GitHub Pages,
added to the home screen, opening fullscreen and running offline. Same route
as the sibling project `eldritch-garden`. See `DEPLOY.md`.

`docs/DESIGN.md` is the fuller statement of that: SLOP is a console — five
genuinely different games behind one set of menus, one save, and one idle layer
that runs under all of them. Read it before reshaping a screen or adding a loop.

That target, not "a web page", is what settles design arguments now:

- **Touch is the only input.** No hover states, no keyboard, no right-click.
  Interactive targets are 44px or larger; the HUD glyph row had to grow once
  already for this.
- **The app gets killed.** Android reclaims backgrounded processes whenever it
  likes, which is why there is now a save system (see below).
- **Portrait, one thumb.** The layout is a single column capped at 480px and
  measured against 375x812. Do not add a second column or a landscape mode.
- **It has to work with the radio off.** Anything the game loads at runtime
  must be in `sw.js`'s `SHELL`, or it is missing offline.

## Commands

```bash
npm run dev         # serve at localhost:8000 (ES modules need http://, not file://)
npm run dev:win     # same, via PowerShell — no Node or Python needed
npm run build       # bundle src/ + styles/ into dist/slop.html (single portable file)
npm run check:shell # verify sw.js SHELL matches what is on disk (PowerShell)
npm test            # build, then drive a full campaign in jsdom
```

**Always run `npm test` before declaring work finished.** It plays all five
acts to the victory screen and catches broken chassis wiring, missing DOM ids
and crashes in the act/boss ladder that manual play will not.

Python is *not* installed, so `npm run dev` fails — use `npm run dev:win`,
which needs nothing beyond PowerShell. `npm run check:shell` also runs without
Node, and should be run before every deploy — though the same check is now part
of `npm test` as `tools/check-shell.js`, so a missing `SHELL` entry fails
the test run rather than waiting for a phone to lose signal.

## Skills

Three repeated workflows are encoded in `.claude/skills/` — use them rather
than reconstructing the steps:

| Skill | For |
|---|---|
| `add-microgame` | Adding a microgame. **Three files change now, not two** — the docs predate the offline cache. |
| `voice-check` | Writing or auditing any character dialogue. |
| `ship` | The pre-deploy checklist and push. |

## The one rule that shapes everything

**The chassis catches everything a microgame throws.** `Game.safeLane()` wraps
every call into module code. A crash becomes an in-fiction `GLITCH?!` event —
the round is awarded to the player, the Slop-Goblin takes credit, play
continues. The page never breaks.

This is why microgames can be written carelessly and quickly. It is the core
design bet of the codebase. Do not add try/catch inside microgames, and do not
"fix" this by making modules defensive — the whole point is that they don't
have to be.

## Where things live

| I want to... | Go to |
|---|---|
| Add or edit a microgame | `src/modules/` — see `docs/ADDING-A-MICROGAME.md` |
| Add dialogue, an Act, or a boss | `src/content/lore.js` — see `docs/LORE.md` |
| Add a mutator / shop item / stat | `src/content/mutators.js`, `shop.js`, `stats.js` |
| Change round flow, scoring, economy | `src/game.js` — see `docs/ARCHITECTURE.md` |
| Change what survives closing the app | `src/save.js` |
| Add a tower, enemy or reshape waves | `src/content/defense.js` — data only |
| Change how the perimeter plays | `src/defense.js` — see `docs/PARALLEL-LOOPS.md` |
| Add a card or a build to the archive | `src/content/archive.js` — data only |
| Change how the card duel plays | `src/archive.js` — see `docs/PARALLEL-LOOPS.md` |
| Add to the company or retune idle rates | `src/content/understudy.js` — data only |
| Change how offline time pays | `src/understudy.js` |
| Add or retune a cross-run boon | `src/content/ledger.js` — data only |
| Change what survives between runs | `src/ledger.js` |
| Change how it installs or caches | `manifest.webmanifest`, `sw.js` — see `DEPLOY.md` |
| Change sounds | `src/audio.js` |
| Add a drop or a pot upgrade | `src/content/pot.js` — data only |
| Change how the honey pot plays | `src/pot.js` |
| Change screen effects | `src/fx.js` |
| Change layout or styling | `styles/main.css`, `index.html` |
| Change how a menu is laid out | the SHEET PASS in `styles/main.css` — see `docs/DESIGN.md` |
| Add a font, image or sound file | `assets/`, then `sw.js`'s `SHELL` — see `docs/DESIGN.md` |

`src/game.js` is large (~1000 lines) and deliberately monolithic — it is the
chassis, and its parts are genuinely coupled. Prefer adding content over
growing it. If it must grow, extract a whole subsystem (the honey pot, the
defense lane) rather than slicing it thin.

## Content is data, not code

Acts, bosses, dialogue, mutators, shop items, and stats are all plain data
arrays in `src/content/`. Adding a boss or 20 new barks should not touch
`game.js` at all. If a content addition requires a chassis change, that's a
signal the content schema needs extending — do that deliberately rather than
special-casing.

## Two canon authors

Every system in the game is diegetically attributed to one of two characters,
and this is load-bearing for tone, not decoration:

- **THE ARTIFICER** (cyan `#2fe1ff`, formal, capitalized) built the Acts,
  stats, XP, Workshop, boss ladder, timer. Wants the player to finish.
- **SLOP-GOBLIN** (acid `#c9ff2f`, lowercase, no terminal punctuation) built
  the buddy, turret lane, honey pot, mutators, chaos events — and wired them
  into each other on purpose. Wants the player happily distracted.

When you add a system, decide whose it is and write its dialogue in that
voice. Read `docs/LORE.md` before writing any character dialogue. Getting the
voices wrong is the most common way to damage this project.

## House style

- 2-space indent, semicolons, double quotes in module headers / single quotes
  inline (the existing files are consistent; match the file you're in).
- No new dependencies without asking. `jsdom` is devDependency-only.
- Comments explain *why*, not *what*. The codebase has a lot of unusual
  decisions (the crash-as-feature, the favor-weighted dialogue, the pot pausing
  the plot) — those deserve comments. `// increment counter` does not.
- **There is now a save system.** This reverses the original rule, which was
  "never use `localStorage`; a run is a session." That held up in a browser
  tab and did not survive the move to an installed Android app, where closing
  the app for a phone call and discarding an hour of progress were the same
  gesture. All storage access goes through `src/save.js` — do not call
  `localStorage` directly from anywhere else, and keep `sessionStorage`
  unused.
- **Time away from the game pays exactly one system.** The save deliberately
  freezes every time-based value across a session — the buddy's hunger, the
  GLAZED buff, bark timers — because a pet that starved overnight punishes
  someone for closing the app. THE UNDERSTUDY's company is the sole exception
  and the whole point of that character: they were rehearsing while you were
  out. If you add a system that accrues over real time, it does **not** get
  offline credit unless it is theirs.
- **Offline pay is an exploit surface.** `Understudy.applyOffline` refuses a
  gap over the cap, a timestamp in the future (a wound-back device clock), and
  a gap under a minute. `Save.apply` refuses a `lastAt` it cannot believe.
  Every one of those has a test; do not relax one without adding another.
- **Two storage keys, two lifetimes.** `slop.save.v1` is one run and is wiped
  by `start()`. `slop.ledger.v1` is the record of ever having played and must
  survive that — clearing a run must never clear the ledger. Both go through
  `store()` in `src/save.js`; nothing else touches `localStorage`.
- **The bundle is one shared scope.** `tools/build.js` concatenates modules
  into a single closure, so two files declaring the same top-level name
  redeclare each other at runtime. The dev server never sees this, because
  there each module has its own scope — it only breaks the built artefact,
  which is what ships. The build fails loudly on a collision now; if it does,
  rename, do not work around it.

## Gotchas

- **DOM ids are a contract.** `game.js` resolves ~70 ids at boot via `$()`. If
  you remove an element from `index.html`, the game breaks at startup. The
  smoke test catches this.
- **Instructions are DOM, not canvas.** A microgame declares `hint` (a string,
  or a function of `g` when the ask changes mid-round) and the chassis renders
  it. Never `fillText` an instruction: canvas text is scaled down with the
  canvas — 13px in a 480-wide board is about 9.5px on a phone. Under 40
  characters so it stays one line in a double round; `npm test` enforces both
  the presence and the length.
- **`dist/` is generated.** Never edit `dist/slop.html` by hand; it is
  overwritten by every build and is gitignored.
- **Everything runs on one rAF loop.** The buddy, turret lane, and honey pot
  brew keep ticking during menus and even during the pot minigame. Only the
  *round* pauses. That asymmetry is intentional.
- **There is no lose state _in the campaign_.** No lives, no game over.
  Failing a round costs momentum (combo, boss regen), never progress. Do not
  add a fail state to the Act ladder.
  **The perimeter is the one exception, and it is deliberately fenced.** THE
  CRAB's tower defense can be lost: leaks eat integrity and a breach costs goo
  and his regard. That loss must stay inside his own economy — it must never
  touch `actIdx`, hero level, or XP. The Artificer removed death from the
  build and that has not been reversed; the Crab was simply allowed a stake of
  his own. `npm test` asserts this boundary directly.
  **The archive is not a second exception.** A card bout can be lost, but
  losing one costs nothing whatsoever — not goo, not XP, not standing, not the
  card you would have drafted. It is a wall you may walk into as often as you
  like. Giving it a real cost would make it the second losable stake in the
  game, which is a canon decision rather than a balance tweak.
- **A `filter` on an ancestor breaks every sheet.** The menus are
  `position:fixed` siblings of `#app`, and any filtered ancestor becomes
  their containing block — which silently re-anchors a full-screen sheet to the
  480px column. That is why the page's hue drift lives on `#bgLayer` and the
  contrast tweak sits on `#stageWrap`. Do not move either back onto `body`
  or `#app`.
- **`sw.js`'s `SHELL` is a contract too.** Every file the game fetches at
  runtime must be listed, or the app is broken offline while looking fine
  online. The install handler swallows per-entry failures deliberately, so
  nothing tells you — `npm run check:shell` is what tells you. Add a module,
  add the line.
- **Bump `CACHE` in `sw.js` for any shell change.** Modules are cache-first
  with no background refresh, which is unusual on purpose: refreshing one
  module in the background would let the next load pair it with siblings from
  the previous generation. The cache is one indivisible generation, and the
  constant is the only thing that retires it.
- **The save schema is an explicit field list**, not a walk of `Game`. A new
  chassis field is absent from saves until someone adds it to
  `Save.snapshot()` on purpose — so the failure mode of forgetting is a value
  that resets, never a corrupted run. Saves are written at exactly one place,
  the top of `nextRound()`, where `round` means "rounds completed". Do not add
  a second write site without reading the comment there first.
