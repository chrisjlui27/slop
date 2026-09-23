/* ================== THE LEDGER (CROSS-RUN BOONS) ==================

   Meta-progression: the only state in SLOP that outlives a run.

   It belongs to THE ARTIFICER, and that attribution decides its whole
   character. He wants the player to finish; he has said so since the title
   screen. So when a run ends without finishing, he does not commiserate — he
   writes down how far you got and quietly makes the next attempt easier. The
   Goblin would never build something this patient, and the Crab would consider
   it charity.

   Boons unlock on TOTAL acts cleared across every run, not on runs completed.
   Counting completed runs would give nothing at all to a player who keeps
   dying in Act VI, which is exactly the player this system exists for.
================================================================= */

/* Each boon is applied once at the start of every run, after the reset. Effects
   reach the parallel loops through the APIs the chassis already exposes
   (g.defenseApi, g.understudyApi) rather than importing them, which keeps this
   file free of the module graph and safely at the content layer.

   Kept deliberately small. These are a running start, not a difficulty
   setting — a returning player should feel steadier, not skip the game. */
export const Boons = [
  {
    id: 'seedgoo', at: 3, label: 'SEED FUNDING',
    desc: 'begin every run with 40 goo',
    apply(g){ g.goo += 40; }
  },
  {
    id: 'standin', at: 6, label: 'STANDING CAST',
    desc: 'THE STAND-IN is already in the company',
    apply(g){ g.understudy.members.standin = g.understudy.members.standin || 1; }
  },
  {
    id: 'secondpad', at: 10, label: 'PRE-DUG PAD',
    desc: 'the perimeter opens with a second clacker',
    apply(g){
      const pad = g.defense.pads[3];
      if(pad && !pad.tower) pad.tower = { typeId:'clacker', level:1, fireT:0 };
    }
  },
  {
    id: 'headstart', at: 15, label: 'FIELD PROMOTION',
    desc: 'start with a stat point already earned',
    apply(g){ g.hero.points += 1; }
  },
  {
    id: 'cheaprolls', at: 22, label: 'STANDING ORDER',
    desc: 'rerolls cost 2 less, always',
    apply(g){ g.rerollDiscount = (g.rerollDiscount||0) + 2; }
  },
  {
    id: 'steady', at: 30, label: 'STEADY HANDS',
    desc: 'begin with NERVE 2',
    apply(g){ g.hero.nerve = Math.max(g.hero.nerve, 2); }
  }
];

/* What the Artificer says the first time each one is granted. He is not warm
   about it — he is a man closing a gap in his own design. */
export const BoonLines = {
  seedgoo:    "You have cleared three gates across your attempts. I have arranged forty goo for the next one. Do not thank me, it is bookkeeping.",
  standin:    "The Understudy asked whether their cast could start already assembled. I could not construct an argument against it.",
  secondpad:  "The Crab has pre-dug a pad. He did not ask. I have decided that is acceptable.",
  headstart:  "Fifteen gates. You have earned a point before the first trial. Spend it deliberately.",
  cheaprolls: "Your rerolls are cheaper now, permanently. I would rather you bailed on a bad trial than lost momentum to it.",
  steady:     "Thirty gates. Your hands are steadier than they were. That is measurable, and I have measured it."
};

/* ==================== MASTERY ====================

   The Acts were the only loop with nothing to come back for. The campaign is
   linear, the pool is random, and a trial you have played two hundred times
   paid exactly what a trial you had never seen paid.

   Mastery is the answer and it belongs to THE ARTIFICER, like everything else
   structural: he keeps records. Every trial counts its own wins, across every
   run, in the ledger — the one thing that outlives a run — and a trial you
   have learned pays more than one you have not.

   Three ranks, and the thresholds are deliberately not round-number grinds:
   three wins is "you can do this one", eight is "reliably", twenty is a trial
   you know the shape of before the banner has finished slamming. */
export const MASTERY_RANKS = [3, 8, 20];

/* What a rank is worth on a won lane. Small on purpose — this is a reason to
   keep playing the trials, not a reason to farm the easy ones. XP scales
   because XP is the Artificer's currency and mastery is his record; the goo is
   a rounding bonus that makes a mastered trial feel paid. */
export const MASTERY_XP = 0.15;
export const MASTERY_GOO = 2;

export function masteryRank(wins){
  let r = 0;
  MASTERY_RANKS.forEach(t => { if((wins|0) >= t) r++; });
  return r;
}

export function masteryStars(rank){ return '★'.repeat(rank); }
