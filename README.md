# SLOP — A Chronicle of Unfinished Things

A browser CRPG hiding inside a WarioWare-style microgame chassis.

Fourteen microgames, five acts, five bosses, a hero sheet with stats and XP, a
shop, a tower-defense lane, a virtual pet, a second entire game inside a honey
pot — and two narrators who built all of it and can't agree on what it's for.

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

SLOP is a PWA. Served over HTTPS it installs to an Android home screen and runs
fullscreen and offline, with no store and no wrapper. `DEPLOY.md` has the
GitHub Pages steps.

A run now survives closing the app — Android kills backgrounded processes
whenever it likes, and the title screen offers CONTINUE when there is something
to come back to. The save is a between-rounds snapshot, so resuming replays the
trial you were in the middle of.

## The game

You are the Hero. Clear microgames to earn XP and damage the gate at the end of
each Act. Five gates, then THE UNSHIPPED, then NEW GAME+.

**There is no lose state.** No lives, no game over. Missing a trial costs
momentum — your combo breaks, the boss regenerates — never progress. This is
canon: the Artificer removed death from the build and the Slop-Goblin was
furious about it.

Running in parallel, all the time, whether you're paying attention or not:

- **The buddy** (👾) gets hungry in real time. Feed it for goo and levels. Its
  *mood throttles your turret's fire rate*, so neglect has teeth.
- **The defense lane** auto-fires at drifting blobs; tap them yourself for more
  goo. Upgrade the turret, or buy a second one.
- **The honey pot** (🍯) fills slowly from a 15% skim on *every* goo you earn
  anywhere. Open it and you get a whole separate drop-catching minigame — which
  pauses the Artificer's plot entirely. Harvest for a GLAZED buff.
- **Two narrators** comment continuously, in distinct voices with distinct
  synth timbres, weighted by which of them you've been siding with.

**Choices that matter:** a mutator draft every few rounds (pick a sabotage or
refuse it), stat points on level up, a shop with three upgrade trees, a reroll
button for bailing on a trial, and a chaos-intensity setting. Every one of them
also nudges the FAVOR meter toward one narrator or the other — Goblin side pays
+50% goo, Artificer side pays +50% XP, and the winner talks more.

## Repo map

```
CLAUDE.md              instructions for Claude Code — read first
DEPLOY.md              getting it onto an Android home screen
index.html             DOM skeleton (every id here is a contract)
manifest.webmanifest   PWA identity: name, icons, fullscreen, portrait
sw.js                  offline cache — SHELL must list every runtime file
styles/main.css        all presentation
src/
  main.js              entry point
  game.js              the chassis: round flow, economy, all subsystems
  save.js              what survives closing the app
  audio.js             one blip() primitive, ~30 named cues
  fx.js                shake, chroma, glitch bars, stamps, confetti
  modules/             14 microgames, one file each, fully isolated
  content/
    lore.js            the two narrators, their barks, the five Acts
    mutators.js        sabotage effects
    shop.js            upgrade catalogue
    stats.js           hero stat definitions
docs/
  ARCHITECTURE.md      how the chassis works, how systems cross-feed
  ADDING-A-MICROGAME.md  5-minute guide, two files to touch
  LORE.md              voice bible — read before writing dialogue
tools/
  build.js             ~100-line bundler → dist/slop.html
  smoke-test.js        boots the build, plays a whole campaign
  serve.ps1            dependency-free dev server (no Node, no Python)
  check-shell.ps1      verifies sw.js SHELL against what is on disk
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
`src/content/`. A new microgame is two files. Start with `CLAUDE.md`.
