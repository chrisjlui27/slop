/* ============================== SAVE ==============================

   The original build had no save system on purpose: a run was a session, and
   that held up fine in a browser tab. It does not survive the move to an
   installed Android app. Android kills backgrounded processes on its own
   schedule, so "close the app for a phone call" and "throw away an hour of
   progress" were the same gesture. The canon was amended rather than worked
   around — see CLAUDE.md.

   What is saved is a BETWEEN-ROUNDS snapshot, never a live round. Lanes,
   the running microgame, the defense lane's in-flight blobs and the pot
   minigame are all deliberately absent: serialising a half-played trial would
   mean every microgame had to describe its own state, which is exactly the
   burden the chassis exists to keep off module authors. Resuming therefore
   replays the round you were in. Losing at most one trial is a fair price for
   modules staying as careless as they are allowed to be.

   The economy keeps running while you are away in only one direction: it does
   not. Time-based state (the GLAZED buff, the buddy's hunger clock, ambient
   bark timers) is intentionally not restored — an offline buddy that starved
   for nine hours is a punishment for closing the app, and the Artificer would
   not have shipped that. */

const KEY = 'slop.save.v1';
const VERSION = 1;

/* localStorage is not merely "sometimes empty" — reading the property itself
   throws in a Chrome profile with cookies blocked, so every access is guarded
   rather than null-checked. A phone that cannot save still plays; it just
   plays the way the game originally did. */
function store(){
  try{
    const s = window.localStorage;
    const probe = '__slop__';
    s.setItem(probe, '1'); s.removeItem(probe);
    return s;
  }catch(e){ return null; }
}

export const Save = {
  available(){ return store() !== null; },

  /* A plain field copy rather than a generic walk of the Game object: the
     explicit list is the schema, and anything added to the chassis is absent
     from saves until someone adds it here on purpose. That is the intended
     failure mode — a forgotten field resets, it does not corrupt. */
  snapshot(g){
    return {
      v: VERSION,
      savedAt: Date.now(),
      score: g.score, round: g.round, combo: g.combo, goo: g.goo,
      history: g.history.slice(-6),
      meter: g.meter, megaPending: g.megaPending,
      chaosLevel: g.chaosLevel,
      actIdx: g.actIdx, actRound: g.actRound, ngPlus: g.ngPlus,
      standing: Object.assign({}, g.standing),
      hero: Object.assign({}, g.hero),
      buddy: { level: g.buddy.level, feeds: g.buddy.feeds },
      turret: Object.assign({}, g.turret),
      // The perimeter persists, minus everything in flight. Towers and
      // integrity are what the player built and what they owe; the enemies on
      // the board are not, and restoring a half-finished wave would mean
      // resuming into an ambush nobody chose to walk into.
      perimeter: g.defense.perimeter,
      wave: g.defense.wave,
      breaches: g.defense.breaches,
      towers: g.defense.pads.map(p => p.tower
        ? { typeId: p.tower.typeId, level: p.tower.level }
        : null),
      shopLevels: Object.assign({}, g.shopLevels),
      pot: { brew: g.pot.brew, brewMax: g.pot.brewMax },
      // Boss HP is the one mid-encounter value worth keeping: losing it would
      // hand back a full-health gate to a player who had nearly cleared it.
      boss: g.boss ? Object.assign({}, g.boss) : null,
      codexSeen: g.codexSeen.slice()
    };
  },

  write(g){
    const s = store(); if(!s) return false;
    try{ s.setItem(KEY, JSON.stringify(this.snapshot(g))); return true; }
    catch(e){ return false; }   // quota, or a profile that revoked access mid-run
  },

  read(){
    const s = store(); if(!s) return null;
    try{
      const raw = s.getItem(KEY); if(!raw) return null;
      const data = JSON.parse(raw);
      // A save from a future or prehistoric schema is discarded rather than
      // migrated. There is no long-term progression to protect, so the honest
      // move is a clean run, not a guess at what the fields used to mean.
      if(!data || data.v !== VERSION) return null;
      return data;
    }catch(e){ return null; }
  },

  clear(){
    const s = store(); if(!s) return;
    try{ s.removeItem(KEY); }catch(e){}
  },

  /* Restores onto a Game that has already been reset by start(), so anything
     this does not touch is guaranteed to hold a clean initial value rather
     than a leftover from the previous run. */
  apply(g, d){
    g.score = d.score|0; g.round = d.round|0; g.combo = d.combo|0; g.goo = d.goo|0;
    g.history = Array.isArray(d.history) ? d.history.slice() : [];
    g.meter = d.meter||0; g.megaPending = !!d.megaPending;
    g.chaosLevel = [0,1,2].indexOf(d.chaosLevel) >= 0 ? d.chaosLevel : 1;
    g.actIdx = d.actIdx|0; g.actRound = d.actRound|0; g.ngPlus = d.ngPlus|0;
    // Keys are taken from the live object, not the save, so a patron added
    // after this save was written starts at 0 rather than arriving undefined.
    Object.keys(g.standing).forEach(id=>{
      const v = d.standing ? d.standing[id] : 0;
      g.standing[id] = Math.max(0, Math.min(100, v || 0));
    });
    if(d.hero) Object.assign(g.hero, d.hero);
    if(d.buddy){ g.buddy.level = d.buddy.level||1; g.buddy.feeds = d.buddy.feeds||0; }
    if(d.turret) Object.assign(g.turret, d.turret);
    g.shopLevels = Object.assign({}, d.shopLevels||{});
    if(d.pot){ g.pot.brew = d.pot.brew||0; g.pot.brewMax = d.pot.brewMax||100; }
    g.boss = d.boss || null;
    g.codexSeen = Array.isArray(d.codexSeen) ? d.codexSeen.slice() : [];

    // The board comes back empty and the wave restarts from its beginning —
    // see the snapshot comment. Integrity and breach count carry, because
    // those are the consequences the player earned.
    if(typeof d.perimeter === 'number'){
      g.defense.perimeter = Math.max(1, Math.min(g.defense.perimeterMax, d.perimeter));
    }
    g.defense.wave = Math.max(0, d.wave|0);
    g.defense.breaches = Math.max(0, d.breaches|0);
    if(Array.isArray(d.towers)){
      // Cleared first: Defense.reset() seeds a free tower, and layering a save
      // over it would resurrect one the player had deliberately salvaged.
      g.defense.pads.forEach(p => { p.tower = null; });
      d.towers.forEach((t, i)=>{
        if(!t || !g.defense.pads[i]) return;
        g.defense.pads[i].tower = { typeId: t.typeId, level: Math.max(1, t.level|0), fireT: 0 };
      });
    }
  },

  /* A one-line description of a save, for the resume button on the title
     screen. The player should know what they are walking back into before
     they commit to it. */
  describe(d){
    const act = ['I','II','III','IV','V'][d.actIdx] || String(d.actIdx+1);
    const ng = d.ngPlus ? ' · NG+' + d.ngPlus : '';
    return 'ACT ' + act + ' · RD ' + d.round + ' · LV ' + (d.hero ? d.hero.level : 1) + ng;
  }
};
