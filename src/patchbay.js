/* ==================== THE PATCH BAY ====================

   THE ARTIFICER's routing puzzle: the sixth loop, and the only one whose verb
   is thinking. Data — racks, pay, par thresholds — is in
   src/content/patchbay.js; this is the generator and the rules.

   How a board is made, because it is the whole guarantee:

     1. a random spanning tree is grown over the grid from the core, so every
        tile is reachable and there is exactly one path between any two
     2. each tile's shape is the set of edges the tree gave it
     3. every tile is turned a random number of quarter-turns

   The board was solved before step 3, so it is always solvable, and the
   fewest clockwise turns back to that solution is par. Nothing about it is
   hand-made and nothing about it needs to be.

   Boards come from a seeded generator (rack, level), so a panel is the same
   panel on every phone and the same panel after the app has been killed —
   the save only has to remember stars, never a board.

   What it is not: it cannot be lost, it has no clock, and it pays nothing for
   time away. It is a loop you can put down mid-panel and pick up tomorrow
   exactly where the goblin left it.
====================================================== */

import { Sound } from "./audio.js";
import {
  Racks, CRAWLSPACE, STAR_PAR, Systems, N, E, S, W, rackById
} from "./content/patchbay.js";

/* mulberry32: small, fast, and identical on every JS engine, which is the
   only property that matters here — a seed has to mean the same board on a
   phone as it does in the test suite. */
function rng(seed){
  let a = seed >>> 0;
  return function(){
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// One quarter-turn clockwise: N→E→S→W→N.
export const turn = m => ((m << 1) | (m >> 3)) & 15;
const turnBy = (m, k) => { for(let i=0;i<(k&3);i++) m = turn(m); return m; };
const OPP = { [N]:S, [E]:W, [S]:N, [W]:E };
const DIRS = [N, E, S, W];

export const PatchBay = {
  Racks, CRAWLSPACE, rackById, turn,

  reset(){
    return {
      stars: {},        // levelKey -> best stars (1..3)
      crawl: 0,         // crawlspace boards cleared
      board: null
    };
  },

  key(rackId, level){ return rackId + ':' + level; },

  /* ---------------- generation ---------------- */

  seedFor(rackId, level){
    // Rack ids hashed rather than indexed, so inserting a rack later does not
    // silently re-deal every board after it.
    let h = 2166136261;
    const s = rackId + '#' + level;
    for(let i=0;i<s.length;i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  },

  neighbour(b, i, dir){
    const x = i % b.w, y = Math.floor(i / b.w);
    let nx = x, ny = y;
    if(dir === N) ny--; else if(dir === S) ny++; else if(dir === E) nx++; else nx--;
    if(b.wrap){ nx = (nx + b.w) % b.w; ny = (ny + b.h) % b.h; }
    else if(nx < 0 || ny < 0 || nx >= b.w || ny >= b.h) return -1;
    return ny * b.w + nx;
  },

  generate(rackId, level){
    const rack = rackById(rackId);
    if(!rack) return null;
    const r = rng(this.seedFor(rackId, level));
    const w = rack.w, h = rack.h, n = w*h;
    const b = { rackId, level, w, h, wrap: !!rack.wrap, cells: [], core: 0, turns: 0, par: 0, solved: false };
    for(let i=0;i<n;i++) b.cells.push({ base:0, rot:0, locked:false, glyph:'' });

    // The core sits at the middle of the panel, where the eye starts.
    b.core = Math.floor(h/2) * w + Math.floor(w/2);

    /* Randomised Prim's over the grid. Prim's rather than a depth-first walk
       because DFS grows long corridors, and a panel of corridors is a panel of
       straights — the least interesting tile there is. */
    const inTree = new Uint8Array(n);
    inTree[b.core] = 1;
    const frontier = [];
    const addFrontier = i => DIRS.forEach(d => {
      const j = this.neighbour(b, i, d);
      if(j >= 0 && !inTree[j]) frontier.push([i, d, j]);
    });
    addFrontier(b.core);
    while(frontier.length){
      const k = Math.floor(r() * frontier.length);
      const [i, d, j] = frontier[k];
      frontier[k] = frontier[frontier.length-1]; frontier.pop();
      if(inTree[j]) continue;
      // A 1-wide wrap board can offer the same cell both ways round; one
      // cable between two tiles is enough.
      if(i === j) continue;
      inTree[j] = 1;
      b.cells[i].base |= d;
      b.cells[j].base |= OPP[d];
      addFrontier(j);
    }

    // Leaves are the systems waiting for power.
    b.cells.forEach((c, i) => {
      if(i !== b.core && [N,E,S,W].filter(d => c.base & d).length === 1){
        c.glyph = Systems[Math.floor(r() * Systems.length)];
      }
    });

    // Bolted-down anchors, then the scramble. A board that happens to come
    // out of the scramble already solved is scrambled again: a panel you have
    // won before touching it is a bug with a star rating.
    const lockable = b.cells.map((c, i) => i).filter(i => i !== b.core);
    const locks = Math.round(lockable.length * (rack.locks || 0));
    for(let k=0;k<locks;k++){
      const pick = Math.floor(r() * lockable.length);
      b.cells[lockable[pick]].locked = true;
      lockable.splice(pick, 1);
    }
    for(let tries=0; tries<8; tries++){
      b.cells.forEach(c => { c.rot = c.locked ? 0 : Math.floor(r() * 4); });
      if(!this.isSolved(b)) break;
    }
    b.par = this.parOf(b);
    return b;
  },

  /* ---------------- reading a board ---------------- */

  maskOf(c){ return turnBy(c.base, c.rot); },

  /* Everything reachable from the core along cables that meet — a cable into
     a tile that has no cable back is a dead end, not a connection. */
  lit(b){
    const on = new Uint8Array(b.cells.length);
    const stack = [b.core];
    on[b.core] = 1;
    while(stack.length){
      const i = stack.pop();
      const m = this.maskOf(b.cells[i]);
      DIRS.forEach(d => {
        if(!(m & d)) return;
        const j = this.neighbour(b, i, d);
        if(j < 0 || on[j]) return;
        if(this.maskOf(b.cells[j]) & OPP[d]){ on[j] = 1; stack.push(j); }
      });
    }
    return on;
  },

  /* Solved means every tile has power and no cable points at nothing. The
     second half matters: a board can light every tile while a stub still
     hangs off an edge, and that is not a routed panel. Any configuration that
     meets both counts — par measures turns, it does not own the answer. */
  isSolved(b){
    const on = this.lit(b);
    for(let i=0;i<b.cells.length;i++){
      if(!on[i]) return false;
      const m = this.maskOf(b.cells[i]);
      for(const d of DIRS){
        if(!(m & d)) continue;
        const j = this.neighbour(b, i, d);
        if(j < 0) return false;
        if(!(this.maskOf(b.cells[j]) & OPP[d])) return false;
      }
    }
    return true;
  },

  // Fewest clockwise taps from where each tile is to a matching orientation of
  // its solved shape. Symmetry is why this is a search and not 4-rot: a
  // straight is solved at two rotations and a cross at all four.
  parOf(b){
    let par = 0;
    b.cells.forEach(c => {
      for(let k=0;k<4;k++){
        if(turnBy(c.base, c.rot + k) === c.base){ par += k; return; }
      }
    });
    return par;
  },

  starsFor(b){
    if(!b.solved) return 0;
    const par = Math.max(1, b.par);
    if(b.turns <= par * STAR_PAR[0]) return 3;
    if(b.turns <= Math.ceil(par * STAR_PAR[1])) return 2;
    return 1;
  },

  /* ---------------- playing a board ---------------- */

  open(g, rackId, level){
    if(rackId !== CRAWLSPACE.id && !this.rackOpen(g, rackId)) return null;
    const b = this.generate(rackId, level);
    g.bay.board = b;
    return b;
  },

  tap(g, i){
    const b = g.bay.board;
    if(!b || b.solved) return false;
    const c = b.cells[i];
    if(!c || c.locked || i === b.core) return false;
    c.rot = (c.rot + 1) & 3;
    b.turns++;
    Sound.cardPlay();
    if(this.isSolved(b)){ b.solved = true; Sound.archiveWin(); }
    return true;
  },

  // Back to the scramble it was dealt, turns and all. Regenerated from the
  // seed rather than remembered, which is the same board by construction.
  restart(g){
    const b = g.bay.board;
    if(!b) return null;
    return this.open(g, b.rackId, b.level);
  },

  /* ---------------- progress ---------------- */

  starsOf(g, rackId, level){ return g.bay.stars[this.key(rackId, level)] || 0; },
  totalStars(g){ return Object.values(g.bay.stars).reduce((s, n) => s + (n|0), 0); },
  rackOpen(g, rackId){
    const rack = Racks.find(r => r.id === rackId);
    return !!rack && this.totalStars(g) >= rack.need;
  },
  rackDone(g, rackId){
    const rack = Racks.find(r => r.id === rackId);
    if(!rack) return false;
    for(let l=0;l<rack.levels;l++) if(!this.starsOf(g, rackId, l)) return false;
    return true;
  },
  crawlOpen(g){ return this.rackDone(g, Racks[Racks.length-1].id); },

  // The first level in a rack without a star, so the shelf can offer "the
  // next one" rather than making the player find it.
  nextLevel(g, rackId){
    const rack = Racks.find(r => r.id === rackId);
    if(!rack) return 0;
    for(let l=0;l<rack.levels;l++) if(!this.starsOf(g, rackId, l)) return l;
    return 0;
  },

  /* Pays through the chassis on a solved board. A first clear pays the rack's
     rate; improving to three stars later pays half of it again, once. Nothing
     else pays twice, so replaying a solved panel is for the stars alone. */
  claim(g){
    const b = g.bay.board;
    if(!b || !b.solved || b.claimed) return null;
    b.claimed = true;
    const stars = this.starsFor(b);

    if(b.rackId === CRAWLSPACE.id){
      g.bay.crawl++;
      return { goo: CRAWLSPACE.pay.goo, xp: CRAWLSPACE.pay.xp, stars, first: true, crawl: true };
    }
    const rack = Racks.find(r => r.id === b.rackId);
    const k = this.key(b.rackId, b.level);
    const before = g.bay.stars[k] || 0;
    let goo = 0, xp = 0;
    if(before === 0){ goo += rack.pay.goo; xp += rack.pay.xp; }
    if(stars === 3 && before < 3){ goo += Math.round(rack.pay.goo * 0.5); xp += Math.round(rack.pay.xp * 0.5); }
    if(stars > before) g.bay.stars[k] = stars;
    return { goo, xp, stars, first: before === 0, better: stars > before };
  }
};
