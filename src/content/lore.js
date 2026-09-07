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
  idle:{
    artificer:[
      "The final boss is THE UNSHIPPED. Everything here is aimed at that.",
      "I am tracking your pace against five Acts. You are inside tolerance.",
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
      "i know every trial. all fourteen. i could run them right now if asked",
      "no notes on your form. genuinely. i would just also like a turn",
      "i wait in the wings. that is the whole job so far. i am very good at it",
      "the crab talks to me. mostly about the perimeter. i listen properly"
    ]
  }
};

// ---- Acts: the actual plot spine ----
export const Acts = [
  {
    n:'ACT I', title:'THE CRUMBLING TUTORIAL',
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
  {
    n:'ACT V', title:'THE FINAL BUILD',
    quest:'Ship it',
    rounds:9,
    boss:{ name:'THE UNSHIPPED', hp:14, regen:2, final:true },
    open:[
      { who:'artificer', line:"The last gate. THE UNSHIPPED is every version of this game we abandoned. It is large. You are ready." },
      { who:'goblin', line:"ok real talk. i want you to beat it too. i just wanted the road there to be extremely stupid. it was. good job" }
    ],
    close:[]
  }
];
