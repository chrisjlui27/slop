/* ==================== THE LEDGER ====================

   Cross-run memory. Everything else in this codebase is scoped to a single
   run: `Save` snapshots one campaign and `start()` wipes it. The ledger is the
   one record that survives, which is why it lives under its own storage key
   rather than inside the save — clearing a run must not clear the history of
   having played.

   It counts total acts cleared rather than runs completed. A player who keeps
   stalling in Act VI has cleared a great many gates and finished nothing, and
   they are precisely who this is for.

   Reads are defensive to the point of paranoia because this is durable state a
   user can hand-edit: a corrupt ledger must degrade to "no boons" rather than
   to a broken boot.
==================================================== */

import { store } from "./save.js";
import { Boons, BoonLines } from "./content/ledger.js";

const LEDGER_KEY = 'slop.ledger.v1';
const LEDGER_VERSION = 1;

const blank = () => ({ v: LEDGER_VERSION, runs: 0, actsCleared: 0, bestAct: 0, bestNg: 0, seen: [] });

export const Ledger = {
  Boons, BoonLines,

  read(){
    const s = store();
    if(!s) return blank();
    try{
      const raw = s.getItem(LEDGER_KEY);
      if(!raw) return blank();
      const d = JSON.parse(raw);
      if(!d || d.v !== LEDGER_VERSION) return blank();
      return {
        v: LEDGER_VERSION,
        runs: Math.max(0, d.runs|0),
        actsCleared: Math.max(0, d.actsCleared|0),
        bestAct: Math.max(0, d.bestAct|0),
        bestNg: Math.max(0, d.bestNg|0),
        seen: Array.isArray(d.seen) ? d.seen.filter(x => typeof x === 'string') : []
      };
    }catch(e){ return blank(); }
  },

  write(l){
    const s = store();
    if(!s) return false;
    try{ s.setItem(LEDGER_KEY, JSON.stringify(l)); return true; }
    catch(e){ return false; }
  },

  clear(){
    const s = store();
    if(!s) return;
    try{ s.removeItem(LEDGER_KEY); }catch(e){}
  },

  /* ---------------- recording ---------------- */

  /* Called on every gate brought down, final or not. A run that ends in Act VI
     still contributed five gates to the record. */
  recordActCleared(g){
    const l = this.read();
    l.actsCleared++;
    l.bestAct = Math.max(l.bestAct, g.actIdx + 1);
    l.bestNg = Math.max(l.bestNg, g.ngPlus);
    this.write(l);
    return l;
  },

  recordVictory(g){
    const l = this.read();
    l.runs++;
    l.bestNg = Math.max(l.bestNg, g.ngPlus);
    this.write(l);
    return l;
  },

  /* ---------------- boons ---------------- */

  earned(l){ return Boons.filter(b => (l || this.read()).actsCleared >= b.at); },

  /* The next one still to come, for the title screen. Being able to see what
     you are working toward is most of the point of a meta layer. */
  next(l){
    const rec = l || this.read();
    return Boons.find(b => rec.actsCleared < b.at) || null;
  },

  /* Applied once at the start of every run, after resetState has cleared the
     board. Returns the boons the player has not been told about yet, so the
     caller can have the Artificer introduce them rather than silently
     buffing the run. */
  applyBoons(g){
    const l = this.read();
    const earned = this.earned(l);
    const fresh = [];
    earned.forEach(b => {
      // A boon that throws must not take the run's first frame with it; the
      // player loses that one bonus and nothing else.
      try{ b.apply(g); }catch(e){ console.error('boon failed ('+b.id+'):', e); }
      if(l.seen.indexOf(b.id) === -1){ l.seen.push(b.id); fresh.push(b); }
    });
    if(fresh.length) this.write(l);
    return { earned, fresh, ledger: l };
  },

  /* One line for the title screen. Null when there is no history worth
     showing — a first-time player should not be handed an empty scoreboard. */
  describe(l){
    const rec = l || this.read();
    if(!rec.actsCleared && !rec.runs) return null;
    const bits = [];
    bits.push(rec.actsCleared + (rec.actsCleared === 1 ? ' gate' : ' gates'));
    if(rec.runs) bits.push(rec.runs + (rec.runs === 1 ? ' run shipped' : ' runs shipped'));
    const n = this.earned(rec).length;
    if(n) bits.push(n + (n === 1 ? ' boon' : ' boons'));
    return 'THE LEDGER · ' + bits.join(' · ');
  }
};
