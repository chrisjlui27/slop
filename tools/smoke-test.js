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
  // A real origin, because jsdom refuses localStorage on the default
  // about:blank one. Without it every storage access throws, `store()` returns
  // null, and the save and ledger degrade to no-ops — which they are designed
  // to do, so the suite passed while covering neither of them. This line is
  // what makes persistence testable at all.
  url: "https://slop.test/",
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

/* The body is wrapped because jsdom runs with pretendToBeVisual, so the game's
   requestAnimationFrame loop holds the event loop open. An assertion that
   throws would therefore skip process.exit() and leave the run hanging until
   something kills it, reporting nothing — which is precisely the least useful
   way for a test suite to fail. The finally clause guarantees an exit code. */
setTimeout(async () => {
  try {
    // Async since the console checks: 'a round resumes with the time it had'
    // and 'the next round starts after coming back between rounds' are claims
    // about wall-clock time, and the only honest way to test those is to let
    // some pass.
    await runChecks();
  } catch (e) {
    failures++;
    console.log(" FAIL  smoke test threw: " + (e && e.stack ? e.stack : e));
  } finally {
    console.log(
      failures === 0
        ? "\nAll smoke checks passed."
        : `\n${failures} check(s) failed.`
    );
    process.exit(failures === 0 ? 0 : 1);
  }
}, 120);

async function runChecks() {
  const G = window.SLOP;
  check("game object exposed on window.SLOP", !!G);
  if (!G) return;

  check("microgame pool is populated", G && typeof G.pickModule === "function");

  // ---- the microgame contract, across the whole pool ----
  // The chassis converts a throwing module into a free win, which is exactly
  // what makes a permanently broken one invisible in play: it never crashes
  // the page, it just quietly stops being a game. So every module is driven
  // here, outside safeLane, where a throw is a failure rather than a feature.
  const mods = G.modules || [];
  check("every microgame is registered", mods.length >= 25);
  check("microgame ids are unique", new Set(mods.map(m => m.id)).size === mods.length);

  const shapeBad = mods.filter(m =>
    !m.id || !m.verb || !m.color ||
    typeof m.init !== "function" || typeof m.render !== "function");
  check("every microgame has id, verb, colour, init and render", shapeBad.length === 0);

  // The hint is the chassis-drawn instruction band, and since modules stopped
  // drawing their own it is the only thing telling the player what is being
  // asked. A missing or empty one is a silent readability regression, so it is
  // part of the contract now.
  const hintless = mods.filter(m => !m.hint).map(m => m.id);
  check("every microgame declares a hint: " + (hintless.join(", ") || "none missing"),
    hintless.length === 0);

  // Module-scope mutable state breaks DOUBLE SLOP, where one module object
  // runs in two lanes at once. Two independent `local` objects must stay
  // independent after both have been initialised and driven.
  const fakeCtx = () => new Proxy({}, { get: () => () => {} });
  const fakeG = (round) => {
    const g = {
      W: 480, H: 480, ctx: fakeCtx(), local: {}, round,
      won: false, lost: false,
      win() { this.won = true; }, lose() { this.lost = true; },
    };
    return g;
  };

  const broken = [];
  const badHint = [];
  const leaky = [];
  mods.forEach(m => {
    try {
      // Late-round values, where difficulty scaling is most likely to produce
      // a degenerate number.
      const a = fakeG(1), b = fakeG(40);
      m.init(a); m.init(b);
      for (let i = 0; i < 30; i++) {
        if (m.update) { m.update(a, 33); m.update(b, 33); }
        m.render(a); m.render(b);
      }
      if (m.onDown) { m.onDown(a, 240, 240); m.onDown(b, 100, 380); }
      if (m.onMove) { m.onMove(a, 250, 250); m.onMove(b, 110, 390); }
      if (m.onUp) { m.onUp(a, 260, 260); m.onUp(b, 120, 400); }
      if (m.cleanup) { m.cleanup(a); m.cleanup(b); }
      // Dynamic hints read g.local, so they are driven in every state the
      // module passed through above — a hint that throws or goes blank
      // mid-round leaves the player with no instruction at all.
      [a, b].forEach(gg => {
        const h = typeof m.hint === "function" ? m.hint(gg) : m.hint;
        if (typeof h !== "string" || !h.trim()) badHint.push(m.id + " (empty hint)");
        // 40 chars is one line at the width a DOUBLE SLOP lane gets. Longer wraps
        // to two, which pushes the band up over the board it is explaining.
        else if (h.length > 40) badHint.push(m.id + " (hint too long: " + h.length + ")");
      });
      if (Object.keys(a.local).length === 0) leaky.push(m.id + " (no g.local state)");
    } catch (e) {
      broken.push(m.id + ": " + e.message);
    }
  });
  check("no microgame throws when driven: " + (broken[0] || "none"), broken.length === 0);
  check("every microgame keeps its state on g.local", leaky.length === 0);
  check("hints stay valid and short: " + (badHint[0] || "all"), badHint.length === 0);

  // ---- winnability ----
  // "Does not throw" is not "is a game". The chassis awards a throwing module
  // to the player, so a module that can never be won looks identical in play to
  // one that is merely hard — it just quietly stops being winnable. These drive
  // the correct input for each and demand a win.
  //
  // Deliberately coupled to each module's internals: that coupling is the
  // point, and a module that changes shape should have to update its strategy
  // here rather than silently losing coverage.
  const byId = id => mods.find(m => m.id === id);
  const strategies = {
    trace(m, g) {
      const py = x => 240 + Math.sin(g.local.phase + (x / 480) * Math.PI * 2 * g.local.freq) * g.local.amp;
      m.onDown(g, g.local.x, py(g.local.x));
      for (let x = g.local.x; x <= 445 && !g.won && !g.lost; x += 4) m.onMove(g, x, py(x));
    },
    chase(m, g) {
      for (let i = 0; i < 600 && !g.won; i++) { m.onMove(g, g.local.tx, g.local.ty); m.update(g, 16); }
    },
    stack(m, g) {
      for (let i = 0; i < 4000 && !g.won && !g.lost; i++) {
        m.update(g, 16);
        if (!g.local.dropping && Math.abs(g.local.x - 240) < 4) m.onDown(g);
      }
    },
    rhythm(m, g) {
      for (let i = 0; i < 6000 && !g.won && !g.lost; i++) {
        m.update(g, 16);
        const n = g.local.notes.find(n => !n.hit && Math.abs(n.x - g.local.line) <= g.local.tol * 0.5);
        if (n) m.onDown(g);
      }
    },
    wire(m, g) {
      g.local.left.forEach(p => {
        const t = g.local.right.find(r => r.col === p.col);
        m.onDown(g, p.x, p.y); m.onMove(g, t.x, t.y); m.onUp(g, t.x, t.y);
      });
    },
    weigh(m, g) { m.onDown(g, g.local.heavy === "L" ? 100 : 380, 240); },
    sling(m, g) {
      // Aim by geometry: pull the opposite way from the target, with the pull
      // length the flight needs. Solved rather than searched, because a
      // strategy that brute-forces a launch angle would pass on a module that
      // had stopped being aimable.
      const l = g.local;
      const dx = l.tx - l.ox, dy = l.ty - l.oy;
      const d = Math.hypot(dx, dy) || 1;
      m.onDown(g, l.ox, l.oy);
      for (let pull = 20; pull <= 120 && !g.won; pull += 2) {
        m.onMove(g, l.ox - dx / d * pull, l.oy - dy / d * pull);
        // Fire a copy of the shot and see where it lands, then commit to the
        // one that hits.
        const save = { px: l.px, py: l.py, vx: l.vx, vy: l.vy, flying: l.flying, done: l.done };
        m.onUp(g);
        for (let i = 0; i < 400 && !g.won && !g.lost; i++) m.update(g, 16);
        if (g.won) return;
        g.lost = false;
        Object.assign(l, save, { dragging: true });
      }
    },
    steady(m, g) {
      // Played correctly means a thumb that goes down and does not move.
      m.onDown(g, 240, 240);
      for (let i = 0; i < 400; i++) { m.update(g, 16); m.onMove(g, 240, 240); }
    },
    crank(m, g) {
      const l = g.local, dir = l.cw ? 1 : -1;
      m.onDown(g, l.hx, l.hy + l.r);
      for (let i = 1; i < 4000 && !g.won && !g.lost; i++) {
        const a = Math.PI / 2 + dir * i * 0.2;
        m.onMove(g, l.hx + Math.cos(a) * l.r, l.hy + Math.sin(a) * l.r);
      }
    },
    split(m, g) {
      // Bisect for the fair cut, which is only findable because share() is
      // monotone in x — if that stops being true this stops passing.
      const l = g.local;
      let lo = l.x0, hi = l.x1;
      for (let i = 0; i < 40; i++) {
        const mid = (lo + hi) / 2;
        if (m.share(l, mid) < l.total / 2) lo = mid; else hi = mid;
      }
      m.onDown(g, (lo + hi) / 2, 300);
      m.onUp(g, (lo + hi) / 2, 300);
    },
    peel(m, g) {
      m.onDown(g, 240, g.local.y);
      let y = g.local.y;
      const step = Math.max(1, g.local.maxStep - 2);
      for (let i = 0; i < 1200 && !g.won && !g.lost; i++) { y += step; m.onMove(g, 240, y); }
    },
  };

  const unwinnable = [];
  Object.keys(strategies).filter(id => id !== "steady").forEach(id => {
    const m = byId(id);
    if (!m) { unwinnable.push(id + " (missing)"); return; }
    // Two rounds apart, so a difficulty curve that becomes impossible late is
    // caught rather than passing on the easy case.
    [1, 30].forEach(round => {
      const g = fakeG(round);
      try {
        m.init(g);
        strategies[id](m, g);
        if (!g.won) unwinnable.push(id + " @round " + round + (g.lost ? " (lost)" : " (never resolved)"));
      } catch (e) { unwinnable.push(id + " @round " + round + ": " + e.message); }
    });
  });
  check("playing correctly wins: " + (unwinnable[0] || "all"), unwinnable.length === 0);

  // steady is the other survive-on-timeout module: holding still must not lose.
  const steadyMod = byId("steady");
  if (steadyMod) {
    const g = fakeG(30);
    steadyMod.init(g);
    strategies.steady(steadyMod, g);
    check("holding still is survivable", !g.lost);
    const g2 = fakeG(1);
    steadyMod.init(g2);
    for (let i = 0; i < 200 && !g2.lost; i++) g2 && steadyMod.update(g2, 16);
    check("never touching the board loses steady", g2.lost);
  }

  // flee survives on the clock rather than resolving, so it is checked the
  // other way round: running from the pack must not get you caught.
  const fleeMod = byId("flee");
  if (fleeMod) {
    const g = fakeG(30);
    fleeMod.init(g);
    const corners = [[30, 30], [450, 30], [30, 450], [450, 450], [240, 240]];
    for (let i = 0; i < 300 && !g.lost; i++) {
      let bx = 240, by = 240, best = -1;
      corners.forEach(([px, py]) => {
        const dd = Math.min.apply(null, g.local.hunters.map(h => Math.hypot(px - h.x, py - h.y)));
        if (dd > best) { best = dd; bx = px; by = py; }
      });
      fleeMod.onMove(g, bx, by);
      fleeMod.update(g, 16);
    }
    check("flee is survivable when played well", !g.lost);
  }

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
  check("progressed through every act", G.actIdx >= G.acts.length - 1);
  check("the campaign has grown past five acts", G.acts.length >= 8);
  check("only the last act is final", G.acts.filter(a => a.boss.final).length === 1 && G.acts[G.acts.length-1].boss.final);
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

  // ---- hero stats ----
  const statIds = (G.acts && G.hero) ? ["reflex", "wit", "grit", "nerve", "charm"] : [];
  check("every stat exists on the hero", statIds.every(id => typeof G.hero[id] === "number"));

  // NERVE raises the combo ceiling, which multiplies every goo source at once.
  G.hero.nerve = 1;
  const capBase = G.comboCap();
  G.hero.nerve = 4;
  check("nerve raises the combo cap", G.comboCap() === capBase + 3);
  G.hero.nerve = 1;

  // CHARM scales standing earned, and must not scale standing lost — a stat
  // that deepened your penalties would be a trap.
  G.standing = { artificer: 0, goblin: 0, crab: 0, understudy: 0 };
  G.hero.charm = 5;
  G.shiftFavor("goblin", 10);
  check("charm raises standing earned", G.standing.goblin > 10);
  G.standing.crab = 50;
  G.hero.charm = 5;
  G.shiftFavor("crab", -10);
  check("charm does not deepen standing lost", G.standing.crab === 40);
  G.hero.charm = 1;

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
  check("the tick throws nothing", !G._subsystemFaults);

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

  /* ---- THE CONSOLE: loops pause when you leave them ----
     Exactly one loop runs — the one on screen — and the company, which is the
     idle layer, runs everywhere. Driven through tickLoops(), the frame's share
     for the loops, so the rule is tested without a second animation loop. */
  const Dz = G.defenseApi, Uz = G.understudyApi;
  const fresh = () => {
    G.defense = Dz.reset(); G.defense.restT = 0;
    G.understudy = Uz.reset(); G.understudy.members = { understudy: 3, standin: 3 };
    G.buddy.hunger = 1; G.potBuffT = 5000;
  };
  const run = (state, ms) => { G.state = state; for (let i = 0; i < ms / 50; i++) G.tickLoops(50); };

  fresh();
  run("archive", 20000);
  check("the perimeter does not fight while you are elsewhere", G.defense.wave === 0 && G.defense.enemies.length === 0);
  check("the buddy does not starve while you are elsewhere", G.buddy.hunger === 1);
  check("the GLAZED clock does not run while you are elsewhere", G.potBuffT === 5000);
  check("the company works while you are elsewhere", G.understudy.lifetimeGoo > 0 || G.understudy.accGoo > 0);

  fresh();
  run("tdgame", 8000);
  check("the perimeter fights while you are at your post", G.defense.wave >= 1);
  check("the buddy waits while you are at the perimeter", G.buddy.hunger === 1);

  fresh();
  run("playing", 8000);
  check("the buddy gets hungry while the Acts are live", G.buddy.hunger < 1);
  check("GLAZED runs down while the Acts are live", G.potBuffT < 5000);
  check("the perimeter waits while the Acts are live", G.defense.wave === 0);

  fresh();
  run("menu", 8000);
  check("a menu over the Acts pauses the buddy too", G.buddy.hunger === 1);

  // The pot no longer brews on a clock; it fills from goo and from catching.
  // Goo earned while running — the buddy, the company — still skims in, so
  // the claim is that brew rises by exactly that skim and not a drop more.
  G.pot = G.potApi.reset();
  const gooBeforeBrew = G.goo;
  run("playing", 8000);
  const skim = Math.abs(G.goo - gooBeforeBrew) * 0.15;
  check("the pot does not brew on its own", Math.abs(G.pot.brew - skim) < 1e-6);
  G.addGoo(100);
  check("goo still skims into the pot", G.pot.brew > 0);

  // Leaving pauses a loop's work in progress rather than throwing it away.
  G.state = "menu";
  G.openArchive();
  G.archiveApi.start(G, "prototype");
  const bout = G.archive.bout, handBefore = bout.hand.join();
  G.closeArchive();
  check("leaving the archive keeps the bout", G.archive.bout === bout && bout.hand.join() === handBefore);
  G.openArchive();
  check("coming back finds the same bout", G.archive.bout === bout);
  G.closeArchive();

  G.openBay();
  const panel = G.bayApi.open(G, "front", 0);
  G.bayApi.tap(G, panel.cells.findIndex((c, i) => !c.locked && i !== panel.core));
  G.closeBay();
  G.openBay();
  check("leaving the patch bay keeps the half-routed panel", G.bay.board === panel && panel.turns === 1);
  G.closeBay();

  G.openPotGame();
  const jar = G.pot.session;
  G.closePotGame();
  G.openPotGame();
  check("leaving the pot keeps the jar", G.pot.session === jar);
  jar.over = true;
  G.closePotGame();
  G.openPotGame();
  check("a broken jar is replaced when you come back", G.pot.session !== jar && !G.pot.session.over);
  G.closePotGame();

  // The stall: leaving for a loop in the gap between rounds, then coming back.
  G.state = "resolve";
  G.openDefense();
  G.closeDefense();
  check("coming back between rounds does not strand the Acts", G.state === "resolve");
  await new Promise(r => setTimeout(r, 400));
  check("the next round starts after coming back between rounds", G.state !== "resolve");

  // A live round resumes with the clock it had, not a fresh one.
  G.state = "playing";
  G.deadline = performance.now() + 2000;
  G.openCompany();
  await new Promise(r => setTimeout(r, 300));
  G.closeCompany();
  const left = G.deadline - performance.now();
  check("a live round resumes with the time it had", left > 1500 && left <= 2000);

  /* ---- THE PATCH BAY: the routing puzzle ----
     The loop whose whole promise is a guarantee: every board is solvable, par
     is honest, and a seed is the same board everywhere. Those are checked
     across every rack rather than on one lucky board. */
  const Bay = G.bayApi;
  G.bay = Bay.reset();
  const solveByPar = (b) => {
    let taps = 0;
    b.cells.forEach(c => {
      for (let k = 0; k < 4; k++) {
        let m = c.base; for (let q = 0; q < ((c.rot + k) & 3); q++) m = Bay.turn(m);
        if (m === c.base) { taps += k; c.rot = (c.rot + k) & 3; return; }
      }
    });
    return taps;
  };
  let unsolvable = [], dealtSolved = [], parWrong = [], drift = [];
  [...Bay.Racks, Bay.CRAWLSPACE].forEach(r => {
    for (let l = 0; l < (r.levels || 12); l++) {
      const b = Bay.generate(r.id, l);
      if (Bay.isSolved(b)) dealtSolved.push(r.id + ":" + l);
      if (JSON.stringify(Bay.generate(r.id, l)) !== JSON.stringify(b)) drift.push(r.id + ":" + l);
      const par = b.par;
      if (solveByPar(b) !== par) parWrong.push(r.id + ":" + l);
      if (!Bay.isSolved(b)) unsolvable.push(r.id + ":" + l);
    }
  });
  check("every panel is solvable: " + (unsolvable[0] || "all"), unsolvable.length === 0);
  check("no panel is dealt already solved: " + (dealtSolved[0] || "none"), dealtSolved.length === 0);
  check("par is exactly the turns that solve it: " + (parWrong[0] || "all"), parWrong.length === 0);
  check("a seed is the same panel every time: " + (drift[0] || "all"), drift.length === 0);

  // Playing one: taps turn, locks do not, and the core is not a tile.
  G.bay = Bay.reset();
  check("the first rack is open", Bay.rackOpen(G, "front"));
  check("later racks need stars", !Bay.rackOpen(G, "back"));
  const pb = Bay.open(G, "front", 0);
  check("a panel opens", !!pb && G.bay.board === pb);
  const tapIdx = pb.cells.findIndex((c, i) => !c.locked && i !== pb.core);
  const rotBefore = pb.cells[tapIdx].rot;
  Bay.tap(G, tapIdx);
  check("a tap turns a tile a quarter", pb.cells[tapIdx].rot === ((rotBefore + 1) & 3));
  check("a tap counts as a turn", pb.turns === 1);
  check("the core does not turn", Bay.tap(G, pb.core) === false);
  const locked = Bay.generate("core", 0);
  const lockIdx = locked.cells.findIndex(c => c.locked);
  G.bay.board = locked;
  check("the core rack has bolted tiles", lockIdx >= 0);
  check("a bolted tile does not turn", Bay.tap(G, lockIdx) === false);

  // Solve the first panel in exactly par turns, through tap(), and it pays.
  G.bay = Bay.reset();
  const fb = Bay.open(G, "front", 0);
  const plan = [];
  fb.cells.forEach((c, i) => {
    for (let k = 0; k < 4; k++) {
      let m = c.base; for (let q = 0; q < ((c.rot + k) & 3); q++) m = Bay.turn(m);
      if (m === c.base) { for (let n = 0; n < k; n++) plan.push(i); return; }
    }
  });
  plan.forEach(i => Bay.tap(G, i));
  check("a panel solved on par is solved", fb.solved === true);
  check("par earns three stars", Bay.starsFor(fb) === 3);
  const bayGoo = G.goo, bayXp = G.hero.level * 1000000 + G.hero.xp;
  G.claimBay();
  check("a first clear pays goo", G.goo > bayGoo);
  check("a first clear pays xp", G.hero.level * 1000000 + G.hero.xp > bayXp);
  check("the stars are recorded", Bay.starsOf(G, "front", 0) === 3);
  const againGoo = G.goo;
  G.claimBay();
  check("a panel cannot be claimed twice", G.goo === againGoo);
  check("a solved panel refuses more turns", Bay.tap(G, plan[0]) === false);

  // Stars below par, and replaying for a better grade pays once.
  G.bay = Bay.reset();
  const sb = Bay.open(G, "front", 1);
  sb.solved = true; sb.turns = Math.ceil(sb.par * 1.5);
  check("a sloppy route earns two stars", Bay.starsFor(sb) === 2);
  sb.turns = sb.par * 3;
  check("a very sloppy route still earns one", Bay.starsFor(sb) === 1);
  const oneStar = Bay.claim(G);
  check("a first clear on one star pays", oneStar.goo > 0 && Bay.starsOf(G, "front", 1) === 1);
  const rb = Bay.open(G, "front", 1);
  rb.solved = true; rb.turns = rb.par;
  const upgrade = Bay.claim(G);
  check("improving to three stars pays the bonus once", upgrade.goo > 0 && Bay.starsOf(G, "front", 1) === 3);
  const rb2 = Bay.open(G, "front", 1);
  rb2.solved = true; rb2.turns = rb2.par;
  check("replaying a three-star panel pays nothing", Bay.claim(G).goo === 0);

  // Stars open racks; the crawlspace opens once the core is routed.
  G.bay = Bay.reset();
  Bay.Racks.forEach(r => { for (let l = 0; l < r.levels; l++) G.bay.stars[Bay.key(r.id, l)] = 2; });
  check("stars open the racks", Bay.Racks.every(r => Bay.rackOpen(G, r.id)));
  check("routing the core opens the crawlspace", Bay.crawlOpen(G));

  // Stars survive a save and cannot be forged.
  const baySnap = JSON.parse(JSON.stringify(G.saveApi.snapshot(G)));
  G.bay = Bay.reset();
  G.saveApi.apply(G, baySnap);
  check("bay stars survive a save", Bay.totalStars(G) === 60);
  check("a save carries no board", G.bay.board === null);
  G.saveApi.apply(G, Object.assign({}, baySnap, {
    bay: { stars: { "front:0": 3, "front:99": 3, "nonsense:0": 3, "back:1": 9, "back:2": "x" }, crawl: -4 }
  }));
  check("forged bay stars are dropped", Bay.totalStars(G) === 3);
  check("a nonsense crawlspace count becomes zero", G.bay.crawl === 0);

  // The screen: opens from the HUD door, and the codex it displaced still
  // opens from the hero sheet without resuming a round underneath it.
  G.bay = Bay.reset();
  G.state = "menu";
  window.document.getElementById("bayBtn").click();
  check("the patch bay opens from its door", G.state === "patchbay");
  check("the racks render", window.document.querySelectorAll("#bayShelf button").length >= 6);
  G.closeBay();
  check("the patch bay closes back to play", G.state !== "patchbay");
  G.state = "menu";
  window.document.getElementById("sheetBtn").click();
  window.document.getElementById("codexBtn").click();
  check("the codex opens from the hero sheet",
    !window.document.getElementById("codexOverlay").classList.contains("hidden"));
  check("opening the codex takes the sheet down",
    window.document.getElementById("sheetOverlay").classList.contains("hidden"));
  window.document.getElementById("codexCloseBtn").click();

  /* ---- THE ACTS: mastery ----
     The only loop with nothing to come back for. Mastery is per trial, lives
     in the ledger so it outlives a run, and pays a learned trial more than an
     unlearned one. */
  const Lg = G.ledgerApi;
  Lg.clear();
  G.mastery = {};
  check("a trial starts unmastered", Lg.rankOf(G, "smash") === 0);
  for (let i = 0; i < Lg.MASTERY_RANKS[0]; i++) Lg.recordTrial(G, "smash");
  check("wins earn a rank", Lg.rankOf(G, "smash") === 1);
  for (let i = 0; i < Lg.MASTERY_RANKS[2]; i++) Lg.recordTrial(G, "smash");
  check("enough wins master a trial", Lg.rankOf(G, "smash") === Lg.MASTERY_RANKS.length);
  check("mastery counts the mastered", Lg.mastered(G) === 1);
  check("mastery is per trial", Lg.rankOf(G, "dodge") === 0);

  // It survives a run ending, which is the whole reason it is in the ledger.
  G.start(false);
  check("mastery outlives a run", Lg.rankOf(G, "smash") === Lg.MASTERY_RANKS.length);
  check("a run starts with the record loaded", (G.mastery.smash | 0) > 0);

  // A mastered trial pays more. Driven through the real round resolution so
  // the reward path is what is tested, not a copy of it.
  const payFor = (trialId) => {
    G.lanes = [{ result: true, def: G.modules.find(m => m.id === trialId) }];
    const xpBefore = G.hero.level * 1000000 + G.hero.xp, gooBefore = G.goo;
    G.state = "playing";
    G.finishRound();
    return { xp: (G.hero.level * 1000000 + G.hero.xp) - xpBefore, goo: G.goo - gooBefore };
  };
  const plain = payFor("dodge");
  const learned = payFor("smash");
  check("a mastered trial pays more xp", learned.xp > plain.xp);
  check("a mastered trial pays goo", learned.goo > 0);

  // A hand-edited ledger must degrade to "no mastery", not to a broken boot.
  try {
    window.localStorage.setItem("slop.ledger.v1",
      JSON.stringify({ v: 1, runs: 1, actsCleared: 1, bestAct: 1, bestNg: 0, seen: [], mastery: { smash: "lots", dodge: -4, odd: 9 } }));
  } catch (e) {}
  const junked = Lg.read();
  check("a junk mastery entry is dropped", !junked.mastery.smash && !junked.mastery.dodge);
  check("a sound mastery entry survives beside it", junked.mastery.odd === 9);
  // A ledger written before mastery existed keeps its history rather than
  // being thrown away for missing a counter.
  try {
    window.localStorage.setItem("slop.ledger.v1",
      JSON.stringify({ v: 1, runs: 3, actsCleared: 7, bestAct: 4, bestNg: 1, seen: [] }));
  } catch (e) {}
  const old = Lg.read();
  check("a ledger from before mastery is not discarded", old.actsCleared === 7);
  check("it simply has no record yet", Object.keys(old.mastery).length === 0);
  Lg.clear();
  G.mastery = {};

  /* ---- THE ARCHIVE: relics, thinning and the endless rung ----
     The two things the loop owed: a progression that is not the deck, and
     something past the sixth build. */
  const Ar = G.archiveApi;
  G.archive = Ar.reset();
  G.goo = 9000;
  check("a fresh archive holds no relics", G.archive.relics.length === 0);
  check("the endless rung is shut until the shelf is filed", !Ar.endlessOpen(G));

  // Relics are the state of the table before a card is drawn.
  Ar.takeRelic(G, "order");
  Ar.start(G, "prototype");
  check("standing order starts the bout blocked", G.archive.bout.block === 6);
  Ar.takeRelic(G, "spare");
  Ar.start(G, "prototype");
  check("first draft adds energy on turn one", G.archive.bout.energy === 4);
  Ar.takeRelic(G, "cache");
  Ar.start(G, "prototype");
  check("a warm cache draws six", G.archive.bout.hand.length === 6);
  Ar.takeRelic(G, "flag");
  Ar.start(G, "prototype");
  const energyBeforeFree = G.archive.bout.energy;
  Ar.play(G, G.archive.bout.hand.findIndex(id => Ar.cardById(id).cost > 0));
  check("the feature flag makes the first card free", G.archive.bout.energy === energyBeforeFree);
  Ar.play(G, 0);
  check("the flag is spent after one card", G.archive.bout.energy < energyBeforeFree);
  check("a relic cannot be taken twice", Ar.takeRelic(G, "flag") === false);

  // Thinning: goo out, cards out, and a floor.
  G.archive = Ar.reset();
  G.goo = 9000;
  const deckBefore = G.archive.deck.length, gooBeforePurge = G.goo;
  check("a card can be struck out", Ar.purge(G, 0) === true);
  check("thinning shrinks the deck", G.archive.deck.length === deckBefore - 1);
  check("thinning costs goo", G.goo < gooBeforePurge);
  const firstCost = 40, secondCost = Ar.purgeCost(G);
  check("thinning gets dearer", secondCost > firstCost);
  for (let i = 0; i < 20 && Ar.canPurge(G); i++) Ar.purge(G, 0);
  check("a deck cannot be thinned past its floor", G.archive.deck.length === 6);
  G.goo = 0;
  check("thinning refuses when the goo is not there", Ar.purge(G, 0) === false);

  // The endless rung: generated, repeatable, and it climbs.
  G.archive = Ar.reset();
  G.archive.cleared = Ar.Builds.map(b => b.id);
  check("filing the shelf opens the endless rung", Ar.endlessOpen(G));
  const tierOne = Ar.endlessBuild(G);
  G.archive.tier = 4;
  const tierFour = Ar.endlessBuild(G);
  check("a later tier is larger", tierFour.hp > tierOne.hp);
  check("a later tier pays more", tierFour.reward.goo > tierOne.reward.goo);

  G.archive.tier = 1;
  G.goo = 0;
  check("the endless rung can be started", Ar.start(G, "unshipped") === true);
  G.archive.bout.foeHp = 0;
  Ar.settle(G, G.archive.bout);
  check("an endless tier can be won", G.archive.bout.over === "win");
  const endlessPaid = Ar.claim(G, null);
  check("an endless tier pays", endlessPaid && endlessPaid.goo > 0);
  check("winning a tier raises the tier", G.archive.tier === 2);
  check("the best tier is remembered", G.archive.bestTier === 1);
  check("an endless tier is never 'already filed'", endlessPaid.first === true);

  // A relic every second clear, offered as a choice and instead of a card.
  G.archive = Ar.reset();
  Ar.start(G, "prototype");
  G.archive.bout.foeHp = 0; Ar.settle(G, G.archive.bout);
  check("the first clear offers cards", !!G.archive.bout.draftOptions);
  Ar.claim(G, G.archive.bout.draftOptions[0]);
  Ar.start(G, "slice");
  G.archive.bout.foeHp = 0; Ar.settle(G, G.archive.bout);
  check("the second clear offers relics instead", !!G.archive.bout.relicOptions && !G.archive.bout.draftOptions);
  const relicPick = G.archive.bout.relicOptions[0];
  Ar.claim(G, relicPick);
  check("the relic is taken", Ar.hasRelic(G, relicPick));

  // All of it survives a save, and none of it can be forged.
  G.archive.purges = 3; G.archive.tier = 5; G.archive.bestTier = 4;
  const relSnap = JSON.parse(JSON.stringify(G.saveApi.snapshot(G)));
  G.archive = Ar.reset();
  G.saveApi.apply(G, relSnap);
  check("relics survive a save", Ar.hasRelic(G, relicPick));
  check("the tier survives a save", G.archive.tier === 5 && G.archive.bestTier === 4);
  check("the thinning count survives a save", G.archive.purges === 3);
  G.saveApi.apply(G, Object.assign({}, relSnap, {
    archive: Object.assign({}, relSnap.archive, { relics: ["nonsense"], tier: -9 })
  }));
  check("an unknown relic is dropped", G.archive.relics.length === 0);
  check("a nonsense tier becomes one", G.archive.tier === 1);

  // Handed back clean: the older archive checks further down drive a fresh
  // shelf, and a test that leaves state behind is a test that breaks its
  // neighbours rather than itself.
  G.archive = Ar.reset();

  /* ---- THE PERIMETER: doctrine, surges and calling waves in ----
     The three things the loop owed: a decision between waves, a board that
     grows, and a progression that is the Crab's rather than the shop's. */
  const Df = G.defenseApi;
  G.defense = Df.reset();
  G.goo = 4000;
  const padsAtStart = G.defense.pads.length;
  check("a fresh line has taken no doctrine", G.defense.doctrine.length === 0);

  // Every fourth wave the line earns one, and holds until it is taken.
  G.defense.wave = 4;
  Df.completeWave(G, G.defense);
  check("a milestone wave offers a doctrine", !!G.defense.doctrineOffer);
  check("two are offered", G.defense.doctrineOffer.length === 2);
  const waveHeld = G.defense.wave;
  G.defense.restT = 0;
  for (let i = 0; i < 40; i++) Df.tick(G, 50);
  check("the line holds while a doctrine is on the table", G.defense.wave === waveHeld);

  // OPEN THE FLANK is the one that changes the board.
  G.defense.doctrineOffer = ["flank", "plating"];
  check("a doctrine can be taken", Df.takeDoctrine(G, "flank") === true);
  check("the offer clears once taken", G.defense.doctrineOffer === null);
  check("the flank adds board", G.defense.pads.length === padsAtStart + 3);
  check("a new pad knows where it is", G.defense.pads[padsAtStart].x != null);
  check("a doctrine cannot be taken twice", Df.takeDoctrine(G, "flank") === false);
  check("waves resume once a doctrine is taken", (Df.tick(G, 3000), G.defense.wave > waveHeld));

  // The multipliers are read from one place and actually reach the towers.
  G.defense.doctrine = [];
  const plainRange = Df.towerStats(G, { typeId: "clacker", level: 1 }).range;
  const plainInterval = Df.towerStats(G, { typeId: "clacker", level: 1 }).interval;
  G.defense.doctrine = ["optics", "drill"];
  check("optics reaches further", Df.towerStats(G, { typeId: "clacker", level: 1 }).range > plainRange);
  check("drill fires faster", Df.towerStats(G, { typeId: "clacker", level: 1 }).interval < plainInterval);
  G.defense.doctrine = ["salvage"];
  G.defense.pads[4].tower = { typeId: "clacker", level: 1, fireT: 0 };
  const fullRefund = Df.sellValue(G, 4);
  G.defense.doctrine = [];
  check("the salvage crew refunds in full", fullRefund > Df.sellValue(G, 4));

  // PLATING raises the ceiling and patches to it, which is the only doctrine
  // that touches integrity.
  G.defense.perimeter = 20;
  const maxBefore = G.defense.perimeterMax;
  G.defense.doctrineOffer = ["plating", "optics"];
  Df.takeDoctrine(G, "plating");
  check("plating raises the ceiling", G.defense.perimeterMax > maxBefore);
  check("plating patches to full", G.defense.perimeter === G.defense.perimeterMax);

  // Surges: every fifth wave brings something the first row cannot hold.
  G.defense = Df.reset();
  G.defense.wave = 4;
  Df.startWave(G, G.defense);
  check("a surge wave carries an elite", G.defense.queue.some(id => !!Df.EliteTypes[id]));
  check("a surge is announced", G.defense.surge === true);
  G.defense.wave = 5;
  Df.startWave(G, G.defense);
  check("an ordinary wave carries no elite", !G.defense.queue.some(id => !!Df.EliteTypes[id]));

  // An elite is an enemy everywhere that matters: it spawns, it can be killed,
  // and it bites harder on the way through.
  G.defense = Df.reset();
  Df.spawn(G, G.defense, "wedge");
  check("an elite spawns", G.defense.enemies.length === 1);
  const gooBeforeElite = G.goo;
  Df.kill(G, G.defense, G.defense.enemies[0]);
  check("an elite pays when it dies", G.goo > gooBeforeElite);

  // Calling the next wave in early: pays for the time handed back, and only
  // while the line is actually resting.
  G.defense = Df.reset();
  G.defense.wave = 2; G.defense.queue = []; G.defense.enemies = []; G.defense.restT = 4000;
  const gooBeforeCall = G.goo;
  const called = Df.callWaveEarly(G);
  check("calling a wave early pays", called > 0 && G.goo > gooBeforeCall);
  check("calling a wave early starts it", G.defense.wave === 3);
  check("a wave already running cannot be called", Df.callWaveEarly(G) === false);

  // SPOTTERS is the readout doctrine, so what it changes is the readout.
  G.defense.doctrine = [];
  const plainLabel = Df.nextWaveLabel(G);
  G.defense.doctrine = ["spotters"];
  check("spotters name the next wave", Df.nextWaveLabel(G).length > plainLabel.length);

  // Doctrine survives a save, and the board it produced is replayed from it
  // rather than stored twice.
  G.defense = Df.reset();
  G.defense.doctrineOffer = ["flank", "plating"];
  Df.takeDoctrine(G, "flank");
  const padsWithFlank = G.defense.pads.length;
  const defSnap = JSON.parse(JSON.stringify(G.saveApi.snapshot(G)));
  G.defense = Df.reset();
  G.saveApi.apply(G, defSnap);
  check("doctrine survives a save", G.defense.doctrine.indexOf("flank") >= 0);
  check("the board it built comes back with it", G.defense.pads.length === padsWithFlank);
  G.saveApi.apply(G, Object.assign({}, defSnap, { doctrine: ["nonsense"] }));
  check("an unknown doctrine is ignored", G.defense.doctrine.indexOf("nonsense") < 0);

  /* ---- THE COMPANY: productions ----
     The sink that makes the idle layer a game rather than an accumulator:
     rate now, or a lump later. Time is the whole mechanic, so the clock
     guards are tested the same way the offline-pay ones are. */
  const Co = G.understudyApi;
  G.understudy = Co.reset();
  G.goo = 5000;
  check("the first production is open from the start", Co.productionUnlocked(G, "readthrough"));
  check("later productions are closed", !Co.productionUnlocked(G, "closing"));

  const gooBeforeStage = G.goo;
  check("a production can be staged", Co.stage(G, "readthrough") === true);
  check("staging costs goo", G.goo < gooBeforeStage);
  check("staging cannot happen twice at once", Co.stage(G, "readthrough") === false);
  check("a staged show is not ready immediately", !Co.productionReady(G));
  check("collecting early pays nothing", Co.collect(G) === null);

  // The company works at half rate while it is on stage.
  G.understudy.members = { understudy: 1, standin: 1 };
  const stagingRate = Co.rates(G).goo;
  const running = G.understudy.production;
  G.understudy.production = null;
  const freeRate = Co.rates(G).goo;
  check("a running show halves the rate", Math.abs(stagingRate - freeRate * 0.5) < 1e-9);
  G.understudy.production = running;

  // Wind the start back so the show has closed, and take the curtain call.
  G.understudy.production.startedAt = Date.now() - G.understudy.production.durationMs - 10;
  check("a finished show is ready", Co.productionReady(G));
  const gooPreCall = G.goo, standingPre = G.standing.understudy;
  const closed = Co.collect(G);
  check("the curtain call pays", closed && G.goo > gooPreCall);
  check("the curtain call pays standing", G.standing.understudy > standingPre);
  check("a closed show is recorded", Co.productionDone(G, "readthrough"));
  check("collecting twice pays nothing", Co.collect(G) === null);
  check("closing a show unlocks the next", Co.productionUnlocked(G, "preview"));

  // Every distinct show closed makes the company permanently better.
  G.understudy.staged = [];
  const plainRate = Co.rates(G).goo;
  G.understudy.staged = ["readthrough", "preview"];
  check("staged shows raise the rate for good", Co.rates(G).goo > plainRate);

  // Clock guards. A start stamp in the future is a wound-back device clock or
  // an edited save, and must not hand back a finished show.
  Co.stage(G, "preview");
  const prodSnap = JSON.parse(JSON.stringify(G.saveApi.snapshot(G)));
  G.understudy = Co.reset();
  G.saveApi.apply(G, prodSnap);
  check("a running show survives a save", !!G.understudy.production);
  check("the shelf of closed shows survives a save", G.understudy.staged.length === 2);

  const futureSnap = JSON.parse(JSON.stringify(prodSnap));
  futureSnap.company.production.startedAt = Date.now() + 99999999;
  G.saveApi.apply(G, futureSnap);
  check("a show that claims to start in the future starts now",
    !Co.productionReady(G) && G.understudy.production.startedAt <= Date.now());

  // Length comes from the catalogue, so editing it in the save does nothing.
  const shortSnap = JSON.parse(JSON.stringify(prodSnap));
  shortSnap.company.production.durationMs = 1;
  G.saveApi.apply(G, shortSnap);
  check("a show cannot be shortened by editing the save",
    G.understudy.production.durationMs === Co.productionById("preview").minutes * 60000);

  const junkSnap = JSON.parse(JSON.stringify(prodSnap));
  junkSnap.company.production = { id: "nonsense", startedAt: Date.now(), durationMs: 5 };
  junkSnap.company.staged = ["nonsense", "readthrough"];
  G.saveApi.apply(G, junkSnap);
  check("an unknown show is dropped from a restored save", G.understudy.production === null);
  check("unknown shows are dropped from the shelf", G.understudy.staged.join() === "readthrough");

  // The company screen still opens with all of this on it.
  G.understudy = Co.reset();
  G.state = "menu";
  G.openCompany();
  check("the production panel renders", window.document.querySelectorAll("#coStage button").length > 0);
  G.closeCompany();

  /* ---- THE HONEY POT: the goblin's arcade ----
     Driven through the subsystem the way the board drives it. What is checked
     is that the two currencies stay separate, that the stake ends a session
     and nothing else, and that the upgrades actually change the board. */
  const P = G.potApi;
  G.pot = P.reset();
  check("the pot starts with no honey and no upgrades",
    G.pot.honey === 0 && Object.keys(G.pot.upgrades).length === 0);

  G.state = "menu";
  G.openPotGame();
  check("pot screen opens", G.state === "potgame");
  const ps = G.pot.session;
  check("a session starts clean", ps && ps.cracks === 0 && !ps.over);

  // Catching. The drop is placed on the jar rather than waited for, so the
  // test measures the rules and not the RNG.
  const putOnJar = (id) => {
    const s = G.pot.session;
    s.drops.push({ id, x: s.jarX, y: P.POT.JAR_Y - 1, vy: 5, caught: false });
    P.tick(G, 16);
  };
  const brewBefore = G.pot.brew;
  putOnJar("gold");
  check("catching pays honey", G.pot.honey > 0);
  check("catching pays brew", G.pot.brew > brewBefore);
  check("the combo counts up", G.pot.session.combo === 1);

  // Honey is the pot's money and must never reach the campaign's.
  const gooBeforePot = G.goo;
  putOnJar("comb");
  check("honey does not pay goo", G.goo === gooBeforePot);

  // The sting: brew back out, combo gone, a crack in the jar.
  const brewFull = G.pot.brew, honeyFull = G.pot.honey;
  putOnJar("bee");
  check("a sting costs brew", G.pot.brew < brewFull);
  check("a sting does not take honey already banked", G.pot.honey === honeyFull);
  check("a sting breaks the combo", G.pot.session.combo === 0);
  check("a sting cracks the jar", G.pot.session.cracks === 1);

  // Three cracks end the session and nothing else. Same fence as the archive:
  // the perimeter is still the only loop that can take something off you.
  const potAct = G.actIdx, potLevel = G.hero.level, potGoo = G.goo;
  putOnJar("bee"); putOnJar("bee");
  check("the jar gives out", G.pot.session.over === true);
  check("a lost jar keeps the honey", G.pot.honey === honeyFull);
  check("a lost jar does not touch the act ladder", G.actIdx === potAct);
  check("a lost jar does not touch hero level", G.hero.level === potLevel);
  check("a lost jar does not touch goo", G.goo === potGoo);

  // Upgrades: bought with honey, and they change the board rather than the
  // payout. A wider jar has to be measurably wider.
  G.pot.honey = 999;
  const widthBefore = P.mods(G).halfWidth;
  check("an upgrade can be bought", P.buy(G, "wide") === true);
  check("buying spends honey", G.pot.honey < 999);
  check("a wider jar is wider", P.mods(G).halfWidth > widthBefore);
  const crackBefore = P.mods(G).cracks;
  P.buy(G, "panes");
  check("spare panes raise the stake", P.mods(G).cracks === crackBefore + 1);
  P.buy(G, "mesh");
  check("bee mesh stops the cracking", P.mods(G).stingCracks === 0);
  for (let i = 0; i < 9; i++) P.buy(G, "wide");
  check("an upgrade cannot pass its cap", P.levelOf(G, "wide") <= 4);

  // Escalation: the mix and the rate both move with the session clock.
  const early = G.pot.session ? P.heat(G.pot.session) : 0;
  P.open(G);
  G.pot.session.elapsed = 999999;
  check("escalation tops out at one", P.heat(G.pot.session) === 1 && early < 1);

  // The tick must survive a long unattended session without throwing.
  const faultsBefore = G._subsystemFaults || 0;
  P.open(G);
  for (let i = 0; i < 600; i++) G.updatePotGame(50);
  check("a long session throws nothing", (G._subsystemFaults || 0) === faultsBefore);

  // Harvest is the pot's one outward payment.
  G.pot.brew = G.pot.brewMax;
  const gooPreHarvest = G.goo;
  G.harvestPot();
  check("harvest pays goo", G.goo > gooPreHarvest);
  check("harvest empties the meter", G.pot.brew === 0);
  check("harvest glazes", G.potBuffT > 0);

  // Honey and upgrades survive a save; a session does not.
  G.pot.honey = 42; G.pot.upgrades = { wide: 2 };
  const potSnap = JSON.parse(JSON.stringify(G.saveApi.snapshot(G)));
  G.pot = P.reset();
  G.saveApi.apply(G, potSnap);
  check("honey survives a save", G.pot.honey === 42);
  check("pot upgrades survive a save", G.pot.upgrades.wide === 2);
  check("a save carries no pot session", G.pot.session === null);
  G.saveApi.apply(G, Object.assign({}, potSnap, { pot: { brew: 0, brewMax: 100, upgrades: { wide: 99, nonsense: 3 } } }));
  check("a restored upgrade cannot pass its cap", G.pot.upgrades.wide === 4);
  check("unknown upgrades are dropped from a restored pot", !G.pot.upgrades.nonsense);

  G.closePotGame();
  check("pot screen closes back to play", G.state !== "potgame");

  /* ---- THE ARCHIVE: the card duel ----
     Driven the way a player drives it — through the chassis, one card at a
     time — because the bout is the only loop in the game with no frame loop
     to fall over in. What is checked is the shape of the thing: that a deck
     exists, that playing correctly wins, that winning pays, and above all
     that losing costs nothing outside the screen. */
  const A = G.archiveApi;
  check("the archive has a starting deck", G.archive.deck.length === 10);
  check("the shelf starts closed after the first build",
    A.isUnlocked(G, "prototype") && !A.isUnlocked(G, "slice"));

  G.state = "menu";
  G.openArchive();
  check("archive screen opens", G.state === "archive");
  check("the shelf renders", window.document.querySelectorAll("#arcList button").length > 0);

  // A bout, played by the same greedy policy the ladder was tuned against:
  // spend what you can afford, then end the turn.
  const arcGooBefore = G.goo, arcXpBefore = G.hero.level * 100000 + G.hero.xp;
  A.start(G, "prototype");
  G.renderArchive();
  check("a bout deals an opening hand", G.archive.bout.hand.length === 5);
  let arcGuard = 0;
  while (G.archive.bout && !G.archive.bout.over && arcGuard++ < 400) {
    const b = G.archive.bout;
    const i = b.hand.findIndex(id => A.cardById(id).cost <= b.energy);
    if (i >= 0) A.play(G, i); else A.endTurn(G);
  }
  const won = G.archive.bout && G.archive.bout.over === "win";
  check("the first build can be beaten: " + (G.archive.bout ? G.archive.bout.over : "no bout"), won);

  if (won) {
    G.renderArchive();
    const options = G.archive.bout.draftOptions;
    check("a clear offers three cards", options && options.length === 3);
    G.claimArchive(options[0]);
    check("the drafted card joins the deck", G.archive.deck.length === 11);
    check("the build is filed", A.isCleared(G, "prototype"));
    check("filing a build unlocks the next one", A.isUnlocked(G, "slice"));
    check("a clear pays goo", G.goo > arcGooBefore);
    check("a clear pays xp", G.hero.level * 100000 + G.hero.xp > arcXpBefore);
    check("the bout is cleared away after claiming", G.archive.bout === null);
  }

  /* The fence, asserted the same way the Crab's is. Losing a bout must cost
     the bout and nothing else: the perimeter is still the only loop in the
     game with a stake outside itself. */
  const arcAct = G.actIdx, arcLevel = G.hero.level, arcXp = G.hero.xp;
  const arcGoo = G.goo, arcDeck = G.archive.deck.length, arcCleared = G.archive.cleared.length;
  const arcPerimeter = G.defense.perimeter;
  A.start(G, "slice");
  G.archive.bout.hp = 1;
  A.endTurn(G);          // whatever it does, it does more than 1
  check("a bout can be lost", G.archive.bout.over === "lose");
  check("losing does not touch the act ladder", G.actIdx === arcAct);
  check("losing does not touch hero level", G.hero.level === arcLevel);
  check("losing does not touch xp", G.hero.xp === arcXp);
  check("losing does not touch goo", G.goo === arcGoo);
  check("losing does not touch the deck", G.archive.deck.length === arcDeck);
  check("losing does not file the build", G.archive.cleared.length === arcCleared);
  check("losing does not touch the perimeter", G.defense.perimeter === arcPerimeter);
  check("a lost bout pays nothing", G.claimArchive(null) === undefined && G.goo === arcGoo);

  // Leaving mid-bout is free and always available.
  A.start(G, "slice");
  A.flee(G);
  check("leaving a bout abandons it", G.archive.bout === null);
  G.closeArchive();
  check("archive screen closes back to play", G.state !== "archive");

  // The deck and the shelf survive a save; a bout deliberately does not.
  G.archive.deck.push("rewrite");
  G.archive.cleared = ["prototype"];
  const arcSnap = JSON.parse(JSON.stringify(G.saveApi.snapshot(G)));
  G.archive = A.reset();
  G.saveApi.apply(G, arcSnap);
  check("the deck survives a save", G.archive.deck.indexOf("rewrite") >= 0);
  check("the shelf survives a save", A.isCleared(G, "prototype"));
  check("a save carries no bout", G.archive.bout === null);
  // A hand-edited save must not be able to smuggle a card the resolver does
  // not know how to play.
  G.saveApi.apply(G, Object.assign({}, arcSnap, { archive: { deck: ["patch", "nonsense"], cleared: ["nope"] } }));
  check("unknown cards are dropped from a restored deck", G.archive.deck.join() === "patch");
  check("unknown builds are dropped from a restored shelf", G.archive.cleared.length === 0);

  // Opening and closing the Crab's screen must restore the prior state.
  G.state = "menu";
  G.openDefense();
  check("perimeter screen opens", G.state === "tdgame");
  G.renderBuildMenu();
  G.closeDefense();
  check("perimeter screen closes back to play", G.state !== "tdgame");

  // ---- THE COMPANY (the Understudy's idle layer) ----
  const U = G.understudyApi;
  G.understudy = U.reset();
  const u = G.understudy;
  G.standing.understudy = 0;

  check("company starts with the understudy alone", Object.keys(u.members).join() === "understudy");
  check("company earns something from the start", U.rates(G).goo > 0);

  // Recruiting is the only way the roster grows, and it must be paid for.
  G.goo = 0;
  U.recruit(G, "standin");
  check("cannot recruit without goo", !U.has(G, "standin"));
  G.goo = 1000;
  const rateBefore = U.rates(G).goo;
  U.recruit(G, "standin");
  check("recruiting adds to the company", U.has(G, "standin"));
  check("recruiting raises the rate", U.rates(G).goo > rateBefore);
  check("recruiting cannot happen twice", U.recruit(G, "standin") === false);

  const lvlRate = U.rates(G).goo;
  U.upgradeMember(G, "standin");
  check("rehearsing raises the level", U.levelOf(G, "standin") === 2);
  check("rehearsing raises the rate", U.rates(G).goo > lvlRate);

  // Standing must scale the whole layer, since that is the Understudy's payoff.
  const flatRate = U.rates(G).goo;
  G.standing.understudy = 100;
  check("understudy standing raises the idle rate", U.rates(G).goo > flatRate);
  G.standing.understudy = 0;

  // Small rates must not round away to nothing every frame.
  G.goo = 0; u.accGoo = 0; u.accXp = 0; u.lifetimeGoo = 0;
  for (let i = 0; i < 600; i++) G.updateCompany(100);   // 60 seconds
  check("the company actually pays out over time", G.goo > 0);
  check("the company logs what it earned", u.lifetimeGoo > 0);
  check("the company tick throws nothing", !G._subsystemFaults);

  // ---- offline accounting: where an exploit would live ----
  u.lifetimeGoo = 0; G.goo = 0;
  u.lastAt = Date.now() - 5000;
  check("a reload is not a session away", U.applyOffline(G) === null);

  u.lastAt = Date.now() - 2 * 60 * 60 * 1000;   // two hours
  const twoHour = U.applyOffline(G);
  check("being away pays out", twoHour && twoHour.goo > 0);
  check("offline pay reaches the player", G.goo > 0);

  // The cap is what stops a week away from returning a finished run.
  G.goo = 0; u.lifetimeGoo = 0;
  u.lastAt = Date.now() - 30 * 24 * 60 * 60 * 1000;   // a month
  const capped = U.applyOffline(G);
  const capHours = U.offlineCapMs(G) / 3600000;
  check("a long absence is capped", capped && capped.ms <= U.offlineCapMs(G));
  check("the cap is reported as capped", capped && capped.capped === true);
  check("a month away pays no more than the cap", capped.goo <= U.rates(G).goo * capHours * 3600);

  // Winding the device clock backwards must not mint anything.
  G.goo = 0;
  u.lastAt = Date.now() + 10 * 60 * 60 * 1000;
  check("a future timestamp pays nothing", U.applyOffline(G) === null && G.goo === 0);

  // Claiming twice in a row must not pay twice.
  u.lastAt = Date.now() - 3 * 60 * 60 * 1000;
  U.applyOffline(G);
  const gooAfterClaim = G.goo;
  U.applyOffline(G);
  check("offline pay cannot be claimed twice", G.goo === gooAfterClaim);

  // The screen must open and close back to where it came from.
  G.state = "menu";
  G.openCompany();
  check("company screen opens", G.state === "company");
  G.renderCompany();
  G.closeCompany();
  check("company screen closes back", G.state !== "company");

  // ---- THE LEDGER (cross-run meta-progression) ----
  const L = G.ledgerApi;
  L.clear();

  check("a fresh ledger shows nothing", L.describe(L.read()) === null);
  check("a fresh ledger grants no boons", L.earned(L.read()).length === 0);
  check("a fresh ledger names what is next", !!L.next(L.read()));

  // Gates accumulate across runs, not just completed ones — that is the whole
  // premise, so it gets a direct test.
  G.actIdx = 4; G.ngPlus = 0;
  for (let i = 0; i < 3; i++) L.recordActCleared(G);
  let rec = L.read();
  check("clearing a gate is recorded", rec.actsCleared === 3);
  check("the best act reached is tracked", rec.bestAct === 5);
  check("three gates earn the first boon", L.earned(rec).length === 1);
  check("the ledger describes itself once there is history", typeof L.describe(rec) === "string");

  // Boons must actually change the run they are applied to.
  G.goo = 0;
  const applied = L.applyBoons(G);
  check("earned boons are applied", G.goo >= 40);
  check("a newly earned boon is announced once", applied.fresh.length === 1);
  const again = L.applyBoons(G);
  check("an announced boon is not announced twice", again.fresh.length === 0);

  // A deep ledger must apply every boon without any of them throwing.
  L.clear();
  G.actIdx = 7;
  for (let i = 0; i < 30; i++) L.recordActCleared(G);
  rec = L.read();
  check("a deep ledger earns every boon", L.earned(rec).length === L.Boons.length);
  check("a complete ledger has nothing left to name", L.next(rec) === null);

  G.defense = D.reset();
  G.understudy = U.reset();
  G.goo = 0; G.hero.points = 0; G.hero.nerve = 1; G.rerollDiscount = 0;
  L.applyBoons(G);
  check("every boon applies without throwing", G.goo >= 40);
  check("the company boon seats the stand-in", U.has(G, "standin"));
  check("the perimeter boon pre-digs a pad", G.defense.pads.filter(p => p.tower).length >= 2);
  check("the promotion boon grants a point", G.hero.points >= 1);
  check("the reroll boon discounts rerolls", G.rerollDiscount >= 2);
  check("the steady boon raises nerve", G.hero.nerve >= 2);
  check("every boon has a line to announce it", L.Boons.every(b => !!L.BoonLines[b.id]));

  // Durable state a user can hand-edit must degrade to "no boons", not to a
  // broken boot.
  try { window.localStorage.setItem("slop.ledger.v1", "{ not json"); } catch (e) {}
  check("a corrupt ledger reads as empty", L.read().actsCleared === 0);
  try { window.localStorage.setItem("slop.ledger.v1", JSON.stringify({ v: 99, actsCleared: 9999 })); } catch (e) {}
  check("a ledger from another version is discarded", L.read().actsCleared === 0);

  // Starting a run clears the save but must never clear the record of playing.
  L.clear();
  G.actIdx = 2;
  L.recordActCleared(G);
  G.start(false);
  check("starting a run keeps the ledger", L.read().actsCleared === 1);
  check("starting a run clears the save", window.localStorage.getItem("slop.save.v1") === null);
}
