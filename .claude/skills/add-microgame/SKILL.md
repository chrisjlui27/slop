---
name: add-microgame
description: Add a new microgame to SLOP end to end — module file, registration, offline cache entry, and verification. Use when asked to add, write, or design a new microgame, trial, or minigame for the SLOP chassis.
---

# Adding a microgame

`docs/ADDING-A-MICROGAME.md` is the reference for the module contract itself and
should be read first. It says two files change. **That is now out of date: three
do.** The third is the offline cache, and forgetting it is invisible until a
phone loses signal.

## The three files

### 1. `src/modules/<id>.js`

Follow the contract in `docs/ADDING-A-MICROGAME.md`. The rules that actually
bite:

- The canvas is always 480x480 (`g.W`/`g.H`), whatever the on-screen size.
- **All state on `g.local`.** Module-scope variables break DOUBLE SLOP rounds,
  where the same module object runs in two lanes at once.
- Resolve exactly once with `g.win()` / `g.lose()`.
- Set `surviveOnTimeout: true` only if the game is about *lasting*, not
  completing.
- **Do not add try/catch.** The chassis converts a throw into an in-fiction
  `GLITCH?!` that awards the round. Crashing is a supported outcome.
- Scale difficulty off `g.round` and cap it — the round timer already shrinks
  on its own, so uncapped scaling makes Act V impossible.

### 2. `src/modules/index.js`

Import it and add it to the `Modules` array.

### 3. `sw.js` — add it to `SHELL`

New in the Android build. Every file the game fetches at runtime must be listed
in the service worker's `SHELL` array, and `CACHE` must be bumped so installed
phones retire the previous generation.

Miss this and the game still works online, so nothing looks wrong. It fails
only offline, silently, because the install handler swallows per-entry errors on
purpose.

## Then verify

```bash
npm run check:shell
```

This is the check that catches a missed `SHELL` entry. It runs without Node.

Then play it. Node and Python are not installed on this machine, so `npm test`
is unavailable and the browser is the only real verification:

```bash
npm run dev:win
```

To force the new module to appear, temporarily reduce `Modules` in
`src/modules/index.js` to just yours. `SLOP.lanes[0].def` in the console shows
what is currently loaded.

## Input variety

Two microgames run side by side in double rounds. Before adding another
tap-spam game, check what the pool already leans on — tap, drag,
hold-and-release, swipe, timing, memory, judgement. A tap-spam game next to a
precise-tap game is miserable to play.

## Touch, not mouse

The delivery target is an installed Android app. Design for a thumb: no hover
states, no keyboard, no small targets, and nothing that needs two precise
pointers at once.
