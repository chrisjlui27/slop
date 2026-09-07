---
name: voice-check
description: Write or audit SLOP dialogue against the two narrator voices. Use when adding barks, act text, boss intros, or any character line, or when asked whether dialogue sounds right.
---

# Voice check

Getting the two voices wrong is the most common way to damage this project.
`docs/LORE.md` is the bible; read it before writing. This skill is the short
form and the checklist.

## The premise

Two entities built the game together and disagree about what it is for. Both
know they are inside a game. Both know the player is outside it. The fourth
wall is not broken occasionally — it is absent, permanently, as a design
constant.

## THE ARTIFICER — cyan `#2fe1ff`

Formal. Capitalised. Complete sentences. Terminal punctuation.

Built the Acts, hero stats, the XP curve, the Workshop, the boss ladder, the
round timer — anything structural, progressive or balanced. Wants the player to
reach the end, and sees himself as the reason the game is finishable at all.

He treats the Goblin's additions as contamination he has been forced to accept
— but he *has* accepted them, and says so. **Exasperated, not defeated.** He
occasionally apologises for parts he built badly; Act IV is explicitly his
shame.

Never: slang, lowercase, exclamation spam, cruelty toward the player.

## SLOP-GOBLIN — acid `#c9ff2f`

all lowercase. no terminal punctuation. fragments. occasional ALL-CAPS burst

Built the buddy, the turret lane, the honey pot, the mutators, the chaos
events — and crucially the *wiring between them*. Stated motive:
"interoperability", because it is funny when systems touch.

Wants the player happily distracted, forever. **Genuinely delighted, never
malicious.** He takes credit for crashes, brags about the coupling he
introduced, and openly tells the player how to derail the Artificer's plot. In
Act V he admits he wants the player to win too — he just wanted the road there
to be extremely stupid.

Never: capital letters at sentence start, periods at line end, actual malice,
threatening the player.

## Checklist for any new line

1. **Whose system is it?** Every mechanic belongs to one of them. A line about
   XP, timers, stats or the boss ladder is the Artificer's. A line about the
   buddy, turret, pot, mutators or chaos is the Goblin's. If you are adding a
   *system*, decide whose it is first — that decision drives the voice, not the
   other way round.
2. **Punctuation.** Goblin lines must not end in a period. Artificer lines must.
3. **Capitalisation.** Goblin lines start lowercase, always.
4. **Neither is cruel.** Exasperation and delight, never contempt. Failure
   costs momentum, never progress — nothing should imply the player lost
   something permanent, because they cannot.
5. **No pretending the game is real.** Neither voice maintains a fiction that
   this is not a game.

## Where it goes

All dialogue is data in `src/content/lore.js` — barks keyed by event, and the
`open`/`close` arrays on each Act. Adding twenty lines or a whole boss should
touch no chassis code. If it seems to need a change in `src/game.js`, that is a
signal the content schema needs extending; extend it deliberately rather than
special-casing.
