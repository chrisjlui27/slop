/* ==================== THE ARCHIVE (THE FIFTH LOOP) ====================

   Data for the card duel. Cards, builds and what beating one pays are plain
   values here; src/archive.js is the loop that reads them, and the chassis
   only opens the door.

   Canon: THE ARTIFICER kept every abandoned version of this game in cold
   storage, filed and labelled, with no intention of anyone running them again
   — the same instinct that produced the frozen roadmap in Act VII. SLOP-GOBLIN
   found the key and turned the shelf into a card game, because the builds
   still execute and, in his reading, still want to be finished. The
   descriptions below are the Artificer's filing labels. The duel is not his.

   Adding a card or a build should not require touching src/archive.js: the
   resolver reads these fields and nothing else.
======================================================================== */

/* A card is the sum of its fields. Everything omitted is zero, which is what
   keeps the resolver one function long:

     cost     energy to play
     dmg      damage to the build, after its block
     block    block for you, cleared at the start of your next turn
     bugs     stacks that bite the build at the start of its turn, then decay
     draw     cards drawn immediately
     energy   energy granted immediately
     heal     your own repair
     selfDmg  what it costs you, ignoring block — always the interesting ones */
export const Cards = [
  // The starting ten. Deliberately dull: the deck is the progression, so the
  // first bout has to be the least interesting one you will ever play.
  { id:'patch',    name:'PATCH',     cost:1, dmg:5,  color:'#2fe1ff', start:4 },
  { id:'guard',    name:'GUARD',     cost:1, block:5, color:'#2fe1ff', start:4 },
  { id:'shipit',   name:'SHIP IT',   cost:2, dmg:9,  color:'#c9ff2f', start:1 },
  { id:'refactor', name:'REFACTOR',  cost:1, draw:2, color:'#7a3cff', start:1 },

  // Drafted. One is offered from this pool, three at a time, after each clear.
  { id:'hotfix',   name:'HOTFIX',      cost:0, dmg:3,             color:'#2fe1ff' },
  { id:'bisect',   name:'BISECT',      cost:1, dmg:4, draw:1,     color:'#2fe1ff' },
  { id:'bigpatch', name:'BIG PATCH',   cost:2, dmg:8, block:4,    color:'#2fe1ff' },
  { id:'rewrite',  name:'REWRITE',     cost:3, dmg:20,            color:'#ff2f9e' },
  { id:'crunch',   name:'CRUNCH',      cost:2, dmg:14, selfDmg:4, color:'#ff2f9e' },
  { id:'regress',  name:'REGRESSION',  cost:1, bugs:4,            color:'#ff7a2f' },
  { id:'dupe',     name:'DUPLICATE',   cost:1, bugs:2, draw:1,    color:'#ff7a2f' },
  { id:'lgtm',     name:'LGTM',        cost:1, block:6, bugs:2,   color:'#ff7a2f' },
  { id:'rollback', name:'ROLLBACK',    cost:1, block:9, draw:1,   color:'#7a3cff' },
  { id:'standup',  name:'STAND-UP',    cost:0, energy:1, draw:1,  color:'#7a3cff' },
  { id:'mortem',   name:'POSTMORTEM',  cost:1, heal:8,            color:'#7a3cff' },
  { id:'scope',    name:'SCOPE CREEP', cost:2, dmg:5, block:5, draw:1, color:'#fff02f' }
];

/* The shelf, in the order it was filed. Each build is a version of this game
   that did not ship; `intents` is what it does, in order, forever — telegraphed
   a turn ahead, because a card game where the enemy's move is a surprise is a
   slot machine.

     a  attack
     b  block
     h  heal
     g  attack, and grows every cycle — the ones that got worse over time */
/* Measured, not guessed. A decent-but-crude simulated player — spend every
   point of energy each turn, prefer lethal, then damage, then block when the
   incoming hit is large — drafting RANDOM cards rather than synergistic ones,
   1500 bouts per build, with the deck it would plausibly hold at that rung:

     THE PROTOTYPE      100%    3.6 turns
     THE VERTICAL SLICE 100%    5.1
     THE DEMO            95%    6.7
     THE PORT            75%    7.6
     THE REMASTER        63%    7.8
     THE SEQUEL          46%    7.4

   The first two teach, the third is a scare, and the last three are fights a
   player wins by drafting better than that simulation does. If these numbers
   are retuned, re-measure rather than reasoning about them: the ladder was
   non-monotonic twice, in ways nobody would have predicted from the values. */
export const Builds = [
  {
    id:'prototype', name:'THE PROTOTYPE', glyph:'🧱', hp:28,
    intents:[['a',6],['b',6],['a',8]],
    desc:'Two rooms and a placeholder. It ran. Nothing since has been as certain.',
    reward:{ goo:30, xp:10 }
  },
  {
    id:'slice', name:'THE VERTICAL SLICE', glyph:'🍰', hp:44,
    intents:[['a',9],['a',6],['b',9],['a',14]],
    desc:'One complete minute of the game, built to be shown. Shown twice.',
    reward:{ goo:45, xp:14 }
  },
  {
    id:'demo', name:'THE DEMO', glyph:'💿', hp:58,
    intents:[['a',13],['a',8],['h',8],['a',14],['b',10]],
    desc:'Loud, generous, and thirty seconds from the end of its own content.',
    reward:{ goo:65, xp:20 }
  },
  {
    id:'port', name:'THE PORT', glyph:'🔌', hp:66,
    intents:[['b',12],['a',15],['a',9],['a',15]],
    desc:'The same game, moved somewhere it did not fit. It fought the whole way.',
    reward:{ goo:90, xp:26 }
  },
  {
    id:'remaster', name:'THE REMASTER', glyph:'✨', hp:72,
    intents:[['a',11],['h',10],['a',15],['b',12],['a',18]],
    desc:'Everything that shipped, again, brighter. None of what was missing.',
    reward:{ goo:120, xp:34 }
  },
  {
    id:'sequel', name:'THE SEQUEL', glyph:'🏚️', hp:84,
    intents:[['a',14],['g',8],['b',14],['a',19],['g',8]],
    desc:'Announced. Scoped. Staffed. Cancelled in the same quarter as this one.',
    reward:{ goo:170, xp:46 }
  }
];

/* A build already beaten still pays, at a fraction, and stops paying XP or
   cards entirely. The shelf is not a goo farm — it is six fights that get
   harder, and the deck you take into the next one is the reward that matters. */
export const REPEAT_RATE = 0.3;

/* Your side of the table. Flat, not scaled off hero level: the deck is the
   progression here, and a level 20 hero walking through the whole shelf on
   statistics alone would make the cards decorative. */
export const YOU_HP = 50;
export const ENERGY = 3;
export const HAND = 5;

export const cardById = id => Cards.find(c => c.id === id);
export const buildById = id => Builds.find(b => b.id === id);

/* The ten you start with, spelled out rather than generated, so the opening
   hand is a thing someone chose. */
export const starterDeck = () =>
  Cards.filter(c => c.start).flatMap(c => Array(c.start).fill(c.id));

/* What a card says on its face. Generated from the fields so a new card cannot
   ship with a description that lies about what it does — the one piece of text
   in the game that is not allowed to be authored. */
export function cardText(c){
  const bits = [];
  if(c.dmg) bits.push('deal ' + c.dmg);
  if(c.block) bits.push('block ' + c.block);
  if(c.bugs) bits.push(c.bugs + ' bugs');
  if(c.heal) bits.push('repair ' + c.heal);
  if(c.draw) bits.push('draw ' + c.draw);
  if(c.energy) bits.push('+' + c.energy + ' energy');
  if(c.selfDmg) bits.push('take ' + c.selfDmg);
  return bits.join(' · ');
}
