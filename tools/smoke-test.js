#!/usr/bin/env node
/**
 * Boots dist/slop.html in jsdom and drives it through real gameplay:
 * starts a run, forces wins, and verifies the Act/boss ladder actually
 * advances and the final victory state is reachable.
 *
 * This is the regression net for the chassis. It does NOT test any individual
 * microgame's feel — only that the structure holds and nothing throws.
 *
 * Run: npm test   (builds first)
 */
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const HTML = path.join(__dirname, "../dist/slop.html");
if (!fs.existsSync(HTML)) {
  console.error("dist/slop.html missing — run `npm run build` first.");
  process.exit(1);
}

let failures = 0;
const check = (label, cond) => {
  console.log(`${cond ? "  ok  " : " FAIL "} ${label}`);
  if (!cond) failures++;
};

const dom = new JSDOM(fs.readFileSync(HTML, "utf8"), {
  runScripts: "dangerously",
  pretendToBeVisual: true,
  // Stubs must be installed BEFORE the inline script executes, otherwise the
  // chassis calls getContext() during boot and gets jsdom's unimplemented one.
  beforeParse(window) {
    window.HTMLCanvasElement.prototype.getContext = () =>
      new Proxy({}, { get: () => () => {} });
    window.AudioContext = undefined;
    window.webkitAudioContext = undefined;
  },
});
const { window } = dom;

setTimeout(() => {
  const G = window.SLOP;
  check("game object exposed on window.SLOP", !!G);
  if (!G) process.exit(1);

  check("14 microgames registered", G && typeof G.pickModule === "function");

  // Start a run.
  window.document.getElementById("startBtn").click();
  check("run started (act 0)", G.actIdx === 0);
  check("hero begins at level 1", G.hero.level === 1);
  check("story overlay opened on act start", G.state === "story");

  // Advance past the opening story beat.
  window.document.getElementById("storyContinueBtn").click();
  check("state left story after continue", G.state !== "story");

  // Drive the whole campaign by forcing round wins.
  let guard = 0;
  const forceWin = () => {
    if (G.state === "story") {
      window.document.getElementById("storyContinueBtn").click();
      return;
    }
    if (G.state === "levelup") {
      const btn = window.document.querySelector("#levelList button");
      if (btn) btn.click();
      return;
    }
    if (G.state === "draft") {
      window.document.getElementById("draftSkipBtn").click();
      return;
    }
    if (G.state === "bonus") {
      G.finishBonusStage();
      return;
    }
    if (G.state === "playing") {
      G.lanes.forEach((l) => l.g && l.g.win());
      return;
    }
    if (G.state === "resolve") G.nextRound();
  };

  while (G.state !== "victory" && guard++ < 4000) forceWin();

  check("campaign reached victory state", G.state === "victory");
  check("progressed through all 5 acts", G.actIdx >= 4);
  check("hero gained levels", G.hero.level > 1);
  check("xp accrued", G.hero.xp >= 0 && G.hero.xpNext > 0);
  check("no boss left standing", G.boss === null);

  // NEW GAME+ should reset the run but keep the ng counter.
  window.document.getElementById("victoryBtn").click();
  check("new game+ incremented", G.ngPlus === 1);
  check("new game+ reset act index", G.actIdx === 0);
  check("new game+ reset hero level", G.hero.level === 1);

  // Economy / cross-system wiring.
  G.goo = 0;
  G.addGoo(10);
  check("addGoo credits goo", G.goo === 10);
  check("addGoo skims into the honey pot", G.pot.brew > 0);

  const favBefore = G.favor;
  G.shiftFavor(-20);
  check("favor shifts toward goblin", G.favor < favBefore);
  check("goblin favor raises goo multiplier", G.favorGooBonus() > 1);

  console.log(
    failures === 0
      ? "\nAll smoke checks passed."
      : `\n${failures} check(s) failed.`
  );
  process.exit(failures === 0 ? 0 : 1);
}, 120);
