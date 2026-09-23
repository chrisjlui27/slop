# Design — what SLOP is trying to be

`ARCHITECTURE.md` says how the chassis works. `PARALLEL-LOOPS.md` says who owns
which loop and why. This is the one that says what the whole thing is supposed
to feel like when it is finished, so that a change can be judged against
something other than "does it still run".

## The shape

**SLOP is a console, not a game.** It is several genuinely different games
living behind one set of menus, on one save, with one idle layer running under
all of them and four narrators arguing about whose fault that is.

```
              ┌──────────────── the idle layer ────────────────┐
              │  runs while you are here, and while you are not │
              └────────────────────────────────────────────────┘
 ┌─────────┐ ┌────────────┐ ┌────────────┐ ┌───────────┐ ┌────────────┐
 │THE ACTS │ │THE PERIMETER│ │THE ARCHIVE│ │THE HONEY  │ │THE COMPANY │
 │microgame│ │tower defense│ │card duel  │ │POT        │ │idle RPG    │
 │gauntlet │ │             │ │turn-based │ │arcade     │ │            │
 └─────────┘ └────────────┘ └────────────┘ └───────────┘ └────────────┘
      └────────────┴── the menus, which are places ──┴──────────┘
```

Three rules hold that together, and they are the ones to defend:

**1. A menu is a place you go, not a panel over the game.** You leave one game
to get to another. That is why the menus became full-screen sheets: a sheet is
somewhere you are, a panel is something in front of you. See *Sheets* below.

**1a. Every loop is a different verb.** The Acts are reflex, the perimeter is
placement, the pot is arcade, the company is investment, and the archive is a
turn with no clock on it. A sixth loop that is a fifth kind of tapping is not a
sixth loop. The archive earned its place by being the one you can play in a
lift, one-handed, with nothing counting down — and by making the *deck*, not
the hero, the thing that progresses.

**2. Leaving pauses what you left — and only what you left.** The round stops.
The Acts wait. The buddy, the turret lane and the honey pot brew keep ticking on
the one rAF loop, because they were never the thing you were doing; they are the
weather. This asymmetry is deliberate and predates the sheets (see the gotcha in
`CLAUDE.md`), and the sheets make it legible: if a whole screen replaced the
board, obviously the board is waiting for you.

**3. The idle layer is always on, and it is the only thing that gets paid for
time you were not here.** THE UNDERSTUDY's company accrues while the app is
closed. Nothing else does — a pet that starved overnight punishes someone for
taking a phone call. The rule and its exploit surface are in `CLAUDE.md`; the
design reason is that exactly one system should reward being away, so that
coming back is an event rather than a cleanup.

## What "a full game" means for each loop

The bar is not "a mechanic exists". It is: **could this be its own app, and
would someone play it?** Where each loop sits against that:

| Loop | Owner | Has | Still owes |
|---|---|---|---|
| The Acts | ARTIFICER | 26 microgames, 8 acts, 8 bosses, 5 stats, XP, Workshop, double rounds, mutators, and per-trial mastery kept in the ledger | An act you can re-enter on purpose; a mutator earned rather than drafted |
| The Archive | GOBLIN, on the ARTIFICER's shelf | A turn-based card duel: 16 cards, 6 builds, a drafted deck, six relics, deck-thinning, and THE UNSHIPPED BUILD — an endless rung that climbs | Bout modifiers; a reason to take a small deck over a wide one |
| The Perimeter | THE CRAB | Waves, 4 tower types, placement, integrity, the only loss state, seven doctrines taken every fourth wave, a board that grows, surges with elites, and waves you can call in early | A fourth corridor; a reason to sell a tower other than a mistake |
| The Honey Pot | SLOP-GOBLIN | Two currencies, five drop types, a combo, a hazard that ends the session, six upgrades bought with its own money, escalation | A reason to reach a deep session other than honey; a second board |
| The Company | THE UNDERSTUDY | A roster, recruitment, rehearsal levels, offline pay with a cap, and six productions to stage — rate now or a lump later, with a permanent bonus per show closed | A reason to keep a small company small; something beyond the sixth show |

Read that table as the roadmap. Growth is breadthwise — more loops and deeper
ones — as much as lengthwise.

### The microgame gauntlet

Twenty-six games is a pool, not a gauntlet. What makes it a gauntlet is
**variety of input syntax**, because two games run side by side in a DOUBLE
SLOP round and the pair has to read as two games rather than one twice. The
pool currently covers: tap, tap-spam, precise tap, drag, drag-precision,
steady-drag, pursuit, swipe, hold-and-release, timing, rhythm, memory,
judgement, survive, rotational drag, judgement-on-release, stillness, and
aim-and-release.

The pool is also the one thing in the game worth getting good at rather than
through, which is what mastery is for: every trial counts its own wins in the
ledger, across every run, and a trial you have learned pays more than one you
have not. Three ranks, stars on the lane label, and a line on the hero sheet
that says how much of the pool you actually know.

Before adding another, check what the pool leans on — `add-microgame` says the
same thing and is the workflow to use.

## Sheets

The UI contract for every menu in the game. It replaced a layout where each
menu was drawn inside `#stageWrap`, which is square: on a 375x812 phone that
meant a 353x353 window holding a shop list 478px long. Every menu scrolled;
the Workshop showed 40% of itself.

1. **A sheet is fixed to the viewport**, not to the board. It is a sibling of
   `#app`, not a child of the stage. (Anything with a `filter` on it becomes
   the containing block for `position:fixed` descendants — which is why the
   page's hue drift lives on `#bgLayer` and the contrast tweak moved onto
   `#stageWrap`. Put a filter on `body` or `#app` again and every sheet
   silently re-anchors to the column.)
2. **Exactly one region of a sheet scrolls**, marked `class="sheetBody"`, and
   only when its content genuinely exceeds the screen. No fixed-pixel scroll
   boxes: a `max-height: 250px` is how a 812px screen ends up showing 250px.
3. **The way out is always on screen**, pinned below the scrolling region. A
   screen whose exit is below the fold reads as a trap.
4. **Touch targets stay at 44px** through every squeeze. When something has to
   give on a short screen, it is padding and margins, never a tap target and
   never the narrators' authored text.

The play screen has its own version of rule 3: the board is clamped against
`100dvh - var(--chrome)`, where `--chrome` is measured from the live layout by
`game.js` rather than estimated. A 320x568 device gets a small board; it does
not get a game it has to scroll into view.

## Assets, and the slop feel

The game should look like a machine that someone kept bolting things onto —
loud, layered, slightly wrong — while staying legible at arm's length on a
phone. That is a *texture* budget, not an excuse for noise: one loud thing at a
time (see the POLISH PASS in `main.css`), and readability is measured, not
judged by eye.

Assets are welcome, and free assets especially. The constraints they have to
clear are not about taste:

- **Offline first.** Anything the game fetches at runtime must be a file in
  this repo and listed in `sw.js`'s `SHELL`. No CDN, no Google Fonts link, no
  runtime download. The two typefaces were fetched from `fonts.googleapis.com`
  until they were vendored under `assets/fonts/` — an installed phone with no
  signal rendered the entire arcade UI in fallback monospace, and nothing said
  why. That is the failure mode every asset has to avoid.
- **Licences travel with the file.** OFL, CC0 or CC-BY, vendored with its
  licence text and a note saying where it came from — `assets/fonts/README.md`
  is the pattern.
- **Generated beats downloaded** when it is close. The background grain is an
  `feTurbulence` data URI: no fetch, no `SHELL` entry, nothing to lose offline.
  Gradients, SVG patterns and CSS animation are free in every sense.
- **Emoji are the sprite sheet.** Every glyph in the HUD, the roster, the
  tower types and the buddy is an emoji, which means the platform ships the
  art, it scales, it is already localised and it costs nothing. Keep it.
- **No new runtime dependencies.** Vanilla JS, ES modules, no framework, no
  build step for the dev path. An asset pack is files; a library is not.

The backdrop is the current example of all four rules at once: gradients and a
generated grain, lit by a pair of palette colours the Act itself carries in
`lore.js`. Eight Acts, eight lightings, no files — and the strength is fixed in
CSS with `color-mix`, so a new Act cannot ship a backdrop that drowns the HUD.

What this leaves room for, in rough order of payoff: a proper sprite/particle
pass on the perimeter, a sound bank beyond synthesised blips (the whole audio
layer is oscillators today, which is a style as much as a shortcut — a sample
bank should sit beside it, not replace it), and per-loop backdrop treatments so
the perimeter and the pot stop borrowing the Acts' lighting.

## What would break the design

Written down because each of these is a plausible-sounding suggestion:

- **A second column, or landscape.** Portrait, one thumb, 480px. The layout is
  measured against 375x812.
- **A fail state in the Acts.** There is none, on purpose. The perimeter is the
  single exception and it is fenced inside the Crab's own economy — it must
  never touch `actIdx`, hero level or XP, and `npm test` asserts that. The
  archive can be lost too, but losing a bout costs literally nothing — no goo,
  no XP, no standing, no card — so it is a wall, not a stake. `npm test`
  asserts that boundary field by field, the same way it asserts the Crab's.
- **Offline credit for a second system.** One system is paid for time away.
  Two is an idle game with a microgame skin.
- **Defensive microgames.** The chassis catches everything a module throws and
  converts it into an in-fiction `GLITCH?!`. Modules are written carelessly on
  purpose; making them careful is how this codebase stops being fast to add to.
- **Menus that do not pause.** If a sheet is open, the thing you left is
  waiting. A menu that keeps the round running turns every decision into a
  reflex test, which is the one thing the Acts already are.
