# Architecture

## Layers

```
index.html          DOM skeleton — every element the chassis binds to
  └ styles/main.css all presentation, incl. mutator effects (invert/quake/giant)
  └ src/main.js     entry point; importing game.js boots everything
      └ src/game.js         THE CHASSIS — round flow, economy, all subsystems
          ├ src/audio.js    Sound: one blip() primitive + ~30 named cues
          ├ src/fx.js       FX: shake, chroma, glitch bars, stamps, confetti
          ├ src/save.js     the only code that touches localStorage
          ├ src/defense.js  THE PERIMETER — the Crab's tower defense
          ├ src/understudy.js THE COMPANY — the Understudy's idle layer
          ├ src/ledger.js   THE LEDGER — cross-run boons, its own storage key
          ├ src/modules/    25 microgames, each fully isolated
          └ src/content/    Acts, dialogue, mutators, shop, stats — pure data

sw.js                 offline cache, registered from index.html
manifest.webmanifest  install identity — outside the module graph entirely
```

## The chassis

`src/game.js` exports a single `Game` object. It owns:

- **Round flow** — `nextRound() → beginModuleRound() → continueModuleRound() →
  finishRound()`, with detours into the mutator draft, level-up, bonus stage,
  and boss gates.
- **Lane system** — a round runs 1 or 2 lanes concurrently. Each lane gets its
  own canvas, its own `local` scratch object, and its own `win()`/`lose()`.
  Lanes never see each other.
- **State machine** — `boot / story / playing / resolve / draft / levelup /
  bonus / potgame / tdgame / company / menu / victory`. The rAF loop dispatches
  on this.
- **Everything else** — hero stats, XP, standing, boss HP, buddy, the perimeter,
  honey pot, the company, the ledger, shop, codex.

### The microgame contract

```js
{
  id, verb, color,          // identity + the banner shown when it starts
  hint,                     // string | (g)=>string — the instruction band
  surviveOnTimeout?,        // true = running out the clock is a WIN
  init(g), update(g, dt), render(g),
  onDown(g,x,y), onMove(g,x,y), onUp(g,x,y), cleanup(g)
}
```

`g` is `{ W, H, ctx, local, round, win(), lose() }`. `W`/`H` are always
480×480 regardless of on-screen size — the chassis scales pointer coordinates
for you. Write to `g.local`, never to module-level variables (the same module
object can be instantiated in two lanes at once).

**The chassis owns the instruction.** Modules declare `hint` and the chassis
draws it, in DOM, in the same place every time, then fades it out so the board
comes back clean. This used to be each module's own `fillText`, which put the
instruction at seven different heights across the pool, left four modules with
none at all, and rendered all of them at roughly 9.5px on a phone — canvas text
is scaled down with the canvas, DOM text is not.

### Crash-as-feature

Every call into module code goes through `Game.safeLane()`. A thrown error is
caught, converted into a `GLITCH?!` screen effect, and the lane is awarded to
the player. This is the reason microgames can be written fast and loose, and
it is why the game is effectively unbreakable at the content layer.

## Cross-system wiring

The systems deliberately feed each other. This is the Slop-Goblin's canonical
motive ("interoperability") expressed as actual coupling:

```
round wins ──► XP ──► levels ──► stats ──► timer length, reroll cost, boss dmg
     │
     └──► combo ──► multiplies ALL goo income
                          │
buddy mood ──────────────►│ (throttles turret fire rate: happy 0.85x, feral 1.5x)
     ▲                    │
     │                    ▼
turret/manual kills ──► goo ──► addGoo() ──┬──► spendable currency
     │                                     └──► skims 15% into honey pot brew
     ▼                                                    │
buddy hunger +                                            ▼
                                              pot harvest ──► GLAZED buff
                                                             (goo ×1.5, 10s)
standing ──┬─► goblin:     goo ×1.5 max
           ├─► artificer:  XP ×1.5 max
           ├─► crab:       tower damage ×1.5 max
           ├─► understudy: idle rate ×1.5 max
           └─► and weights who speaks, four ways
```

`addGoo()` is the single funnel for all goo income — that's what makes the pot
fill from *everything* rather than needing per-source wiring. If you add a new
goo source, call `addGoo()`, not `Game.goo += n`.

## Narrative layer

`Game.say(who, line)` drives the persistent dialogue bar; `Game.bark(barkSet)`
picks a speaker weighted by standing, so the patron you're aligned with
talks more. Story beats (act openings, boss intros, act closings) use
`showStory()`, which halts the round flow behind an overlay and resumes via a
continuation callback.

Acts are data in `content/lore.js`: `{ n, title, quest, rounds, boss, open,
close }`. The chassis reads `rounds` to know when to open the boss gate and
`boss.hp/regen/final` to build the encounter. Adding a ninth act requires no
chassis change.

## Persistence

`src/save.js` owns every `localStorage` access in the codebase. It exists
because the delivery target became an installed Android app, where the OS ends
backgrounded processes on its own schedule; the original "a run is a session"
rule was correct for a browser tab and untenable on a phone.

Three decisions shape it:

- **Between rounds only.** A save is written at exactly one place — the top of
  `nextRound()`, where `round` is precisely "rounds completed". Every other
  hook (a shop purchase during a paused round, a pot harvest) fires while a
  round is in flight, and resuming from one would put the player a trial ahead
  of where they actually were.
- **No live round is serialised.** Lanes, the running microgame, the defense
  lane's in-flight blobs and the pot minigame are all absent. Storing them
  would mean every microgame had to describe its own state, which is exactly
  the burden `safeLane()` exists to keep off module authors. Resuming replays
  the interrupted trial.
- **The schema is an explicit field list**, not a walk of `Game`. Adding a
  chassis field does not silently add it to saves. The failure mode of
  forgetting is therefore a value that resets to its initial state, never a
  half-restored run.

Time-based state — the GLAZED buff, the buddy's hunger clock, ambient bark
timers — is deliberately not restored. A buddy that starved for nine hours
while the app was closed would be a punishment for closing the app.

**A second key holds what outlives a run.** `slop.save.v1` is one campaign and
`start()` wipes it; `slop.ledger.v1` (`src/ledger.js`) is the record of ever
having played and must survive that, which is why it is a separate key rather
than a field in the save. It counts total gates cleared across every attempt
and unlocks boons applied at the start of each new run. Both keys go through
the same `store()` guard.

**One system is exempt from the freeze, and it is the point of a whole
character.** THE
UNDERSTUDY's company (`src/understudy.js`) is credited for time the app was
shut. The save carries a `lastAt` wall-clock stamp that the live tick advances
every frame, so the gap on the next launch is exactly the time nobody was
watching — using the save's own write time instead would double-count a session
left open and idle. The payout is capped, refuses a future timestamp, and
ignores gaps under a minute; each of those guards exists because the
alternative is a system farmed by changing the device clock.

## Timing

One `requestAnimationFrame` loop. `dt` is clamped to 50ms so a backgrounded
tab doesn't teleport state. Round timers are deadline-based (`performance.now()
+ timeLimit`) rather than accumulated, and menus that pause the round stash the
remaining time and restore it — see `pauseForMenu()` / `resumeAfterMenu()`.

The buddy, the perimeter and the pot brew tick on *every* frame regardless of state,
including while the honey pot minigame has the plot paused. Only the round
stops. That asymmetry is a joke the narrators comment on, and it is
intentional.
