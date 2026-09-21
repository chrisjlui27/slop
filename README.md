# SLOP — A Chronicle of Unfinished Things

A browser CRPG hiding inside a WarioWare-style microgame chassis.

Twenty-four microgames, eight acts, eight bosses, a hero sheet with stats and XP, a
shop, a real tower defense, a virtual pet, a second entire game inside a honey
pot — and four creators who built all of it and can't agree on what it's for.

Each of them owns a whole loop, not a feature, and your standing with each one
powers the loop they built. Siding with someone costs standing with everyone
else, so "who am I with" and "what am I playing" are the same question.

Vanilla JS. ES modules. No framework, no build dependencies, no runtime deps.

## Run it

```bash
npm run dev      # http://localhost:8000
```

ES modules require `http://`, so opening `index.html` directly won't work
during development. `npm run dev` needs Python; where that is missing, the
PowerShell server needs nothing installed:

```bash
npm run dev:win  # http://localhost:8000
```

For a version that runs from anywhere with no server:

```bash
npm run build    # → dist/slop.html, one self-contained file
```

```bash
npm test         # builds, then plays a full campaign in jsdom
```

## Put it on your phone

**Live at <https://chrisjlui27.github.io/slop/>** — open it in Chrome on the
phone, then menu → **Add to Home screen**. You get an icon, not a bookmark: it
opens fullscreen with no address bar and runs with the radio off. No store, no
wrapper. `DEPLOY.md` has the details.

A run now survives closing the app — Android kills backgrounded processes
whenever it likes, and the title screen offers CONTINUE when there is something
to come back to. The save is a between-rounds snapshot, so resuming replays the
trial you were in the middle of.

Closing it is also the only way to collect from the company. Every other
time-based system is frozen while you are away, on purpose — a pet that starved
overnight would punish you for having a life. THE UNDERSTUDY's cast is the
exception, and they will tell you exactly what they got done.

## The game

You are the Hero. Clear microgames to earn XP and damage the gate at the end of
each Act. Eight gates, then THE UNSHIPPED, then NEW GAME+.

**The campaign has no lose state.** No lives, no game over. Missing a trial
costs momentum — your combo breaks, the boss regenerates — never progress. This
is canon: the Artificer removed death from the build and the Slop-Goblin was
furious about it.

**The perimeter is the exception.** THE CRAB was allowed one real stake,
because he is the only one of them who thinks a game should be able to cost you
something. It stays inside his economy — a breach takes goo and his regard, and
never touches the Act ladder.

Running in parallel, all the time, whether you're paying attention or not:

- **The buddy** (👾) gets hungry in real time. Feed it for goo and levels. Its
  *mood throttles your turret's fire rate*, so neglect has teeth.
- **The perimeter** (🦀) is a whole tower defense, and it never stops. Three
  corridors, nine build pads, three tower types, and waves that keep arriving
  during menus and microgames alike. Leaks eat integrity; at zero you breach,
  and a breach costs you goo. **It is the only thing in SLOP that can be lost**
  — THE CRAB was allowed a real stake because neither of the other two would
  enforce one.
- **The honey pot** (🍯) fills slowly from a 15% skim on *every* goo you earn
  anywhere. Open it and you get a whole separate drop-catching minigame — which
  pauses the Artificer's plot entirely. Harvest for a GLAZED buff.
- **The company** (🎭) rehearses whether you are there or not. THE UNDERSTUDY
  knows every trial and has never been called on, so they assembled a cast and
  started running the whole show in the wings. Recruit them, and **they keep
  earning while the app is closed** — the one place in SLOP where time away
  pays you back.
- **Four creators** comment continuously, in distinct voices with distinct
  synth timbres, weighted by your standing with each.

**Choices that matter:** a mutator draft every few rounds (pick a sabotage or
refuse it), stat points on level up, a shop with three upgrade trees, a reroll
button for bailing on a trial, and a chaos-intensity setting. Every one of them
also moves your STANDING with one of the four — Goblin pays +50% goo, Artificer
+50% XP, Crab a stronger perimeter, Understudy a faster company — and whoever
you have backed talks the most.

## Repo map

```
CLAUDE.md              instructions for Claude Code — read first
DEPLOY.md              getting it onto an Android home screen
index.html             DOM skeleton (every id here is a contract)
manifest.webmanifest   PWA identity: name, icons, fullscreen, portrait
sw.js                  offline cache — SHELL must list every runtime file
styles/main.css        all presentation
assets/fonts/          the two typefaces, vendored (OFL) so offline is offline
src/
  main.js              entry point
  game.js              the chassis: round flow, economy, all subsystems
  save.js              what survives closing the app
  defense.js           THE PERIMETER — the Crab's tower defense
  understudy.js        THE COMPANY — the Understudy's idle layer
  ledger.js            THE LEDGER — the only state that outlives a run
  audio.js             one blip() primitive, ~30 named cues
  fx.js                shake, chroma, glitch bars, stamps, confetti
  modules/             24 microgames, one file each, fully isolated
  content/
    lore.js            the four creators, their barks, the eight Acts
    mutators.js        sabotage effects
    shop.js            upgrade catalogue
    stats.js           hero stat definitions
    defense.js         towers, enemies, wave composition
    understudy.js      the company roster, idle rates, offline cap
    ledger.js          cross-run boons and what unlocks them
docs/
  ARCHITECTURE.md      how the chassis works, how systems cross-feed
  ADDING-A-MICROGAME.md  5-minute guide, three files to touch
  LORE.md              voice bible — read before writing dialogue
  PARALLEL-LOOPS.md    one loop per character, and how standing drives them
  DESIGN.md            what the whole thing is trying to be, and the UI contract
tools/
  build.js             ~100-line bundler → dist/slop.html
  smoke-test.js        boots the build, plays a whole campaign
  serve.ps1            dependency-free dev server (no Node, no Python)
  check-shell.ps1      verifies sw.js SHELL against what is on disk
  check-shell.js       the same check, in Node, so npm test runs it
```

## The core design bet

Every call into microgame code is wrapped by the chassis. When a microgame
throws, the error is caught, converted into an in-fiction `GLITCH?!` event, the
round is awarded to the player, and the Slop-Goblin takes credit for it.

That single decision is why content can be written fast and carelessly, why the
game is unbreakable at the content layer, and why "maximalist slop" and
"structurally sound" turned out to be the same engineering goal.

## Extending it

Most additions are data, not code. A new boss, twenty new lines of dialogue, a
new shop item, or a new mutator require no chassis changes — just edits in
`src/content/`. A new microgame is three files. Start with `CLAUDE.md`.
