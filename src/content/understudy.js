/* ============== THE COMPANY (THE UNDERSTUDY'S LOOP) ==============

   Data for the idle layer. The subsystem that reads it is src/understudy.js.

   THE UNDERSTUDY knows every trial and has never been called on. Given no
   part, they assembled a company and started rehearsing the whole show in the
   wings. They are not bitter about this. They would simply like it noted.

   This is the one place in SLOP where time away from the game pays out.
   src/save.js deliberately refuses to advance the buddy's hunger or the GLAZED
   buff across a session, because a pet that starved overnight punishes you for
   closing the app. The company is the inverse: they were working, and they have
   something to show you. See docs/PARALLEL-LOOPS.md.
================================================================ */

/* Rehearsal continues while the app is closed, but not forever and not at full
   pace.

   The cap is the load-bearing number. Without one, a week away would hand back
   a finished run and there would be no reason to play the game the rewards are
   for. Eight hours is one night: enough that closing the app before bed is
   rewarded, short enough that it cannot replace playing.

   Off-hours pay a fraction of the live rate, because idle income should be a
   reason to come back rather than a reason to stay away: an hour of playing
   must always beat an hour of not playing.

   That fraction started at a half and was measured down hard. Eight hours is
   480 minutes, so any rate visible per minute becomes an enormous number
   overnight — at a half, one night handed back 2340 goo and four hero levels,
   when the most expensive tower on the perimeter costs 34. The cap alone could
   not fix that without making the window too short to mean "one night". */
export const OFFLINE_CAP_MS = 8 * 60 * 60 * 1000;
export const OFFLINE_RATE = 0.12;

/* Rates are per second at level 1, before standing and before the off-hours
   fraction. They are deliberately small: the company is a trickle that
   compounds, not a replacement for the microgames. A fully recruited company
   earns roughly 300 goo across a night, against the few hundred a good session
   earns from everything else — a meaningful slice, never the main course. */
export const Company = [
  {
    id: 'understudy', name: 'THE UNDERSTUDY', glyph: '🎭', color: '#7a3cff',
    // Free, and present from the first round. A layer that shows the player
    // nothing until they pay for it cannot explain itself.
    cost: 0, goo: 0.010, xp: 0.004,
    desc: 'knows every trial. has never been called on'
  },
  {
    id: 'standin', name: 'THE STAND-IN', glyph: '🧍', color: '#2fe1ff',
    cost: 40, goo: 0.015, xp: 0.005,
    desc: 'does the tapping. does not ask what for'
  },
  {
    id: 'prompter', name: 'THE PROMPTER', glyph: '📖', color: '#fff02f',
    // Weighted to XP: the Artificer's currency, earned by someone he never
    // cast. Neither of them has commented on this.
    cost: 75, goo: 0.009, xp: 0.012,
    desc: 'covers the ones with remembering in them'
  },
  {
    id: 'swing', name: 'THE SWING', glyph: '🔁', color: '#c9ff2f',
    cost: 130, goo: 0.022, xp: 0.007,
    desc: 'covers any role. covers several at once'
  },
  {
    id: 'director', name: 'THE DIRECTOR', glyph: '🎬', color: '#ff7a2f',
    cost: 220, goo: 0.026, xp: 0.010,
    // The only way to extend the offline window, which makes them the pick for
    // a player who plays in one sitting a day rather than many short ones.
    capBonusH: 3,
    desc: 'keeps the hall open longer. nobody approved this'
  }
];

/* Each level multiplies output and costs more than the last, so a deep company
   and a broad one are different bets rather than the same one at different
   speeds. */
export function memberRate(base, level) { return base * (1 + (level - 1) * 0.55); }
export function memberUpgradeCost(base, level) { return Math.round((base || 30) * 0.7 * Math.pow(1.9, level - 1)); }
