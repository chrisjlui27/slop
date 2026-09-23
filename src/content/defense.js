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
  /* `breach` is how much integrity one of these takes on the way through.
     Tuned down from a first pass where an unattended perimeter did not merely
     lose ground but entered a death spiral: leaks outpaced regeneration, every
     breach reset integrity to half, and the next breach followed a wave later.
     A loop nobody is obliged to play must not bill the main economy every
     thirty seconds. */
  drip:     { id:'drip',     name:'DRIP',     hp:3,  speed:0.030, r:11, color:'#c9ff2f', breach:3,  goo:1 },
  runner:   { id:'runner',   name:'RUNNER',   hp:2,  speed:0.064, r:8,  color:'#fff02f', breach:2,  goo:1 },
  lump:     { id:'lump',     name:'LUMP',     hp:13, speed:0.017, r:17, color:'#7a3cff', breach:7,  goo:3 },
  // Dies into two drips. The reason a lone high-damage tower at the front is
  // not a complete answer.
  splitter: { id:'splitter', name:'SPLITTER', hp:6,  speed:0.034, r:13, color:'#ff2f9e', breach:4,  goo:2, splits:'drip', splitCount:2 }
};

/* Waves are generated rather than listed. The perimeter runs for as long as a
   run does — there is no last wave — so a fixed table would either run out or
   be mostly copy-paste. Composition is a function of wave number: each type
   arrives at a fixed wave and then scales.

   Returns the spawn list for a wave, already ordered. */
export function waveComposition(n) {
  const spawns = [];
  const push = (type, count) => { for (let i = 0; i < count; i++) spawns.push(type); };

  push('drip', 2 + Math.floor(n * 0.5));
  if (n >= 3) push('runner', 1 + Math.floor((n - 3) * 0.4));
  if (n >= 5) push('lump', 1 + Math.floor((n - 5) * 0.22));
  if (n >= 7) push('splitter', 1 + Math.floor((n - 7) * 0.25));

  // Shuffled so a wave is not three neat blocks — a lump arriving mid-runner
  // is what forces a tower to be somewhere other than the front.
  for (let i = spawns.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [spawns[i], spawns[j]] = [spawns[j], spawns[i]];
  }
  return spawns;
}

/* Health scaling is separate from composition so the curve can be tuned
   without touching what turns up.

   Both curves were measurably too steep on the first pass: a player who never
   opened the perimeter breached around wave 5, roughly two minutes in, which
   made the Crab's loop mandatory rather than optional and punished people who
   had not yet found the screen. Softened until an untouched perimeter survives
   to roughly wave 11 — long enough to discover it, short enough that ignoring
   it forever still costs. */
export function waveHpMult(n) { return 1 + n * 0.09; }

/* Gap between spawns within a wave, and the rest between waves. Both shrink
   with wave number, but floor out well above zero — a perimeter that becomes
   a solid wall of enemies stops being a game about placement. */
export function spawnGap(n) { return Math.max(340, 1000 - n * 42); }
export function waveRest(n) { return Math.max(2600, 6000 - n * 130); }

/* ==================== DOCTRINE ====================

   THE CRAB's own progression, and the answer to two things the perimeter
   owed: a decision between waves, and a board that grows.

   Every fourth wave the line earns a doctrine, and the perimeter holds — no
   next wave until one of two offered is picked. Holding is the point: it is
   the only moment in this loop that is not happening at you, and it is the
   only one where the board itself can change shape.

   These are one-offs, not levels. A tower is a running cost paid in goo; a
   doctrine is a decision about what kind of line this is going to be, taken
   once, kept for the run. */
export const Doctrines = [
  {
    id:'flank', name:'OPEN THE FLANK', glyph:'🧱',
    desc:'three more pads, forward of the line',
    // The only one that changes the board. Handled in Defense.applyDoctrine.
    pads:[ [60,110], [60,210], [60,310] ],
    line:'we dug out the forward wall. three more pads. i have wanted this since wave one'
  },
  {
    id:'plating', name:'PLATING', glyph:'🛡️',
    desc:'+40 integrity, and patched to full now',
    integrity:40,
    line:'plating. it will still get through. it will take longer about it'
  },
  {
    id:'optics', name:'OPTICS', glyph:'🔭',
    desc:'every tower reaches 14% further',
    rangeMult:1.14,
    line:'we can see further. seeing further is most of it'
  },
  {
    id:'drill', name:'DRILL', glyph:'🥁',
    desc:'every tower fires 12% faster',
    rateMult:0.88,
    line:'faster. not better. faster is usually enough'
  },
  {
    id:'salvage', name:'SALVAGE CREW', glyph:'♻️',
    desc:'kills pay 30% more, selling refunds in full',
    gooMult:1.3, sellFull:true,
    line:'we strip what comes through. it was going to be litter anyway'
  },
  {
    id:'relief', name:'RELIEF SHIFT', glyph:'🧰',
    desc:'a clean wave repairs twice as much',
    cleanMult:2,
    line:'somebody else watches for an hour. i sleep. the line holds either way'
  },
  {
    id:'spotters', name:'SPOTTERS', glyph:'📡',
    desc:'the next wave is named before it arrives',
    spotters:true,
    line:'we know what is coming now. knowing is not the same as ready'
  }
];

/* Waves 4, 8, 12 … and every fourth after. Two options each time, drawn from
   what has not been taken. */
export const DOCTRINE_EVERY = 4;

export const doctrineById = id => Doctrines.find(d => d.id === id);

/* Every fifth wave is a SURGE: the composition gains an elite. They are the
   only enemies worth building a second row for, and the reason the perimeter
   stops being solved once a good line is up. */
export const EliteTypes = {
  wedge: { id:'wedge', name:'THE WEDGE', hp:46, speed:0.020, r:21, color:'#ff7a2f', breach:12, goo:9, elite:true },
  hush:  { id:'hush',  name:'THE HUSH',  hp:22, speed:0.050, r:14, color:'#2fe1ff', breach:8,  goo:7, elite:true }
};

export function eliteForWave(n){
  if(n % 5 !== 0) return null;
  return (n % 10 === 0) ? 'wedge' : 'hush';
}

/* Calling a wave in early. The rest between waves is there so a player can
   build; skipping it is worth goo, because the only thing a tower defense can
   pay you for confidence is time. */
export const CALL_BONUS_PER_SEC = 3;
