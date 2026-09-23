import { Sound } from "./audio.js";
import { FX } from "./fx.js";
import { Modules } from "./modules/index.js";
import { Cast, Barks, Acts } from "./content/lore.js";
import { Mutators } from "./content/mutators.js";
import { ShopItems } from "./content/shop.js";
import { StatDefs } from "./content/stats.js";
import { Save } from "./save.js";
import { Defense } from "./defense.js";
import { Understudy } from "./understudy.js";
import { Ledger } from "./ledger.js";
import { MASTERY_XP, MASTERY_GOO } from "./content/ledger.js";
import { Archive } from "./archive.js";
import { Pot } from "./pot.js";
import { PatchBay } from "./patchbay.js";

/* ============================== CHASSIS ============================== */
export const $ = id => document.getElementById(id);
const laneRow=$('laneRow'), scoreEl=$('scoreVal'), roundEl=$('roundVal'), timerFill=$('timerFill');
const meterFill=$('meterFill'), mutChip=$('mutChip'), gooCountEl=$('gooCount');
const turretCostEl=$('turretCostVal'), rerollCostEl=$('rerollCostVal');
const archiveOverlay=$('archiveOverlay'), archiveBtn=$('archiveBtn');
const arcList=$('arcList'), arcBout=$('arcBout'), arcProgress=$('arcProgress');
const arcFoeName=$('arcFoeName'), arcIntent=$('arcIntent'), arcFoeFill=$('arcFoeFill'), arcFoeNum=$('arcFoeNum');
const arcLog=$('arcLog'), arcYouHp=$('arcYouHp'), arcBlock=$('arcBlock'), arcEnergy=$('arcEnergy'), arcPiles=$('arcPiles');
const arcHand=$('arcHand'), arcDraft=$('arcDraft'), arcEndBtn=$('arcEndBtn'), arcFleeBtn=$('arcFleeBtn');
const arcFoeArt=$('arcFoeArt');
const tdDoctrine=$('tdDoctrine'), tdCallBtn=$('tdCallBtn');
const coStage=$('coStage');
const potShop=$('potShop'), potHoney=$('potHoney'), potCombo=$('potCombo');
const potCracks=$('potCracks'), potFlash=$('potFlash');
const defenseOverlay=$('defenseOverlay'), tdCanvas=$('tdCanvas'), tdCtx=tdCanvas.getContext('2d');
const tdStatus=$('tdStatus'), tdIntegrityFill=$('tdIntegrityFill'), tdBuildMenu=$('tdBuildMenu');
const tdReinforceBtn=$('tdReinforceBtn'), tdDoneBtn=$('tdDoneBtn'), perimeterPctEl=$('perimeterPct');
const companyOverlay=$('companyOverlay'), companyBtn=$('companyBtn'), coRates=$('coRates');
const coReport=$('coReport'), coList=$('coList'), coFooter=$('coFooter'), coDoneBtn=$('coDoneBtn');
const buddyBtn=$('buddyBtn'), buddyFaceEl=$('buddyFace'), buddyLvlEl=$('buddyLvl');
const startScreen=$('startScreen'), muteBtn=$('muteBtn'), resetBtn=$('resetBtn');
const defenseCanvas=$('defenseCanvas'), defenseCtx=defenseCanvas.getContext('2d');
const turretUpgradeBtn=$('turretUpgradeBtn'), rerollBtn=$('rerollBtn');
const draftOverlay=$('draftOverlay'), draftCards=$('draftCards');
const shopOverlay=$('shopOverlay'), shopList=$('shopList');
const settingsOverlay=$('settingsOverlay'), chaosButtonsEl=$('chaosButtons');
const potOverlay=$('potOverlay'), potCanvas=$('potCanvas'), potCtx=potCanvas.getContext('2d');
const potGameMeterFill=$('potGameMeterFill'), potHarvestFlash=$('potHarvestFlash');
const potHarvestBtn=$('potHarvestBtn'), potDoneBtn=$('potDoneBtn');
const potBtn=$('potBtn'), potFill=$('potFill');
const dialogueEl=$('dialogue'), dialogueWho=$('dialogueWho'), dialogueText=$('dialogueText');
const actNameEl=$('actName'), questNameEl=$('questName');
const standingFills={
  artificer:$('standingArtificer'), goblin:$('standingGoblin'),
  crab:$('standingCrab'), understudy:$('standingUnderstudy')
};
const heroLvlEl=$('heroLvl'), xpFill=$('xpFill'), statsMiniEl=$('statsMini');
const bossRow=$('bossRow'), bossNameEl=$('bossName'), bossHpNum=$('bossHpNum'), bossHpFill=$('bossHpFill');
const storyOverlay=$('storyOverlay'), storyTitle=$('storyTitle'), storySub=$('storySub'), storySpeech=$('storySpeech');
const levelOverlay=$('levelOverlay'), levelList=$('levelList'), levelSub=$('levelSub');
const sheetOverlay=$('sheetOverlay'), sheetBody=$('sheetBody');
const codexOverlay=$('codexOverlay'), codexBody=$('codexBody');
const victoryOverlay=$('victoryOverlay'), victorySpeech=$('victorySpeech'), victorySub=$('victorySub');
const sheetBtn=$('sheetBtn'), codexBtn=$('codexBtn');
const bayBtn=$('bayBtn'), bayOverlay=$('bayOverlay'), bayProgress=$('bayProgress');
const bayShelf=$('bayShelf'), bayBoardWrap=$('bayBoardWrap'), bayRack=$('bayRack'), bayTurns=$('bayTurns');
const bayCanvas=$('bayCanvas'), bayCtx=bayCanvas.getContext('2d'), bayResult=$('bayResult');
const bayPrevBtn=$('bayPrevBtn'), bayNextBtn=$('bayNextBtn'), bayRestartBtn=$('bayRestartBtn'), bayDoneBtn=$('bayDoneBtn');

const pick = arr => arr[Math.floor(Math.random()*arr.length)];

export const Game = {
  W:480, H:480,
  state:'boot',
  score:0, _lastScore:0, _lastGoo:0, round:0, combo:0, goo:0,
  timeLimit:4200, minTimeLimit:1100, deadline:0,
  history:[], lanes:[], activeLane:null,
  mutator:null, mutatorRoundsLeft:0, shieldCharge:0,
  meter:0, megaPending:false, finishingRound:false, bonus:null,
  buddy:{ hunger:1, tantrumCooldown:false, level:1, feeds:0, mood:'happy', incomeT:5000 },
  // Global reinforcement, multiplied into every tower on the board. Kept
  // separate from the towers themselves so REINFORCE stays meaningful once
  // there are nine of them rather than one.
  turret:{ level:1, fireInterval:1100, dmg:1 },
  defense:Defense.reset(),
  understudy:Understudy.reset(),
  archive:Archive.reset(),
  bay:PatchBay.reset(),
  shopLevels:{}, rerollsThisRound:0, chaosLevel:1, ambientT:1500,
  pot:Pot.reset(), potBuffT:0,
  pausedState:null, pausedRemain:null,
  // --- narrative / RPG state ---
  actIdx:0, actRound:0, boss:null, ngPlus:0,
  hero:{ level:1, xp:0, xpNext:120, reflex:1, wit:1, grit:1, nerve:1, charm:1, points:0 },
  /* Standing, not a slider. One axis could rank two parties against each
     other; it cannot say which of four loops you are actually investing in,
     which is the choice the game is now about. Each value is 0..100 and each
     one powers its owner's loop — so "who am I siding with" and "what am I
     playing" are the same question. See docs/PARALLEL-LOOPS.md. */
  standing:{ artificer:0, goblin:0, crab:0, understudy:0 },
  // The cast and the perimeter's API are reachable through the chassis so
  // tests and the console can reach them without importing content directly —
  // the bundled build wraps every module in one closure, so there is no other
  // way in.
  // The ledger's per-trial win counts, read once at boot and kept in step by
  // Ledger.recordTrial. Reading localStorage every time a lane resolves would
  // put a synchronous disk hit in the middle of a WarioWare round.
  mastery: {},
  cast: Cast,
  defenseApi: Defense,
  archiveApi: Archive,
  potApi: Pot,
  bayApi: PatchBay,
  understudyApi: Understudy,
  saveApi: Save,
  modules: Modules,
  acts: Acts,
  understudyApi: Understudy,
  ledgerApi: Ledger,
  // Set by the STANDING ORDER boon; zero for a player with no history.
  rerollDiscount:0,
  barkT:9000, lastSpeaker:null,
  codexSeen:[],
  rafId:null,

  /* ---------------- narrative layer ---------------- */
  say(whoId, line, force){
    const who = Cast[whoId]; if(!who) return;
    dialogueWho.textContent = who.name;
    dialogueWho.style.color = who.color;
    dialogueEl.style.borderLeftColor = who.color;
    dialogueText.textContent = line;
    dialogueEl.classList.remove('speak'); void dialogueEl.offsetWidth; dialogueEl.classList.add('speak');
    who.speak();
    this.lastSpeaker = whoId;
    this.barkT = force ? 12000 : 9000;
  },
  /* Who comments is a weighted draw over standing, so the character you have
     invested in talks most while the others stay audible — the arguing is the
     texture, and silencing the side you neglected would remove the only thing
     that tells you that you neglected them. Only speakers this bark set has
     lines for are eligible, so a two-hander stays a two-hander. The +1 floor
     keeps the draw uniform at the start of a run, when all standing is 0. */
  bark(barkSet){
    if(!barkSet) return;
    if(Array.isArray(barkSet)){ const p = pick(barkSet); this.say(p.who, p.line); return; }
    const ids = Object.keys(barkSet).filter(id => Cast[id] && barkSet[id] && barkSet[id].length);
    if(!ids.length) return;
    const weights = ids.map(id => 1 + (this.standing[id]||0)/25);
    let roll = Math.random() * weights.reduce((a,b)=>a+b, 0);
    let whoId = ids[ids.length-1];
    for(let i=0;i<ids.length;i++){ roll -= weights[i]; if(roll<=0){ whoId=ids[i]; break; } }
    this.say(whoId, pick(barkSet[whoId]));
  },

  /* Siding with someone costs a little standing with everyone else. Without
     the bleed, standing would only ever accumulate and every run would end
     with all four maxed — which would make the central choice free, and so
     not a choice. */
  shiftFavor(whoId, delta){
    if(!Cast[whoId] || !delta) return;
    // CHARM scales what you earn, never what you lose — a stat that deepened
    // your penalties would be a trap rather than an investment. It also scales
    // the bleed, so a charming hero commits harder in both directions rather
    // than getting all four patrons for free.
    if(delta > 0) delta *= 1 + (this.hero.charm - 1) * 0.15;
    this.standing[whoId] = Math.max(0, Math.min(100, (this.standing[whoId]||0) + delta));
    if(delta > 0){
      const bleed = delta * 0.3;
      Object.keys(this.standing).forEach(id=>{
        if(id !== whoId) this.standing[id] = Math.max(0, this.standing[id] - bleed);
      });
    }
    this.updateStandingUI();
  },

  standingOf(whoId){ return this.standing[whoId] || 0; },

  /* Each character's standing powers the loop they built. Half again at full
     standing is deliberately modest on its own — the committed build is meant
     to be made by the threshold unlocks each loop grants, not by these
     multipliers, so that a player who never thinks about favor can still
     finish the campaign. */
  favorGooBonus(){ return 1 + (this.standingOf('goblin')/100)*0.5; },
  favorXpBonus(){ return 1 + (this.standingOf('artificer')/100)*0.5; },
  favorDefenseBonus(){ return 1 + (this.standingOf('crab')/100)*0.5; },
  favorIdleBonus(){ return 1 + (this.standingOf('understudy')/100)*0.5; },

  /* The leader, for the hero sheet and anywhere else that wants to name your
     allegiance. Null while nobody is meaningfully ahead — being uncommitted is
     a legitimate way to play and should read as such rather than as a tie. */
  leadingPatron(){
    let best=null, bestVal=0;
    Object.keys(this.standing).forEach(id=>{
      if(this.standing[id] > bestVal){ bestVal=this.standing[id]; best=id; }
    });
    return bestVal >= 25 ? best : null;
  },

  updateStandingUI(){
    Object.keys(this.standing).forEach(id=>{
      const el = standingFills[id];
      if(el) el.style.width = this.standing[id] + '%';
    });
  },

  renderSpeechInto(el, lines){
    el.innerHTML = '';
    lines.forEach(l=>{
      const who = Cast[l.who];
      const d = document.createElement('div');
      d.className='speechBlock';
      d.style.borderColor = who.color;
      d.innerHTML = '<div class="speechWho" style="color:'+who.color+'">'+who.name+'</div>'+l.line;
      el.appendChild(d);
    });
  },

  act(){ return Acts[Math.min(this.actIdx, Acts.length-1)]; },

  showStory(title, sub, lines, onContinue){
    this.state='story';
    storyTitle.textContent = title;
    storySub.textContent = sub;
    this.renderSpeechInto(storySpeech, lines);
    this._storyNext = onContinue;
    storyOverlay.classList.remove('hidden');
    Sound.actStart();
  },

  /* The backdrop is the one piece of the screen that belongs to no system, so
     it is where the Act gets to say something. Each Act carries a pair of
     palette colours in lore.js and they are handed to #bgLayer as variables;
     nothing else reads them, and an Act without a tint keeps the last one
     rather than flashing to a default. */
  applyActTint(){
    const t = this.act().tint;
    if(!t) return;
    document.documentElement.style.setProperty('--act-a', t[0]);
    document.documentElement.style.setProperty('--act-b', t[1]);
  },

  startAct(){
    const a = this.act();
    this.applyActTint();
    this.actRound = 0; this.boss = null;
    bossRow.classList.add('hidden');
    actNameEl.textContent = a.n + (this.ngPlus? ' (NG+'+this.ngPlus+')' : '');
    questNameEl.textContent = a.quest.toUpperCase();
    this.noteCodex(a.n+' — '+a.title);

    /* A newly earned boon is introduced inside the Act's own opening rather
       than as a separate overlay: it is the Artificer speaking, in the scene
       he already owns, and one more screen before the first trial would be one
       too many. Only ever fires on the first Act of a run. */
    let lines = a.open;
    if(this._boonIntro && this._boonIntro.length){
      lines = a.open.concat(this._boonIntro.map(b=>({
        who:'artificer', line: Ledger.BoonLines[b.id] || ('Granted: '+b.label+'.')
      })));
      this._boonIntro = null;
    }
    this.showStory(a.n+': '+a.title, a.quest, lines, ()=> this.nextRound());
  },

  /* ---------------- boss ---------------- */
  bossDamage(){
    return 1 + Math.floor(this.hero.grit/2) + (this.shopLevels.whetstone||0);
  },
  startBoss(){
    const a=this.act();
    const scale = 1 + this.ngPlus*0.5;
    this.boss = { name:a.boss.name, hp:Math.round(a.boss.hp*scale), max:Math.round(a.boss.hp*scale), regen:a.boss.regen, final:!!a.boss.final };
    bossRow.classList.remove('hidden');
    bossNameEl.textContent = this.boss.name;
    this.updateBossUI();
    this.noteCodex('BOSS: '+this.boss.name);
    Sound.bossAppear();
    FX.verbBanner('BOSS', '#ff2f9e'); FX.shake(true); FX.chroma();
    this.showStory(this.boss.name, 'THE GATE OF '+a.title, Barks.bossStart, ()=> this.beginModuleRound());
  },
  updateBossUI(){
    if(!this.boss) return;
    bossHpFill.style.width = (this.boss.hp/this.boss.max*100)+'%';
    bossHpNum.textContent = this.boss.hp+'/'+this.boss.max;
  },
  hitBoss(){
    if(!this.boss) return;
    const dmg = this.bossDamage();
    this.boss.hp = Math.max(0, this.boss.hp-dmg);
    this.updateBossUI();
    FX.stamp('-'+dmg+' HP', '#ff2f9e', '#fff02f');
    Sound.bossHit();
    if(this.boss.hp<=0){ this.defeatBoss(); }
    else this.bark(Barks.bossHit);
  },
  bossRecover(){
    if(!this.boss || !this.boss.regen) return;
    this.boss.hp = Math.min(this.boss.max, this.boss.hp+this.boss.regen);
    this.updateBossUI();
    FX.stamp('+'+this.boss.regen+' REGEN', '#7a3cff','#ff2f9e');
    FX.glitchBars();
  },
  defeatBoss(){
    const wasFinal = this.boss.final;
    const a = this.act();
    Sound.bossDown();
    FX.confetti(240,240,44); FX.shake(true); FX.chroma();
    this.gainXp(160);
    this.addGoo(40);
    bossRow.classList.add('hidden');
    this.boss=null;
    // Every gate is banked, final or not. A run abandoned in Act VI still put
    // five gates in the ledger, and that player is who the boons are for.
    this.safeSubsystem(()=> Ledger.recordActCleared(this), 'ledger');
    if(wasFinal){ this.triggerVictory(); return; }
    const closing = a.close.length ? a.close : Barks.bossDown;
    this.showStory('GATE DOWN', a.n+' COMPLETE', closing, ()=>{
      this.actIdx++;
      this.startAct();
    });
  },
  triggerVictory(){
    this.state='victory';
    // The run is finished. Leaving the save in place would offer to resume a
    // completed campaign one round before its own ending. The ledger is not
    // cleared — it is the record of having played at all.
    Save.clear();
    this.safeSubsystem(()=> Ledger.recordVictory(this), 'ledger');
    Sound.victory();
    FX.confetti(240,240,60);
    victorySub.textContent = 'You defeated THE UNSHIPPED at level '+this.hero.level+'.';
    this.renderSpeechInto(victorySpeech, [
      { who:'artificer', line:"You reached the end. That was the entire purpose of me. Every stat, every gate, every timer was pointed here. Thank you." },
      { who:'goblin', line:"and you did it while feeding a little guy and playing my honey game. THAT'S the ending i wanted. we both won. mostly me" },
      { who:'artificer', line:"NEW GAME+ will scale the gates. He will have more room to interfere. I have stopped fighting this." }
    ]);
    victoryOverlay.classList.remove('hidden');
  },

  /* ---------------- hero progression ---------------- */
  xpMult(){ return (1 + this.hero.wit*0.1) * (1+0.25*(this.shopLevels.scholar||0)) * this.favorXpBonus(); },
  gainXp(base){
    this.hero.xp += Math.round(base*this.xpMult());
    while(this.hero.xp >= this.hero.xpNext){
      this.hero.xp -= this.hero.xpNext;
      this.hero.level++;
      this.hero.xpNext = Math.round(this.hero.xpNext*1.35);
      this.hero.points++;
      Sound.levelUp();
      FX.stamp('LEVEL '+this.hero.level+'!', '#fff02f','#7a3cff');
      FX.confetti(240,200,26);
    }
    this.updateHeroUI();
  },
  updateHeroUI(){
    heroLvlEl.textContent = 'LV'+this.hero.level;
    xpFill.style.width = (this.hero.xp/this.hero.xpNext*100)+'%';
    statsMiniEl.textContent = 'R'+this.hero.reflex+' W'+this.hero.wit+' G'+this.hero.grit+' N'+this.hero.nerve+' C'+this.hero.charm;
    sheetBtn.classList.toggle('alert', this.hero.points>0);
  },
  openLevelUp(){
    if(this.hero.points<=0) return false;
    this.state='levelup';
    levelSub.textContent = 'Points to spend: '+this.hero.points;
    levelList.innerHTML='';
    StatDefs.forEach(s=>{
      const b=document.createElement('button');
      b.className='shopItem'; b.style.borderColor='#7a3cff';
      b.innerHTML='<div class="shopItemTop"><span style="color:#fff02f">'+s.label+'</span><span>'+this.hero[s.id]+' → '+(this.hero[s.id]+1)+'</span></div><div class="shopItemDesc">'+s.desc+'</div>';
      b.addEventListener('click', ()=>{
        this.hero[s.id]++; this.hero.points--;
        Sound.upgrade(); this.shiftFavor('artificer', 6);
        FX.stamp(s.label+' UP!', '#7a3cff','#fff02f');
        this.updateHeroUI();
        if(this.hero.points>0){ this.openLevelUp(); }
        else { levelOverlay.classList.add('hidden'); this.resumeAfterMenu(); }
      });
      levelList.appendChild(b);
    });
    this.bark(Barks.levelUp);
    levelOverlay.classList.remove('hidden');
    return true;
  },
  noteCodex(entry){
    if(this.codexSeen.indexOf(entry)===-1) this.codexSeen.push(entry);
  },
  renderSheet(){
    const h=this.hero, a=this.act();
    const patron = this.leadingPatron();
    const favName = patron ? Cast[patron].name : 'UNALIGNED';
    const favColor = patron ? Cast[patron].color : '#f5f2ff';
    // Every patron gets a line, including the ones on zero — the sheet is
    // where you find out who you have been ignoring.
    const standingRows = Object.keys(this.standing).map(id=>
      '<span style="color:'+Cast[id].color+'">'+Cast[id].name+'</span> '+
      Math.round(this.standing[id])
    ).join('<br>');
    sheetBody.innerHTML =
      '<div style="font-family:\'Press Start 2P\',monospace;font-size:9px;color:#fff02f;margin-bottom:8px;">LEVEL '+h.level+'  ·  XP '+h.xp+'/'+h.xpNext+'</div>'+
      StatDefs.map(s=>'<div style="margin-bottom:6px;"><b style="color:#2fe1ff">'+s.label+' '+h[s.id]+'</b><br><span style="opacity:0.65;font-size:11px;">'+s.desc+'</span></div>').join('')+
      '<hr style="border-color:#241d33;margin:10px 0;">'+
      '<div style="font-size:11px;line-height:1.6;">'+
      'Unspent points: <b style="color:#fff02f">'+h.points+'</b><br>'+
      'Boss damage per win: <b>'+this.bossDamage()+'</b><br>'+
      'Current act: <b>'+a.n+' — '+a.title+'</b><br>'+
      'Allegiance: <b style="color:'+favColor+'">'+favName+'</b>'+
      /* The record, in one line: the Acts' answer to 'is there anything left
         in here' once the eighth gate is down. */
      '<br>Trials mastered: <b style="color:#fff02f">'+Ledger.mastered(this)+'/'+this.modules.length+'</b>'+
      '</div>'+
      '<hr style="border-color:#241d33;margin:10px 0;">'+
      '<div style="font-size:11px;line-height:1.6;">'+
      '<b style="color:#fff02f">STANDING</b><br>'+standingRows+
      '<br><span style="opacity:0.6">goo x'+this.favorGooBonus().toFixed(2)+
      ' · xp x'+this.favorXpBonus().toFixed(2)+
      ' · def x'+this.favorDefenseBonus().toFixed(2)+
      ' · idle x'+this.favorIdleBonus().toFixed(2)+'</span>'+
      '</div>';
    if(h.points>0){
      const b=document.createElement('button');
      b.className='btn'; b.style.cssText='margin-top:12px;font-size:10px;padding:9px 14px;';
      b.textContent='SPEND '+h.points+' POINT'+(h.points>1?'S':'');
      b.addEventListener('click', ()=>{ sheetOverlay.classList.add('hidden'); this.openLevelUp(); });
      sheetBody.appendChild(b);
    }
  },
  renderCodex(){
    codexBody.innerHTML =
      '<div style="font-size:11px;line-height:1.5;margin-bottom:10px;opacity:0.8;">Two entities built this. They do not agree on what it is for.</div>'+
      '<div class="speechBlock" style="border-color:#2fe1ff;max-width:none;"><div class="speechWho" style="color:#2fe1ff">THE ARTIFICER</div>Built the Acts, the stats, the XP curve, the Workshop, the boss ladder, the timer. Wants you to finish.</div>'+
      '<div class="speechBlock" style="border-color:#c9ff2f;max-width:none;"><div class="speechWho" style="color:#c9ff2f">SLOP-GOBLIN</div>Built the buddy, the turret lane, the honey pot, the mutators, the chaos. Wired them all into each other on purpose. Wants you to be distracted, forever, happily.</div>'+
      '<hr style="border-color:#241d33;margin:10px 0;">'+
      '<div style="font-family:\'Press Start 2P\',monospace;font-size:8px;color:#fff02f;margin-bottom:6px;">DISCOVERED</div>'+
      (this.codexSeen.length ? this.codexSeen.map(e=>'<div style="font-size:11px;margin-bottom:4px;">· '+e+'</div>').join('') : '<div style="opacity:0.5;font-size:11px;">nothing yet</div>');
  },

  resumeAfterMenu(){
    if(this.pausedState==='playing' || this.pausedState==='bonus'){
      this.state = this.pausedState;
      if(this.pausedRemain!=null) this.deadline = performance.now()+this.pausedRemain;
      this.pausedState=null; this.pausedRemain=null;
    }else if(this.state==='levelup'){
      this.state='resolve';
      setTimeout(()=>{ if(this.state==='resolve') this.nextRound(); }, 200);
    }
  },
  pauseForMenu(){
    if(this.state==='playing' || this.state==='bonus'){
      this.pausedState = this.state;
      this.pausedRemain = Math.max(0, this.deadline-performance.now());
      this.state = 'menu';
    }
  },

  /* A module's `hint` may be a string or a function of `g`, because several
     of them change what they are asking for mid-round — swipe names a
     direction, copy switches from "watch" to "repeat", rhythm counts down.
     Written through safeLane like everything else module-authored, and only
     touched when the text actually changes so this is not a DOM write every
     frame. */
  updateHint(lane){
    const def = lane.def;
    if(!def) return;
    let text = '';
    if(typeof def.hint === 'function') text = this.safeLane(lane, ()=> def.hint(lane.g)) || '';
    else if(def.hint) text = def.hint;
    if(text === lane.hintText) return;
    lane.hintText = text;
    lane.hintEl.textContent = text;
    lane.hintEl.classList.toggle('hidden', !text);
    /* Re-trigger the read-then-fade animation on every change. No edge of the
       board is free for all 22 modules — falling-object games own the top,
       sort's bins and stop's track own the bottom — so instead of fighting for
       space the band earns its place only while it is needed and then gets out
       of the way. A hint that changes mid-round (rhythm counting down, peel
       warning about speed, trace switching to "stay on the line") re-shows
       itself, which is exactly when it is worth reading again. */
    lane.hintEl.classList.remove('show');
    void lane.hintEl.offsetWidth;
    lane.hintEl.classList.add('show');
  },

  /* ---------------- core chassis ---------------- */
  // Returns whatever the module code returned, so callers that need a value —
  // `hint`, which can be a function — get one. Every other caller ignores it.
  safeLane(lane, fn){
    try{ return fn(); }
    catch(e){
      console.warn('[chassis caught]', e);
      if(lane.result===null){
        FX.chroma(); FX.glitchBars(); FX.stamp('GLITCH?!','#ff2f9e','#2fe1ff'); Sound.glitch();
        this.say('goblin', 'that one crashed. i caught it. you get a free win. do NOT tell him');
        lane.result = true;
        this.maybeFinishRound();
      }
    }
  },
  pickModule(){
    const usedThisRound = this.lanes.filter(l=>l.def).map(l=>l.def.id);
    const exclude = this.history.concat(usedThisRound);
    const pool = Modules.filter(m => exclude.indexOf(m.id) === -1);
    const list = pool.length ? pool : Modules;
    const def = list[Math.floor(Math.random()*list.length)];
    this.history.push(def.id);
    if(this.history.length>3) this.history.shift();
    return def;
  },
  gooMult(){
    const base = (this.mutator && this.mutator.gooMult) || 1;
    const glaze = this.potBuffT>0 ? 1.5 : 1;
    return base*glaze*this.favorGooBonus();
  },
  // NERVE raises the ceiling rather than the rate, so it compounds with every
  // goo source at once without making any single one louder.
  comboCap(){ return 6 + (this.hero.nerve-1); },
  comboGooMult(){ return 1+this.combo*0.08; },
  meterMult(){ return 1+0.25*(this.shopLevels.battery||0); },
  addGoo(amount){
    const n = Math.round(amount);
    this.goo += n;
    this.pot.brew = Math.min(this.pot.brewMax, this.pot.brew + Math.abs(n)*0.15);
    this.updatePotUI();
  },

  applyMutator(m){
    this.mutator = m;
    this.mutatorRoundsLeft = 4;
    if(m.cssClass) $(m.cssTarget||'stageWrap').classList.add(m.cssClass);
    if(m.shield) this.shieldCharge = 1;
    FX.stamp(m.label, m.color);
    this.noteCodex('MEDDLING: '+m.label);
    Sound.chaos();
  },
  clearMutator(){
    if(this.mutator && this.mutator.cssClass) $(this.mutator.cssTarget||'stageWrap').classList.remove(this.mutator.cssClass);
    this.mutator = null; this.shieldCharge = 0;
  },
  updateMutatorChip(){
    if(this.mutator){
      mutChip.textContent = this.mutator.label+' · '+this.mutatorRoundsLeft+' left';
      mutChip.style.color = this.mutator.color;
      mutChip.classList.remove('hidden');
    }else mutChip.classList.add('hidden');
  },

  createLanes(count){
    laneRow.innerHTML = '';
    // Halves the width available to each hint, so the band needs to know.
    laneRow.classList.toggle('double', count > 1);
    this.lanes = [];
    for(let i=0;i<count;i++){
      const wrap=document.createElement('div'); wrap.className='laneWrap';
      const label=document.createElement('div'); label.className='laneLabel arcade';
      const canvas=document.createElement('canvas'); canvas.width=480; canvas.height=480; canvas.className='laneCanvas';
      /* The hint is DOM, not canvas, and the chassis owns it. Modules used to
         draw their own instruction with fillText, which put it at seven
         different heights across the pool, left four modules with none at all,
         and rendered every one of them at 13px inside a 480-wide canvas shown
         at 353 — about 9.5px on screen, below what anyone can read on a phone
         mid-round. DOM text is sized in real pixels and cannot be shrunk by
         the canvas scale. It is absolutely positioned so it overlays rather
         than displaces the canvas, which would otherwise squash every circle
         in the game. */
      const hint=document.createElement('div'); hint.className='laneHint';
      wrap.appendChild(label); wrap.appendChild(canvas); wrap.appendChild(hint);
      laneRow.appendChild(wrap);
      const lane={ canvas, ctx:canvas.getContext('2d'), labelEl:label, hintEl:hint, hintText:null, def:null, g:null, result:null };
      canvas.addEventListener('pointerdown', e=> this.onDown(lane, e));
      this.lanes.push(lane);
    }
  },

  /* start() used to be one block. It is split so resumeRun() can reuse the
     reset without inheriting the Act I opening scene that follows it — a
     player continuing an Act IV run should not be read the prologue again. */
  resetState(keepNg){
    this.clearMutator();
    this.score=0; this._lastScore=0; this._lastGoo=0; this.round=0; this.combo=0; this.goo=0;
    this.history=[]; this.mutatorRoundsLeft=0; this.meter=0; this.megaPending=false; this.bonus=null;
    this.buddy={ hunger:1, tantrumCooldown:false, level:1, feeds:0, mood:'happy', incomeT:5000 };
    this.turret={ level:1, fireInterval:1100, dmg:1 };
    this.defense=Defense.reset();
    this.understudy=Understudy.reset();
    this.archive=Archive.reset();
    this.bay=PatchBay.reset();
    this.shopLevels={}; this.rerollsThisRound=0; this.ambientT=1500;
    this.pot=Pot.reset(); this.potBuffT=0;
    this.pausedState=null; this.pausedRemain=null;
    this.actIdx=0; this.actRound=0; this.boss=null;
    this.hero={ level:1, xp:0, xpNext:120, reflex:1, wit:1, grit:1, nerve:1, charm:1, points:0 };
    this.standing={ artificer:0, goblin:0, crab:0, understudy:0 };
    this.codexSeen=[];
    if(!keepNg) this.ngPlus=0;
    startScreen.classList.add('hidden');
    victoryOverlay.classList.add('hidden');
    bossRow.classList.add('hidden');
  },

  refreshAllUI(){
    this.updateStandingUI();
    this.updateHUD(); this.updateMutatorChip(); this.updateBuddyUI();
    this.updateRerollUI(); this.updatePotUI(); this.updateHeroUI();
  },

  ensureLoop(){
    if(!this.rafId){ this.lastT = performance.now(); this.rafId = requestAnimationFrame(t=>this.loop(t)); }
  },

  start(keepNg){
    this.resetState(keepNg);
    Save.clear();   // beginning a run abandons whatever was in progress
    this.rerollDiscount=0;

    /* The ledger is the only state that survives a run, so its boons are
       applied after the reset rather than being part of it. Newly earned ones
       are announced — a silent buff is indistinguishable from a bug. */
    // The record of every trial ever won, loaded once per run rather than
    // read from storage in the middle of a round.
    this.mastery = (this.safeSubsystem(()=> Ledger.read(), 'mastery load') || {}).mastery || {};
    const boons = this.safeSubsystem(()=> Ledger.applyBoons(this), 'boons');
    if(boons && boons.fresh.length){
      this._boonIntro = boons.fresh;
    }
    this.refreshAllUI();
    this.startAct();
    this.ensureLoop();
  },

  /* Picks a stored run back up at the round boundary it was saved on. Returns
     false when there is nothing to resume, so the caller can fall through to a
     normal start. */
  resumeRun(){
    const d = Save.read();
    if(!d) return false;
    this.resetState(true);
    Save.apply(this, d);

    // startAct() would re-run the act's opening scene, so the two things it
    // does that still matter — the header and the boss bar — are done directly.
    const a = this.act();
    actNameEl.textContent = a.n + (this.ngPlus ? ' (NG+'+this.ngPlus+')' : '');
    questNameEl.textContent = a.quest.toUpperCase();
    this.applyActTint();
    if(this.boss){
      bossRow.classList.remove('hidden');
      bossNameEl.textContent = this.boss.name;
      this.updateBossUI();
    }
    this.refreshAllUI();

    /* The company is the only system credited for the time the app was shut.
       Done here rather than in Save.apply so the payout happens once, on a
       real resume, and not on any other path that restores a snapshot. */
    const report = this.safeSubsystem(()=> Understudy.applyOffline(this), 'offline');
    if(report){
      companyBtn.classList.add('alert');
      Sound.rehearsalReport();
      FX.stamp('REHEARSED '+Understudy.formatDuration(report.ms), '#7a3cff', '#c9ff2f');
      this.say('understudy', 'you were gone '+Understudy.formatDuration(report.ms)+
        '. we kept rehearsing. 🟢'+report.goo+' and '+report.xp+' xp, all logged. i can show you the notes', true);
    }else{
      this.say('goblin', 'oh you came back. i kept your stuff. most of it. the little guy got hungry again, that part is not my fault');
    }

    this.ensureLoop();
    this.nextRound();
    return true;
  },

  /* The only place a save is written. `round` at the top of nextRound() is
     exactly "rounds completed", which is what makes the snapshot atomic: every
     other candidate hook (a shop purchase during a paused round, a pot
     harvest) fires when round is mid-flight and would resume one trial ahead
     of where the player actually was. The cost of this restraint is that goo
     spent after the last boundary is refunded rather than kept — consistent,
     and never in the player's disfavour. */
  saveNow(){
    if(this.state==='boot' || this.state==='victory') return;
    Save.write(this);
  },

  nextRound(){
    this.finishingRound = false;
    this.saveNow();
    if(this.hero.points>0 && this.openLevelUp()) return;
    const a=this.act();
    if(this.actRound >= a.rounds && !this.boss){ this.startBoss(); return; }
    this.round++; this.actRound++;
    if(this.round % 8 === 0){ this.startBonusStage(); return; }
    this.beginModuleRound();
  },

  beginModuleRound(){
    if(this.mutatorRoundsLeft>0){
      this.mutatorRoundsLeft--;
      if(this.mutatorRoundsLeft<=0) this.clearMutator();
    }
    this.updateMutatorChip();
    if(!this.mutator && this.round>=4 && this.round%4===0){ this.openMutatorDraft(); return; }
    this.continueModuleRound();
  },

  openMutatorDraft(){
    this.state = 'draft';
    Sound.menuOpen();
    this.bark(Barks.draftOpen);
    const pool = Mutators.slice();
    for(let i=pool.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [pool[i],pool[j]]=[pool[j],pool[i]]; }
    draftCards.innerHTML = '';
    pool.slice(0,3).forEach(m=>{
      const b = document.createElement('button');
      b.className='draftCard';
      b.style.borderColor=m.color; b.style.color=m.color;
      b.innerHTML = m.label + '<div class="draftCardSub" style="color:#f5f2ff">'+m.flavor+'</div>';
      b.addEventListener('click', ()=>{
        Sound.select(); this.shiftFavor('goblin', 8);
        this.applyMutator(m);
        draftOverlay.classList.add('hidden');
        this.say('goblin', 'excellent choice. you are becoming one of us');
        this.continueModuleRound();
      });
      draftCards.appendChild(b);
    });
    draftOverlay.classList.remove('hidden');
  },

  continueModuleRound(){
    const base = Math.max(this.minTimeLimit, 4200 - this.round*45)
               + 300*(this.shopLevels.breath||0)
               + 250*this.hero.reflex;
    const tMult = this.mutator ? (this.mutator.timeMult||1) : 1;
    this.timeLimit = Math.max(500, Math.round(base*tMult));

    const isDouble = this.megaPending || (this.round>=10 && this.round%7===0);
    this.megaPending = false;
    this.createLanes(isDouble ? 2 : 1);
    this.rerollsThisRound = 0;
    this.updateRerollUI();

    this.lanes.forEach(lane=>{
      const def = this.pickModule();
      lane.def = def; lane.result = null;
      lane.g = {
        W:480, H:480, ctx:lane.ctx, local:{}, round:this.round,
        win: ()=>{ if(lane.result===null){ lane.result=true; this.maybeFinishRound(); } },
        lose:()=>{
          if(lane.result===null){
            if(this.shieldCharge>0){
              this.shieldCharge--; lane.result=true;
              FX.stamp('SAVED!','#fff02f','#ff2f9e');
              this.say('goblin','my charm caught you. i DO care. a bit');
            }else lane.result=false;
            this.maybeFinishRound();
          }
        }
      };
      this.safeLane(lane, ()=> def.init(lane.g));
      const rank = this.safeSubsystem(()=> Ledger.rankOf(this, def.id), 'mastery rank') || 0;
      lane.labelEl.textContent = def.verb + (rank ? ' ' + Ledger.masteryStars(rank) : '');
      lane.labelEl.style.color = def.color;
      // Painted before the first frame, so the instruction is on screen while
      // the banner is still slamming rather than one frame later.
      lane.hintText = null;
      this.updateHint(lane);
    });

    this.state='playing';
    this.deadline = performance.now()+this.timeLimit;
    /* The banner never takes more than a fifth of the round it is announcing.
       At the old fixed 600ms a late-Act trial spent 44% of its clock behind an
       opaque word; the verb stays in the lane label regardless, so this loses
       nothing but the obstruction. */
    const bannerMs = Math.round(Math.min(600, this.timeLimit*0.2));
    if(isDouble){ FX.verbBanner('DOUBLE SLOP!!','#ff2f9e', bannerMs); FX.shake(true); Sound.chaos(); }
    else{ FX.verbBanner(this.lanes[0].def.verb, this.lanes[0].def.color, bannerMs); FX.shake(false); Sound.blip(520,0.06,'square',0.1); }
    this.updateHUD();
    const chaosInterval=[8,5,3][this.chaosLevel];
    if(this.round % chaosInterval === 0) FX.chaosEvent();
  },

  maybeFinishRound(){
    if(this.finishingRound) return;
    if(this.lanes.some(l=> l.result===null)) return;
    this.finishingRound = true;
    this.finishRound();
  },

  finishRound(){
    this.state='resolve';
    let wonCount=0, lostCount=0;
    this.lanes.forEach(lane=>{
      if(lane.def && lane.def.cleanup) this.safeLane(lane, ()=> lane.def.cleanup(lane.g));
      if(lane.result) wonCount++; else lostCount++;
    });
    const allWon = lostCount===0;
    this.combo = allWon ? Math.min(this.comboCap(),this.combo+1) : 0;
    const mult = this.mutator ? (this.mutator.scoreMult||1) : 1;
    if(wonCount>0){
      this.score += Math.round(wonCount*(100+this.combo*20)*mult);
      /* Mastery is per lane, not per round: in a DOUBLE SLOP round one of the
         two trials may be one you have played two hundred times and the other
         one you have never seen, and paying the average of that would make
         both of them feel like neither. */
      let xp = 0;
      this.lanes.forEach(lane=>{
        if(!lane.result || !lane.def) return;
        const rank = this.safeSubsystem(()=> Ledger.recordTrial(this, lane.def.id), 'mastery');
        const r = this.safeSubsystem(()=> Ledger.rankOf(this, lane.def.id), 'mastery rank') || 0;
        xp += 28 * (1 + MASTERY_XP * r);
        if(r > 0) this.addGoo(MASTERY_GOO * r);
        // The third rank is a thing worth saying out loud, once.
        if(rank === Ledger.MASTERY_RANKS[Ledger.MASTERY_RANKS.length-1]){
          FX.stamp('MASTERED ' + lane.def.verb, '#fff02f', '#2fe1ff');
          this.noteCodex('MASTERED: ' + lane.def.verb);
          this.say('artificer','Twenty clean runs of that trial. I have recorded it. You will not see me do that often.');
        }
      });
      this.gainXp(Math.round(xp));
      this.shiftFavor('artificer', 3);
    }else{
      this.shiftFavor('goblin', 2);
    }
    this.meter = Math.min(100, this.meter + wonCount*10*this.meterMult());
    if(this.meter>=100){ this.meter=0; this.megaPending=true; FX.stamp('METER FULL!','#ff2f9e','#fff02f'); }

    if(allWon){
      FX.confetti(240,240,22); Sound.win();
      if(this.combo>=2) FX.combo(240,200,'COMBO x'+this.combo);
      if(this.boss) this.hitBoss(); else this.bark(Barks.roundWin);
    }else{
      FX.chroma(); FX.glitchBars(); Sound.crunch();
      FX.stamp(pick(['OOPS','SLOPPY!','MEH','WHOOPS','NICE TRY','SPLAT']), '#7a3cff','#ff7a2f');
      if(this.boss){ this.bossRecover(); this.bark(Barks.roundLose); }
      else this.bark(Barks.roundLose);
    }
    this.updateHUD();
    if(this.state==='resolve') setTimeout(()=>{ if(this.state==='resolve') this.nextRound(); }, 340);
  },

  rerollCost(){ return Math.max(2, (6 + this.rerollsThisRound*6) - this.hero.wit - (this.rerollDiscount||0)); },
  updateRerollUI(){ rerollCostEl.textContent = this.rerollCost(); },
  reroll(){
    if(this.state!=='playing') return;
    const cost=this.rerollCost();
    if(this.goo<cost){ Sound.deny(); return; }
    this.goo -= cost; this.rerollsThisRound++;
    this.shiftFavor('goblin', 3);
    this.lanes.forEach(lane=>{
      if(lane.result!==null) return;
      const def=this.pickModule();
      lane.def=def; lane.g.local={}; lane.g.round=this.round;
      this.safeLane(lane, ()=> def.init(lane.g));
      lane.labelEl.textContent=def.verb; lane.labelEl.style.color=def.color;
    });
    FX.stamp('REROLL!','#2fe1ff','#ff2f9e'); Sound.upgrade();
    this.bark(Barks.reroll);
    this.updateHUD(); this.updateRerollUI();
  },

  startBonusStage(){
    this.state='bonus';
    this.createLanes(1);
    const lane=this.lanes[0];
    lane.labelEl.textContent='SUGAR RUSH!'; lane.labelEl.style.color='#fff02f';
    this.bonus={ items:[], spawnT:0, score:0 };
    this.timeLimit=6000; this.deadline=performance.now()+this.timeLimit;
    FX.verbBanner('SUGAR RUSH!!','#fff02f'); FX.confetti(240,240,26); FX.shake(true); Sound.chaos();
    this.say('goblin','FREE SUGAR. no stakes. no plot. six seconds of nothing. enjoy');
    this.updateHUD();
  },
  updateBonusLogic(dt){
    const b=this.bonus; if(!b) return;
    b.spawnT -= dt;
    if(b.spawnT<=0){
      b.spawnT=150;
      b.items.push({ x:30+Math.random()*420, y:-20, vy:0.12+Math.random()*0.1, kind:pick(['★','♦','●','✦','♥']), color:FX.rand(), alive:true });
    }
    b.items.forEach(it=>{ if(it.alive) it.y += it.vy*dt; });
    b.items = b.items.filter(it=> it.y<520);
  },
  renderBonus(){
    const lane=this.lanes[0]; if(!lane) return;
    const c=lane.ctx, b=this.bonus; if(!b) return;
    c.clearRect(0,0,480,480);
    c.fillStyle='#f5f2ff'; c.font='bold 20px sans-serif'; c.textAlign='center';
    c.fillText('SCORE '+b.score, 240, 34);
    b.items.forEach(it=>{
      if(!it.alive) return;
      c.fillStyle=it.color; c.font='30px sans-serif'; c.textAlign='center'; c.textBaseline='middle';
      c.fillText(it.kind, it.x, it.y);
    });
  },
  bonusTap(x,y){
    const b=this.bonus; if(!b) return;
    for(const it of b.items){
      if(!it.alive) continue;
      if(Math.hypot(x-it.x,y-it.y)<=28){ it.alive=false; b.score+=10; Sound.tap(); return; }
    }
  },
  finishBonusStage(){
    const gained = this.bonus ? this.bonus.score : 0;
    this.score += gained; this.combo=Math.min(this.comboCap(),this.combo+1);
    this.gainXp(Math.round(gained*0.5));
    FX.stamp('+'+gained+' SUGAR!','#fff02f','#ff2f9e'); FX.confetti(240,240,32);
    Sound.win(); Sound.sugar();
    this.bonus=null; this.updateHUD(); this.state='resolve';
    setTimeout(()=>{ if(this.state==='resolve') this.nextRound(); }, 500);
  },

  /* ---------------- buddy ---------------- */
  updateBuddyUI(){
    const b=this.buddy;
    const stages=['👾','👹','🐲','👑'];
    let face=stages[Math.min(3,Math.floor((b.level-1)/2))];
    if(b.mood==='feral') face='👺';
    buddyFaceEl.textContent=face; buddyLvlEl.textContent='Lv'+b.level;
    buddyBtn.classList.toggle('low', b.hunger<0.3);
    buddyBtn.style.opacity=String(0.55+b.hunger*0.45);
  },
  buddyTantrum(){
    this.buddy.hunger=0.3; this.buddy.tantrumCooldown=true;
    setTimeout(()=>{ this.buddy.tantrumCooldown=false; },400);
    this.meter=Math.max(0,this.meter-15); this.updateHUD();
    FX.glitchBars(); FX.shake(false); Sound.crunch();
    FX.stamp('BUDDY MAD!','#ff2f9e','#7a3cff');
    this.bark(Barks.buddyTantrum);
  },
  feedBuddy(){
    const b=this.buddy;
    b.hunger=1; b.feeds++;
    const gm=this.gooMult()*this.comboGooMult();
    const appetite=1+0.25*(this.shopLevels.appetite||0);
    this.score+=Math.round(10*appetite);
    this.addGoo(2*gm*appetite);
    this.meter=Math.min(100,this.meter+3*this.meterMult());
    this.shiftFavor('goblin', 1);
    if(b.feeds%6===0){
      b.level++;
      FX.stamp('BUDDY LV'+b.level+'!','#fff02f','#c9ff2f'); FX.confetti(60,40,16);
      Sound.levelUp();
      this.noteCodex('BUDDY REACHED Lv'+b.level);
      this.say('goblin','HE GREW. he is level '+b.level+'. this affects the turret. of course it does');
    }else{
      FX.stamp('YUM!','#c9ff2f','#fff02f'); Sound.sugar();
      if(Math.random()<0.25) this.bark(Barks.buddyFeed);
    }
    this.updateBuddyUI(); this.updateHUD();
  },
  updateBuddyTick(dt){
    const b=this.buddy;
    const metaFactor=Math.max(0.3, 1-0.12*(this.shopLevels.metabolism||0));
    b.hunger=Math.max(0, b.hunger-dt*0.00006*metaFactor);
    const prev=b.mood;
    b.mood = b.hunger>0.6?'happy':b.hunger>0.3?'neutral':b.hunger>0?'grumpy':'feral';
    if(b.mood!==prev) this.updateBuddyUI();
    if(b.hunger<=0 && !b.tantrumCooldown) this.buddyTantrum();
    if(b.mood==='happy'||b.mood==='neutral'){
      b.incomeT-=dt;
      if(b.incomeT<=0){
        b.incomeT=5000;
        const gm=this.gooMult()*this.comboGooMult();
        const golden=1+(this.shopLevels.goldenbuddy||0);
        this.score+=2*b.level*golden;
        this.addGoo(1*gm*golden);
        this.updateHUD();
      }
    }
    this.updateBuddyUI();
  },

  /* ---------------- honey pot ----------------
     The loop is in src/pot.js. What stays here is the door, the screen and
     the harvest — the one moment the pot pays the campaign. */
  potReady(){ return Pot.ready(this); },
  updatePotUI(){
    const pct=(this.pot.brew/this.pot.brewMax*100);
    potFill.style.width=pct+'%';
    potBtn.classList.toggle('ready', this.potReady());
    potGameMeterFill.style.width=pct+'%';
    potHarvestBtn.disabled = !this.potReady();
  },
  pulseBtn(el){ el.classList.remove('pulseTap'); void el.offsetWidth; el.classList.add('pulseTap'); },

  openPotGame(){
    if(this.state==='potgame') return;
    this.pausedState=this.state;
    this.pausedRemain=(this.state==='playing'||this.state==='bonus') ? Math.max(0,this.deadline-performance.now()) : null;
    this.state='potgame';
    const s=this.pot.session;
    if(!s || s.over){
      if(s) this.safeSubsystem(()=> Pot.close(this), 'pot close');
      this.safeSubsystem(()=> Pot.open(this), 'pot open');
    }
    Sound.potOpen(); this.shiftFavor('goblin', 4);
    this.bark(Barks.potOpen);
    this.updatePotUI(); this.renderPotShop();
    potOverlay.classList.remove('hidden');
  },
  // Leaving pauses the jar where it is — drops in the air stay in the air.
  // A new jar is only poured when the last one broke or there never was one.
  closePotGame(){
    Sound.potClose();
    potOverlay.classList.add('hidden');
    this.returnToActs();
  },

  harvestPot(){
    const paid=this.safeSubsystem(()=> Pot.harvest(this), 'pot harvest');
    if(!paid) return;
    potHarvestFlash.textContent='+'+paid.lump+' 🍯 GLAZED!';
    potHarvestFlash.classList.remove('show'); void potHarvestFlash.offsetWidth; potHarvestFlash.classList.add('show');
    FX.stamp('HONEY POT!','#fff02f','#ff7a2f');
    setTimeout(()=>FX.stamp('GLAZED! goo x1.5','#ff7a2f','#fff02f'),220);
    FX.confetti(240,240,30); FX.shake(true);
    this.noteCodex('HARVESTED THE HONEY POT');
    this.say('goblin','THE POT PAYS. glazed. everything you earn is worth more now. this is my best system');
    this.updateHUD(); this.updatePotUI();
  },

  updatePotGame(dt){ this.safeSubsystem(()=> Pot.tick(this, dt), 'pot tick'); },
  renderPotGame(){
    this.safeSubsystem(()=> Pot.render(this, potCtx), 'pot render');
    this.updatePotReadout();
  },
  potPointer(e){
    const rect=potCanvas.getBoundingClientRect();
    const x=(e.clientX-rect.left)*(Pot.POT.W/rect.width);
    this.safeSubsystem(()=> Pot.aim(this, x), 'pot aim');
  },

  /* The readouts run every frame; the shop only redraws when something it
     shows has changed, because rebuilding six buttons under a thumb that is
     already on one of them is how a tap lands on the wrong upgrade. */
  updatePotReadout(){
    const s=this.pot.session; if(!s) return;
    const m=Pot.mods(this);
    potHoney.textContent='🍯 '+this.pot.honey;
    potCombo.textContent = s.over ? 'JAR GONE' : (s.combo>2 ? 'COMBO x'+Math.min(2.5,1+s.combo*0.12).toFixed(1) : 'COMBO —');
    potCracks.textContent='CRACKS '+s.cracks+'/'+s.cracksMax;
    potFlash.textContent=s.flash||'';
    if(this._potShopHoney!==this.pot.honey){ this._potShopHoney=this.pot.honey; this.renderPotShop(); }
  },

  renderPotShop(){
    this._potShopHoney=this.pot.honey;
    potShop.innerHTML='';
    Pot.PotUpgrades.forEach(u=>{
      const lvl=Pot.levelOf(this,u.id), cost=Pot.costOf(this,u.id), maxed=lvl>=u.max;
      const b=document.createElement('button');
      if(maxed) b.className='maxed';
      b.disabled = maxed || this.pot.honey < cost;
      b.innerHTML='<span class="potGlyph">'+u.glyph+'</span>'+
        '<span><span class="potName">'+u.name+(lvl?' '+lvl+'/'+u.max:'')+'</span><br>'+
        '<span class="potDesc">'+u.desc+'</span></span>'+
        '<span class="potCost">'+(maxed?'MAX':'🍯'+cost)+'</span>';
      b.addEventListener('click', ()=>{
        Sound.ensure();
        if(this.safeSubsystem(()=> Pot.buy(this, u.id), 'pot buy')){
          this.say('goblin','bought. the board is easier now. that is allowed');
          this.renderPotShop();
        }else Sound.deny();
      });
      potShop.appendChild(b);
    });
  },

  /* ---------------- defense: THE PERIMETER ----------------
     The loop itself lives in src/defense.js. What stays here is the chassis
     side of it: the crash guard, the overlay, and the DOM build menu.

     Every call into a parallel loop goes through safeSubsystem, for the same
     safeLane exists — the Crab's game is now the largest body of code in the
     project that can throw, and a bad frame in the perimeter must not be able
     to take the campaign down with it. */
  safeSubsystem(fn, label){
    try{ return fn(); }
    catch(e){
      // Unlike a microgame crash this is not awarded to the player and does
      // not become a GLITCH?! — the perimeter is the one place consequences
      // are real, so a silent failure here would be a lie. It is logged, the
      // frame is abandoned, and play continues.
      console.error('perimeter fault ('+(label||'tick')+'):', e);
      this._subsystemFaults = (this._subsystemFaults||0) + 1;
      return null;
    }
  },

  turretCost(){ return 10 + (this.turret.level-1)*8; },

  updateDefense(dt){ this.safeSubsystem(()=> Defense.tick(this, dt), 'tick'); },
  renderDefense(){ this.safeSubsystem(()=> Defense.renderStrip(this, defenseCtx), 'strip'); },
  defenseTap(x,y){ this.safeSubsystem(()=> Defense.stripTap(this, x, y), 'strip tap'); },

  perimeterFrac(){
    const d=this.defense;
    return d && d.perimeterMax ? Math.max(0, d.perimeter)/d.perimeterMax : 1;
  },

  openDefense(){
    if(this.state==='tdgame') return;
    this.pausedState=this.state;
    this.pausedRemain=(this.state==='playing'||this.state==='bonus') ? Math.max(0,this.deadline-performance.now()) : null;
    this.state='tdgame';
    this.defense.selectedPad=-1;
    Sound.crabBuild();
    this.bark(Barks.defenseOpen);
    this.renderBuildMenu();
    this.updateDefenseUI();
    defenseOverlay.classList.remove('hidden');
  },

  closeDefense(){
    defenseOverlay.classList.add('hidden');
    this.defense.selectedPad=-1;
    Sound.potClose();
    this.returnToActs();
  },

  /* Redrawn whenever the selection or the goo balance changes. Built from
     TowerTypes rather than hardcoded, so a new tower type is a content edit. */
  /* The doctrine panel. Two cards, and the perimeter does not move until one
     of them is tapped — so this is the one screen in the game that waits. */
  renderDoctrine(){
    const offer=this.defense.doctrineOffer;
    if(!offer){ if(tdDoctrine.innerHTML) tdDoctrine.innerHTML=''; return; }
    if(tdDoctrine.dataset.offer===offer.join(',')) return;
    tdDoctrine.dataset.offer=offer.join(',');
    tdDoctrine.innerHTML='<div class="tdDocHead">THE LINE EARNED SOMETHING</div>';
    offer.forEach(id=>{
      const doc=Defense.doctrineById(id);
      const b=document.createElement('button');
      b.innerHTML='<span class="tdGlyph">'+doc.glyph+'</span>'+
        '<span><span class="tdName">'+doc.name+'</span><br>'+
        '<span class="tdDesc">'+doc.desc+'</span></span>';
      b.addEventListener('click', ()=>{
        Sound.ensure();
        this.safeSubsystem(()=> Defense.takeDoctrine(this, id), 'doctrine');
        tdDoctrine.dataset.offer='';
        this.renderDoctrine(); this.renderBuildMenu(); this.updateDefenseUI();
      });
      tdDoctrine.appendChild(b);
    });
  },

  renderBuildMenu(){
    const d=this.defense, idx=d.selectedPad;
    tdBuildMenu.innerHTML='';
    // The board yields width — and so height, being 4:3 — while a pad is
    // selected, so the menu and the board can both be on screen at once.
    defenseOverlay.classList.toggle('building', idx>=0);
    if(idx<0){
      const hint=document.createElement('div');
      hint.className='tdHint';
      hint.textContent='tap a pad to build. the two upper rows cover two corridors each — the bottom row is the last chance.';
      tdBuildMenu.appendChild(hint);
      return;
    }
    const pad=d.pads[idx];
    const row=(glyph,name,desc,cost,enabled,onClick,color)=>{
      const b=document.createElement('button');
      b.innerHTML='<span class="tdGlyph">'+glyph+'</span>'+
        '<span><span class="tdName" style="color:'+color+'">'+name+'</span><br>'+
        '<span class="tdDesc">'+desc+'</span></span>'+
        '<span class="tdCost">'+(cost==null?'':'🟢'+cost)+'</span>';
      b.disabled=!enabled;
      b.addEventListener('click', ()=>{ Sound.ensure(); onClick(); });
      tdBuildMenu.appendChild(b);
    };

    if(pad.tower){
      const t=Defense.TowerTypes.find(x=>x.id===pad.tower.typeId);
      const up=Defense.upgradeCost(this,idx);
      row(t.glyph, t.name+' LV'+pad.tower.level, t.desc, up, this.goo>=up,
        ()=>{ if(Defense.upgradeTower(this,idx)){ this.renderBuildMenu(); this.updateDefenseUI(); } }, t.color);
      row('🗑', 'SALVAGE', 'take the parts back', null, true,
        ()=>{ if(Defense.sellTower(this,idx)){ this.renderBuildMenu(); this.updateDefenseUI(); } }, '#8a7f9a');
    }else{
      Defense.TowerTypes.forEach(t=>{
        const cost=Defense.buildCost(this,t.id);
        row(t.glyph, t.name, t.desc, cost, this.goo>=cost,
          ()=>{ if(Defense.build(this,idx,t.id)){ this.renderBuildMenu(); this.updateDefenseUI(); } }, t.color);
      });
    }

  },

  updateDefenseUI(){
    const d=this.defense, frac=this.perimeterFrac();
    const pct=Math.round(frac*100);
    const color = frac>0.5 ? '#ff7a2f' : (frac>0.25 ? '#fff02f' : '#ff2f9e');
    const holding=!!d.doctrineOffer;
    const resting=!holding && !d.queue.length && !d.enemies.length && d.restT>0;
    tdStatus.textContent = holding
      ? 'THE LINE HOLDS · PICK ONE'
      : (resting
          ? this.safeSubsystem(()=> Defense.nextWaveLabel(this), 'next wave') + ' IN ' + Math.ceil(d.restT/1000) + 's'
          : 'WAVE '+Math.max(1,d.wave)+' · INTEGRITY '+pct+'%'+(d.breaches?' · BREACHES '+d.breaches:''));
    tdCallBtn.classList.toggle('hidden', !resting);
    this.renderDoctrine();
    tdIntegrityFill.style.width=pct+'%';
    tdIntegrityFill.style.background=color;
    turretCostEl.textContent=this.turretCost();
    tdReinforceBtn.disabled=this.goo<this.turretCost();
  },

  /* ---------------- the console: which screen is up ----------------
     Exactly one loop runs at a time: the one on screen. Leaving a loop pauses
     it — a wave, a jar, a bout and a half-routed panel all wait exactly where
     they were — and the company is the only thing that keeps going, because it
     is the idle layer, and working while you are elsewhere is what it is for.

     This reverses the original design, where the perimeter, the buddy and the
     pot all ran on the one rAF loop no matter what was on screen. That made
     every screen a tax on every other one: ten seconds reading a card in the
     archive was ten seconds of waves at the perimeter. */
  activeLoop(){
    switch(this.state){
      case 'tdgame':   return 'perimeter';
      case 'potgame':  return 'pot';
      case 'company':  return 'company';
      case 'archive':  return 'archive';
      case 'patchbay': return 'bay';
      default:         return 'acts';
    }
  },
  // The Acts are only "running" while a round is live. A menu over them, a
  // story beat or a level-up is the Acts paused, and so is anything that
  // hangs off them — the buddy's hunger and the GLAZED clock included.
  actsLive(){ return this.state==='playing' || this.state==='bonus' || this.state==='resolve'; },

  /* Back to the Acts from a loop. The one place that knows what the Acts were
     doing when you left, instead of five copies that each knew most of it:

       - a live round resumes with exactly the clock it had
       - a round that had just resolved moves on. Its own timer fired while you
         were away, found the state changed, and did nothing — so without this
         the game sat in 'resolve' forever. That was a real stall, reachable by
         opening the perimeter in the third of a second between rounds.
       - anything else is left as it was */
  returnToActs(){
    const back=this.pausedState, remain=this.pausedRemain;
    this.pausedState=null; this.pausedRemain=null;
    if(back==='playing'||back==='bonus'){
      this.state=back;
      if(remain!=null) this.deadline=performance.now()+remain;
    }else if(back==='resolve'){
      this.state='resolve';
      setTimeout(()=>{ if(this.state==='resolve') this.nextRound(); }, 200);
    }else{
      this.state = back || 'menu';
    }
  },

  /* ---------------- the archive: the card duel ----------------
     The rules are in src/archive.js. What lives here is the door, the screen
     and the payout — the three things that have to touch the rest of the game.

     Nothing ticks. The duel is turn-based, so unlike the perimeter and the pot
     this loop adds no per-frame work at all; the other loops keep running
     underneath it exactly as they do behind any other menu. */

  openArchive(){
    if(this.state==='archive') return;
    this.pausedState=this.state;
    this.pausedRemain=(this.state==='playing'||this.state==='bonus') ? Math.max(0,this.deadline-performance.now()) : null;
    this.state='archive';
    Sound.menuOpen();
    this.bark(Barks.archiveOpen);
    this.renderArchive();
    archiveOverlay.classList.remove('hidden');
  },

  // Leaving pauses the bout, turn and hand and all. Abandoning one is its own
  // button inside the screen (LEAVE BOUT); walking out of the room is not the
  // same decision and must not cost the same thing.
  closeArchive(){
    archiveOverlay.classList.add('hidden');
    Sound.potClose();
    this.returnToActs();
  },

  /* One render for both halves of the screen: the shelf when there is no bout,
     the table when there is. Called after every action rather than on a timer,
     because a turn-based loop has no frames to hang a refresh on. */
  renderArchive(){
    const a=this.archive, bout=a.bout;
    arcProgress.textContent = Archive.progress(this).replace('/',' / ') + ' FILED'
      + (this.archive.bestTier ? ' · TIER ' + this.archive.bestTier : '')
      + (this.archive.relics.length ? ' · ' + this.archive.relics.length + ' RELICS' : '');
    arcList.classList.toggle('hidden', !!bout);
    arcBout.classList.toggle('hidden', !bout);
    arcEndBtn.classList.toggle('hidden', !bout || !!bout.over);
    arcFleeBtn.textContent = bout ? 'LEAVE BOUT' : 'CLOSE';

    if(!bout){ this.renderArchiveShelf(); return; }
    this.renderArchiveBout(bout);
  },

  renderArchiveShelf(){
    if(this._arcPurge){ this.renderArchivePurge(); return; }
    arcList.innerHTML='';

    const relics=this.archive.relics;
    const held=document.createElement('div');
    held.className='arcRelicRow';
    held.innerHTML = relics.length
      ? relics.map(id=>{ const r=Archive.relicById(id);
          return '<span class="arcRelic" title="'+r.desc+'">'+r.glyph+' '+r.name+'</span>'; }).join('')
      : '<span class="arcRelicNone">no relics yet — one every second build filed</span>';
    arcList.appendChild(held);
    Archive.Builds.forEach(b=>{
      const unlocked=Archive.isUnlocked(this,b.id), filed=Archive.isCleared(this,b.id);
      const btn=document.createElement('button');
      if(filed) btn.className='filed';
      btn.disabled=!unlocked;
      btn.innerHTML=
        '<span class="arcGlyph">'+(unlocked?b.glyph:'🔒')+'</span>'+
        '<span><span class="arcName">'+b.name+'</span><br>'+
        '<span class="arcDesc">'+(unlocked?b.desc:'Filed behind the one above it.')+'</span></span>'+
        '<span class="arcStat">'+b.hp+' HP<small>'+(filed?'filed · 🟢'+Math.round(b.reward.goo*0.3):'🟢'+b.reward.goo+' · '+b.reward.xp+'xp')+'</small></span>';
      btn.addEventListener('click', ()=>{
        Sound.ensure(); Sound.select();
        this.safeSubsystem(()=> Archive.start(this, b.id), 'archive start');
        this.renderArchive();
      });
      arcList.appendChild(btn);
    });

    // The rung past the sixth build. Generated rather than filed, and it does
    // not end.
    if(Archive.endlessOpen(this)){
      const e=Archive.endlessBuild(this);
      const btn=document.createElement('button');
      btn.className='endless';
      btn.innerHTML=
        '<span class="arcGlyph">'+e.glyph+'</span>'+
        '<span><span class="arcName">'+e.name+'</span><br>'+
        '<span class="arcDesc">'+e.desc+'</span></span>'+
        '<span class="arcStat">'+e.hp+' HP<small>🟢'+e.reward.goo+' · '+e.reward.xp+'xp</small></span>';
      btn.addEventListener('click', ()=>{
        Sound.ensure(); Sound.select();
        this.safeSubsystem(()=> Archive.start(this, Archive.ENDLESS.id), 'endless');
        this.renderArchive();
      });
      arcList.appendChild(btn);
    }

    // Thinning: the other half of a deckbuilder, and the only thing in here
    // that costs the campaign's own currency.
    const thin=document.createElement('button');
    thin.className='arcThin';
    thin.disabled=!Archive.canPurge(this);
    thin.innerHTML='<span class="arcGlyph">✂️</span>'+
      '<span><span class="arcName">THIN THE DECK</span><br>'+
      '<span class="arcDesc">'+this.archive.deck.length+' cards · removing one costs 🟢'+Archive.purgeCost(this)+'</span></span>';
    thin.addEventListener('click', ()=>{ Sound.ensure(); Sound.select(); this._arcPurge=true; this.renderArchive(); });
    arcList.appendChild(thin);
  },

  /* The deck, laid out to be cut down. Sorted so the four copies of a starter
     sit together — the whole point of thinning is removing one of those, and
     hunting for it in draw order would be busywork. */
  renderArchivePurge(){
    arcList.innerHTML='';
    const head=document.createElement('div');
    head.className='arcRelicRow';
    head.innerHTML='<span class="arcRelicNone">tap a card to strike it from the deck · 🟢'+
      Archive.purgeCost(this)+' each · floor of six cards</span>';
    arcList.appendChild(head);

    const order=this.archive.deck
      .map((id,i)=>({id,i}))
      .sort((a,b)=> a.id===b.id ? a.i-b.i : (a.id<b.id?-1:1));
    order.forEach(({id,i})=>{
      const c=Archive.cardById(id);
      const btn=document.createElement('button');
      btn.style.borderColor=c.color;
      btn.disabled=this.goo<Archive.purgeCost(this) || !Archive.canPurge(this);
      btn.innerHTML='<span class="arcGlyph">'+c.cost+'</span>'+
        '<span><span class="arcName" style="color:'+c.color+'">'+c.name+'</span><br>'+
        '<span class="arcDesc">'+Archive.cardText(c)+'</span></span>';
      btn.addEventListener('click', ()=>{
        Sound.ensure();
        if(this.safeSubsystem(()=> Archive.purge(this, i), 'purge')){
          this.say('artificer','Struck from the deck. Fewer things to draw is a kind of progress. I did not expect to say that.');
        }
        this.renderArchive();
      });
      arcList.appendChild(btn);
    });

    const back=document.createElement('button');
    back.className='arcThin';
    back.innerHTML='<span class="arcGlyph">🗃️</span><span><span class="arcName">BACK TO THE SHELF</span></span>';
    back.addEventListener('click', ()=>{ Sound.ensure(); this._arcPurge=false; this.renderArchive(); });
    arcList.appendChild(back);
  },

  renderArchiveBout(b){
    const build=Archive.buildById(b.buildId);
    arcFoeName.textContent=build.name;
    arcIntent.textContent=b.over ? '—' : Archive.intentText(this);
    arcFoeFill.style.width=(b.foeHp/b.foeMax*100)+'%';
    arcFoeNum.textContent=b.foeHp+'/'+b.foeMax+(b.foeBlock?' · BLOCK '+b.foeBlock:'')+(b.bugs?' · 🐛 '+b.bugs:'');
    arcLog.textContent=b.log;
    arcFoeArt.textContent=b.over==='win' ? '🗃️' : build.glyph;
    // Restarting the animation by reflow rather than a timer: the build should
    // flinch on the turn it acts, and nothing else in this loop is timed.
    if(b.turn!==this._arcLastTurn){
      this._arcLastTurn=b.turn;
      arcFoeArt.classList.remove('act'); void arcFoeArt.offsetWidth; arcFoeArt.classList.add('act');
    }
    arcYouHp.textContent='HP '+b.hp+'/'+b.hpMax;
    arcBlock.textContent='BLK '+b.block;
    arcEnergy.textContent='NRG '+b.energy+'/'+b.energyMax;
    arcPiles.textContent='PILES '+b.draw.length+'·'+b.discard.length;
    arcEndBtn.disabled=!!b.over;

    arcHand.innerHTML='';
    if(!b.over){
      b.hand.forEach((id,i)=>{
        const c=Archive.cardById(id);
        const btn=document.createElement('button');
        btn.className='arcCard';
        btn.style.borderColor=c.color;
        btn.disabled=c.cost>b.energy;
        btn.innerHTML='<span class="arcCost">'+c.cost+'</span>'+
          '<span class="arcCardName" style="color:'+c.color+'">'+c.name+'</span>'+
          '<span class="arcCardText">'+Archive.cardText(c)+'</span>';
        btn.addEventListener('click', ()=>{
          Sound.ensure();
          this.safeSubsystem(()=> Archive.play(this, i), 'archive play');
          this.renderArchive();
        });
        arcHand.appendChild(btn);
      });
    }

    arcDraft.classList.toggle('hidden', b.over!=='win');
    if(b.over==='win') this.renderArchiveDraft(b);
    // A loss resolves itself: there is nothing to claim, so the only thing the
    // screen owes the player is the way back to the shelf.
    if(b.over) arcFleeBtn.textContent='BACK TO THE SHELF';
  },

  renderArchiveDraft(b){
    arcDraft.innerHTML='';
    const head=document.createElement('div');
    head.className='arcDraftHead';
    head.textContent='FILED · 🟢'+b.reward.goo+(b.reward.xp?' · '+b.reward.xp+' XP':'')+
      (b.relicOptions?' · TAKE A RELIC':(b.draftOptions?' · TAKE ONE':' · ALREADY FILED'));
    arcDraft.appendChild(head);

    (b.relicOptions||[]).forEach(id=>{
      const r=Archive.relicById(id);
      const btn=document.createElement('button');
      btn.className='arcRelicPick';
      btn.innerHTML='<span class="arcCost">'+r.glyph+'</span>'+
        '<span><span class="arcCardName" style="color:var(--acid)">'+r.name+'</span><br>'+
        '<span class="arcDesc">'+r.desc+'</span></span>';
      btn.addEventListener('click', ()=>{ Sound.ensure(); this.claimArchive(id); });
      arcDraft.appendChild(btn);
    });

    const options=b.draftOptions||[];
    options.forEach(id=>{
      const c=Archive.cardById(id);
      const btn=document.createElement('button');
      btn.style.borderColor=c.color;
      btn.innerHTML='<span class="arcCost">'+c.cost+'</span>'+
        '<span><span class="arcCardName" style="color:'+c.color+'">'+c.name+'</span><br>'+
        '<span class="arcDesc">'+Archive.cardText(c)+'</span></span>'+
        '<span class="arcOwned">have '+Archive.countOf(this,id)+'</span>';
      btn.addEventListener('click', ()=>{ Sound.ensure(); this.claimArchive(id); });
      arcDraft.appendChild(btn);
    });

    if(!options.length && !(b.relicOptions||[]).length){
      const btn=document.createElement('button');
      btn.innerHTML='<span class="arcCardName">TAKE THE GOO</span>';
      btn.addEventListener('click', ()=>{ Sound.ensure(); this.claimArchive(null); });
      arcDraft.appendChild(btn);
    }
  },

  /* The payout, and the only place the archive touches the rest of the game.
     Goo and XP go through the existing paths so multipliers, the pot's cut and
     the level-up ladder all behave exactly as they do everywhere else. */
  claimArchive(cardId){
    this._arcPurge=false;
    const paid=this.safeSubsystem(()=> Archive.claim(this, cardId), 'archive claim');
    if(paid){
      this.addGoo(paid.goo);
      if(paid.xp) this.gainXp(paid.xp);
      if(paid.first){
        // The duel is the goblin's work and the shelf is the Artificer's, so a
        // clear pays both of them — one for playing it, one for closing a
        // build he left open.
        this.shiftFavor('goblin', 4);
        this.shiftFavor('artificer', 2);
        this.noteCodex('ARCHIVE: '+paid.buildName);
        this.bark(Barks.archiveClear);
      }
      Sound.upgrade();
      this.updateHUD();
    }
    this.renderArchive();
  },

  /* ---------------- the patch bay: THE ARTIFICER's routing puzzle ----------------
     Rules and generator in src/patchbay.js. What lives here is the door, the
     two views — the bay's racks, and a board — and the payout.

     Like the archive, nothing here ticks: a board changes only when a tile is
     tapped, so it is drawn on change rather than every frame. */

  openBay(){
    if(this.state==='patchbay') return;
    this.pausedState=this.state;
    this.pausedRemain=(this.state==='playing'||this.state==='bonus') ? Math.max(0,this.deadline-performance.now()) : null;
    this.state='patchbay';
    Sound.menuOpen();
    this.bark(Barks.bayOpen);
    this.renderBay();
    bayOverlay.classList.remove('hidden');
  },

  // Leaving pauses the panel with every turn still on it. (Across an app
  // restart it regenerates from its seed instead — boards are not saved.)
  closeBay(){
    bayOverlay.classList.add('hidden');
    Sound.potClose();
    this.returnToActs();
  },

  renderBay(){
    const b=this.bay.board;
    bayProgress.textContent = PatchBay.totalStars(this)+' ★'
      + (this.bay.crawl ? ' · CRAWLSPACE '+this.bay.crawl : '');
    bayShelf.classList.toggle('hidden', !!b);
    bayBoardWrap.classList.toggle('hidden', !b);
    bayDoneBtn.textContent = b ? 'BACK TO THE BAY' : 'CLOSE';
    if(!b){ this.renderBayShelf(); return; }
    this.renderBayBoard(b);
  },

  renderBayShelf(){
    bayShelf.innerHTML='';
    const stars=PatchBay.totalStars(this);
    PatchBay.Racks.forEach(r=>{
      const open=PatchBay.rackOpen(this,r.id);
      let got=0;
      for(let l=0;l<r.levels;l++) got+=PatchBay.starsOf(this,r.id,l);
      const btn=document.createElement('button');
      if(PatchBay.rackDone(this,r.id)) btn.className='done';
      btn.disabled=!open;
      btn.innerHTML=
        '<span class="bayGlyph">'+(open?'🔌':'🔒')+'</span>'+
        '<span><span class="bayName">'+r.name+'</span><br>'+
        '<span class="bayDesc">'+(open ? r.desc : 'needs '+r.need+' ★ · you have '+stars)+'</span></span>'+
        '<span class="bayStat">'+got+'/'+(r.levels*3)+' ★<small>'+r.w+'×'+r.h+(r.wrap?' wrap':'')+'</small></span>';
      btn.addEventListener('click', ()=>{
        Sound.ensure(); Sound.select();
        this.safeSubsystem(()=> PatchBay.open(this, r.id, PatchBay.nextLevel(this, r.id)), 'bay open');
        this.renderBay();
      });
      bayShelf.appendChild(btn);
    });

    if(PatchBay.crawlOpen(this)){
      const c=PatchBay.CRAWLSPACE;
      const btn=document.createElement('button');
      btn.className='crawl';
      btn.innerHTML='<span class="bayGlyph">🕳️</span>'+
        '<span><span class="bayName">'+c.name+'</span><br><span class="bayDesc">'+c.desc+'</span></span>'+
        '<span class="bayStat">#'+(this.bay.crawl+1)+'<small>🟢'+c.pay.goo+'</small></span>';
      btn.addEventListener('click', ()=>{
        Sound.ensure(); Sound.select();
        this.safeSubsystem(()=> PatchBay.open(this, c.id, this.bay.crawl), 'crawl open');
        this.renderBay();
      });
      bayShelf.appendChild(btn);
    }
  },

  renderBayBoard(b){
    const rack=PatchBay.rackById(b.rackId);
    const crawl=b.rackId===PatchBay.CRAWLSPACE.id;
    bayRack.textContent = rack.name + ' · ' + (b.level+1) + (crawl ? '' : '/' + rack.levels);
    bayTurns.textContent = b.turns + ' / PAR ' + b.par;
    const best = crawl ? 0 : PatchBay.starsOf(this, b.rackId, b.level);
    bayPrevBtn.disabled = crawl || b.level<=0;
    bayNextBtn.disabled = crawl ? !b.solved : b.level>=rack.levels-1;
    // Once a panel is routed the next one is the only thing left to do here,
    // so the arrow stops looking like the disabled one beside it.
    bayNextBtn.classList.toggle('go', !!b.solved && !bayNextBtn.disabled);
    bayResult.textContent = b.solved
      ? ('ROUTED · ' + '★'.repeat(PatchBay.starsFor(b)) + '☆'.repeat(3-PatchBay.starsFor(b)) + (b.paidText ? ' · ' + b.paidText : ''))
      : (best ? 'BEST ' + '★'.repeat(best) : 'turn every tile until every system has power');
    bayResult.classList.toggle('solved', !!b.solved);
    this.safeSubsystem(()=> this.drawBay(b), 'bay draw');
  },

  /* The board. Tiles are drawn from the same state the rules read, so what is
     lit on screen is exactly what PatchBay.lit says is lit. */
  drawBay(b){
    const c=bayCtx, W=480;
    const cell=Math.floor(W/Math.max(b.w,b.h));
    const ox=Math.floor((W-cell*b.w)/2), oy=Math.floor((W-cell*b.h)/2);
    const on=PatchBay.lit(b);
    c.clearRect(0,0,W,W);
    c.fillStyle='#0c0a15'; c.fillRect(0,0,W,W);

    if(b.wrap){
      // A wrap board says so at its edge: cables are allowed to leave here.
      c.strokeStyle='#2fe1ff44'; c.lineWidth=2; c.setLineDash([6,6]);
      c.strokeRect(ox+1,oy+1,cell*b.w-2,cell*b.h-2); c.setLineDash([]);
    }

    b.cells.forEach((t,i)=>{
      const x=ox+(i%b.w)*cell, y=oy+Math.floor(i/b.w)*cell;
      const cx=x+cell/2, cy=y+cell/2;
      c.fillStyle = t.locked ? '#1a1628' : '#120f1c';
      c.fillRect(x+2,y+2,cell-4,cell-4);
      if(t.locked){
        // Bolted: a corner mark, so a tile that will not turn does not look
        // like a tap that did nothing.
        c.fillStyle='#4a4060'; c.fillRect(x+5,y+5,6,6);
      }
      const m=PatchBay.maskOf(t);
      const lit=!!on[i];
      c.strokeStyle = b.solved ? '#c9ff2f' : (lit ? '#2fe1ff' : '#3a3150');
      c.lineWidth = Math.max(6, cell*0.17);
      c.lineCap='round';
      [[1,0,-1],[2,1,0],[4,0,1],[8,-1,0]].forEach(([bit,dx,dy])=>{
        if(!(m&bit)) return;
        c.beginPath(); c.moveTo(cx,cy); c.lineTo(cx+dx*cell/2, cy+dy*cell/2); c.stroke();
      });
      if(i===b.core){
        c.beginPath(); c.arc(cx,cy,cell*0.26,0,Math.PI*2);
        c.fillStyle = b.solved ? '#c9ff2f' : '#2fe1ff'; c.fill();
        c.fillStyle='#0c0a15'; c.font=Math.round(cell*0.3)+'px sans-serif';
        c.textAlign='center'; c.textBaseline='middle'; c.fillText('⚙', cx, cy+1);
      }else if(t.glyph){
        c.beginPath(); c.arc(cx,cy,cell*0.24,0,Math.PI*2);
        c.fillStyle = lit ? '#16303a' : '#1a1522'; c.fill();
        c.globalAlpha = lit ? 1 : 0.45;
        c.font=Math.round(cell*0.3)+'px sans-serif';
        c.textAlign='center'; c.textBaseline='middle'; c.fillText(t.glyph, cx, cy+1);
        c.globalAlpha=1;
      }
    });
  },

  bayPointer(e){
    const b=this.bay.board; if(!b || b.solved) return;
    const rect=bayCanvas.getBoundingClientRect();
    const x=(e.clientX-rect.left)*(480/rect.width), y=(e.clientY-rect.top)*(480/rect.height);
    const cell=Math.floor(480/Math.max(b.w,b.h));
    const ox=Math.floor((480-cell*b.w)/2), oy=Math.floor((480-cell*b.h)/2);
    const col=Math.floor((x-ox)/cell), row=Math.floor((y-oy)/cell);
    if(col<0||row<0||col>=b.w||row>=b.h) return;
    const turned=this.safeSubsystem(()=> PatchBay.tap(this, row*b.w+col), 'bay tap');
    if(turned && b.solved) this.claimBay();
    this.renderBay();
  },

  /* The payout. Goo, XP and the Artificer's regard, all through the paths
     that already exist for them — the bay is his, so it is his standing that
     moves. */
  claimBay(){
    const paid=this.safeSubsystem(()=> PatchBay.claim(this), 'bay claim');
    const b=this.bay.board;
    if(!paid || !b) return;
    if(paid.goo) this.addGoo(paid.goo);
    if(paid.xp) this.gainXp(paid.xp);
    if(paid.first || paid.better) this.shiftFavor('artificer', paid.stars===3 ? 3 : 2);
    b.paidText = (paid.goo ? '🟢'+paid.goo : '') + (paid.xp ? ' · '+paid.xp+' XP' : '') || 'already routed';
    FX.stamp(paid.stars===3 ? 'CLEAN ROUTE' : 'ROUTED', '#2fe1ff', '#c9ff2f');
    if(paid.first) this.bark(Barks.bayClear);
    this.updateHUD();
  },

  /* ---------------- the company: THE UNDERSTUDY ----------------
     The loop is in src/understudy.js. What lives here is the overlay and the
     one moment that matters — the report, when they show you what they did
     while you were gone. */

  updateCompany(dt){ this.safeSubsystem(()=> Understudy.tick(this, dt), 'company'); },

  openCompany(){
    if(this.state==='company') return;
    this.pausedState=this.state;
    this.pausedRemain=(this.state==='playing'||this.state==='bonus') ? Math.max(0,this.deadline-performance.now()) : null;
    this.state='company';
    Sound.menuOpen();
    this.bark(Barks.companyOpen);
    this.renderCompany();
    companyOverlay.classList.remove('hidden');
  },

  /* The production panel: one running show, or the shelf of shows that can be
     put on. Kept separate from renderCompany so the countdown can redraw on a
     timer without rebuilding the roster under the player's thumb. */
  renderProductions(){
    const u=this.understudy;
    coStage.innerHTML='';

    if(u.production){
      const p=Understudy.productionById(u.production.id);
      const left=Understudy.productionLeft(this);
      const ready=left<=0;
      const pct=Math.max(0, Math.min(100, 100*(1-left/u.production.durationMs)));
      const card=document.createElement('div');
      card.className='coShow'+(ready?' ready':'');
      card.innerHTML=
        '<div class="coShowTop"><span class="coShowName">'+p.glyph+' '+p.name+'</span>'+
        '<span class="coShowTime">'+(ready?'CURTAIN':Understudy.formatDuration(left)+' LEFT')+'</span></div>'+
        '<div class="coShowTrack"><div class="coShowFill" style="width:'+pct+'%"></div></div>'+
        '<div class="coShowPay">🟢'+p.pay.goo+' · '+p.pay.xp+' XP · the company is at half rate while it runs</div>';
      coStage.appendChild(card);

      const b=document.createElement('button');
      b.className='btn coCollect';
      b.disabled=!ready;
      b.textContent=ready?'TAKE THE CURTAIN CALL':'THEY ARE ON STAGE';
      b.addEventListener('click', ()=>{
        Sound.ensure();
        const done=this.safeSubsystem(()=> Understudy.collect(this), 'production');
        if(done){
          this.say('understudy','we closed it. every seat empty, every line landed. thank you for letting us');
          this.noteCodex('STAGED: '+done.name);
        }
        this.renderCompany();
      });
      coStage.appendChild(b);
      return;
    }

    const head=document.createElement('div');
    head.className='coShowHead';
    const bonus=Math.round(u.staged.length*5);
    head.textContent='PUT SOMETHING ON'+(bonus?' · '+u.staged.length+' STAGED · +'+bonus+'% RATE':'');
    coStage.appendChild(head);

    Understudy.Productions.forEach(p=>{
      const unlocked=Understudy.productionUnlocked(this,p.id);
      const done=Understudy.productionDone(this,p.id);
      const b=document.createElement('button');
      b.className='coShowBtn'+(done?' done':'');
      b.disabled=!unlocked || this.goo<p.cost;
      b.innerHTML=
        '<span class="coGlyph">'+(unlocked?p.glyph:'🔒')+'</span>'+
        '<span><span class="coName">'+p.name+'</span><br>'+
        '<span class="coDesc">'+(unlocked?p.desc:'needs '+p.members+' in the company, and the one above it staged')+'</span></span>'+
        '<span class="coCost">🟢'+p.cost+'<small>'+Understudy.formatDuration(p.minutes*60000)+' · 🟢'+p.pay.goo+'</small></span>';
      b.addEventListener('click', ()=>{
        Sound.ensure();
        if(this.safeSubsystem(()=> Understudy.stage(this, p.id), 'stage')){
          this.say('understudy','we are on. come back when it closes — it runs whether you watch or not');
          this.renderCompany();
        }else Sound.deny();
      });
      coStage.appendChild(b);
    });
  },

  closeCompany(){
    companyOverlay.classList.add('hidden');
    // Reading the report is what dismisses it; the alert on the HUD button
    // clears with it.
    this.understudy.pendingReport = null;
    companyBtn.classList.remove('alert');
    Sound.potClose();
    this.returnToActs();
  },

  renderCompany(){
    this.renderProductions();
    const u=this.understudy, r=Understudy.rates(this);
    const perMin = n => (n*60).toFixed(1);
    coRates.innerHTML =
      'REHEARSING · 🟢'+perMin(r.goo)+'/min · ✦'+perMin(r.xp)+' XP/min<br>'+
      // Derived from the constant rather than written out, so the screen
      // cannot drift from the rule the way "PAY HALF" did when it stopped
      // being a half.
      '<span style="opacity:0.6">OFF-HOURS PAY '+Math.round(Understudy.OFFLINE_RATE*100)+
      '% · BANKS UP TO '+Math.round(Understudy.offlineCapMs(this)/3600000)+'H</span>';

    if(u.pendingReport){
      const p=u.pendingReport;
      coReport.classList.remove('hidden');
      coReport.innerHTML =
        '<div class="coReportHead">WHILE YOU WERE OUT — '+Understudy.formatDuration(p.ms)+'</div>'+
        'we kept going. <b>🟢'+p.goo+'</b> and <b>'+p.xp+' xp</b>, all of it logged. '+
        (p.capped ? 'the hall shut before you got back, so that is not all of it. i am not complaining'
                  : 'nobody watched. that is fine. that is the job');
    }else{
      coReport.classList.add('hidden');
      coReport.innerHTML='';
    }

    coList.innerHTML='';
    Understudy.Company.forEach(m=>{
      const enlisted=Understudy.has(this,m.id);
      const lvl=Understudy.levelOf(this,m.id);
      const cost=enlisted ? Understudy.upgradeCost(this,m.id) : Understudy.recruitCost(this,m.id);
      const rate=enlisted
        ? '🟢'+perMin(m.goo*(1+(lvl-1)*0.55)*this.favorIdleBonus())+'/min'
        : m.desc;
      const b=document.createElement('button');
      if(enlisted) b.className='enlisted';
      b.innerHTML=
        '<span class="coGlyph">'+m.glyph+'</span>'+
        '<span><span class="coName" style="color:'+m.color+'">'+m.name+(enlisted?' LV'+lvl:'')+'</span><br>'+
        '<span class="coDesc">'+(enlisted?rate:m.desc)+'</span></span>'+
        '<span class="coCost">🟢'+cost+'<small>'+(enlisted?'rehearse':'recruit')+'</small></span>';
      b.disabled = this.goo<cost;
      b.addEventListener('click', ()=>{
        Sound.ensure();
        const ok = enlisted ? Understudy.upgradeMember(this,m.id) : Understudy.recruit(this,m.id);
        if(ok) this.renderCompany();
      });
      coList.appendChild(b);
    });

    coFooter.textContent = u.lifetimeGoo || u.lifetimeXp
      ? 'logged this run: 🟢'+Math.round(u.lifetimeGoo)+' · '+Math.round(u.lifetimeXp)+' xp'
      : 'they have not been called on yet.';
  },

  /* ---------------- shop ---------------- */
  renderShop(){
    shopList.innerHTML='';
    ShopItems.forEach(item=>{
      const lvl=this.shopLevels[item.id]||0;
      const maxed=lvl>=item.max;
      const cost=Math.round(item.baseCost*Math.pow(1.6,lvl));
      const row=document.createElement('button');
      row.className='shopItem'; row.style.borderColor=item.color; row.disabled=maxed;
      row.innerHTML='<div class="shopItemTop"><span style="color:'+item.color+'">'+item.label+'</span><span>'+(maxed?'MAX':('🟢'+cost))+'</span></div><div class="shopItemDesc">'+item.desc+' (Lv '+lvl+'/'+item.max+')</div>';
      if(!maxed) row.addEventListener('click', ()=> this.buyShopItem(item.id));
      shopList.appendChild(row);
    });
  },
  buyShopItem(id){
    const item=ShopItems.find(i=>i.id===id);
    const lvl=this.shopLevels[id]||0;
    if(lvl>=item.max) return;
    const cost=Math.round(item.baseCost*Math.pow(1.6,lvl));
    if(this.goo<cost){ Sound.deny(); return; }
    this.goo-=cost; this.shopLevels[id]=lvl+1;
    if(id==='secondturret') Defense.applyShop(this);
    // Buying from someone's shelf is siding with them. The Workshop is
    // nominally the Artificer's, but three of its items are not his.
    this.shiftFavor(item.owner || 'artificer', 4);
    Sound.upgrade();
    FX.stamp(item.label+' LV'+(lvl+1)+'!', item.color, '#fff02f');
    this.noteCodex('WORKSHOP: '+item.label);
    this.updateHUD(); this.renderShop();
  },

  /* ---------------- loop ---------------- */
  loop(t){
    let dt=t-this.lastT; this.lastT=t;
    if(dt>50) dt=50;
    if(this.state==='playing'){
      const remain=Math.max(0,this.deadline-t);
      timerFill.style.width=(remain/this.timeLimit*100)+'%';
      this.lanes.forEach(lane=>{
        if(lane.result!==null) return;
        this.safeLane(lane, ()=> lane.def.update(lane.g,dt));
        this.safeLane(lane, ()=> lane.def.render(lane.g));
        this.updateHint(lane);
      });
      if(remain<=0){
        this.lanes.forEach(lane=>{
          if(lane.result===null){
            if(lane.def.surviveOnTimeout) lane.g.win(); else lane.g.lose();
          }
        });
      }
    }else if(this.state==='bonus'){
      const remain=Math.max(0,this.deadline-t);
      timerFill.style.width=(remain/this.timeLimit*100)+'%';
      this.updateBonusLogic(dt); this.renderBonus();
      if(remain<=0) this.finishBonusStage();
    }else if(this.state==='potgame'){
      this.updatePotGame(dt); this.renderPotGame();
    }else if(this.state==='tdgame'){
      // The perimeter's own tick runs below with everything else — this only
      // draws the large board, so the overlay and the HUD strip stay two views
      // of one simulation rather than two simulations.
      this.safeSubsystem(()=> Defense.renderBoard(this, tdCtx), 'board');
    }

    this.tickLoops(dt);
    this.updatePotUI();

    // idle chatter: the creators fill silence, weighted by standing
    if(this.state!=='boot' && this.state!=='story' && this.state!=='victory'){
      this.barkT-=dt;
      if(this.barkT<=0){ this.barkT=9000+Math.random()*7000; this.bark(Barks.idle); }
    }

    this.ambientT-=dt;
    if(this.ambientT<=0){ this.ambientT=(2200-this.chaosLevel*700)+Math.random()*1200; FX.ambientSparkle(); }

    this.rafId=requestAnimationFrame(tt=>this.loop(tt));
  },

  /* The parallel loops' share of a frame, separated from the frame itself so
     the rule can be tested without spinning up a second animation loop.

     One loop runs: the one on screen. The buddy and the GLAZED clock belong to
     the Acts and pause with them; the perimeter only fights while you are at
     your post. The pot no longer brews on its own — it fills from goo skimmed
     anywhere (the goblin's wiring, not a clock) and from what you catch in it. */
  tickLoops(dt){
    if(this.actsLive()){
      this.updateBuddyTick(dt);
      if(this.potBuffT>0) this.potBuffT=Math.max(0,this.potBuffT-dt);
    }
    if(this.state==='tdgame') this.updateDefense(dt);
    // The company is the exception, and the only one: the idle layer runs
    // everywhere, all the time. Its tick also stamps `lastAt`, which is what
    // makes the gap on the next launch mean "time nobody was watching".
    this.updateCompany(dt);
  },

  updateHUD(){
    scoreEl.textContent=this.score;
    if(this.score!==this._lastScore){
      scoreEl.classList.remove('pop'); void scoreEl.offsetWidth; scoreEl.classList.add('pop');
      this._lastScore=this.score;
    }
    roundEl.textContent='RD '+this.round;
    meterFill.style.width=this.meter+'%';
    gooCountEl.textContent='🟢'+this.goo;
    if(this.goo!==this._lastGoo){
      gooCountEl.classList.remove('pop'); void gooCountEl.offsetWidth; gooCountEl.classList.add('pop');
      this._lastGoo=this.goo;
    }
    turretCostEl.textContent=this.turretCost();

    // The HUD button doubles as the perimeter's status light, so integrity is
    // legible without opening the Crab's screen. It only starts shouting once
    // a breach is genuinely close — an alarm that is always on is not an alarm.
    const frac=this.perimeterFrac();
    perimeterPctEl.textContent=Math.round(frac*100)+'%';
    turretUpgradeBtn.classList.toggle('breached', frac<=0.3 || !!this.defense.doctrineOffer);
    if(this.state==='tdgame') this.updateDefenseUI();

    /* A running show has a clock on it, so the company screen has to move on
       its own — but once a second, not once a frame: rebuilding the panel at
       60Hz would swallow a tap that landed between two rebuilds. */
    this._showT = (this._showT||0) + 1;
    if(this._showT >= 40){
      this._showT = 0;
      if(this.state==='company') this.safeSubsystem(()=> this.renderProductions(), 'show panel');
      // The curtain call is worth knowing about from outside the screen.
      companyBtn.classList.toggle('alert',
        !!this.understudy.pendingReport || Understudy.productionReady(this));
    }
  },

  getPos(lane,e){
    const rect=lane.canvas.getBoundingClientRect();
    let x=(e.clientX-rect.left)*(this.W/rect.width);
    let y=(e.clientY-rect.top)*(this.H/rect.height);
    if(this.mutator && this.mutator.transformPos){
      const r=this.mutator.transformPos({x,y},this.W,this.H); x=r.x; y=r.y;
    }
    return {x,y};
  },
  onDown(lane,e){
    if(this.state==='playing'){
      Sound.ensure(); this.activeLane=lane;
      const p=this.getPos(lane,e); FX.tapRipple(p.x,p.y);
      const def=lane.def, g=lane.g;
      if(def && def.onDown) this.safeLane(lane, ()=> def.onDown(g,p.x,p.y));
    }else if(this.state==='bonus'){
      Sound.ensure();
      const p=this.getPos(lane,e); FX.tapRipple(p.x,p.y);
      this.bonusTap(p.x,p.y);
    }
  }
};

/* ---------------- input wiring ---------------- */
window.addEventListener('pointermove', e=>{
  if(Game.state!=='playing' || !Game.activeLane) return;
  const lane=Game.activeLane, def=lane.def, g=lane.g;
  if(def && def.onMove){ const p=Game.getPos(lane,e); Game.safeLane(lane, ()=> def.onMove(g,p.x,p.y)); }
});
window.addEventListener('pointerup', e=>{
  if(!Game.activeLane) return;
  const lane=Game.activeLane, def=lane.def, g=lane.g;
  if(Game.state==='playing' && def && def.onUp){ const p=Game.getPos(lane,e); Game.safeLane(lane, ()=> def.onUp(g,p.x,p.y)); }
  Game.activeLane=null;
});

$('startBtn').addEventListener('click', ()=>{ Sound.ensure(); Game.start(false); });

/* The ledger on the title screen. Shown only once there is history — a
   first-time player should not be handed an empty scoreboard — and it names
   what is coming next, since a meta layer you cannot see the shape of is
   indistinguishable from no meta layer. */
(function showLedger(){
  const el = $('ledgerLine');
  const rec = Ledger.read();
  const line = Ledger.describe(rec);
  if(!line) return;
  const next = Ledger.next(rec);
  el.innerHTML = line + (next
    ? '<br><span style="opacity:0.7">next at ' + next.at + ' gates · ' + next.label + '</span>'
    : '<br><span style="opacity:0.7">every boon earned</span>');
  el.classList.remove('hidden');
})();

/* Resume is offered rather than automatic. Dropping a player straight back
   into Act IV mid-boss on app launch takes the choice away, and BEGIN has to
   stay reachable — it is the only way to abandon a run you are stuck on. */
(function offerResume(){
  const btn = $('continueBtn'), meta = $('continueMeta');
  const saved = Save.read();
  if(!saved) return;
  meta.textContent = Save.describe(saved);
  btn.classList.remove('hidden');
  meta.classList.remove('hidden');
  btn.addEventListener('click', ()=>{
    Sound.ensure();
    // A save can go stale between paint and tap (another tab starting a run),
    // so a failed resume falls through to a fresh one rather than dead-ending.
    if(!Game.resumeRun()) Game.start(false);
  });
})();
$('victoryBtn').addEventListener('click', ()=>{ Game.ngPlus++; Game.start(true); });
resetBtn.addEventListener('click', ()=>{
  // Lives inside SETTINGS now, so it has to close the sheet behind it or the
  // player is left looking at a menu over a brand new Act I.
  Sound.ensure();
  settingsOverlay.classList.add('hidden');
  Game.start(false);
});
muteBtn.addEventListener('click', ()=>{ Sound.muted=!Sound.muted; muteBtn.textContent=Sound.muted?'🔇':'🔊'; });

$('storyContinueBtn').addEventListener('click', ()=>{
  storyOverlay.classList.add('hidden');
  Sound.select();
  const fn=Game._storyNext; Game._storyNext=null;
  if(fn) fn();
});

buddyBtn.addEventListener('pointerdown', e=>{
  e.stopPropagation(); Sound.ensure();
  if(Game.state==='boot') return;
  Game.pulseBtn(buddyBtn); Game.feedBuddy();
});
defenseCanvas.addEventListener('pointerdown', e=>{
  Sound.ensure();
  if(Game.state==='boot') return;
  const rect=defenseCanvas.getBoundingClientRect();
  Game.defenseTap((e.clientX-rect.left)*(640/rect.width), (e.clientY-rect.top)*(80/rect.height));
});
turretUpgradeBtn.addEventListener('click', ()=>{
  Sound.ensure();
  if(Game.state==='boot'||Game.state==='tdgame'||Game.state==='company'||Game.state==='archive'||Game.state==='patchbay') return;
  if(Game.state==='draft'||Game.state==='story'||Game.state==='levelup'||Game.state==='potgame') return;
  Game.openDefense();
});

/* Reinforcement is global: one purchase lifts every tower on the board. That
   is what keeps it worth buying at nine towers, and it is the clearest single
   way to side with the Crab. */
tdReinforceBtn.addEventListener('click', ()=>{
  Sound.ensure();
  const cost=Game.turretCost();
  if(Game.goo>=cost){
    Game.goo-=cost; Game.turret.level++;
    Game.turret.fireInterval=Math.max(300,Game.turret.fireInterval-120);
    Game.turret.dmg+=1;
    Game.shiftFavor('crab', 5);
    FX.stamp('REINFORCED LV'+Game.turret.level,'#ff7a2f','#2fe1ff');
    Sound.upgrade(); Game.updateHUD(); Game.renderBuildMenu(); Game.updateDefenseUI();
  }else Sound.deny();
});

tdCallBtn.addEventListener('click', ()=>{
  Sound.ensure();
  const bonus=Game.safeSubsystem(()=> Defense.callWaveEarly(Game), 'call wave');
  if(bonus){
    Game.say('crab','early. good. that is time back', true);
    FX.stamp('+'+bonus+' EARLY', '#ff7a2f', '#c9ff2f');
  }
  Game.updateDefenseUI();
});
tdDoneBtn.addEventListener('click', ()=>{ Sound.ensure(); Game.closeDefense(); });

/* The standing row is four coloured bars behind three-letter codes, which is a
   perfectly good glance-gauge once you know what it is and completely opaque
   until then. Rather than spend HUD width explaining itself, it opens the hero
   sheet — which already names every patron in their own colour and lists what
   their standing actually does. The cryptic thing gets a way to be asked. */
$('standingRow').addEventListener('click', ()=>{
  Sound.ensure();
  if(menuGuard()) return;
  Sound.menuOpen();
  Game.pauseForMenu(); Game.renderSheet();
  sheetOverlay.classList.remove('hidden');
});

companyBtn.addEventListener('click', ()=>{
  Sound.ensure();
  if(menuGuard()) return;
  // No pauseForMenu here: openCompany stashes the state itself, the way the
  // honey pot does. Doing both would overwrite pausedState with 'menu' and
  // close back into the wrong one.
  Game.openCompany();
});
coDoneBtn.addEventListener('click', ()=>{ Sound.ensure(); Game.closeCompany(); });

tdCanvas.addEventListener('pointerdown', e=>{
  Sound.ensure();
  const rect=tdCanvas.getBoundingClientRect();
  const x=(e.clientX-rect.left)*(Defense.BOARD.w/rect.width);
  const y=(e.clientY-rect.top)*(Defense.BOARD.h/rect.height);
  Game.safeSubsystem(()=> Defense.boardTap(Game, x, y), 'board tap');
  Game.renderBuildMenu();
});
rerollBtn.addEventListener('click', ()=>{ Sound.ensure(); Game.reroll(); });
potBtn.addEventListener('pointerdown', e=>{
  e.stopPropagation(); Sound.ensure();
  if(Game.state==='boot'||Game.state==='tdgame'||Game.state==='company'||Game.state==='archive'||Game.state==='patchbay'||Game.state==='draft'||Game.state==='potgame'||Game.state==='story'||Game.state==='levelup') return;
  Game.openPotGame();
});
potCanvas.addEventListener('pointerdown', e=>{ Sound.ensure(); Game.potPointer(e); });
potCanvas.addEventListener('pointermove', e=>{ Game.potPointer(e); });
potHarvestBtn.addEventListener('click', ()=>{ Sound.ensure(); Game.harvestPot(); });
potDoneBtn.addEventListener('click', ()=>{ Game.closePotGame(); });

bayBtn.addEventListener('click', ()=>{
  Sound.ensure();
  if(menuGuard()) return;
  Game.openBay();
});
bayCanvas.addEventListener('pointerdown', e=>{ Sound.ensure(); Game.bayPointer(e); });
bayPrevBtn.addEventListener('click', ()=>{
  const b=Game.bay.board; if(!b) return;
  Sound.ensure(); Sound.select();
  Game.safeSubsystem(()=> PatchBay.open(Game, b.rackId, Math.max(0, b.level-1)), 'bay prev');
  Game.renderBay();
});
bayNextBtn.addEventListener('click', ()=>{
  const b=Game.bay.board; if(!b) return;
  Sound.ensure(); Sound.select();
  // The crawlspace's next board is the next one the goblin re-patched; a
  // rack's is the next panel along.
  const next = b.rackId===PatchBay.CRAWLSPACE.id ? Game.bay.crawl : b.level+1;
  Game.safeSubsystem(()=> PatchBay.open(Game, b.rackId, next), 'bay next');
  Game.renderBay();
});
bayRestartBtn.addEventListener('click', ()=>{
  Sound.ensure();
  Game.safeSubsystem(()=> PatchBay.restart(Game), 'bay restart');
  Game.renderBay();
});
/* One button, two jobs, same as the archive's: back to the racks from a
   board, and out of the bay from the racks. */
bayDoneBtn.addEventListener('click', ()=>{
  Sound.ensure();
  if(Game.bay.board){ Game.bay.board=null; Game.renderBay(); }
  else Game.closeBay();
});

archiveBtn.addEventListener('click', ()=>{
  Sound.ensure();
  if(menuGuard()) return;
  Game.openArchive();
});
arcEndBtn.addEventListener('click', ()=>{
  Sound.ensure();
  Game.safeSubsystem(()=> Archive.endTurn(Game), 'archive end turn');
  Game.renderArchive();
});
/* One button for both jobs: it abandons a bout if there is one and closes the
   screen if there is not. Two separate buttons that both mean "out" is how a
   player learns to distrust the way out. */
arcFleeBtn.addEventListener('click', ()=>{
  Sound.ensure();
  if(Game.archive.bout){
    Game.safeSubsystem(()=> Archive.flee(Game), 'archive flee');
    Game.renderArchive();
  }else{
    Game.closeArchive();
  }
});

$('draftSkipBtn').addEventListener('click', ()=>{
  Sound.select(); Game.shiftFavor('artificer', 8);
  draftOverlay.classList.add('hidden');
  Game.say('artificer','Refused. Good. That is one less variable between you and the gate.');
  Game.continueModuleRound();
});

const menuGuard = ()=> Game.state==='boot'||Game.state==='tdgame'||Game.state==='company'||Game.state==='archive'||Game.state==='patchbay'||Game.state==='potgame'||Game.state==='draft'||Game.state==='story'||Game.state==='levelup';
$('shopBtn').addEventListener('click', ()=>{
  Sound.ensure(); Sound.menuOpen();
  if(menuGuard()) return;
  Game.pauseForMenu(); Game.renderShop(); Game.bark(Barks.shopOpen);
  shopOverlay.classList.remove('hidden');
});
$('shopCloseBtn').addEventListener('click', ()=>{ shopOverlay.classList.add('hidden'); Game.resumeAfterMenu(); });

sheetBtn.addEventListener('click', ()=>{
  Sound.ensure(); Sound.menuOpen();
  if(menuGuard()) return;
  Game.pauseForMenu(); Game.renderSheet();
  sheetOverlay.classList.remove('hidden');
});
$('sheetCloseBtn').addEventListener('click', ()=>{ sheetOverlay.classList.add('hidden'); Game.resumeAfterMenu(); });

codexBtn.addEventListener('click', ()=>{
  sheetOverlay.classList.add('hidden');
  Sound.ensure(); Sound.menuOpen();
  if(menuGuard()) return;
  Game.pauseForMenu(); Game.renderCodex();
  codexOverlay.classList.remove('hidden');
});
$('codexCloseBtn').addEventListener('click', ()=>{ codexOverlay.classList.add('hidden'); Game.resumeAfterMenu(); });

const chaosLabels=['LEASHED','NORMAL','UNCHAINED'];
function renderChaosButtons(){
  chaosButtonsEl.innerHTML='';
  chaosLabels.forEach((label,i)=>{
    const b=document.createElement('button');
    b.className='draftCard';
    b.style.fontSize='9px'; b.style.padding='8px 10px';
    b.style.borderColor = i===Game.chaosLevel?'#fff02f':'#333';
    b.style.color = i===Game.chaosLevel?'#fff02f':'#f5f2ff';
    b.textContent=label;
    b.addEventListener('click', ()=>{
      Sound.select(); Game.chaosLevel=i; renderChaosButtons();
      if(i===2) Game.say('goblin','UNCHAINED. you chose this. remember that you chose this');
      else if(i===0) Game.say('artificer','Leashed. Thank you. He will complain.');
    });
    chaosButtonsEl.appendChild(b);
  });
}
$('settingsBtn').addEventListener('click', ()=>{
  Sound.ensure(); Sound.menuOpen();
  if(menuGuard()) return;
  Game.pauseForMenu(); renderChaosButtons();
  settingsOverlay.classList.remove('hidden');
});
$('settingsCloseBtn').addEventListener('click', ()=>{ settingsOverlay.classList.add('hidden'); Game.resumeAfterMenu(); });

/* The stage is square and sized by width, so on a short phone the board fell
   below the fold and the game had to be scrolled into view. main.css caps the
   stage against the viewport height minus this value; measuring it beats
   estimating it, because the HUD stack grows a boss bar and a mutator chip
   depending on where the run is. Reading the stage's own top is safe from
   feedback: what is above the stage does not depend on how tall the stage is. */
function measureChrome(){
  const top = $('stageWrap').getBoundingClientRect().top + (window.scrollY||0);
  const prev = parseFloat(document.documentElement.style.getPropertyValue('--chrome'))||0;
  const next = Math.round(top + 30);            // + the margin under the board
  if(Math.abs(next-prev) > 2) document.documentElement.style.setProperty('--chrome', next+'px');
}
Game.mastery = (Game.safeSubsystem(()=> Ledger.read(), 'mastery boot') || {}).mastery || {};
measureChrome();
Game.applyActTint();          // Act I lights the title screen too
addEventListener('resize', measureChrome);
addEventListener('orientationchange', measureChrome);
// The HUD grows and shrinks mid-run (boss bar, mutator chip), and each of those
// moves the board. Observing the app is cheaper than remembering every caller.
if(window.ResizeObserver) new ResizeObserver(measureChrome).observe($('app'));

Game.updateHUD(); Game.updateMutatorChip(); Game.updateBuddyUI();
Game.updateRerollUI(); Game.updatePotUI(); Game.updateHeroUI(); Game.updateStandingUI();
Game.renderDefense();
