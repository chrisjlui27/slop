import { Sound } from "../audio.js";

/* ======================== THE CREATORS (CANON) ========================
   Every system in this game was built by one of these entities, and each of
   them owns a whole loop rather than a feature — see docs/PARALLEL-LOOPS.md.

   THE ARTIFICER built: acts, stats, XP, the shop, the boss ladder, the timer.
   SLOP-GOBLIN built: the buddy, the honey pot, the mutators, the chaos
     events, and the fact that all of them are wired into each other.
   THE CRAB built: the defense lane, because something is getting in and the
     other two will not treat that as real.
   THE UNDERSTUDY built: nothing. They keep playing while you are away, and
     would like it noted.

   They all know they are inside a game. They all know you are outside it.
===================================================================== */

export const Cast = {
  goblin:{ id:'goblin', name:'SLOP-GOBLIN', color:'#c9ff2f', speak(){ Sound.goblinSpeak(); } },
  artificer:{ id:'artificer', name:'THE ARTIFICER', color:'#2fe1ff', speak(){ Sound.artificerSpeak(); } },
  crab:{ id:'crab', name:'THE CRAB', color:'#ff7a2f', speak(){ Sound.crabSpeak(); } },
  understudy:{ id:'understudy', name:'THE UNDERSTUDY', color:'#7a3cff', speak(){ Sound.understudySpeak(); } }
};

// Barks: reactive one-liners, keyed by event. The two argue across the same bar.
export const Barks = {
  roundWin:{
    artificer:[
      "Good. That is progress. Progress is the point.",
      "Clean. The boss ladder is designed around exactly that.",
      "You are ahead of my projections. Keep the pace.",
      "Noted and logged. That damage was real."
    ],
    goblin:[
      "boring!! do it worse next time",
      "you won but did you FEEL anything",
      "ok fine that was fine. i'm adding a bee",
      "congrats you advanced his little plot. anyway feed the guy"
    ]
  },
  roundLose:{
    artificer:[
      "A setback. Nothing is lost — I removed death from the build.",
      "That one was his fault. I want that on the record.",
      "Recompose. The Act does not end because you missed.",
      "Ignore the noise. Watch the timer, not the confetti."
    ],
    goblin:[
      "HAHA. beautiful. no notes",
      "that's the good stuff. that's the slop",
      "he wanted you to win that. i did NOT",
      "failure is just content with a different name"
    ]
  },
  levelUp:[
    { who:'artificer', line:"A level. Spend the point deliberately — this is the system that actually carries you." },
    { who:'goblin', line:"stats!! he loves these. i tried to add a stat called SMELL and he said no" }
  ],
  bossStart:[
    { who:'artificer', line:"This is the gate. Win rounds to deal damage. Your GRIT decides how hard you hit." },
    { who:'goblin', line:"i gave it extra hp when he wasn't looking. also it heals. bye" }
  ],
  bossHit:{
    artificer:["Direct hit. Sustain it.","The gate is weakening. Again.","That is exactly the loop. Repeat it."],
    goblin:["ough. ok. lucky","stop that","it's fine it heals. probably"]
  },
  bossDown:[
    { who:'artificer', line:"The gate is down. The Act closes. This is what forward motion feels like." },
    { who:'goblin', line:"whatever. next one has MORE honey in it. i'm putting honey in the boss" }
  ],
  potOpen:[
    { who:'goblin', line:"YES. welcome to my game inside his game. the plot is paused. it can wait forever" },
    { who:'artificer', line:"He built an entire second game and wired it to the economy so I cannot remove it." }
  ],
  shopOpen:[
    { who:'artificer', line:"The Workshop. Sanctioned, balanced, and load-bearing. Spend here." },
    { who:'goblin', line:"half these are mine. the turret is mine. he shipped it anyway" }
  ],
  draftOpen:[
    { who:'goblin', line:"i'm meddling. pick your poison. or refuse, coward" },
    { who:'artificer', line:"You may refuse. I would prefer you refuse. You will not refuse." }
  ],
  reroll:[
    { who:'goblin', line:"rerolling!! disrespect the content!! i love it" },
    { who:'artificer', line:"An acceptable use of resources. Barely." }
  ],
  buddyFeed:[
    { who:'goblin', line:"he's SO happy. this does nothing for the plot. keep going" },
    { who:'artificer', line:"That creature is not in the design document. It is now load-bearing. I have accepted this." }
  ],
  buddyTantrum:[
    { who:'goblin', line:"he's mad!! he's eating the slop meter!! that's a feature" },
    { who:'artificer', line:"The tantrum is draining a meter I need for pacing. Please feed it." }
  ],
  /* The Crab's screen. He does not pause the plot to spite the Artificer, the
     way the pot does — he pauses it because losing a trial while defending the
     perimeter would be unfair, and unfairness is the thing he is against. */
  defenseOpen:{
    crab:[
      "good. you are here. the line is there. keep it there",
      "pads cover the corridor they sit on and the one below. bottom row covers one. that is the decision",
      "the trial is paused. i am not going to make you lose one of his rounds for standing watch",
      "spend goo on the line or spend it on his shop. i am not going to pretend that is a free choice",
      "brine slows. shell scatters. clacker just works. build what the wave is, not what you like"
    ],
    goblin:[
      "oh you're doing the crab thing. he's SO normal about this",
      "i keep feeding them. he keeps noticing. it's our little routine"
    ]
  },
  /* The company. Eager, rehearsed, entirely without resentment — the moment
     they stop being gracious about never being cast, they stop being the
     Understudy and become a different character. */
  companyOpen:{
    understudy:[
      "you came to see us. nobody comes to see us. sit anywhere",
      "we work while you are out. that is not a complaint, it is the arrangement",
      "recruit whoever you like. we have all learned the whole show",
      "the director keeps the hall open longer. do not ask who approved that",
      "everything we earn goes to you. that has always been the deal. i just like saying it out loud"
    ],
    artificer:[
      "I did not cast them. I also did not stop them. Both of those are on the record.",
      "Their XP is real XP. I checked it twice, hoping it would not be."
    ],
    goblin:[
      "they rehearse in the DARK. while you're ASLEEP. i think it's great",
      "i offered to wire them into the pot. they said no. politely. weird"
    ]
  },
  /* THE ARCHIVE. The shelf is the Artificer's — he filed every build he
     abandoned and meant that to be the end of it. The card game played on it
     is the goblin's, which is why one of them sounds delighted and the other
     sounds like a man watching his filing cabinet be monetised. */
  archiveOpen:{
    goblin:[
      "i found his shelf. every version of this he gave up on. they all still RUN",
      "made a card game out of the corpses. they fight back. it's great",
      "your deck is the only thing that matters in here. no stats. he HATES that",
      "the sequel is on the bottom shelf. it was cancelled before it was written. it is furious",
      "beat one and it gives you a card. that's how it works now. i decided"
    ],
    artificer:[
      "Cold storage. Every build I abandoned, labelled and shelved. He has made them a leisure activity.",
      "These are not enemies. They are drafts. I filed them so they would stop being my problem.",
      "Nothing in here touches your level or your Acts. I insisted on that much.",
      "You may lose in here. You lose the bout and nothing else — I checked his implementation twice."
    ]
  },
  archiveClear:{
    goblin:[
      "it's filed!! take a card off the corpse. that's the loop",
      "one down. he's pretending not to watch this"
    ],
    artificer:[
      "That build is closed. I had not expected to feel anything about that.",
      "Filed properly this time. Take something from it — it is owed to you."
    ]
  },
  /* THE PATCH BAY. His, entirely: the panel behind the game where every
     system draws power from his core. The goblin's lines are about the
     re-patching, because that is the part of it that is his — and he is not
     sorry, because he is never sorry. */
  bayOpen:{
    artificer:[
      "He wired every system into every other one. This is where I route them back. You may help.",
      "Every tile you turn is one coupling I no longer have to explain.",
      "There is no clock in here. I removed it. Think as long as you like.",
      "Par is the fewest turns. It is a yardstick, not the answer. Any route that powers everything is correct."
    ],
    goblin:[
      "he's untangling my wiring. i'll just redo it later. that's the loop",
      "every panel in here is one i re-patched. every single one. you're welcome",
      "there's a crawlspace under the last rack. i live there now",
      "the buddy was wired into the turret for a REASON. the reason was funny"
    ]
  },
  bayClear:{
    artificer:[
      "Routed. Every system has power and nothing is plugged into anything it should not be. Briefly.",
      "That panel is correct. I would like it noted that it was correct before he touched it."
    ],
    goblin:[
      "oh you fixed it. cute. see you next panel",
      "all lit up. i'm going to go unplug the pot now"
    ]
  },
  idle:{
    artificer:[
      "The final boss is THE UNSHIPPED. Everything here is aimed at that.",
      "I am tracking your pace against eight Acts. You are inside tolerance.",
      "If a system confuses you, it is probably his.",
      "Your stats persist. The chaos does not. Invest accordingly."
    ],
    goblin:[
      "psst. the honey pot pauses his whole plot. use it constantly",
      "i wired the buddy's mood into the turret's fire rate. why? interoperability",
      "every goo you earn secretly fills my pot. every single one. he knows",
      "there's no lose state. i removed it. he was FURIOUS",
      "you are reading a text box in a game about tapping shapes. hi"
    ],
    crab:[
      "something is getting in. bottom of the screen. i have raised this",
      "the goblin has been feeding them. i have told him. i will tell him again",
      "turret is holding. turret is one turret. do the arithmetic",
      "he counts acts. i count what comes through. only one of those goes up",
      "you tapped one yourself. noted. that is the first help i have had"
    ],
    understudy:[
      "i know every trial. all twenty-five. i could run them right now if asked",
      "no notes on your form. genuinely. i would just also like a turn",
      "i wait in the wings. that is the whole job so far. i am very good at it",
      "the crab talks to me. mostly about the perimeter. i listen properly"
    ]
  }
};

// ---- Acts: the actual plot spine ----
/* tint is the Act's pair of backdrop lights — a wash and an accent, read by
   Game.applyActTint and handed to #bgLayer. Content, not code: the colours are
   the palette's own, and which two an Act gets says whose Act it is. */
export const Acts = [
  {
    n:'ACT I', title:'THE CRUMBLING TUTORIAL',
    tint:['#2fe1ff','#7a3cff'],
    quest:'Reach the gate',
    rounds:6,
    boss:{ name:'THE PLACEHOLDER', hp:5, regen:0 },
    open:[
      { who:'artificer', line:"You begin in the tutorial zone. It was never finished. It is load-bearing anyway. Six trials, then a gate." },
      { who:'goblin', line:"i live here. i put the honey pot in the tutorial. that's illegal i think" }
    ],
    close:[
      { who:'artificer', line:"Act I closes. You have a hero, stats, and momentum. Hold onto all three." }
    ]
  },
  {
    n:'ACT II', title:'THE LEAKING SUBROUTINE',
    tint:['#c9ff2f','#2fe1ff'],
    quest:'Plug the leak',
    rounds:7,
    boss:{ name:'THE MEMORY LEAK', hp:7, regen:1 },
    open:[
      { who:'artificer', line:"Something here consumes and does not release. Expect the gate to heal itself. Hit it faster than it recovers." },
      { who:'goblin', line:"the leak is me. i'm the leak. i leak between systems. it's my whole thing" }
    ],
    close:[
      { who:'goblin', line:"you plugged it. rude. i'll find another seam, there are so many seams" }
    ]
  },
  {
    n:'ACT III', title:'THE GILDED CONFIG',
    tint:['#fff02f','#ff7a2f'],
    quest:'Resolve the conflict',
    rounds:8,
    boss:{ name:'THE MERGE CONFLICT', hp:9, regen:1 },
    open:[
      { who:'artificer', line:"Two versions of this Act exist. His and mine. They disagree. The gate is that disagreement, given hit points." },
      { who:'goblin', line:"<<<<<<< HEAD. i wrote a boss out of a merge conflict. i'm so proud" }
    ],
    close:[
      { who:'artificer', line:"Resolved in my favour. Mostly. Act III closes." }
    ]
  },
  {
    n:'ACT IV', title:'THE UNCOMMENTED DEPTHS',
    tint:['#7a3cff','#ff2f9e'],
    quest:'Descend',
    rounds:8,
    boss:{ name:'THE NULL POINTER', hp:11, regen:2 },
    open:[
      { who:'artificer', line:"Nothing down here is documented. I wrote it at speed and never came back. I am sorry in advance." },
      { who:'goblin', line:"THIS is my favourite act. nobody knows what anything does. not even him" }
    ],
    close:[
      { who:'goblin', line:"you went into the undocumented part and came back. that's genuinely impressive. genuinely" }
    ]
  },
  /* Acts V-VII were added after THE CRAB and THE UNDERSTUDY became full
     characters with loops of their own. They sit here, between the Artificer's
     confession in Act IV and his finale, because that is where the other two
     have room to be part of the plot rather than commentary beside it. Each of
     the three belongs to a different voice. */
  {
    n:'ACT V', title:'THE DEPRECATED WING',
    tint:['#ff7a2f','#ff2f9e'],
    quest:'Hold the line',
    rounds:8,
    boss:{ name:'THE BREAKING CHANGE', hp:12, regen:2 },
    open:[
      { who:'crab', line:"this part was sealed off. i sealed it off. something has been widening the gap and it was not me" },
      { who:'artificer', line:"He filed this. Repeatedly. I marked it low priority for four Acts. That was an error and it is mine." }
    ],
    close:[
      { who:'crab', line:"line held. i am not going to make a thing of it. i would like it in the record that i filed this" }
    ]
  },
  {
    n:'ACT VI', title:'THE ORPHANED BRANCH',
    tint:['#7a3cff','#c9ff2f'],
    quest:'Find what was cut',
    rounds:9,
    boss:{ name:'THE FORCE PUSH', hp:14, regen:2 },
    open:[
      { who:'understudy', line:"this is where the cut content went. i know all of it. i learned every part nobody kept" },
      { who:'goblin', line:"oh this place RULES. everything in here is a version of something you already beat but worse. i love it here" }
    ],
    close:[
      { who:'understudy', line:"you saw it. that is all i wanted. it was good work and somebody has now seen it" }
    ]
  },
  {
    n:'ACT VII', title:'THE FROZEN ROADMAP',
    tint:['#2fe1ff','#c9ff2f'],
    quest:'Thaw it',
    rounds:9,
    boss:{ name:'THE SCOPE CREEP', hp:16, regen:3 },
    open:[
      { who:'artificer', line:"Everything promised and never built is stored here, at temperature. Do not read the labels. Some of them are recent." },
      { who:'goblin', line:"i added forty things to this roadmap while you were reading that. THE SCOPE CREEP is my son and i am proud of him" }
    ],
    close:[
      { who:'artificer', line:"The roadmap is moving again. I had stopped expecting that. Thank you." },
      { who:'crab', line:"it is moving toward the gate. that is a direction. i will take a direction" }
    ]
  },
  {
    n:'ACT VIII', title:'THE FINAL BUILD',
    tint:['#ff2f9e','#fff02f'],
    quest:'Ship it',
    rounds:9,
    boss:{ name:'THE UNSHIPPED', hp:18, regen:3, final:true },
    open:[
      { who:'artificer', line:"The last gate. THE UNSHIPPED is every version of this game we abandoned. It is large. You are ready." },
      { who:'goblin', line:"ok real talk. i want you to beat it too. i just wanted the road there to be extremely stupid. it was. good job" },
      { who:'crab', line:"whole company is behind you. i am at the back. that is where i am useful" },
      { who:'understudy', line:"we rehearsed this one. all of us. we never thought anyone would call it. break a leg" }
    ],
    close:[]
  }
];
