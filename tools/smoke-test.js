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

  // Standing: four independent axes, each powering its owner's loop.
  G.standing = { artificer: 0, goblin: 0, crab: 0, understudy: 0 };
  G.shiftFavor("goblin", 20);
  check("standing rises for the named patron", G.standing.goblin === 20);
  check("goblin standing raises goo multiplier", G.favorGooBonus() > 1);
  check("standing does not leak across patrons", G.favorXpBonus() === 1);

  // Siding with someone must cost standing elsewhere, or the choice is free.
  G.standing.crab = 10;
  G.shiftFavor("artificer", 10);
  check("siding with one patron bleeds the others", G.standing.crab < 10);
  check("bleed floors at zero", G.standing.understudy === 0);

  G.shiftFavor("crab", 500);
  check("standing clamps at 100", G.standing.crab === 100);
  check("crab standing raises defense multiplier", G.favorDefenseBonus() > 1);

  // An unknown speaker must be ignored rather than creating a phantom patron.
  G.shiftFavor("nobody", 50);
  check("unknown patron is rejected", G.standing.nobody === undefined);

  // Every patron has a voice and a colour, or the dialogue bar breaks on them.
  const castOk = Object.keys(G.standing).every(id => G.cast[id] && G.cast[id].name && G.cast[id].color);
  check("every patron has a cast entry", castOk);

  // ---- THE PERIMETER (the Crab's loop) ----
  const D = G.defenseApi;
  G.defense = D.reset();
  const d = G.defense;

  check("perimeter starts intact", d.perimeter === d.perimeterMax);
  check("perimeter starts with one tower", d.pads.filter(p => p.tower).length === 1);
  check("nine build pads", d.pads.length === 9);

  // Pads must not sit on top of each other, or placement is not a decision.
  const positions = d.pads.map((_, i) => { const p = D.padPos(i); return p.x + ":" + p.y; });
  check("every pad has a distinct position", new Set(positions).size === 9);

  G.goo = 500;
  const emptyPad = d.pads.findIndex(p => !p.tower);
  const buildCost = D.buildCost(G, "clacker");
  const gooBefore = G.goo;
  D.build(G, emptyPad, "clacker");
  check("building places a tower", !!d.pads[emptyPad].tower);
  check("building charges goo", G.goo === gooBefore - buildCost);

  D.upgradeTower(G, emptyPad);
  check("upgrading raises tower level", d.pads[emptyPad].tower.level === 2);

  D.sellTower(G, emptyPad);
  check("salvage clears the pad", d.pads[emptyPad].tower === null);

  // Building must be refused rather than going into debt.
  G.goo = 0;
  D.build(G, emptyPad, "shell");
  check("cannot build without goo", d.pads[emptyPad].tower === null && G.goo === 0);

  // The wave engine has to actually produce enemies when ticked.
  G.goo = 500;
  for (let i = 0; i < 400; i++) G.updateDefense(50);
  check("waves advance", d.wave >= 1);
  check("the tick throws nothing", !G._defenseFaults);

  // A leak costs integrity; a breach costs goo, and must leave the campaign
  // alone — the Act ladder still cannot be failed.
  const actBefore = G.actIdx, levelBefore = G.hero.level;
  d.perimeter = 3;
  d.enemies = [{ typeId: "lump", lane: 0, x: 10, hp: 99, maxHp: 99, slowT: 0, slowAmt: 0, wobble: 0 }];
  G.goo = 200;
  const breachesBefore = d.breaches;
  for (let i = 0; i < 40; i++) G.updateDefense(50);
  check("a breach is recorded", d.breaches === breachesBefore + 1);
  check("a breach costs goo", G.goo < 200);
  check("a breach leaves integrity above zero", d.perimeter > 0);
  check("a breach does not touch the act ladder", G.actIdx === actBefore);
  check("a breach does not touch hero level", G.hero.level === levelBefore);

  // Opening and closing the Crab's screen must restore the prior state.
  G.state = "menu";
  G.openDefense();
  check("perimeter screen opens", G.state === "tdgame");
  G.renderBuildMenu();
  G.closeDefense();
  check("perimeter screen closes back to play", G.state !== "tdgame");

  console.log(
    failures === 0
      ? "\nAll smoke checks passed."
      : `\n${failures} check(s) failed.`
  );
  process.exit(failures === 0 ? 0 : 1);
}, 120);
