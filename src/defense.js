/* ==================== THE PERIMETER ====================

   THE CRAB's loop: a tower defense that runs continuously, in the background,
   whether or not anyone is looking at it.

   Two views of one board. `renderStrip` draws the 640x80 lane wedged into the
   HUD; `renderBoard` draws the same state large enough to play on. Positions
   are stored once in board space (content/defense.js BOARD) and scaled per
   view, so the two can never disagree about where anything is.

   Three things make this different from the lane it replaces:

   1. It keeps running. Waves arrive on the rAF loop during menus, during the
      honey pot, during a microgame. Ignoring the perimeter is a decision with
      a consequence, not an absence of one.
   2. Placement matters. Nine pads, and the two rows that cover two corridors
      at once are the ones furthest from the breach.
   3. It can be lost. Leaks eat perimeter integrity and at zero the run pays
      for it. This is the only losable stake in SLOP, and it is deliberately
      confined to the Crab's own economy — the Act ladder still cannot be
      failed. See CLAUDE.md.
========================================================== */

import { Sound } from "./audio.js";
import { FX } from "./fx.js";
import {
  BOARD, CORRIDOR_Y, PAD_Y, PAD_X, PAD_R, BREACH_X,
  TowerTypes, EnemyTypes, waveComposition, waveHpMult, spawnGap, waveRest
} from "./content/defense.js";

const typeById = id => TowerTypes.find(t => t.id === id);

export const Defense = {
  BOARD, TowerTypes, EnemyTypes,

  /* ---------------- geometry ---------------- */

  padCount(){ return PAD_Y.length * PAD_X.length; },
  padPos(i){
    return { x: PAD_X[i % PAD_X.length], y: PAD_Y[Math.floor(i / PAD_X.length)] };
  },

  /* ---------------- state ---------------- */

  reset(){
    const pads = [];
    for(let i = 0; i < this.padCount(); i++) pads.push({ tower: null });
    const d = {
      perimeter: 100, perimeterMax: 100,
      wave: 0, queue: [], spawnT: 0, restT: 4000, waveLeaks: 0, breaches: 0,
      enemies: [], projectiles: [], blasts: [],
      selectedPad: -1,
      pads
    };
    // One free CLACKER, mid-board. The lane this replaced had a turret from
    // the first frame, and a perimeter that starts undefended reads as broken
    // rather than as a challenge.
    pads[4].tower = { typeId: 'clacker', level: 1, fireT: 0 };
    return d;
  },

  /* Rebuilt from the shop rather than saved, exactly as the old turret list
     was: SECOND TURRET is a derived fact, and storing it twice invites the two
     copies to disagree. */
  applyShop(g){
    const d = g.defense;
    if(g.shopLevels.secondturret && !d.pads[3].tower){
      d.pads[3].tower = { typeId: 'clacker', level: 1, fireT: 0 };
    }
  },

  /* ---------------- costs ---------------- */

  buildCost(g, typeId){
    const t = typeById(typeId);
    if(!t) return Infinity;
    // Each tower already standing raises the price of the next, so a perimeter
    // is a running cost rather than a one-off purchase, and goo spent here is
    // felt in the Workshop.
    const built = g.defense.pads.filter(p => p.tower).length;
    return Math.round(t.cost * Math.pow(1.18, Math.max(0, built - 1)));
  },
  upgradeCost(g, padIdx){
    const pad = g.defense.pads[padIdx];
    if(!pad || !pad.tower) return Infinity;
    const t = typeById(pad.tower.typeId);
    return Math.round(t.cost * 0.8 * Math.pow(1.75, pad.tower.level - 1));
  },
  sellValue(g, padIdx){
    const pad = g.defense.pads[padIdx];
    if(!pad || !pad.tower) return 0;
    const t = typeById(pad.tower.typeId);
    return Math.round(t.cost * 0.45 * pad.tower.level);
  },

  /* ---------------- tower stats ----------------
     Global reinforcement (g.turret) multiplies every tower; the type supplies
     the character. Keeping the two separate is what lets the REINFORCE button
     stay meaningful once there are nine towers rather than one. */

  towerStats(g, tower){
    const t = typeById(tower.typeId);
    const lvl = tower.level;
    const moodFactor = { happy:0.85, neutral:1, grumpy:1.2, feral:1.5 }[g.buddy.mood] || 1;
    const rushBoost = (g.mutator && g.mutator.id === 'rush') ? 0.75 : 1;
    return {
      type: t,
      dmg: g.turret.dmg * t.dmgMult * (1 + (lvl - 1) * 0.6) * g.favorDefenseBonus(),
      // The buddy's mood still throttles fire rate. That coupling is the
      // Goblin's and predates the Crab; he has opinions about it.
      interval: g.turret.fireInterval * t.intervalMult * moodFactor * rushBoost,
      range: t.range * (1 + (lvl - 1) * 0.10),
      splash: t.splash,
      slow: t.slow
    };
  },

  /* ---------------- actions ---------------- */

  build(g, padIdx, typeId){
    const d = g.defense, pad = d.pads[padIdx];
    if(!pad || pad.tower) return false;
    const cost = this.buildCost(g, typeId);
    if(g.goo < cost){ Sound.deny(); return false; }
    g.goo -= cost;
    pad.tower = { typeId, level: 1, fireT: 0 };
    g.shiftFavor('crab', 4);
    Sound.crabBuild();
    g.updateHUD();
    return true;
  },

  upgradeTower(g, padIdx){
    const pad = g.defense.pads[padIdx];
    if(!pad || !pad.tower) return false;
    const cost = this.upgradeCost(g, padIdx);
    if(g.goo < cost){ Sound.deny(); return false; }
    g.goo -= cost;
    pad.tower.level++;
    g.shiftFavor('crab', 3);
    Sound.upgrade();
    g.updateHUD();
    return true;
  },

  sellTower(g, padIdx){
    const pad = g.defense.pads[padIdx];
    if(!pad || !pad.tower) return false;
    g.addGoo(this.sellValue(g, padIdx));
    pad.tower = null;
    // Selling is not treachery, but it is not help either.
    g.shiftFavor('crab', -2);
    Sound.select();
    g.updateHUD();
    return true;
  },

  /* ---------------- the loop ----------------
     Runs every frame from Game.loop regardless of state. */

  tick(g, dt){
    const d = g.defense;
    if(!d || !d.pads) return;

    this.updateWave(g, d, dt);
    this.moveEnemies(g, d, dt);
    this.fireTowers(g, d, dt);

    d.projectiles.forEach(p => { p.t += dt; });
    d.projectiles = d.projectiles.filter(p => p.t < 140);
    d.blasts.forEach(b => { b.t += dt; });
    d.blasts = d.blasts.filter(b => b.t < 260);
  },

  updateWave(g, d, dt){
    if(d.queue.length){
      d.spawnT -= dt;
      if(d.spawnT <= 0){
        d.spawnT = spawnGap(d.wave);
        this.spawn(g, d, d.queue.shift());
      }
      return;
    }
    // A wave is only over once the board is clear, so a straggler cannot be
    // outrun by the next wave's timer.
    if(d.enemies.length) return;

    d.restT -= dt;
    if(d.restT > 0) return;
    if(d.wave > 0) this.completeWave(g, d);
    d.wave++;
    d.queue = waveComposition(d.wave);
    d.waveLeaks = 0;
    d.spawnT = 0;
    d.restT = waveRest(d.wave);
  },

  spawn(g, d, typeId, atX, atLane){
    const t = EnemyTypes[typeId];
    if(!t) return;
    const lane = atLane != null ? atLane : Math.floor(Math.random() * CORRIDOR_Y.length);
    // Hard cap. A backlog of enemies during a long unattended stretch should
    // cost integrity, not framerate.
    if(d.enemies.length > 60) return;
    d.enemies.push({
      typeId, lane,
      x: atX != null ? atX : BOARD.w + 14 + Math.random() * 40,
      hp: t.hp * waveHpMult(d.wave),
      maxHp: t.hp * waveHpMult(d.wave),
      slowT: 0, slowAmt: 0,
      wobble: Math.random() * 10
    });
  },

  moveEnemies(g, d, dt){
    const jitter = (g.mutator && g.mutator.id === 'quake') ? 1.6 : 1;
    for(const en of d.enemies){
      const t = EnemyTypes[en.typeId];
      if(en.slowT > 0){ en.slowT -= dt; } else { en.slowAmt = 0; }
      en.x -= t.speed * dt * jitter * (1 - en.slowAmt);
    }
    const through = d.enemies.filter(en => en.x <= BREACH_X);
    if(through.length){
      d.enemies = d.enemies.filter(en => en.x > BREACH_X);
      let bite = 0;
      through.forEach(en => { bite += EnemyTypes[en.typeId].breach; });
      d.waveLeaks += through.length;
      d.perimeter -= bite;
      Sound.leak();
      if(d.perimeter <= 0) this.breach(g, d);
    }
  },

  fireTowers(g, d, dt){
    const extraTargets = g.shopLevels.splash ? 1 : 0;
    d.pads.forEach((pad, i) => {
      if(!pad.tower) return;
      const tw = pad.tower;
      tw.fireT -= dt;
      if(tw.fireT > 0) return;

      const s = this.towerStats(g, tw);
      const p = this.padPos(i);

      // Target the enemy nearest the breach — anything else lets a leader walk
      // through while the tower fusses over something that just arrived.
      let best = null, bestX = Infinity;
      for(const en of d.enemies){
        const ey = CORRIDOR_Y[en.lane];
        if(Math.hypot(en.x - p.x, ey - p.y) > s.range) continue;
        if(en.x < bestX){ bestX = en.x; best = en; }
      }
      if(!best){ tw.fireT = 120; return; }   // idle poll, not a full cooldown

      tw.fireT = s.interval;
      const targets = [best];
      if(s.splash > 0){
        for(const en of d.enemies){
          if(en === best) continue;
          const ey = CORRIDOR_Y[en.lane];
          if(Math.hypot(en.x - best.x, ey - CORRIDOR_Y[best.lane]) <= s.splash) targets.push(en);
        }
        d.blasts.push({ x: best.x, y: CORRIDOR_Y[best.lane], r: s.splash, t: 0, color: s.type.color });
      } else if(extraTargets){
        for(const en of d.enemies){
          if(targets.length > extraTargets) break;
          if(en === best) continue;
          const ey = CORRIDOR_Y[en.lane];
          if(Math.hypot(en.x - p.x, ey - p.y) <= s.range) targets.push(en);
        }
      }

      d.projectiles.push({ x1: p.x, y1: p.y, x2: best.x, y2: CORRIDOR_Y[best.lane], t: 0, color: s.type.color });
      Sound.turretFire();

      targets.forEach(en => {
        if(s.slow > 0){ en.slowAmt = Math.max(en.slowAmt, s.slow); en.slowT = 900; }
        en.hp -= s.dmg;
        if(en.hp <= 0) this.kill(g, d, en);
      });
      d.enemies = d.enemies.filter(en => en.hp > 0);
    });
  },

  kill(g, d, en){
    const t = EnemyTypes[en.typeId];
    g.addGoo(t.goo * g.gooMult() * g.comboGooMult());
    g.buddy.hunger = Math.min(1, g.buddy.hunger + 0.03);
    if(t.splits){
      for(let i = 0; i < (t.splitCount || 2); i++){
        this.spawn(g, d, t.splits, en.x + (i - 0.5) * 18, en.lane);
      }
    }
    Sound.pop(false);
    g.updateHUD();
  },

  completeWave(g, d){
    // Clean waves restore real integrity; leaky ones barely patch it. That gap
    // is what makes paying attention worth anything.
    const clean = d.waveLeaks === 0;
    d.perimeter = Math.min(d.perimeterMax, d.perimeter + (clean ? 14 : 5));
    g.addGoo((4 + d.wave) * g.gooMult());
    g.shiftFavor('crab', clean ? 2.5 : 1);
    Sound.waveClear();
    if(clean && d.wave % 3 === 0) FX.stamp('LINE HELD', '#ff7a2f', '#2fe1ff');
    g.updateHUD();
  },

  breach(g, d){
    d.breaches++;
    // The only real loss in the game, and it is kept inside the Crab's own
    // economy: goo, integrity and his regard. The Act ladder is untouched,
    // because the Artificer removed death and that has not been reversed.
    // A share of goo, but capped. A never-tended perimeter settles into
    // breaching about once a wave, and a pure percentage made that a tax that
    // grew with your wealth — so the richer you got, the more an optional loop
    // charged you for ignoring it. The cap keeps a breach meaningful when you
    // are poor and survivable when you are not.
    const lost = Math.min(Math.round(g.goo * 0.18), 20 + d.wave * 3);
    g.goo = Math.max(0, g.goo - lost);
    d.perimeter = Math.round(d.perimeterMax * 0.5);

    // The wave is over — they are through, there is nothing left to hold — and
    // the line re-forms before the next one. Without this a breach was not an
    // event but a treadmill: integrity reset to half, the same unstoppable wave
    // was still on the board, and the next breach followed a wave later. The
    // pause is what converts an unattended perimeter from a running tax into an
    // occasional, survivable cost.
    d.enemies = [];
    d.queue = [];
    d.restT = 9000;
    g.shiftFavor('crab', -8);
    Sound.crabBreach();
    FX.shake(true); FX.chroma();
    FX.stamp('BREACH', '#ff7a2f', '#ff2f9e');
    g.say('crab', d.breaches === 1
      ? 'it is in. i said it would be in. i am not going to enjoy this'
      : 'that is ' + d.breaches + '. i have stopped counting out loud for your sake', true);
    g.updateHUD();
  },

  /* ---------------- input ---------------- */

  /* Board taps select a pad; the build menu is DOM, not canvas, so it can have
     real 48px buttons instead of hit-tested rectangles. */
  boardTap(g, x, y){
    const d = g.defense;
    for(let i = 0; i < d.pads.length; i++){
      const p = this.padPos(i);
      if(Math.hypot(x - p.x, y - p.y) <= PAD_R + 8){
        d.selectedPad = (d.selectedPad === i) ? -1 : i;
        Sound.select();
        return i;
      }
    }
    d.selectedPad = -1;
    return -1;
  },

  /* Strip taps still pop blobs by hand, which is how the lane has always
     worked and the fastest way to earn the Crab's regard early. */
  stripTap(g, x, y){
    const d = g.defense;
    const bx = x * (BOARD.w / 640);
    const by = y * (BOARD.h / 80);
    for(const en of d.enemies){
      const t = EnemyTypes[en.typeId];
      const ey = CORRIDOR_Y[en.lane];
      if(Math.hypot(bx - en.x, by - ey) <= t.r + 26){
        en.hp -= Math.max(2, g.turret.dmg * 2);
        if(en.hp <= 0){
          this.kill(g, d, en);
          d.enemies = d.enemies.filter(e => e.hp > 0);
          g.score += 5;
          g.shiftFavor('crab', 0.4);
          Sound.pop(true);
          if(Math.random() < 0.25) FX.stamp('POP!', '#ff7a2f', '#c9ff2f');
        } else {
          Sound.tap();
        }
        g.updateHUD();
        return true;
      }
    }
    return false;
  },

  /* ---------------- rendering ---------------- */

  renderStrip(g, c){
    const d = g.defense;
    c.clearRect(0, 0, 640, 80);
    if(!d || !d.pads) return;

    const sx = bx => bx * (640 / BOARD.w);
    const sy = by => 10 + (by / BOARD.h) * 66;

    // Integrity reads across the top of the strip, so the state of the
    // perimeter is visible without opening it.
    const frac = Math.max(0, d.perimeter) / d.perimeterMax;
    c.fillStyle = '#1a1018';
    c.fillRect(0, 0, 640, 5);
    c.fillStyle = frac > 0.5 ? '#ff7a2f' : (frac > 0.25 ? '#fff02f' : '#ff2f9e');
    c.fillRect(0, 0, 640 * frac, 5);

    c.strokeStyle = '#3a2417'; c.lineWidth = 1;
    CORRIDOR_Y.forEach(cy => {
      c.beginPath(); c.moveTo(0, sy(cy)); c.lineTo(640, sy(cy)); c.stroke();
    });

    // The breach edge. Brightens as integrity falls.
    c.fillStyle = frac > 0.35 ? '#4a2a18' : '#ff2f9e';
    c.fillRect(0, 8, 3, 70);

    d.pads.forEach((pad, i) => {
      if(!pad.tower) return;
      const p = this.padPos(i), t = typeById(pad.tower.typeId);
      c.fillStyle = t.color;
      c.beginPath(); c.arc(sx(p.x), sy(p.y), 4, 0, Math.PI * 2); c.fill();
    });

    d.projectiles.forEach(p => {
      c.strokeStyle = p.color || '#fff02f'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(sx(p.x1), sy(p.y1)); c.lineTo(sx(p.x2), sy(p.y2)); c.stroke();
    });

    d.enemies.forEach(en => {
      const t = EnemyTypes[en.typeId];
      c.fillStyle = t.color;
      c.beginPath(); c.arc(sx(en.x), sy(CORRIDOR_Y[en.lane]), Math.max(2, t.r * 0.42), 0, Math.PI * 2); c.fill();
    });
  },

  renderBoard(g, c){
    const d = g.defense;
    c.clearRect(0, 0, BOARD.w, BOARD.h);
    if(!d || !d.pads) return;

    // Corridors, drawn as bands so the play space reads as three routes rather
    // than three lines.
    CORRIDOR_Y.forEach(cy => {
      c.fillStyle = 'rgba(255,122,47,0.05)';
      c.fillRect(0, cy - 26, BOARD.w, 52);
      c.strokeStyle = '#3a2417'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(0, cy); c.lineTo(BOARD.w, cy); c.stroke();
    });

    // The breach wall.
    const frac = Math.max(0, d.perimeter) / d.perimeterMax;
    // Gradients are the one 2D-context feature this file needs that a stubbed
    // or partial context may not provide (jsdom's, for one). Falling back to a
    // flat fill keeps the board renderable anywhere rather than making the
    // wall a hard dependency on a complete canvas implementation.
    const grad = c.createLinearGradient && c.createLinearGradient(0, 0, 60, 0);
    if(grad && grad.addColorStop){
      grad.addColorStop(0, frac > 0.35 ? 'rgba(255,122,47,0.5)' : 'rgba(255,47,158,0.6)');
      grad.addColorStop(1, 'rgba(255,122,47,0)');
      c.fillStyle = grad;
    } else {
      c.fillStyle = frac > 0.35 ? 'rgba(255,122,47,0.28)' : 'rgba(255,47,158,0.32)';
    }
    c.fillRect(0, 0, 60, BOARD.h);
    c.fillStyle = frac > 0.35 ? '#ff7a2f' : '#ff2f9e';
    c.fillRect(0, 0, 5, BOARD.h);

    // Pads.
    d.pads.forEach((pad, i) => {
      const p = this.padPos(i);
      const selected = d.selectedPad === i;

      if(pad.tower){
        const t = typeById(pad.tower.typeId);
        const s = this.towerStats(g, pad.tower);
        if(selected){
          c.fillStyle = 'rgba(255,255,255,0.05)';
          c.beginPath(); c.arc(p.x, p.y, s.range, 0, Math.PI * 2); c.fill();
          c.strokeStyle = t.color; c.lineWidth = 1;
          c.beginPath(); c.arc(p.x, p.y, s.range, 0, Math.PI * 2); c.stroke();
        }
        c.fillStyle = '#15111f';
        c.beginPath(); c.arc(p.x, p.y, PAD_R, 0, Math.PI * 2); c.fill();
        c.strokeStyle = t.color; c.lineWidth = selected ? 3 : 2;
        c.beginPath(); c.arc(p.x, p.y, PAD_R, 0, Math.PI * 2); c.stroke();
        c.font = '26px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(t.glyph, p.x, p.y + 1);
        // Level pips, so a reinforced tower is legible at a glance.
        for(let k = 0; k < pad.tower.level; k++){
          c.fillStyle = t.color;
          c.beginPath(); c.arc(p.x - 12 + k * 8, p.y + PAD_R - 5, 2.5, 0, Math.PI * 2); c.fill();
        }
      } else {
        c.setLineDash([5, 5]);
        c.strokeStyle = selected ? '#ff7a2f' : '#332742';
        c.lineWidth = selected ? 3 : 2;
        c.beginPath(); c.arc(p.x, p.y, PAD_R, 0, Math.PI * 2); c.stroke();
        c.setLineDash([]);
        c.fillStyle = selected ? '#ff7a2f' : '#40324f';
        c.font = '20px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText('+', p.x, p.y + 1);
      }
    });

    d.blasts.forEach(b => {
      const k = b.t / 260;
      c.strokeStyle = b.color; c.globalAlpha = 1 - k; c.lineWidth = 2;
      c.beginPath(); c.arc(b.x, b.y, b.r * (0.4 + k * 0.8), 0, Math.PI * 2); c.stroke();
      c.globalAlpha = 1;
    });

    d.projectiles.forEach(p => {
      c.strokeStyle = p.color || '#fff02f'; c.lineWidth = 2;
      c.globalAlpha = 1 - (p.t / 140);
      c.beginPath(); c.moveTo(p.x1, p.y1); c.lineTo(p.x2, p.y2); c.stroke();
      c.globalAlpha = 1;
    });

    d.enemies.forEach(en => {
      const t = EnemyTypes[en.typeId];
      const y = CORRIDOR_Y[en.lane] + Math.sin((en.x + en.wobble) * 0.06) * 5;
      c.fillStyle = t.color;
      c.beginPath(); c.arc(en.x, y, t.r, 0, Math.PI * 2); c.fill();
      if(en.slowAmt > 0){
        c.strokeStyle = '#2fe1ff'; c.lineWidth = 2;
        c.beginPath(); c.arc(en.x, y, t.r + 3, 0, Math.PI * 2); c.stroke();
      }
      // Health only shown once something has taken a hit — a board of full
      // bars is noise.
      if(en.hp < en.maxHp){
        const w = t.r * 2;
        c.fillStyle = '#0c0a15'; c.fillRect(en.x - t.r, y - t.r - 8, w, 3);
        c.fillStyle = '#c9ff2f'; c.fillRect(en.x - t.r, y - t.r - 8, w * (en.hp / en.maxHp), 3);
      }
    });
  }
};
