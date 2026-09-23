/* ==================== THE COMPANY ====================

   THE UNDERSTUDY's loop: an idle layer that earns while you play and, uniquely
   in this codebase, while you do not.

   How it differs from the other loops:

   - **It is the one place offline time pays.** Every other time-based system
     is deliberately frozen across a session (see src/save.js): a buddy that
     starved for nine hours would punish someone for closing the app. The
     company inverts that on purpose — they were rehearsing, and they have
     something to show you when you come back.
   - **It has no board and no input during play.** There is nothing to react
     to. The only decisions are which of the company to recruit and how deeply
     to invest, made in a menu, at whatever pace you like.
   - **It cannot be lost.** The Crab owns the only losable stake in the game;
     the Understudy owns its gentlest system, and that contrast is the point.

   `lastAt` is the whole trick. It is advanced every live tick and written into
   the save, so the gap between it and `Date.now()` is exactly the time nobody
   was watching — no double counting when the app was merely open and idle.
====================================================== */

import { Sound } from "./audio.js";
import { FX } from "./fx.js";
import {
  Company, OFFLINE_CAP_MS, OFFLINE_RATE, memberRate, memberUpgradeCost,
  Productions, PRODUCTION_BONUS, STAGING_RATE, productionById
} from "./content/understudy.js";

const byId = id => Company.find(m => m.id === id);

export const Understudy = {
  Company, OFFLINE_CAP_MS, OFFLINE_RATE, Productions, productionById,

  reset(){
    return {
      // id -> level. The Understudy themself is always in the company; the
      // rest are recruited.
      members: { understudy: 1 },
      lastAt: Date.now(),
      // Fractional carry. Rates are a few hundredths of a goo per second, so
      // rounding every frame would floor to zero and the layer would earn
      // nothing at all.
      accGoo: 0, accXp: 0,
      lifetimeGoo: 0, lifetimeXp: 0,
      pendingReport: null,
      // The show currently running, and every distinct one ever closed.
      production: null,          // { id, startedAt, durationMs }
      staged: []
    };
  },

  /* ---------------- rates ---------------- */

  /* Per second, live. Off-hours apply OFFLINE_RATE on top at payout. Standing
     is folded in here rather than at payout so every readout in the UI already
     reflects it. */
  rates(g){
    const u = g.understudy;
    let goo = 0, xp = 0;
    Object.keys(u.members).forEach(id => {
      const m = byId(id); if(!m) return;
      const lvl = u.members[id];
      goo += memberRate(m.goo, lvl);
      xp  += memberRate(m.xp, lvl);
    });
    // Standing, the permanent bonus every closed show leaves behind, and the
    // halving while a show is running — all folded in here so every readout in
    // the UI already reflects them and none of them can disagree.
    const bonus = g.favorIdleBonus()
      * (1 + PRODUCTION_BONUS * u.staged.length)
      * (u.production ? STAGING_RATE : 1);
    return { goo: goo * bonus, xp: xp * bonus };
  },

  /* ---------------- productions ---------------- */

  // Unlocked in order, and each one needs a cast big enough to put it on. The
  // two gates are different on purpose: the order is the ladder, the cast size
  // is what makes recruiting mean something beyond a bigger number.
  productionUnlocked(g, id){
    const i = Productions.findIndex(p => p.id === id);
    if(i < 0) return false;
    if(i > 0 && g.understudy.staged.indexOf(Productions[i-1].id) < 0) return false;
    return Object.keys(g.understudy.members).length >= Productions[i].members;
  },
  productionDone(g, id){ return g.understudy.staged.indexOf(id) >= 0; },

  stage(g, id){
    const u = g.understudy;
    const p = productionById(id);
    if(!p || u.production || !this.productionUnlocked(g, id)) return false;
    if(g.goo < p.cost){ Sound.deny(); return false; }
    g.goo -= p.cost;
    u.production = { id, startedAt: Date.now(), durationMs: p.minutes * 60000 };
    g.shiftFavor('understudy', 3);
    Sound.understudyJoin();
    FX.stamp(p.name, '#7a3cff', '#c9ff2f');
    g.updateHUD();
    return true;
  },

  /* Remaining milliseconds, or 0 when the show has closed. Derived from the
     start stamp rather than stored as an end stamp: an end stamp is a single
     number a hand-edited save can move, and this way the only thing worth
     editing is the start, which src/save.js already refuses to believe if it
     is in the future. */
  productionLeft(g){
    const p = g.understudy.production;
    if(!p) return 0;
    return Math.max(0, (p.startedAt + p.durationMs) - Date.now());
  },
  productionReady(g){ return !!g.understudy.production && this.productionLeft(g) <= 0; },

  /* Closing night. Pays through the chassis' own paths so multipliers and the
     level ladder behave exactly as they do everywhere else, and marks the
     production as staged so the permanent bonus counts it once. */
  collect(g){
    const u = g.understudy;
    if(!this.productionReady(g)) return null;
    const p = productionById(u.production.id);
    u.production = null;
    if(!p) return null;
    if(u.staged.indexOf(p.id) < 0) u.staged.push(p.id);
    u.lifetimeGoo += p.pay.goo;
    u.lifetimeXp += p.pay.xp;
    g.addGoo(p.pay.goo);
    g.gainXp(p.pay.xp);
    g.shiftFavor('understudy', p.pay.standing);
    Sound.rehearsalReport();
    FX.stamp(p.name + ' CLOSES', '#7a3cff', '#fff02f');
    g.updateHUD();
    return p;
  },

  offlineCapMs(g){
    const u = g.understudy;
    let bonusH = 0;
    Object.keys(u.members).forEach(id => {
      const m = byId(id);
      if(m && m.capBonusH) bonusH += m.capBonusH * u.members[id];
    });
    return OFFLINE_CAP_MS + bonusH * 3600 * 1000;
  },

  /* ---------------- costs ---------------- */

  has(g, id){ return !!g.understudy.members[id]; },
  levelOf(g, id){ return g.understudy.members[id] || 0; },
  recruitCost(g, id){ const m = byId(id); return m ? m.cost : Infinity; },
  upgradeCost(g, id){
    const m = byId(id); if(!m) return Infinity;
    return memberUpgradeCost(m.cost, this.levelOf(g, id));
  },

  /* ---------------- actions ---------------- */

  recruit(g, id){
    const m = byId(id);
    if(!m || this.has(g, id)) return false;
    const cost = this.recruitCost(g, id);
    if(g.goo < cost){ Sound.deny(); return false; }
    g.goo -= cost;
    g.understudy.members[id] = 1;
    g.shiftFavor('understudy', 5);
    Sound.understudyJoin();
    FX.stamp(m.name + ' JOINS', m.color, '#7a3cff');
    g.updateHUD();
    return true;
  },

  upgradeMember(g, id){
    if(!this.has(g, id)) return false;
    const cost = this.upgradeCost(g, id);
    if(g.goo < cost){ Sound.deny(); return false; }
    g.goo -= cost;
    g.understudy.members[id]++;
    g.shiftFavor('understudy', 3);
    Sound.upgrade();
    g.updateHUD();
    return true;
  },

  /* ---------------- the loop ---------------- */

  tick(g, dt){
    const u = g.understudy;
    if(!u || !u.members) return;
    u.lastAt = Date.now();

    const r = this.rates(g);
    u.accGoo += r.goo * (dt / 1000);
    u.accXp  += r.xp  * (dt / 1000);

    // Flushed only at whole units, so the fractional carry survives between
    // frames and small rates still accumulate.
    if(u.accGoo >= 1){
      const n = Math.floor(u.accGoo);
      u.accGoo -= n;
      u.lifetimeGoo += n;
      g.addGoo(n);
    }
    if(u.accXp >= 1){
      const n = Math.floor(u.accXp);
      u.accXp -= n;
      u.lifetimeXp += n;
      g.gainXp(n);
    }
  },

  /* Called once on resume, after the save has been applied. Returns the report
     so the caller can announce it, or null when nothing meaningful accrued. */
  applyOffline(g){
    const u = g.understudy;
    if(!u || !u.lastAt) return null;

    const cap = this.offlineCapMs(g);
    const raw = Date.now() - u.lastAt;
    // A negative gap means the device clock moved backwards — a timezone
    // change, or a user setting the clock. Treated as no time passed rather
    // than trusted, since the alternative is a system that can be farmed by
    // changing the date.
    const away = Math.max(0, Math.min(raw, cap));
    u.lastAt = Date.now();

    // Under a minute is not a session away, it is a reload.
    if(away < 60000) return null;

    const r = this.rates(g);
    const secs = away / 1000;
    const goo = Math.floor(r.goo * secs * OFFLINE_RATE);
    const xp  = Math.floor(r.xp  * secs * OFFLINE_RATE);
    if(goo <= 0 && xp <= 0) return null;

    u.lifetimeGoo += goo;
    u.lifetimeXp += xp;
    if(goo > 0) g.addGoo(goo);
    if(xp > 0) g.gainXp(xp);

    const report = { ms: away, goo, xp, capped: raw > cap };
    u.pendingReport = report;
    return report;
  },

  /* "3h 20m" — the report is a sentence the Understudy says, so the duration
     has to read as one. */
  formatDuration(ms){
    const mins = Math.round(ms / 60000);
    if(mins < 60) return mins + 'm';
    const h = Math.floor(mins / 60), m = mins % 60;
    return m ? h + 'h ' + m + 'm' : h + 'h';
  }
};
