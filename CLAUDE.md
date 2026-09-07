# CLAUDE.md

Project instructions for Claude Code working in this repo.

## What this is

**SLOP — A Chronicle of Unfinished Things.** A browser CRPG built as a
WarioWare-style microgame chassis with a narrative layer on top. Vanilla JS,
ES modules, zero runtime dependencies. No framework, no TypeScript, no CSS
preprocessor. Keep it that way unless explicitly asked.

## Commands

```bash
npm run dev     # serve at localhost:8000 (ES modules need http://, not file://)
npm run build   # bundle src/ + styles/ into dist/slop.html (single portable file)
npm test        # build, then drive a full campaign in jsdom
```

Always run `npm test` before declaring work finished. It boots the built game
and plays through all five acts to the victory screen, so it catches broken
chassis wiring, missing DOM ids, and crashes in the act/boss ladder.

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
| Change sounds | `src/audio.js` |
| Change screen effects | `src/fx.js` |
| Change layout or styling | `styles/main.css`, `index.html` |

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
- Never use `localStorage`/`sessionStorage`. There is no save system by design;
  a run is a session.

## Gotchas

- **DOM ids are a contract.** `game.js` resolves ~70 ids at boot via `$()`. If
  you remove an element from `index.html`, the game breaks at startup. The
  smoke test catches this.
- **`dist/` is generated.** Never edit `dist/slop.html` by hand; it is
  overwritten by every build and is gitignored.
- **Everything runs on one rAF loop.** The buddy, turret lane, and honey pot
  brew keep ticking during menus and even during the pot minigame. Only the
  *round* pauses. That asymmetry is intentional.
- **There is no lose state.** No lives, no game over. Failing a round costs
  momentum (combo, boss regen), never progress. Do not add a fail state.
