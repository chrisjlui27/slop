/* ==================== THE HONEY POT ====================

   SLOP-GOBLIN's arcade loop, extracted out of the chassis when it stopped
   being a distraction and became a game. Data — what falls, what it pays, what
   the goblin sells — is in src/content/pot.js.

   What makes it a game rather than a minigame:

   - **Two currencies.** BREW fills the meter the campaign cares about and is
     cashed in by HARVEST for goo, XP and the GLAZED buff. HONEY is the pot's
     own money and buys the upgrades, which change how the board plays. Brew
     leaves the pot; honey never does.
   - **A stake inside its own economy.** Bees crack the jar and three cracks
     end the session. You keep every drop of brew and honey already banked, so
     the loss is the session, never the run — the perimeter is still the only
     loop that can take something off you (see CLAUDE.md).
   - **An escalation.** The mix shifts toward hazards and the spawn rate climbs
     over about a minute of play, so "one more catch" is a decision with a
     downside instead of free.

   Time away pays nothing here. The brew trickle and the session clock run on
   the live rAF loop only; the company remains the sole system credited for a
   closed app.
======================================================================== */

import { Sound } from "./audio.js";
import { FX } from "./fx.js";
import {
  Drops, PotUpgrades, POT, dropById, upgradeById, upgradeCost, spawnTable
} from "./content/pot.js";

export const Pot = {
  Drops, PotUpgrades, POT, upgradeById,

  reset(){
    return {
      brew:0, brewMax:100,
      honey:0, lifetimeHoney:0,
      upgrades:{},           // id -> level
      best:0,                // best single-session honey, for the codex
      session:null
    };
  },

  /* ---------------- upgrades ---------------- */

  levelOf(g, id){ return g.pot.upgrades[id] || 0; },
  costOf(g, id){
    const u = upgradeById(id); if(!u) return Infinity;
    const lvl = this.levelOf(g, id);
    return lvl >= u.max ? Infinity : upgradeCost(u, lvl);
  },
  buy(g, id){
    const cost = this.costOf(g, id);
    if(!isFinite(cost) || g.pot.honey < cost) return false;
    g.pot.honey -= cost;
    g.pot.upgrades[id] = this.levelOf(g, id) + 1;
    Sound.upgrade();
    return true;
  },

  // Everything the upgrades change, resolved in one place so the board and the
  // shop can never disagree about what a level is worth.
  mods(g){
    return {
      halfWidth: POT.JAR_HALF + 7 * this.levelOf(g,'wide'),
      fallScale: Math.pow(0.91, this.levelOf(g,'slow')),
      reach: 7 * this.levelOf(g,'magnet'),
      stingScale: this.levelOf(g,'mesh') ? 0.5 : 1,
      stingCracks: this.levelOf(g,'mesh') >= 1 ? 0 : 1,
      brewScale: 1 + 0.25 * this.levelOf(g,'rich'),
      cracks: POT.CRACKS + this.levelOf(g,'panes')
    };
  },

  /* ---------------- a session ---------------- */

  open(g){
    const m = this.mods(g);
    g.pot.session = {
      drops:[], spawnT:400, jarX:POT.W/2,
      elapsed:0, combo:0, cracks:0, cracksMax:m.cracks,
      banked:0, caught:0, missed:0, over:false,
      flash:'',
      bubbles:Array.from({length:7},()=>({
        x:Math.random()*POT.W, y:POT.H-20+Math.random()*20,
        r:3+Math.random()*4, speed:0.01+Math.random()*0.02
      }))
    };
    return g.pot.session;
  },

  close(g){
    const s = g.pot.session;
    if(s && s.banked > g.pot.best) g.pot.best = s.banked;
    g.pot.session = null;
  },

  // How far into the escalation a session is, 0..1.
  heat(s){ return Math.max(0, Math.min(1, s.elapsed / POT.ESCALATE_MS)); },

  tick(g, dt){
    const s = g.pot.session; if(!s) return;
    const m = this.mods(g);
    s.bubbles.forEach(b=>{
      b.y -= b.speed*dt;
      if(b.y < -10){ b.y = POT.H - 10; b.x = Math.random()*POT.W; }
    });
    if(s.over) return;

    s.elapsed += dt;
    const k = this.heat(s);
    const lerp = (a,b)=> a + (b-a)*k;

    s.spawnT -= dt;
    if(s.spawnT <= 0){
      const lo = lerp(POT.SPAWN_MS[0], POT.SPAWN_MS_LATE[0]);
      const hi = lerp(POT.SPAWN_MS[1], POT.SPAWN_MS_LATE[1]);
      s.spawnT = lo + Math.random()*(hi-lo);
      const table = spawnTable(k);
      const roll = Math.random();
      const def = (table.find(r => roll <= r.upto) || table[table.length-1]).d;
      s.drops.push({
        id: def.id, x: 24 + Math.random()*(POT.W-48), y:-12,
        vy: (def.vy[0] + Math.random()*(def.vy[1]-def.vy[0])) * m.fallScale,
        caught:false
      });
    }

    const catchY = POT.JAR_Y;
    s.drops.forEach(d=>{
      if(d.caught) return;
      const def = dropById(d.id);
      const wasAbove = d.y < catchY;
      d.y += d.vy*dt;
      if(!wasAbove || d.y < catchY) return;
      if(Math.abs(d.x - s.jarX) > m.halfWidth + m.reach + def.r*0.5){
        // A miss only matters for the readout — the jar is the stake, not the
        // drop. Missing a bee is the correct play and must never be punished.
        if(!def.hazard) s.missed++;
        return;
      }
      d.caught = true;
      def.hazard ? this.sting(g, s, def, m) : this.collect(g, s, def, m);
    });
    s.drops = s.drops.filter(d => !d.caught && d.y < POT.H + 20);
  },

  collect(g, s, def, m){
    s.combo++;
    s.caught++;
    const mult = Math.min(POT.COMBO_CAP, 1 + s.combo*POT.COMBO_STEP);
    const honey = Math.max(1, Math.round(def.honey * mult));
    g.pot.honey += honey;
    g.pot.lifetimeHoney += honey;
    s.banked += honey;
    g.pot.brew = Math.min(g.pot.brewMax, g.pot.brew + def.brew * m.brewScale);
    g.score += def.score;
    s.flash = '+' + honey + ' honey' + (s.combo > 3 ? '  x' + mult.toFixed(1) : '');
    Sound[def.sound || 'drip']();
  },

  sting(g, s, def, m){
    s.combo = 0;
    g.pot.brew = Math.max(0, g.pot.brew + def.brew * m.stingScale);
    s.cracks += (def.crack || 1) * m.stingCracks;
    s.flash = m.stingCracks ? 'CRACK' : 'mesh held';
    Sound[def.sound || 'beeBuzz']();
    if(s.cracks >= s.cracksMax){
      s.over = true;
      s.flash = 'the jar gives out. you keep the honey';
      Sound.crunch();
    }
  },

  // Pointer x in board space. Clamped to the board rather than to the jar's
  // centre so a wide jar can still reach the edges.
  aim(g, x){
    const s = g.pot.session; if(!s) return;
    s.jarX = Math.max(10, Math.min(POT.W-10, x));
  },

  /* ---------------- harvest ---------------- */

  ready(g){ return g.pot.brew >= g.pot.brewMax; },

  /* Cashing the meter in. This is the pot's only outward payment and the one
     moment the campaign notices it exists. */
  harvest(g){
    if(!this.ready(g)){ Sound.deny(); return null; }
    const lump = 30 + Math.round(g.round*1.5);
    g.score += lump*2;
    g.addGoo(lump);
    g.pot.brew = 0;
    g.potBuffT = 10000;
    g.gainXp(POT.HARVEST_XP);
    Sound.harvest();
    return { lump };
  },

  /* ---------------- render ---------------- */

  render(g, c){
    const s = g.pot.session; if(!s || !c) return;
    const m = this.mods(g);
    c.clearRect(0,0,POT.W,POT.H);
    c.fillStyle='#150f22'; c.fillRect(0,0,POT.W,POT.H);

    // The heat haze: the board itself reddens as the session escalates, so the
    // thing getting more dangerous is visible without reading a number.
    const k = this.heat(s);
    if(k > 0){
      c.fillStyle='rgba(255,47,158,'+(0.03 + k*0.10).toFixed(3)+')';
      c.fillRect(0,0,POT.W,POT.H);
    }

    s.bubbles.forEach(b=>{
      c.beginPath(); c.arc(b.x,b.y,b.r,0,Math.PI*2);
      c.fillStyle='rgba(255,240,47,0.12)'; c.fill();
    });

    s.drops.forEach(d=>{
      const def = dropById(d.id);
      c.beginPath(); c.arc(d.x, d.y, def.r, 0, Math.PI*2);
      c.fillStyle = def.color; c.fill();
      if(def.stripe){ c.fillStyle = def.stripe; c.fillRect(d.x-def.r+1, d.y-2, def.r*2-2, 4); }
    });

    // The jar. Cracks show on it rather than in a counter somewhere else.
    const half = m.halfWidth;
    c.fillStyle = s.over ? '#4a2036' : '#2fe1ff';
    c.fillRect(s.jarX-half, POT.JAR_Y-8, half*2, 26);
    c.fillStyle='#0c0a15';
    for(let i=0;i<s.cracks;i++){
      const cx = s.jarX - half + 10 + i*((half*2-16)/Math.max(1,s.cracksMax-1));
      c.fillRect(cx, POT.JAR_Y-6, 3, 20);
    }
    if(m.reach > 0){
      c.strokeStyle='rgba(47,225,255,0.35)'; c.lineWidth=2;
      c.strokeRect(s.jarX-half-m.reach, POT.JAR_Y-10, (half+m.reach)*2, 30);
    }
  }
};
