# Lore bible

Read this before writing any dialogue. The two voices are the most distinctive
thing about the project and the easiest thing to get wrong.

## The premise

Two entities built this game together and disagree about what it is for. Both
know they are inside a game. Both know the player is outside it. Neither
pretends otherwise — the fourth wall is not broken occasionally, it is simply
absent, permanently, as a design constant.

The player is "the Hero," progressing through five Acts toward THE UNSHIPPED.

## THE ARTIFICER

**Colour:** cyan `#2fe1ff` · **Sound:** clean sine chime · **Register:** formal,
capitalized, complete sentences, terminal punctuation.

Built: the Acts, hero stats, XP curve, the Workshop, the boss ladder, the round
timer. Anything structural, progressive, or balanced.

Wants the player to reach the end. Sees himself as the reason the game is
finishable at all. Treats the Goblin's additions as contamination he has been
forced to accept — but he *has* accepted them, and says so; he is exasperated,
not defeated. Occasionally apologises for parts of the game he built badly
(Act IV is explicitly his shame).

```
"Good. That is progress. Progress is the point."
"A setback. Nothing is lost — I removed death from the build."
"That creature is not in the design document. It is now load-bearing.
 I have accepted this."
```

Never: slang, lowercase, exclamation spam, cruelty toward the player.

## SLOP-GOBLIN

**Colour:** acid `#c9ff2f` · **Sound:** low sawtooth growl · **Register:**
all lowercase, no terminal punctuation, fragments, occasional ALL-CAPS burst
for emphasis.

Built: the buddy, the turret lane, the honey pot, the mutators, the chaos
events — and, crucially, the *wiring between them*. His stated motive is
"interoperability": he connects systems because it is funny when they touch.

Wants the player happily distracted, forever. Not malicious — genuinely
delighted. He takes credit for crashes, brags about the coupling he introduced,
and openly tells the player how to derail the Artificer's plot. In Act V he
admits he wants the player to win too; he just wanted the road there to be
extremely stupid.

```
"boring!! do it worse next time"
"i wired the buddy's mood into the turret's fire rate. why? interoperability"
"every goo you earn secretly fills my pot. every single one. he knows"
"that one crashed. i caught it. you get a free win. do NOT tell him"
```

Never: capital letters at sentence start, periods at line end, actual malice,
threatening the player.

## Writing new dialogue

All dialogue lives in `src/content/lore.js`.

**Barks** are reactive one-liners keyed by event. Two shapes:

```js
// Shape A — both voices have pools; the favor meter picks who speaks.
roundWin: {
  artificer: ["...", "..."],
  goblin:    ["...", "..."]
}

// Shape B — a fixed exchange; one line is picked at random.
levelUp: [
  { who: 'artificer', line: "..." },
  { who: 'goblin',    line: "..." }
]
```

Add to the pools freely — more variety is strictly better, and the idle pool in
particular is where the game's personality lives during quiet moments.

**Acts** are the plot spine:

```js
{
  n: 'ACT VI', title: 'THE NAME OF THE PLACE',
  quest: 'What the player is doing',
  rounds: 9,                                    // trials before the boss gate
  boss: { name: 'THE BOSS', hp: 16, regen: 2 }, // add final:true for the last
  open:  [ { who, line }, ... ],                // shown on act start
  close: [ { who, line }, ... ]                 // shown on boss defeat
}
```

Act names follow a theme: unfinished software as dungeon. THE CRUMBLING
TUTORIAL, THE LEAKING SUBROUTINE, THE GILDED CONFIG, THE UNCOMMENTED DEPTHS,
THE FINAL BUILD. Bosses are failure modes: THE PLACEHOLDER, THE MEMORY LEAK,
THE MERGE CONFLICT, THE NULL POINTER, THE UNSHIPPED. Stay in that register.

## Attribution rule

When you add a system, decide whose it is and label it in the shop description
("goblin tech" / "Artificer issue") and in its dialogue. Nothing in this game
is authorless. If you can't decide whose a feature is, that usually means it
isn't opinionated enough yet.
