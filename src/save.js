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
export function store(){
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
      // What the line has decided, not the board those decisions produced —
      // the extra pads and the raised integrity are replayed from these on
      // load, so there is one source of truth for the shape of the board.
      doctrine: g.defense.doctrine.slice(),
      wave: g.defense.wave,
      breaches: g.defense.breaches,
      towers: g.defense.pads.map(p => p.tower
        ? { typeId: p.tower.typeId, level: p.tower.level }
        : null),
      /* The company, including the wall-clock stamp that makes offline pay
         possible. This is the one field in the whole schema that exists to
         measure time the app was NOT running — everywhere else time-based
         state is frozen on purpose (see the header). `lastAt` is advanced by
         the live tick, so the gap on resume is time nobody was watching. */
      company: {
        members: Object.assign({}, g.understudy.members),
        lastAt: g.understudy.lastAt,
        lifetimeGoo: g.understudy.lifetimeGoo,
        lifetimeXp: g.understudy.lifetimeXp,
        /* A running show and the shelf of shows already closed. The show is
           stored as its start stamp and its length rather than an end stamp:
           an end stamp is one number a hand-edited save can drag into the
           past, and this way the only thing worth editing is a start, which
           apply() refuses to believe if it is in the future. */
        production: g.understudy.production
          ? Object.assign({}, g.understudy.production)
          : null,
        staged: g.understudy.staged.slice()
      },
      /* The archive, minus the bout. The deck and the shelf are what the
         player built and beat; a half-played duel is in-flight state in the
         same sense as the perimeter's wave, and resuming into someone else's
         turn three is worse than starting the fight again for free. */
      archive: {
        deck: g.archive.deck.slice(),
        cleared: g.archive.cleared.slice(),
        // The second axis: relics held, cards struck out, and how far up the
        // endless ladder this run has got.
        relics: g.archive.relics.slice(),
        purges: g.archive.purges,
        tier: g.archive.tier,
        bestTier: g.archive.bestTier
      },
      /* The patch bay is stars and a crawlspace count, never a board: boards
         regenerate from their seed, so the same panel comes back without the
         save having to describe forty-nine tiles. */
      bay: {
        stars: Object.assign({}, g.bay.stars),
        crawl: g.bay.crawl
      },
      shopLevels: Object.assign({}, g.shopLevels),
      /* The pot, minus the session. Honey and the upgrades bought with it are
         what the player built; a half-played session is in-flight state like
         the perimeter's wave, and three cracks into a jar is not somewhere to
         be resumed. */
      pot: {
        brew: g.pot.brew, brewMax: g.pot.brewMax,
        honey: g.pot.honey, lifetimeHoney: g.pot.lifetimeHoney,
        upgrades: Object.assign({}, g.pot.upgrades),
        best: g.pot.best
      },
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
    /* Unknown card ids are dropped rather than trusted: a save edited by hand
       or written by an older build must not be able to put a card in the deck
       that no resolver knows how to play. Same for the shelf. */
    if(d.archive){
      const known = id => g.archiveApi.cardById(id);
      const isBuild = id => g.archiveApi.buildById(id);
      if(Array.isArray(d.archive.deck) && d.archive.deck.length){
        g.archive.deck = d.archive.deck.filter(known);
      }
      if(Array.isArray(d.archive.cleared)){
        g.archive.cleared = d.archive.cleared.filter(isBuild);
      }
      if(Array.isArray(d.archive.relics)){
        g.archive.relics = d.archive.relics.filter(id => g.archiveApi.relicById(id));
      }
      g.archive.purges = Math.max(0, d.archive.purges|0);
      g.archive.tier = Math.max(1, d.archive.tier|0 || 1);
      g.archive.bestTier = Math.max(0, d.archive.bestTier|0);
      g.archive.bout = null;
    }
    /* Stars are checked against the live racks: a key for a rack that no
       longer exists, a level past its rack's end, or a star count outside 1..3
       is dropped, so an edited save cannot open THE CORE by writing a number. */
    if(d.bay){
      g.bay.stars = {};
      const racks = g.bayApi.Racks;
      if(d.bay.stars && typeof d.bay.stars === 'object') Object.keys(d.bay.stars).forEach(k=>{
        const [id, lvl] = k.split(':');
        const rack = racks.find(r => r.id === id);
        const level = Number(lvl), n = d.bay.stars[k]|0;
        if(rack && Number.isInteger(level) && level >= 0 && level < rack.levels && n >= 1 && n <= 3){
          g.bay.stars[k] = n;
        }
      });
      g.bay.crawl = Math.max(0, d.bay.crawl|0);
      g.bay.board = null;
    }
    g.shopLevels = Object.assign({}, d.shopLevels||{});
    if(d.pot){
      g.pot.brew = d.pot.brew||0; g.pot.brewMax = d.pot.brewMax||100;
      g.pot.honey = Math.max(0, d.pot.honey|0);
      g.pot.lifetimeHoney = Math.max(0, d.pot.lifetimeHoney|0);
      g.pot.best = Math.max(0, d.pot.best|0);
      // Levels are clamped against the live catalogue, so a hand-edited save
      // cannot buy a level nine WIDER JAR and a board with no game in it.
      g.pot.upgrades = {};
      if(d.pot.upgrades) g.potApi.PotUpgrades.forEach(u=>{
        const lvl = Math.max(0, Math.min(u.max, d.pot.upgrades[u.id]|0));
        if(lvl) g.pot.upgrades[u.id] = lvl;
      });
      g.pot.session = null;
    }
    g.boss = d.boss || null;
    g.codexSeen = Array.isArray(d.codexSeen) ? d.codexSeen.slice() : [];

    // The board comes back empty and the wave restarts from its beginning —
    // see the snapshot comment. Integrity and breach count carry, because
    // those are the consequences the player earned.
    if(Array.isArray(d.doctrine)){
      d.doctrine.forEach(id=>{
        const doc = g.defenseApi.doctrineById(id);
        if(!doc || g.defense.doctrine.indexOf(id) >= 0) return;
        g.defense.doctrine.push(id);
        g.defenseApi.applyDoctrine(g, doc);
      });
    }
    if(typeof d.perimeter === 'number'){
      g.defense.perimeter = Math.max(1, Math.min(g.defense.perimeterMax, d.perimeter));
    }
    g.defense.wave = Math.max(0, d.wave|0);
    g.defense.breaches = Math.max(0, d.breaches|0);
    if(d.company){
      const c = d.company;
      if(c.members && typeof c.members === 'object'){
        g.understudy.members = Object.assign({}, c.members);
      }
      // A missing or absurd stamp becomes "now", which pays nothing. Trusting
      // it blindly would let a hand-edited save mint unlimited goo.
      const t = Number(c.lastAt);
      g.understudy.lastAt = (isFinite(t) && t > 0 && t <= Date.now()) ? t : Date.now();
      g.understudy.lifetimeGoo = Math.max(0, c.lifetimeGoo || 0);
      g.understudy.lifetimeXp = Math.max(0, c.lifetimeXp || 0);
      g.understudy.staged = Array.isArray(c.staged)
        ? c.staged.filter(id => g.understudyApi.productionById(id))
        : [];
      g.understudy.production = null;
      if(c.production){
        const p = g.understudyApi.productionById(c.production.id);
        const started = Number(c.production.startedAt);
        // Same rule as lastAt: a start in the future is a wound-back clock or
        // an edited save, and the answer is "it started now" rather than
        // "it finished already".
        if(p && isFinite(started) && started > 0){
          g.understudy.production = {
            id: p.id,
            startedAt: Math.min(started, Date.now()),
            // Length comes from the catalogue, never from the save.
            durationMs: p.minutes * 60000
          };
        }
      }
    }

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
