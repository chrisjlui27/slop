/* ==================== THE PERIMETER (THE CRAB'S LOOP) ====================

   Data for the tower defense. Towers, enemies and wave composition are all
   plain values here; src/defense.js contains the loop that reads them. Adding
   a tower type or reshaping the wave curve should not require touching the
   subsystem, and definitely not the chassis.

   The Crab built this because things are getting in and the other two will not
   treat that as real. It is the only loop in SLOP with something that can
   actually be lost — see docs/PARALLEL-LOOPS.md for why that is his and not
   the Artificer's.
======================================================================== */

/* Board space. Every position in this system is expressed in these
   coordinates and scaled at render time, so the HUD strip and the full
   overlay are two views of one board rather than two boards. */
export const BOARD = { w: 480, h: 360 };

/* Three corridors running right to left, with a row of build pads slung under
   each. A pad row sits exactly between its own corridor and the next one down,
   so the top two rows can cover two corridors at once and the bottom row
   covers one. That asymmetry is the whole placement decision: the cheap
   efficient slots are the ones furthest from the breach. */
export const CORRIDOR_Y = [60, 160, 260];
export const PAD_Y = [110, 210, 310];
export const PAD_X = [120, 240, 360];
export const PAD_R = 32;

/* Where a leak becomes a breach. Enemies are removed here and take a bite out
   of perimeter integrity on the way through. */
export const BREACH_X = 8;

export const TowerTypes = [
  {
    id: 'clacker', name: 'CLACKER', glyph: '🦀', cost: 14,
    dmgMult: 1, intervalMult: 1, range: 112, splash: 0, slow: 0,
    color: '#ff7a2f',
    desc: 'single target. cheap. does the job'
  },
  {
    id: 'brine', name: 'BRINE POT', glyph: '🫙', cost: 22,
    // Nearly harmless on its own. It exists to make the other two work, which
    // is the only reason to spend a pad on it.
    dmgMult: 0.3, intervalMult: 1.4, range: 96, splash: 0, slow: 0.45,
    color: '#2fe1ff',
    desc: 'slows what it touches. barely scratches it'
  },
  {
    id: 'shell', name: 'SHELL GUN', glyph: '💥', cost: 34,
    dmgMult: 0.85, intervalMult: 2.1, range: 124, splash: 46, slow: 0,
    color: '#ff2f9e',
    desc: 'slow. hits everything near where it lands'
  }
];

export const EnemyTypes = {
  drip:     { id:'drip',     name:'DRIP',     hp:3,  speed:0.030, r:11, color:'#c9ff2f', breach:4,  goo:1 },
  runner:   { id:'runner',   name:'RUNNER',   hp:2,  speed:0.064, r:8,  color:'#fff02f', breach:3,  goo:1 },
  lump:     { id:'lump',     name:'LUMP',     hp:13, speed:0.017, r:17, color:'#7a3cff', breach:11, goo:3 },
  // Dies into two drips. The reason a lone high-damage tower at the front is
  // not a complete answer.
  splitter: { id:'splitter', name:'SPLITTER', hp:6,  speed:0.034, r:13, color:'#ff2f9e', breach:5,  goo:2, splits:'drip', splitCount:2 }
};

/* Waves are generated rather than listed. The perimeter runs for as long as a
   run does — there is no last wave — so a fixed table would either run out or
   be mostly copy-paste. Composition is a function of wave number: each type
   arrives at a fixed wave and then scales.

   Returns the spawn list for a wave, already ordered. */
export function waveComposition(n) {
  const spawns = [];
  const push = (type, count) => { for (let i = 0; i < count; i++) spawns.push(type); };

  push('drip', 3 + Math.floor(n * 0.8));
  if (n >= 3) push('runner', 1 + Math.floor((n - 3) * 0.55));
  if (n >= 5) push('lump', 1 + Math.floor((n - 5) * 0.28));
  if (n >= 7) push('splitter', 1 + Math.floor((n - 7) * 0.34));

  // Shuffled so a wave is not three neat blocks — a lump arriving mid-runner
  // is what forces a tower to be somewhere other than the front.
  for (let i = spawns.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [spawns[i], spawns[j]] = [spawns[j], spawns[i]];
  }
  return spawns;
}

/* Health scaling is separate from composition so the curve can be tuned
   without touching what turns up. Kept gentle: the perimeter is meant to be
   survivable while ignored for a while, and only genuinely demanding if you
   have been spending your goo elsewhere the whole run. */
export function waveHpMult(n) { return 1 + n * 0.13; }

/* Gap between spawns within a wave, and the rest between waves. Both shrink
   with wave number, but floor out well above zero — a perimeter that becomes
   a solid wall of enemies stops being a game about placement. */
export function spawnGap(n) { return Math.max(340, 1000 - n * 42); }
export function waveRest(n) { return Math.max(2600, 6000 - n * 130); }
