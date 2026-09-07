# Parallel loops

## The idea

SLOP's canon already says every system is *built by someone*. Until now that
was two people and one real game loop: the Artificer's microgame campaign, with
the Slop-Goblin's toys bolted onto its side.

The rescope takes that seriously. **Each character owns a whole game loop, and
those loops run in parallel.** The game grows breadthwise — more loops — as well
as lengthwise — more Acts. A new character is a new way to play, not a new
voice commenting on the same play.

This changes what the favor meter is for. A single Goblin↔Artificer slider
cannot express standing with four parties, and more importantly it cannot
express the interesting choice: *which loop are you actually investing in.*

## The cast, and what each one owns

| Who | Colour | Owns | Loop | Wants |
|---|---|---|---|---|
| THE ARTIFICER | cyan `#2fe1ff` | Acts, stats, XP, Workshop, boss ladder, timer | The microgame campaign | You to finish |
| SLOP-GOBLIN | acid `#c9ff2f` | Buddy, honey pot, mutators, chaos | Incremental / distraction | You happily distracted |
| THE CRAB | orange `#ff7a2f` | The defense lane | Tower defense | The perimeter held |
| THE UNDERSTUDY | violet `#7a3cff` | The idle party | Idle RPG | To be taken seriously |

Colours are taken from the existing palette, which already had orange and
violet defined and unassigned to any speaker.

### THE CRAB

The defense lane used to auto-fire at drifting blobs and was, mechanically,
a decoration that printed goo. THE CRAB is the answer to "why is that there,
and who put it there."

His position: **the blobs are getting in.** They are not scenery. The Artificer
ignores them because they are not on the critical path to the boss gate. The
Goblin thinks they are funny and has been *feeding* them. The Crab is the only
one treating the perimeter as real, and he is correct, and nobody is listening.

Voice: clipped. Short declaratives, frequently no articles. Sideways — he
answers a question next to the one you asked. Not military, not a drill
sergeant; more like someone who has been on the same shift for a very long
time and has stopped padding sentences.

```
"wave in sixty. you are not ready. that is fine. you are never ready"
"the goblin has been feeding them. i have told him. i will tell him again"
"hold the left. the left is where it always goes wrong"
```

Never: exclamation marks, enthusiasm, addressing the plot, caring who wins.

His lane is now a **proper tower defense**: real waves with
composition, multiple tower types with distinct roles, placement that matters,
and a fail state that is *his* — losing the perimeter costs you something,
which is the first thing in this game that can be lost. That is the point of
him, and it is why he is not the Artificer (who removed death) or the Goblin
(who would never enforce a cost).

### THE UNDERSTUDY

Owns the idle layer: a small party that plays the game while you are not
looking, and reports back when you return.

This is the deliberate inverse of the save system's current rule. `src/save.js`
refuses to advance time-based state across a session, because a buddy that
starved for nine hours punishes you for closing the app. The Understudy's
layer is the one place offline time is a *reward* — they were working, and
they have things to show you.

They want to be taken seriously as a Hero. They are not bitter about it. They
are just extremely, tirelessly available.

## Favor becomes standing

Replace the scalar with per-character standing:

```js
favor: { artificer: 0, goblin: 0, crab: 0, understudy: 0 }   // each 0..100
```

`shiftFavor(who, delta)` grants standing to one character and bleeds a smaller
amount from the others, so favor stays a *choice* rather than something that
only accumulates.

**Each character's standing powers their own loop.** This is what makes the
question "which loop am I investing in" the same question as "who am I siding
with":

| Standing | Effect |
|---|---|
| Artificer | XP multiplier — the campaign advances faster |
| Goblin | Goo multiplier — the incremental layer pays more |
| Crab | Tower damage and range — the perimeter holds longer |
| Understudy | Idle rate — the party earns more while you are away |

### Why it should be able to be ultra-important or not at all

Spread standing evenly and every loop is mildly better; nothing is
transformed. Dump it all into one and that loop becomes dominant while the
others visibly starve. Both are legitimate ways to play, and the game should
not tell you which it prefers.

Threshold effects are what make the committed build feel different in kind
rather than degree: at high standing a character unlocks something only they
can give. Below that, standing is a set of multipliers you can reasonably
ignore. A player who never thinks about favor should still finish; a player
who commits should get a run that looks unlike theirs.

### Who talks

`bark()` currently picks a speaker with a two-way weight. It becomes a weighted
draw across standing share, so the character you have invested in comments
most — with the others still audible, because the arguing is the texture.

## Sequencing

The favor spine comes first. It is what every loop hooks into, and retrofitting
it after a second loop exists means changing that loop twice.

1. ~~**Standing**~~ — **done.** Multi-axis favor, its UI, and the four-way
   bark weighting.
2. ~~**THE CRAB**~~ — **done.** Cast entry, voice, barks, and the defense lane
   rebuilt as a real tower defense. See "How the perimeter turned out" below.
3. ~~**THE UNDERSTUDY**~~ — **done.** The idle layer and the offline-time rule
   that only applies to them. See "How the company turned out" below.
4. ~~**Breadth**~~ — **done.** More microgames, more Acts, meta-progression
   across runs, deeper hero systems. See "How the breadth pass turned out".

## How the perimeter turned out

`src/defense.js` with its data in `src/content/defense.js`. The decisions worth
knowing before changing it:

- **One simulation, two views.** Positions live in board space (480×360) and
  are scaled at render time, so the HUD strip and the full overlay cannot
  disagree about where anything is. `renderStrip` and `renderBoard` are the
  only places that know about pixels.
- **Nine pads, three columns by three rows.** A pad row sits between its own
  corridor and the next one down, so the top two rows cover two corridors each
  and the bottom row covers one. The efficient slots are the ones furthest
  from the breach — that asymmetry *is* the placement decision.
- **It never stops.** Waves arrive on the rAF loop during menus, the honey pot
  and microgames. Ignoring the perimeter is a decision with a consequence.
- **Global reinforcement is separate from per-tower level.** `Game.turret`
  multiplies every tower; REINFORCE stays worth buying at nine towers.
- **It has its own crash guard.** `Game.safeSubsystem` mirrors `safeLane`, but
  unlike a microgame crash a fault here is *not* awarded to the player and does
  not become a `GLITCH?!` — the perimeter is where consequences are real, so
  swallowing a fault as a reward would be a lie. It logs and abandons the frame.
- **Waves are generated, not listed.** A run has no last wave, so a fixed table
  would either run out or be mostly copy-paste.
- **What persists.** Towers, integrity and breach count; not the enemies in
  flight. Resuming into a half-finished wave would be an ambush nobody chose.


## What this does not change

- **No fail state in the campaign.** The Crab's perimeter can be lost; the
  Artificer's Act ladder still cannot. Do not let the Crab's cost leak into
  the microgame loop.
- **Content stays data.** A new character is a `Cast` entry, a bark set and a
  loop module — not special cases in `game.js`.
- **The chassis still catches everything.** More loops means more surface for
  a careless throw, which makes the crash-as-feature bet more valuable, not
  less.

## How the company turned out

`src/understudy.js` with its data in `src/content/understudy.js`. It is the
quietest loop in the game and the only one with an exploit surface, so most of
the decisions are about the latter.

- **`lastAt` is the whole trick.** It is stamped on every live tick and written
  into the save, so the gap between it and `Date.now()` on launch is exactly
  the time nobody was watching. Using the save's own timestamp instead would
  double-count a session that sat open and idle.
- **Three things are refused rather than trusted**: a gap larger than the cap,
  a timestamp in the future (a wound-back device clock), and a gap under a
  minute (a reload is not a session away). Each has a test.
- **The cap is load-bearing.** Without it a week away hands back a finished run
  and there is no reason to play the game the rewards are for. Eight hours is
  one night; THE DIRECTOR is the only way to extend it, which makes them the
  pick for someone who plays once a day rather than in many short bursts.
- **Off-hours pay 12%, not 50%.** Measured, not guessed. Eight hours is 480
  minutes, so any per-minute rate that is visible during play becomes enormous
  overnight: at a half, one night returned 2340 goo and four hero levels when
  the most expensive thing in the game cost 34. An hour of playing must always
  beat an hour of not playing.
- **Fractional carry matters.** Rates are hundredths of a goo per second, so
  flushing with `Math.round` every frame would floor to zero forever. The
  accumulator only pays out at whole units.
- **XP is the interesting payout.** It is the Artificer's currency, earned by
  someone he never cast. It accelerates levelling but cannot skip an Act, since
  Acts advance on round wins.

Measured gradient across a night, which is the shape to preserve if the numbers
are touched again:

| Investment | Per night |
|---|---|
| Nobody recruited | ~34 goo |
| Full roster at level 1 | ~430 goo, one level |
| Fully rehearsed, standing 100 | ~1900 goo, four levels, 17h window |

The top row is a trickle you notice; the bottom is a genuine commitment that
costs standing with the other three.

## How the breadth pass turned out

Four separate widenings, none of which needed a chassis change beyond wiring.

**Microgames: 14 → 22.** The pool leaned almost entirely on `onDown`, so the
eight new ones deliberately do not: drag-precision (`trace`), pursuit
(`chase`), timing (`stack`), rhythm (`rhythm`), drag-to-connect (`wire`),
pure judgement with no reflex at all (`weigh`), survive-by-dragging (`flee`),
and steady-drag that punishes speed (`peel`). Variety across *input syntax* is
what makes a double round read as two games rather than one game twice.

**Acts: 5 → 8.** V, VI and VII sit between the Artificer's confession in Act IV
and his finale, because that is where the Crab and the Understudy have room to
be part of the plot rather than commentary beside it. Each of the three belongs
to a different voice. THE UNSHIPPED remains the only `final` boss.

**Hero stats: 3 → 5.** NERVE raises the combo *ceiling* rather than any rate,
so it compounds with every goo source at once without making one louder. CHARM
scales standing earned — and explicitly not standing lost, since a stat that
deepened your penalties would be a trap rather than an investment. It scales
the bleed too, so a charming hero commits harder in both directions instead of
collecting all four patrons for free.

**THE LEDGER** (`src/ledger.js`, boons in `src/content/ledger.js`) is the only
state that outlives a run, under its own storage key so that starting a run
cannot clear the record of having played. It belongs to the Artificer, and that
attribution is the design: he wants you to finish, so when you do not, he
writes down how far you got and quietly makes the next attempt easier.

It counts **total gates cleared, not runs completed** — counting runs would
give nothing at all to a player who keeps stalling in Act VI, who is exactly
who it exists for. Six boons unlock across 3 to 30 gates, each applied after
the reset and announced by the Artificer inside the Act I opening, because a
silent buff is indistinguishable from a bug.

### What the tests learned

Three bugs surfaced that the existing suite structurally could not catch, and
each left a permanent check behind:

- **The bundle shares one scope.** `src/ledger.js` was written with the same
  `const KEY` as `src/save.js`; the dev server was fine and the built artefact
  was broken. `tools/build.js` now fails on any top-level name collision.
- **jsdom had no usable `localStorage`.** Its default `about:blank` origin
  makes every storage access throw, so `store()` returned null and the save and
  ledger degraded to no-ops — exactly as designed, which is why the suite
  passed while covering neither. Giving the DOM a real `url` made persistence
  testable for the first time.
- **"Does not throw" is not "is a game."** The chassis awards a throwing module
  to the player, so an unwinnable module is invisible in play. A winnability
  harness drives the correct input for each new microgame at rounds 1 and 30
  and demands a win. It immediately found `trace` accepting a 46px grab into a
  27px corridor and then failing the player for it on the first move.
