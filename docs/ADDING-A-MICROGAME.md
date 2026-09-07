# Adding a microgame

Two files change. It takes about five minutes.

## 1. Create `src/modules/yourgame.js`

```js
import { Sound } from "../audio.js";

export default {
  id: 'yourgame',            // unique, lowercase, matches the filename
  verb: 'DO IT!',            // the banner slammed on screen when it starts
  color: '#c9ff2f',          // banner + lane label colour

  init(g) {
    // Called once when the round starts. Put ALL state on g.local.
    g.local.target = { x: g.W / 2, y: g.H / 2, r: 60 };
    // g.round is the current round number — use it to scale difficulty.
    g.local.speed = 0.1 + g.round * 0.004;
  },

  update(g, dt) {
    // dt is milliseconds since last frame, clamped to 50.
    // Optional — omit if your game is purely reactive to input.
  },

  render(g) {
    const c = g.ctx;
    c.clearRect(0, 0, g.W, g.H);   // always clear first
    c.beginPath();
    c.arc(g.local.target.x, g.local.target.y, g.local.target.r, 0, Math.PI * 2);
    c.fillStyle = '#c9ff2f';
    c.fill();
  },

  onDown(g, x, y) {
    const t = g.local.target;
    if (Math.hypot(x - t.x, y - t.y) <= t.r) {
      Sound.tap();
      g.win();      // resolve the lane — safe to call once
    } else {
      g.lose();
    }
  },

  // onMove(g, x, y) and onUp(g, x, y) are optional — add for drag/hold games.
  // cleanup(g) is optional — only needed if you allocated something external.
};
```

## 2. Register it in `src/modules/index.js`

```js
import yourgame from "./yourgame.js";

export const Modules = [
  // ...existing
  yourgame,
];
```

That's it. The chassis picks it up immediately, avoids repeating it too soon,
and includes it in double-lane rounds and rerolls automatically.

## Rules

**The canvas is always 480×480.** `g.W` and `g.H` are always 480 no matter how
big the lane renders on screen. Pointer coordinates are pre-scaled to match, so
just work in 480×480 space and ignore the real size.

**All state goes on `g.local`.** Never use module-scope variables — the same
module object can run in two lanes simultaneously during a DOUBLE SLOP round,
and they'd stomp each other.

**Resolve exactly once.** Call `g.win()` or `g.lose()` when the game is
decided. The chassis ignores repeat calls, but guard your own logic with a
`g.local.done` flag if input could fire after resolution.

**If you never resolve, the timer does it.** Running out the clock counts as a
loss by default. Set `surviveOnTimeout: true` on the module if your game is
about *lasting* rather than *completing* (see `balance.js`).

**Don't add try/catch.** The chassis catches everything you throw and turns it
into a `GLITCH?!` event that awards the player the round. Crashing is a
supported outcome. Write fast and loose.

**Keep input syntax distinct.** Two microgames can run side by side. A tap-spam
game next to a precise-tap game is miserable. Prefer variety across the pool:
tap, drag, hold-and-release, swipe, timing, memory, judgement.

## Difficulty

Scale off `g.round`, and cap it:

```js
g.local.speed = 0.09 + Math.min(0.1, g.round * 0.003);
```

The round timer already shrinks as the run progresses (and grows with the
player's REFLEX stat), so your module doesn't need to get much harder on its
own. Uncapped scaling makes late acts impossible.

## Testing

```bash
npm run dev     # then play until it comes up
npm test        # verifies nothing structural broke
```

To force your module to appear, temporarily make `Modules` in
`src/modules/index.js` contain only yours. Or in the browser console:
`SLOP.lanes[0].def` shows what's currently loaded.
