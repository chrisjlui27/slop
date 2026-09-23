/* ==================== THE PATCH BAY (THE SIXTH LOOP) ====================

   Data for the routing puzzle. The loop is in src/patchbay.js.

   Canon: SLOP-GOBLIN wired every system in this game into every other one
   — the buddy into the turret, the turret into the pot, the pot into the
   plot — and he calls it interoperability. THE ARTIFICER's answer is the
   patch bay: the panel behind the game where every system draws power from
   his core, and where he routes the cables back to where they belong, one
   tile at a time. The goblin re-patches it whenever nobody is looking. That
   is why there is always another panel.

   The verb is the one the other five loops do not have: thinking. There is
   no clock, no draw, no spawn table and nothing that can be lost. A board is
   generated from a seed, so it is the same board for everyone and the same
   board when you come back to it, and it is always solvable because it was
   built solved and then scrambled.
========================================================================== */

/* Racks, in the order they are opened. Stars unlock the next rack, not
   clears: a player who scrapes through every panel on four stars' worth of
   extra turns has not learned the thing the next rack assumes.

   Each gate is set just under two stars a panel across everything before it.
   The first pass asked for nearly two and a half at the top, which meant a
   player routing every panel competently on two stars could never see THE
   CORE — a gate that shuts out the competent is a wall, not a ladder.

     w, h     board size in tiles
     wrap     cables may leave one edge and arrive at the opposite one
     locks    share of tiles bolted down in their solved orientation — an
              anchor on a big board, not a gift
     pay      goo and XP on a first clear; a first three-star clear pays
              half as much again */
export const Racks = [
  { id:'front',  name:'THE FRONT PANEL', w:4, h:4, wrap:false, locks:0,    levels:5, need:0,
    pay:{ goo:14, xp:8 },  desc:'the part a visitor would see. four by four' },
  { id:'back',   name:'THE BACK PANEL',  w:5, h:5, wrap:false, locks:0,    levels:5, need:8,
    pay:{ goo:20, xp:11 }, desc:'the part a visitor should not see' },
  { id:'riser',  name:'THE RISER',       w:5, h:6, wrap:false, locks:0.06, levels:5, need:18,
    pay:{ goo:26, xp:14 }, desc:'taller than it is wide. so was the problem' },
  { id:'loop',   name:'THE LOOPBACK',    w:5, h:5, wrap:true,  locks:0.06, levels:5, need:28,
    pay:{ goo:32, xp:17 }, desc:'cables leave one edge and come back on the other' },
  { id:'main',   name:'THE MAIN BUS',    w:6, h:6, wrap:true,  locks:0.08, levels:5, need:38,
    pay:{ goo:40, xp:21 }, desc:'everything passes through here. everything' },
  { id:'core',   name:'THE CORE',        w:7, h:7, wrap:true,  locks:0.10, levels:5, need:48,
    pay:{ goo:52, xp:26 }, desc:'the artificer’s own panel. he would like it back' }
];

/* Past the sixth rack: the goblin's re-patching, forever. The same generator
   at the core's size, one seed after another, paying less than a rack does —
   it is there for a player who wants another board, not for a farm. */
export const CRAWLSPACE = {
  id:'crawl', name:'THE CRAWLSPACE', w:7, h:7, wrap:true, locks:0.08,
  pay:{ goo:22, xp:10 }, desc:'where he goes to undo your work. it does not end'
};

/* Stars come from turns taken against par, where par is the fewest clockwise
   turns that reach the generated solution. A board can have other solutions
   and they count — par is a yardstick, not the answer key. */
export const STAR_PAR = [1.0, 1.6];     // <= par*1.0 → 3★, <= par*1.6 → 2★, else 1★

/* The systems at the ends of the cables. A leaf tile — one connection —
   wears one of these, so the board reads as the thing it is: every loop in
   the game, waiting for power. Assigned by seed, so a board always looks the
   same. */
export const Systems = ['👾','🦀','🍯','🎭','🗃️','🧙','🛒','🎲','🐝','📖','🔊','🧱'];

/* Direction bits. A tile is the OR of the edges it has a cable on. */
export const N = 1;
export const E = 2;
export const S = 4;
export const W = 8;

export const rackById = id => Racks.find(r => r.id === id) || (id === CRAWLSPACE.id ? CRAWLSPACE : null);
