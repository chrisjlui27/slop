/**
 * SLOP — entry point.
 *
 * Importing game.js is what boots the game: it builds the chassis, wires every
 * DOM listener, and paints the initial HUD. Nothing here needs to run in order
 * beyond that single import.
 *
 * If you are adding a feature, you almost certainly want one of:
 *   src/modules/        a new microgame          (docs/ADDING-A-MICROGAME.md)
 *   src/content/lore.js new dialogue or an Act   (docs/LORE.md)
 *   src/content/*.js    new mutator / shop item / stat
 *   src/game.js         the chassis itself       (docs/ARCHITECTURE.md)
 */
import { Game } from "./game.js";

// Exposed for console poking during development. Not used by the game itself.
// Handy: Game.actIdx = 4 to jump to the final act, Game.goo = 999 to test shop.
window.SLOP = Game;
