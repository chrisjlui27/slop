import { Sound } from "./audio.js";
import { FX } from "./fx.js";
import { Modules } from "./modules/index.js";
import { Cast, Barks, Acts } from "./content/lore.js";
import { Mutators } from "./content/mutators.js";
import { ShopItems } from "./content/shop.js";
import { StatDefs } from "./content/stats.js";

/* ============================== CHASSIS ============================== */
export const $ = id => document.getElementById(id);
const laneRow=$('laneRow'), scoreEl=$('scoreVal'), roundEl=$('roundVal'), timerFill=$('timerFill');
const meterFill=$('meterFill'), mutChip=$('mutChip'), gooCountEl=$('gooCount');
const turretCostEl=$('turretCostVal'), rerollCostEl=$('rerollCostVal');
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
const favorMark=$('favorMark');
const heroLvlEl=$('heroLvl'), xpFill=$('xpFill'), statsMiniEl=$('statsMini');
const bossRow=$('bossRow'), bossNameEl=$('bossName'), bossHpNum=$('bossHpNum'), bossHpFill=$('bossHpFill');
const storyOverlay=$('storyOverlay'), storyTitle=$('storyTitle'), storySub=$('storySub'), storySpeech=$('storySpeech');
const levelOverlay=$('levelOverlay'), levelList=$('levelList'), levelSub=$('levelSub');
const sheetOverlay=$('sheetOverlay'), sheetBody=$('sheetBody');
const codexOverlay=$('codexOverlay'), codexBody=$('codexBody');
const victoryOverlay=$('victoryOverlay'), victorySpeech=$('victorySpeech'), victorySub=$('victorySub');
const sheetBtn=$('sheetBtn'), codexBtn=$('codexBtn');

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
  turret:{ level:1, fireInterval:1100, dmg:1 }, turrets:[],
  defense:{ enemies:[], spawnT:0, projectiles:[] },
  shopLevels:{}, rerollsThisRound:0, chaosLevel:1, ambientT:1500,
  pot:{ brew:0, brewMax:100 }, potBuffT:0, potGame:null,
  pausedState:null, pausedRemain:null,
  // --- narrative / RPG state ---
  actIdx:0, actRound:0, boss:null, ngPlus:0,
  hero:{ level:1, xp:0, xpNext:120, reflex:1, wit:1, grit:1, points:0 },
  favor:0,              // -100 goblin .. +100 artificer
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
  // Who comments is itself a function of favor: the winning side talks more.
  bark(pairSet){
    if(!pairSet) return;
    if(Array.isArray(pairSet)){ const p = pick(pairSet); this.say(p.who, p.line); return; }
    const goblinBias = 0.5 - (this.favor/260);
    const whoId = Math.random() < goblinBias ? 'goblin' : 'artificer';
    const pool = pairSet[whoId];
    if(pool && pool.length) this.say(whoId, pick(pool));
  },
  shiftFavor(delta){
    this.favor = Math.max(-100, Math.min(100, this.favor+delta));
    favorMark.style.left = (50 + this.favor/2.2)+'%';
  },
  favorGooBonus(){ return this.favor<0 ? 1 + (-this.favor/100)*0.5 : 1; },
  favorXpBonus(){ return this.favor>0 ? 1 + (this.favor/100)*0.5 : 1; },

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

  startAct(){
    const a = this.act();
    this.actRound = 0; this.boss = null;
    bossRow.classList.add('hidden');
    actNameEl.textContent = a.n + (this.ngPlus? ' (NG+'+this.ngPlus+')' : '');
    questNameEl.textContent = a.quest.toUpperCase();
    this.noteCodex(a.n+' — '+a.title);
    this.showStory(a.n+': '+a.title, a.quest, a.open, ()=> this.nextRound());
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
    if(wasFinal){ this.triggerVictory(); return; }
    const closing = a.close.length ? a.close : Barks.bossDown;
    this.showStory('GATE DOWN', a.n+' COMPLETE', closing, ()=>{
      this.actIdx++;
      this.startAct();
    });
  },
  triggerVictory(){
    this.state='victory';
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
    statsMiniEl.textContent = 'R'+this.hero.reflex+' W'+this.hero.wit+' G'+this.hero.grit;
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
        Sound.upgrade(); this.shiftFavor(+6);
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
    const fav = this.favor<-25?'SLOP-GOBLIN':this.favor>25?'THE ARTIFICER':'BALANCED';
    sheetBody.innerHTML =
      '<div style="font-family:\'Press Start 2P\',monospace;font-size:9px;color:#fff02f;margin-bottom:8px;">LEVEL '+h.level+'  ·  XP '+h.xp+'/'+h.xpNext+'</div>'+
      StatDefs.map(s=>'<div style="margin-bottom:6px;"><b style="color:#2fe1ff">'+s.label+' '+h[s.id]+'</b><br><span style="opacity:0.65;font-size:11px;">'+s.desc+'</span></div>').join('')+
      '<hr style="border-color:#241d33;margin:10px 0;">'+
      '<div style="font-size:11px;line-height:1.6;">'+
      'Unspent points: <b style="color:#fff02f">'+h.points+'</b><br>'+
      'Boss damage per win: <b>'+this.bossDamage()+'</b><br>'+
      'Current act: <b>'+a.n+' — '+a.title+'</b><br>'+
      'Allegiance: <b style="color:'+(this.favor<0?'#c9ff2f':'#2fe1ff')+'">'+fav+'</b><br>'+
      '<span style="opacity:0.6">goo x'+this.favorGooBonus().toFixed(2)+' · xp x'+this.favorXpBonus().toFixed(2)+'</span>'+
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

  /* ---------------- core chassis ---------------- */
  safeLane(lane, fn){
    try{ fn(); }
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
    this.lanes = [];
    for(let i=0;i<count;i++){
      const wrap=document.createElement('div'); wrap.className='laneWrap';
      const label=document.createElement('div'); label.className='laneLabel arcade';
      const canvas=document.createElement('canvas'); canvas.width=480; canvas.height=480; canvas.className='laneCanvas';
      wrap.appendChild(label); wrap.appendChild(canvas); laneRow.appendChild(wrap);
      const lane={ canvas, ctx:canvas.getContext('2d'), labelEl:label, def:null, g:null, result:null };
      canvas.addEventListener('pointerdown', e=> this.onDown(lane, e));
      this.lanes.push(lane);
    }
  },

  start(keepNg){
    this.clearMutator();
    this.score=0; this._lastScore=0; this._lastGoo=0; this.round=0; this.combo=0; this.goo=0;
    this.history=[]; this.mutatorRoundsLeft=0; this.meter=0; this.megaPending=false; this.bonus=null;
    this.buddy={ hunger:1, tantrumCooldown:false, level:1, feeds:0, mood:'happy', incomeT:5000 };
    this.turret={ level:1, fireInterval:1100, dmg:1 };
    this.turrets=[{x:624,y:50,fireT:0}];
    this.defense={ enemies:[], spawnT:0, projectiles:[] };
    this.shopLevels={}; this.rerollsThisRound=0; this.ambientT=1500;
    this.pot={ brew:0, brewMax:100 }; this.potBuffT=0; this.potGame=null;
    this.pausedState=null; this.pausedRemain=null;
    this.actIdx=0; this.actRound=0; this.boss=null;
    this.hero={ level:1, xp:0, xpNext:120, reflex:1, wit:1, grit:1, points:0 };
    this.favor=0; this.codexSeen=[];
    if(!keepNg) this.ngPlus=0;
    startScreen.classList.add('hidden');
    victoryOverlay.classList.add('hidden');
    bossRow.classList.add('hidden');
    this.shiftFavor(0);
    this.updateHUD(); this.updateMutatorChip(); this.updateBuddyUI();
    this.updateRerollUI(); this.updatePotUI(); this.updateHeroUI();
    this.startAct();
    if(!this.rafId){ this.lastT = performance.now(); this.rafId = requestAnimationFrame(t=>this.loop(t)); }
  },

  nextRound(){
    this.finishingRound = false;
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
        Sound.select(); this.shiftFavor(-8);
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
      lane.labelEl.textContent = def.verb;
      lane.labelEl.style.color = def.color;
    });

    this.state='playing';
    this.deadline = performance.now()+this.timeLimit;
    if(isDouble){ FX.verbBanner('DOUBLE SLOP!!','#ff2f9e'); FX.shake(true); Sound.chaos(); }
    else{ FX.verbBanner(this.lanes[0].def.verb, this.lanes[0].def.color); FX.shake(false); Sound.blip(520,0.06,'square',0.1); }
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
    this.combo = allWon ? Math.min(6,this.combo+1) : 0;
    const mult = this.mutator ? (this.mutator.scoreMult||1) : 1;
    if(wonCount>0){
      this.score += Math.round(wonCount*(100+this.combo*20)*mult);
      this.gainXp(28*wonCount);
      this.shiftFavor(+3);
    }else{
      this.shiftFavor(-2);
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

  rerollCost(){ return Math.max(2, (6 + this.rerollsThisRound*6) - this.hero.wit); },
  updateRerollUI(){ rerollCostEl.textContent = this.rerollCost(); },
  reroll(){
    if(this.state!=='playing') return;
    const cost=this.rerollCost();
    if(this.goo<cost){ Sound.deny(); return; }
    this.goo -= cost; this.rerollsThisRound++;
    this.shiftFavor(-3);
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
    this.score += gained; this.combo=Math.min(6,this.combo+1);
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
    this.shiftFavor(-1);
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

  /* ---------------- honey pot ---------------- */
  potReady(){ return this.pot.brew >= this.pot.brewMax; },
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
    this.potGame={ drops:[], spawnT:300, jarX:200,
      bubbles:Array.from({length:6},()=>({ x:Math.random()*400, y:280+Math.random()*20, r:3+Math.random()*4, speed:0.01+Math.random()*0.02 })) };
    Sound.potOpen(); this.shiftFavor(-4);
    this.bark(Barks.potOpen);
    this.updatePotUI();
    potOverlay.classList.remove('hidden');
  },
  closePotGame(){
    Sound.potClose();
    potOverlay.classList.add('hidden');
    const back=this.pausedState; this.pausedState=null;
    if(back==='playing'||back==='bonus'){
      this.state=back;
      if(this.pausedRemain!=null) this.deadline=performance.now()+this.pausedRemain;
      this.say('artificer','Thank you. The Act resumes exactly where it stopped. It always does. That is the problem.');
    }else{
      this.nextRound();
    }
  },
  harvestPot(){
    if(!this.potReady()){ Sound.deny(); return; }
    const lump=30+Math.round(this.round*1.5);
    this.score+=lump*2; this.goo+=lump;
    this.pot.brew=0; this.potBuffT=10000;
    this.gainXp(40);
    potHarvestFlash.textContent='+'+lump+' 🍯 GLAZED!';
    potHarvestFlash.classList.remove('show'); void potHarvestFlash.offsetWidth; potHarvestFlash.classList.add('show');
    FX.stamp('HONEY POT!','#fff02f','#ff7a2f');
    setTimeout(()=>FX.stamp('GLAZED! goo x1.5','#ff7a2f','#fff02f'),220);
    FX.confetti(240,240,30); FX.shake(true); Sound.harvest();
    this.noteCodex('HARVESTED THE HONEY POT');
    this.say('goblin','THE POT PAYS. glazed. everything you earn is worth more now. this is my best system');
    this.updateHUD(); this.updatePotUI();
  },
  updatePotGame(dt){
    const p=this.potGame; if(!p) return;
    p.bubbles.forEach(b=>{ b.y-=b.speed*dt; if(b.y<-10){ b.y=290; b.x=Math.random()*400; } });
    p.spawnT-=dt;
    if(p.spawnT<=0){
      p.spawnT=480+Math.random()*380;
      const roll=Math.random();
      const kind = roll<0.12?'gold':roll<0.24?'bee':'drip';
      p.drops.push({ x:24+Math.random()*352, y:-10, vy:0.1+Math.random()*0.05, kind, caught:false });
    }
    const jarY=258, jarHalfW=34;
    p.drops.forEach(d=>{
      if(d.caught) return;
      const wasAbove=d.y<jarY;
      d.y+=d.vy*dt;
      if(wasAbove && d.y>=jarY && Math.abs(d.x-p.jarX)<=jarHalfW){
        d.caught=true;
        if(d.kind==='gold'){ this.pot.brew=Math.min(this.pot.brewMax,this.pot.brew+8); this.score+=5; Sound.goldDrip(); }
        else if(d.kind==='bee'){ this.pot.brew=Math.min(this.pot.brewMax,this.pot.brew+5); Sound.beeBuzz(); }
        else{ this.pot.brew=Math.min(this.pot.brewMax,this.pot.brew+3); Sound.drip(); }
        this.updateHUD(); this.updatePotUI();
      }
    });
    p.drops=p.drops.filter(d=> !d.caught && d.y<320);
  },
  renderPotGame(){
    const p=this.potGame; if(!p) return;
    const c=potCtx;
    c.clearRect(0,0,400,300);
    c.fillStyle='#150f22'; c.fillRect(0,0,400,300);
    p.bubbles.forEach(b=>{ c.beginPath(); c.arc(b.x,b.y,b.r,0,Math.PI*2); c.fillStyle='rgba(255,240,47,0.12)'; c.fill(); });
    p.drops.forEach(d=>{
      if(d.caught) return;
      c.beginPath(); c.arc(d.x,d.y, d.kind==='gold'?10:d.kind==='bee'?9:7, 0, Math.PI*2);
      c.fillStyle = d.kind==='gold'?'#fff02f':d.kind==='bee'?'#0c0a15':'#ff7a2f';
      c.fill();
      if(d.kind==='bee'){ c.fillStyle='#fff02f'; c.fillRect(d.x-6,d.y-2,12,4); }
    });
    c.fillStyle='#2fe1ff'; c.fillRect(p.jarX-34,250,68,26);
    c.fillStyle='#0c0a15'; c.font='16px sans-serif'; c.textAlign='center'; c.textBaseline='middle';
    c.fillText('🍯', p.jarX, 266);
  },
  potPointer(e){
    const rect=potCanvas.getBoundingClientRect();
    const x=(e.clientX-rect.left)*(400/rect.width);
    if(this.potGame) this.potGame.jarX=Math.max(24,Math.min(376,x));
  },

  /* ---------------- defense ---------------- */
  turretCost(){ return 10 + (this.turret.level-1)*8; },
  updateDefense(dt){
    const d=this.defense;
    d.spawnT-=dt;
    if(d.spawnT<=0){
      d.spawnT=Math.max(650, 1400-this.round*15);
      d.enemies.push({ x:-10, y:20+Math.random()*40, r:12+Math.random()*6, hp:1, alive:true, wobble:Math.random()*10 });
    }
    const jitter=(this.mutator && this.mutator.id==='quake')?3:1;
    d.enemies.forEach(en=>{ if(en.alive) en.x+=0.05*dt*jitter; });
    d.enemies=d.enemies.filter(en=> en.x<660);
    const moodFactor={happy:0.85,neutral:1,grumpy:1.2,feral:1.5}[this.buddy.mood]||1;
    const rushBoost=(this.mutator && this.mutator.id==='rush')?0.75:1;
    const effInterval=this.turret.fireInterval*moodFactor*rushBoost;
    const hitCount=this.shopLevels.splash?2:1;
    this.turrets.forEach(tur=>{
      tur.fireT-=dt;
      if(tur.fireT<=0){
        tur.fireT=effInterval;
        let hits=0;
        for(const en of d.enemies){
          if(hits>=hitCount) break;
          if(!en.alive) continue;
          en.hp-=this.turret.dmg;
          d.projectiles.push({ x1:tur.x, y1:tur.y, x2:en.x, y2:en.y, t:0 });
          hits++;
          if(en.hp<=0){
            en.alive=false;
            this.addGoo(1*this.gooMult()*this.comboGooMult());
            this.buddy.hunger=Math.min(1,this.buddy.hunger+0.03);
            Sound.pop(false); this.updateHUD();
          }
        }
        if(hits>0) Sound.turretFire();
      }
    });
    d.projectiles.forEach(p=> p.t+=dt);
    d.projectiles=d.projectiles.filter(p=> p.t<150);
  },
  renderDefense(){
    const c=defenseCtx, d=this.defense;
    c.clearRect(0,0,640,80);
    c.strokeStyle='#2a2438'; c.beginPath(); c.moveTo(0,60); c.lineTo(640,60); c.stroke();
    this.turrets.forEach(tur=>{
      c.fillStyle='#2fe1ff'; c.beginPath(); c.arc(tur.x,tur.y,14,0,Math.PI*2); c.fill();
      c.fillStyle='#0c0a15'; c.font='14px sans-serif'; c.textAlign='center'; c.textBaseline='middle';
      c.fillText('🛡', tur.x, tur.y+1);
    });
    d.enemies.forEach(en=>{
      if(!en.alive) return;
      c.beginPath(); c.arc(en.x, en.y+Math.sin((en.x+en.wobble)*0.2)*4, en.r,0,Math.PI*2);
      c.fillStyle='#c9ff2f'; c.fill();
    });
    d.projectiles.forEach(p=>{
      c.strokeStyle='#fff02f'; c.lineWidth=2;
      c.beginPath(); c.moveTo(p.x1,p.y1); c.lineTo(p.x2,p.y2); c.stroke();
    });
  },
  defenseTap(x,y){
    const d=this.defense;
    for(const en of d.enemies){
      if(!en.alive) continue;
      if(Math.hypot(x-en.x,y-en.y)<=en.r+10){
        en.alive=false;
        this.addGoo(3*this.gooMult()*this.comboGooMult());
        this.score+=5;
        this.buddy.hunger=Math.min(1,this.buddy.hunger+0.05);
        Sound.pop(true);
        if(Math.random()<0.25) FX.stamp('POP!','#c9ff2f','#2fe1ff');
        this.updateHUD();
        return;
      }
    }
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
    if(id==='secondturret') this.turrets.push({x:560,y:50,fireT:0});
    this.shiftFavor(+4);
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
    }

    this.updateBuddyTick(dt);
    this.updateDefense(dt);
    this.renderDefense();

    if(this.potBuffT>0) this.potBuffT=Math.max(0,this.potBuffT-dt);
    if(!this.potReady()) this.pot.brew=Math.min(this.pot.brewMax, this.pot.brew+dt*0.0004);
    this.updatePotUI();

    // idle chatter: the two creators fill silence, weighted by favor
    if(this.state!=='boot' && this.state!=='story' && this.state!=='victory'){
      this.barkT-=dt;
      if(this.barkT<=0){ this.barkT=9000+Math.random()*7000; this.bark(Barks.idle); }
    }

    this.ambientT-=dt;
    if(this.ambientT<=0){ this.ambientT=(2200-this.chaosLevel*700)+Math.random()*1200; FX.ambientSparkle(); }

    this.rafId=requestAnimationFrame(tt=>this.loop(tt));
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
$('victoryBtn').addEventListener('click', ()=>{ Game.ngPlus++; Game.start(true); });
resetBtn.addEventListener('click', ()=>{ Sound.ensure(); Game.start(false); });
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
  if(Game.state==='boot') return;
  const cost=Game.turretCost();
  if(Game.goo>=cost){
    Game.goo-=cost; Game.turret.level++;
    Game.turret.fireInterval=Math.max(300,Game.turret.fireInterval-120);
    Game.turret.dmg+=1;
    FX.stamp('TURRET LV'+Game.turret.level+'!','#2fe1ff','#c9ff2f');
    Sound.upgrade(); Game.updateHUD();
  }else Sound.deny();
});
rerollBtn.addEventListener('click', ()=>{ Sound.ensure(); Game.reroll(); });
potBtn.addEventListener('pointerdown', e=>{
  e.stopPropagation(); Sound.ensure();
  if(Game.state==='boot'||Game.state==='draft'||Game.state==='potgame'||Game.state==='story'||Game.state==='levelup') return;
  Game.openPotGame();
});
potCanvas.addEventListener('pointerdown', e=>{ Sound.ensure(); Game.potPointer(e); });
potCanvas.addEventListener('pointermove', e=>{ Game.potPointer(e); });
potHarvestBtn.addEventListener('click', ()=>{ Sound.ensure(); Game.harvestPot(); });
potDoneBtn.addEventListener('click', ()=>{ Game.closePotGame(); });

$('draftSkipBtn').addEventListener('click', ()=>{
  Sound.select(); Game.shiftFavor(+8);
  draftOverlay.classList.add('hidden');
  Game.say('artificer','Refused. Good. That is one less variable between you and the gate.');
  Game.continueModuleRound();
});

const menuGuard = ()=> Game.state==='boot'||Game.state==='potgame'||Game.state==='draft'||Game.state==='story'||Game.state==='levelup';
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

Game.updateHUD(); Game.updateMutatorChip(); Game.updateBuddyUI();
Game.updateRerollUI(); Game.updatePotUI(); Game.updateHeroUI(); Game.shiftFavor(0);
Game.renderDefense();
