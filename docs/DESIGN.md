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
 ┌─────────┐ ┌──────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
 │THE ACTS │ │PERIMETER │ │ARCHIVE  │ │PATCH BAY│ │HONEY POT│ │COMPANY  │
 │reflex   │ │placement │ │cards    │ │thinking │ │arcade   │ │investing│
 └─────────┘ └──────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘
      └──────────────┴──── the menus, which are places ────┴──────────┘
```

Three rules hold that together, and they are the ones to defend:

**1. A menu is a place you go, not a panel over the game.** You leave one game
to get to another. That is why the menus became full-screen sheets: a sheet is
somewhere you are, a panel is something in front of you. See *Sheets* below.

**1a. Every loop is a different verb.** The Acts are reflex, the perimeter is
placement, the pot is arcade, the company is investment, the archive is a turn
with no clock on it, and the patch bay is thinking. A seventh loop that is a
sixth kind of tapping is not a seventh loop. The archive earned its place by
being the one you can play in a lift, one-handed, with nothing counting down —
and by making the *deck*, not the hero, the thing that progresses. The patch bay
earned its place by taking away the last thing the archive still had: chance.
No draw, no spawn, no clock; a board generated from a seed and guaranteed
solvable, where the only variable is whether you have seen the route yet.

**2. Only the loop on screen runs.** Leaving a loop pauses it, completely: the
round stops with its clock intact, a wave at the perimeter hangs in the air, a
card bout keeps its hand, a jar keeps its drops, a half-routed panel keeps its
turns. The buddy and the GLAZED clock belong to the Acts and pause with them.

This reverses the first version of this rule, which said the buddy, the
perimeter and the pot "were the weather" and ran on regardless. In practice
that made every screen a tax on every other one — ten seconds reading a card
was ten seconds of waves somewhere you could not see — and it made leaving a
loop a punishment rather than a choice. A console where switching games costs
you is not a console.

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
| The Acts | ARTIFICER | 25 microgames, 8 acts, 8 bosses, 5 stats, XP, Workshop, double rounds, mutators, and per-trial mastery kept in the ledger | An act you can re-enter on purpose; a mutator earned rather than drafted |
| The Archive | GOBLIN, on the ARTIFICER's shelf | A turn-based card duel: 16 cards, 6 builds, a drafted deck, six relics, deck-thinning, and THE UNSHIPPED BUILD — an endless rung that climbs | Bout modifiers; a reason to take a small deck over a wide one |
| The Perimeter | THE CRAB | Waves, 4 tower types, placement, integrity, the only loss state, seven doctrines taken every fourth wave, a board that grows, surges with elites, and waves you can call in early | A fourth corridor; a reason to sell a tower other than a mistake |
| The Patch Bay | ARTIFICER, re-patched by the GOBLIN | A tile-rotation routing puzzle: six racks from 4×4 to a 7×7 wrap-around core, seeded boards guaranteed solvable, par and stars, gates set by stars, an endless crawlspace | A second puzzle mechanic — bridges or coloured circuits — so a rack can change the rules and not only the size |
| The Honey Pot | SLOP-GOBLIN | Two currencies, five drop types, a combo, a hazard that ends the session, six upgrades bought with its own money, escalation | A reason to reach a deep session other than honey; a second board |
| The Company | THE UNDERSTUDY | A roster, recruitment, rehearsal levels, offline pay with a cap, and six productions to stage — rate now or a lump later, with a permanent bonus per show closed | A reason to keep a small company small; something beyond the sixth show |

Read that table as the roadmap. Growth is breadthwise — more loops and deeper
ones — as much as lengthwise.

### The microgame gauntlet

Twenty-five games is a pool, not a gauntlet. What makes it a gauntlet is
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

## The console: the dock, the home screen, the sheets

The UI contract. It replaced two earlier layouts in turn: menus drawn inside
the square board (a 353px window over a 478px shop list), and then a home
screen with eleven stacked HUD rows above the board — standing, hero, glyphs,
meter, pot, a live perimeter lane, timer — where the board started 442px down
a 812px screen.

**The dock is the only way between screens.** Six tabs along the bottom, in
the thumb's reach — ACTS, PERIMETER, ARCHIVE, PATCH BAY, HONEY POT, COMPANY —
each carrying the one number worth knowing about its loop without opening it:
integrity, builds filed, stars, brew, the company's rate or the show's clock.
The tab you are on is the only loop running (rule 2). Every switch goes through
`Game.goTo()`, which leaves the current loop, closes any menu over the Acts,
and enters the next; loop screens have no exit buttons of their own, because a
second "leave" inside every screen is a second way to say the same thing. The
dock is locked — and covered — while the Acts are asking you something: the
title, a story beat, a level-up, a draft, the ending.

**The home screen puts the eye at the top and the thumb at the bottom.** Top
bar (act, quest, and the four things you open from anywhere: hero sheet,
workshop, settings, sound), the narrator, a status row (buddy, level, score,
goo), then — pushed down to sit on the dock — the round strip and the board.
On a tall phone the spare height goes between the two groups, never between
the board and the thumb. Chrome above the board went from 442px to 242px; the
board is full width at 360 and up, and 271px at 320x568 where it used to hit
its 190px floor.

The board is clamped against `100dvh - var(--chrome) - var(--dock-total)`.
`--chrome` is the rows above the board **summed**, not the board's top edge —
the board is pushed down on purpose, and measuring its edge would count the
free space as chrome, shrink the board, free more space, and chase itself to
the floor.

**Sheets**, for every screen that is not home:

1. **A sheet is fixed to the viewport.** Loop screens and the menus over the
   Acts stop at the dock, which stays usable; the Acts' questions cover it.
   Nothing with a `filter` may sit above a sheet or the dock — a filtered
   ancestor becomes the containing block for `position:fixed` — which is why
   the page's hue drift lives on `#bgLayer` and the contrast tweak on
   `#stageWrap`.
2. **Exactly one region scrolls**, marked `class="sheetBody"`, and only when
   its content genuinely exceeds the screen. On a 320px phone a sheet with two
   lists may scroll both; an exit below the fold is never acceptable.
3. **The way out is always on screen** — the dock for loop screens, a pinned
   button for the menus and the questions.
4. **Touch targets stay at 44px** through every squeeze. What gives on a short
   screen is padding, the narrator's second line, and the pot and perimeter
   boards, which cap their height so their lists keep their room.
5. **Sheets are opaque.** At 98.5% the board behind one bled through as a ghost
   of its own label.

**One design system, in one file.** `styles/main.css` is ordered by layer —
fonts, tokens, base, components, the shell, the dock, sheets, screens, motion,
short phones — and every screen draws from the same parts: one title style in
the screen's owner's colour (the stacked pink-cyan-yellow shadow is the
wordmark's alone), one button shape whose colour says what it does, one row
component for every list in the game, one recessed track for every meter. It
replaced 1,300 lines of stacked "passes", each overriding the last, where the
value a rule ended up with depended on where it sat.

Moved rather than removed: the four standing bars and the stat line live in the
hero sheet now, next to the text that explains them; the codex opens from the
hero sheet; RESET lives in settings. Removed outright: the live perimeter lane
on the HUD (the perimeter only runs on its own screen now, so it would have
been a picture of something paused), and the perpetual wiggle on buttons that
were not asking for anything.

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
