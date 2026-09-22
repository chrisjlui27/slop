/* ==================== THE ARCHIVE ====================

   The fifth loop: a turn-based card duel against the versions of this game
   that never shipped. Data — cards, builds, payouts — is in
   src/content/archive.js; this is the rules engine, and src/game.js owns only
   the door and the screen.

   How it differs from the other four:

   - **It is turn-based.** Nothing here runs on the rAF loop. The perimeter
     ticks, the pot brews and the company rehearses while this screen is open,
     because they are the weather; the duel itself moves only when a thumb
     moves it. That makes it the one loop you can play in a lift with one hand
     and no clock running against you, which is the point of having it.
   - **The deck is the progression, not the hero.** Hero level, stats and the
     Workshop do nothing in here. What you take into the sixth build is the
     twelve cards you chose after the first five, and nothing else.
   - **It cannot cost you anything.** Running out of health ends the bout with
     no reward and no other consequence — no goo, no XP, no standing, and
     nothing at all outside this screen. The perimeter remains the only loop
     with a real stake (see CLAUDE.md); this one is a wall you may hit as often
     as you like. `npm test` asserts that boundary the same way it asserts the
     Crab's.

   Everything below is pure state on `g.archive` plus the resolver. It throws
   like any subsystem and the chassis catches it through safeSubsystem.
====================================================== */

import { Sound } from "./audio.js";
import {
  Cards, Builds, cardById, buildById, starterDeck, cardText,
  REPEAT_RATE, YOU_HP, ENERGY, HAND
} from "./content/archive.js";

export const Archive = {
  Cards, Builds, cardById, buildById, cardText, YOU_HP,

  reset(){
    return {
      deck: starterDeck(),
      cleared: [],
      bout: null
    };
  },

  /* ---------------- the shelf ---------------- */

  // Filed in order, and opened in order: the next build unlocks when the one
  // before it goes down. A shelf you can start at the bottom of is a menu.
  isUnlocked(g, id){
    const i = Builds.findIndex(b => b.id === id);
    if(i <= 0) return i === 0;
    return g.archive.cleared.indexOf(Builds[i-1].id) >= 0;
  },
  isCleared(g, id){ return g.archive.cleared.indexOf(id) >= 0; },

  /* ---------------- a bout ---------------- */

  start(g, buildId){
    const build = buildById(buildId);
    if(!build || !this.isUnlocked(g, buildId)) return false;
    const b = {
      buildId,
      foeHp: build.hp, foeMax: build.hp, foeBlock: 0, bugs: 0,
      intentIdx: 0, cycles: 0,
      hp: YOU_HP, hpMax: YOU_HP, block: 0,
      energy: ENERGY, energyMax: ENERGY,
      draw: shuffle(g.archive.deck.slice()), hand: [], discard: [],
      turn: 1, over: null, log: 'the build loads. it still runs',
      draftOptions: null
    };
    g.archive.bout = b;
    this.deal(b, HAND);
    Sound.archiveOpen();
    return true;
  },

  // Draw pile empty means the discard is reshuffled — the deck is small enough
  // that this happens two or three times a bout, which is what makes adding a
  // card to it a real decision rather than a collection.
  deal(b, n){
    for(let i=0;i<n;i++){
      if(!b.draw.length){
        if(!b.discard.length) return;
        b.draw = shuffle(b.discard); b.discard = [];
      }
      b.hand.push(b.draw.pop());
    }
  },

  /* One resolver for every card, reading the fields in src/content/archive.js
     and nothing else. A new card is a row of data; if a card ever needs code,
     the schema is what should grow. */
  play(g, handIdx){
    const b = g.archive.bout;
    if(!b || b.over) return false;
    const id = b.hand[handIdx];
    const c = cardById(id);
    if(!c || c.cost > b.energy) return false;

    b.hand.splice(handIdx, 1);
    b.discard.push(id);
    b.energy -= c.cost;

    if(c.energy) b.energy += c.energy;
    if(c.block) b.block += c.block;
    if(c.heal) b.hp = Math.min(b.hpMax, b.hp + c.heal);
    if(c.draw) this.deal(b, c.draw);
    if(c.bugs) b.bugs += c.bugs;
    if(c.dmg) this.hitBuild(b, c.dmg);
    // Self damage ignores block on purpose: the cost of CRUNCH should not be
    // something you can simply guard against, or it is not a cost.
    if(c.selfDmg) b.hp -= c.selfDmg;

    b.log = c.name.toLowerCase() + ' — ' + cardText(c);
    Sound.cardPlay();
    this.settle(g, b);
    return true;
  },

  hitBuild(b, dmg){
    const absorbed = Math.min(b.foeBlock, dmg);
    b.foeBlock -= absorbed;
    b.foeHp = Math.max(0, b.foeHp - (dmg - absorbed));
  },

  endTurn(g){
    const b = g.archive.bout;
    if(!b || b.over) return false;

    // Hand is discarded rather than kept. Holding cards across turns turns
    // every draw into a saving decision, which is a longer game than a loop
    // someone opens between two microgames.
    b.discard = b.discard.concat(b.hand);
    b.hand = [];

    // The build's turn: its bugs bite first, then it acts. Block it gained
    // last time is spent whether or not anything hit it.
    if(b.bugs > 0){
      this.hitBuild(b, b.bugs);
      b.bugs = Math.max(0, b.bugs - 1);
      if(this.settle(g, b)) return true;
    }
    b.foeBlock = 0;

    const build = buildById(b.buildId);
    const [kind, baseVal] = build.intents[b.intentIdx % build.intents.length];
    const val = kind === 'g' ? baseVal + Math.floor(b.cycles) * baseVal : baseVal;
    if(kind === 'a' || kind === 'g'){
      const absorbed = Math.min(b.block, val);
      b.block -= absorbed;
      b.hp -= (val - absorbed);
      b.log = build.name.toLowerCase() + ' hits for ' + val + (absorbed ? ' — ' + absorbed + ' blocked' : '');
      Sound.archiveHit();
    } else if(kind === 'b'){
      b.foeBlock += val;
      b.log = build.name.toLowerCase() + ' hardens — block ' + val;
    } else if(kind === 'h'){
      b.foeHp = Math.min(b.foeMax, b.foeHp + val);
      b.log = build.name.toLowerCase() + ' patches itself for ' + val;
    }

    b.intentIdx++;
    if(b.intentIdx % build.intents.length === 0) b.cycles++;

    // Your turn. Block does not carry: it was for the hit that just landed.
    b.block = 0;
    b.energy = b.energyMax;
    b.turn++;
    this.deal(b, HAND);
    this.settle(g, b);
    return true;
  },

  // Called after anything that can change either health total. Returns true if
  // the bout ended here, so callers can stop resolving.
  settle(g, b){
    if(b.over) return true;
    if(b.foeHp <= 0){
      b.over = 'win';
      b.log = 'the build stops. it is filed';
      this.offerDraft(g, b);
      Sound.archiveWin();
      return true;
    }
    if(b.hp <= 0){
      b.hp = 0;
      b.over = 'lose';
      // Deliberately not a punishment. Nothing is deducted anywhere — see the
      // header — so the line says what actually happened and no more.
      b.log = 'your build crashes. nothing is lost but the bout';
      Sound.archiveLose();
      return true;
    }
    return false;
  },

  // Fleeing is allowed and costs the same as losing, which is nothing. A
  // screen you cannot leave mid-bout would be the first place in this game
  // that traps you.
  flee(g){
    const b = g.archive.bout;
    if(!b) return false;
    g.archive.bout = null;
    return true;
  },

  /* ---------------- rewards ---------------- */

  offerDraft(g, b){
    const build = buildById(b.buildId);
    const first = !this.isCleared(g, b.buildId);
    const mult = first ? 1 : REPEAT_RATE;

    b.reward = {
      first,
      goo: Math.round(build.reward.goo * mult),
      xp: first ? build.reward.xp : 0
    };
    // A repeat clear pays a trickle and offers no card: the shelf stays a
    // ladder rather than becoming a deck-building machine you farm the bottom
    // rung of.
    b.draftOptions = first ? drawDraft() : null;
  },

  // Applied by the chassis so goo, XP and standing all move through the paths
  // that already exist for them. Returns what it paid, for the screen to say.
  claim(g, cardId){
    const b = g.archive.bout;
    if(!b || b.over !== 'win' || !b.reward) return null;
    const paid = b.reward;
    paid.buildName = buildById(b.buildId).name;

    if(cardId && b.draftOptions && b.draftOptions.indexOf(cardId) >= 0){
      g.archive.deck.push(cardId);
      paid.card = cardById(cardId);
    }
    if(paid.first && !this.isCleared(g, b.buildId)) g.archive.cleared.push(b.buildId);

    g.archive.bout = null;
    return paid;
  },

  /* ---------------- readouts ---------------- */

  intentText(g){
    const b = g.archive.bout;
    if(!b) return '';
    const build = buildById(b.buildId);
    const [kind, baseVal] = build.intents[b.intentIdx % build.intents.length];
    const val = kind === 'g' ? baseVal + Math.floor(b.cycles) * baseVal : baseVal;
    if(kind === 'a') return 'ATTACK ' + val;
    if(kind === 'g') return 'ATTACK ' + val + ' ↑';
    if(kind === 'b') return 'BLOCK ' + val;
    return 'REPAIR ' + val;
  },

  // How much of the deck is a given card, for the draft screen: drafting a
  // fourth REWRITE into a fourteen-card deck is a decision worth seeing.
  countOf(g, id){ return g.archive.deck.filter(c => c === id).length; },

  progress(g){ return g.archive.cleared.length + '/' + Builds.length; }
};

/* Fisher-Yates. Math.random is fine here — nothing in this loop is replayed,
   scored against anyone else, or worth seeding. */
function shuffle(a){
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

// Three distinct cards from the draftable pool — anything with a `start` count
// is already in the deck by definition and is not worth offering.
function drawDraft(){
  const pool = Cards.filter(c => !c.start).map(c => c.id);
  shuffle(pool);
  return pool.slice(0, 3);
}
