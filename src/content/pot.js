/* ==================== THE HONEY POT (SLOP-GOBLIN'S ARCADE) ====================

   Data for the pot: what falls, what it is worth, and what the goblin will
   sell you to make catching it easier. The loop is in src/pot.js.

   The pot used to be a minute of catching drips into a jar with no way to get
   better at it and nothing to decide. It is a game now, and the shape of that
   game is three things, all of them here rather than in code:

     1. two currencies — BREW fills the meter that pays the campaign, HONEY is
        the pot's own money and buys the upgrades below
     2. a hazard worth avoiding — bees crack the jar, and three cracks end the
        session with whatever you have banked
     3. an escalation — the longer you stay in, the faster and meaner it gets,
        so staying is a decision rather than a formality

   None of it accrues while the app is closed. The company is the only system
   paid for time away (see CLAUDE.md); the pot pays for attention.
============================================================================ */

/* What falls. `weight` is the base spawn share and `lateWeight` is where it
   ends up at full escalation, so the mix shifts toward the dangerous end the
   longer a session runs rather than simply speeding up. */
export const Drops = [
  {
    id:'drip', color:'#ff7a2f', r:8, brew:3, honey:1, score:2,
    weight:0.60, lateWeight:0.34, vy:[0.10,0.15]
  },
  {
    id:'gold', color:'#fff02f', r:11, brew:8, honey:4, score:6,
    weight:0.14, lateWeight:0.16, vy:[0.12,0.17], sound:'goldDrip'
  },
  {
    // Worth the most and falls fastest — the one you have to decide whether to
    // cross the board for, which is the only real decision in a catching game.
    id:'comb', color:'#c9ff2f', r:13, brew:12, honey:7, score:12,
    weight:0.06, lateWeight:0.12, vy:[0.20,0.26], sound:'harvest'
  },
  {
    id:'bee', color:'#0c0a15', stripe:'#fff02f', r:9, hazard:true,
    brew:-7, honey:0, score:0, crack:1,
    weight:0.20, lateWeight:0.30, vy:[0.13,0.19], sound:'beeBuzz'
  },
  {
    // Late-session only: the goblin escalating, as he does.
    id:'wasp', color:'#1a1522', stripe:'#ff2f9e', r:10, hazard:true,
    brew:-12, honey:0, score:0, crack:1,
    weight:0.00, lateWeight:0.08, vy:[0.22,0.30], sound:'beeBuzz'
  }
];

/* The goblin's shop, bought with honey, kept across a run. Every one of these
   changes how the board plays rather than how much it pays — an upgrade that
   only multiplies the payout is a number, not a decision. */
export const PotUpgrades = [
  { id:'wide',   name:'WIDER JAR',   glyph:'🫙', max:4, base:12, step:1.7,
    desc:'+7px of jar per level' },
  { id:'slow',   name:'THICK AIR',   glyph:'🌫️', max:3, base:18, step:1.9,
    desc:'everything falls 9% slower' },
  { id:'magnet', name:'STICKY RIM',  glyph:'🧲', max:3, base:22, step:2.0,
    desc:'catches from 7px further out' },
  { id:'mesh',   name:'BEE MESH',    glyph:'🕸️', max:2, base:26, step:2.2,
    desc:'stings cost half, and no crack' },
  { id:'rich',   name:'RICH SYRUP',  glyph:'🍯', max:3, base:20, step:2.0,
    desc:'+25% brew from every catch' },
  { id:'panes',  name:'SPARE PANES', glyph:'🩹', max:2, base:30, step:2.4,
    desc:'+1 crack before the jar goes' }
];

/* Session shape. A session escalates over ESCALATE_MS toward the `late`
   figures and then stays there, so a long session is dangerous rather than
   impossible — the jar is what ends it, not a timer. */
export const POT = {
  W: 400, H: 300,
  JAR_Y: 258, JAR_HALF: 34, JAR_LIP: 0,
  CRACKS: 3,
  SPAWN_MS: [560, 900],        // interval at the start of a session
  SPAWN_MS_LATE: [240, 420],   // interval at full escalation
  ESCALATE_MS: 75000,
  // Consecutive good catches multiply honey only. Brew is the campaign's
  // currency and must not be combo-scaled, or the pot becomes the fastest way
  // to play the Artificer's game and stops being a distraction from it.
  COMBO_STEP: 0.12,
  COMBO_CAP: 2.5,
  HARVEST_XP: 40
};

export const dropById = id => Drops.find(d => d.id === id);
export const upgradeById = id => PotUpgrades.find(u => u.id === id);

export function upgradeCost(u, level){
  return Math.round(u.base * Math.pow(u.step, level));
}

/* The spawn table at a given point in a session, 0..1 escalated. Returned as
   cumulative weights so the caller rolls once. */
export function spawnTable(t){
  const k = Math.max(0, Math.min(1, t));
  const rows = Drops.map(d => ({ d, w: d.weight + (d.lateWeight - d.weight) * k }));
  const total = rows.reduce((s, r) => s + r.w, 0) || 1;
  let acc = 0;
  return rows.map(r => { acc += r.w / total; return { d: r.d, upto: acc }; });
}
