/* ============================== AUDIO ============================== */
export const Sound = {
  ctx:null, muted:false,
  /* Call from inside a user gesture. Creating the context is only half the job
     on mobile: Android hands back a context in the 'suspended' state, and
     backgrounding an installed PWA suspends it again — so a player who takes a
     phone call mid-run comes back to a silent game. resume() is therefore not a
     one-time unlock but something every gesture re-asserts. It returns a
     promise that rejects when called outside a gesture; that is expected and
     harmless, hence the swallow. */
  ensure(){
    if(!this.ctx){
      try{ this.ctx = new (window.AudioContext||window.webkitAudioContext)(); }catch(e){}
    }
    if(this.ctx && this.ctx.state === 'suspended'){
      try{ this.ctx.resume(); }catch(e){}
    }
  },
  blip(freq, dur, type, vol){
    if(this.muted || !this.ctx) return;
    try{
      const t0 = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type || 'square';
      osc.frequency.setValueAtTime(freq, t0);
      gain.gain.setValueAtTime((vol!=null?vol:0.16), t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + (dur||0.1));
      osc.connect(gain).connect(this.ctx.destination);
      osc.start(t0); osc.stop(t0 + (dur||0.1) + 0.02);
    }catch(e){}
  },
  win(){ this.blip(660,0.08,'square',0.14); setTimeout(()=>this.blip(990,0.12,'square',0.14),70); },
  tap(){ this.blip(880,0.045,'square',0.10); },
  glitch(){ this.blip(90,0.05,'square',0.12); this.blip(2200,0.03,'square',0.05); },
  chaos(){ [220,330,440,660].forEach((f,i)=> setTimeout(()=>this.blip(f,0.09,'triangle',0.11), i*40)); },
  crunch(){ [300,220,160,110].forEach((f,i)=> setTimeout(()=>this.blip(f,0.05,'square',0.14), i*30)); },
  sugar(){ [880,1046,1318,1568].forEach((f,i)=> setTimeout(()=>this.blip(f,0.07,'sine',0.12), i*35)); },
  pop(manual){ this.blip(manual?720:480, manual?0.05:0.04, 'square', manual?0.13:0.08); },
  turretFire(){ this.blip(1400,0.03,'square',0.06); },
  levelUp(){ [440,554,659,880].forEach((f,i)=> setTimeout(()=>this.blip(f,0.09,'square',0.13), i*60)); },
  upgrade(){ this.blip(660,0.08,'square',0.15); setTimeout(()=>this.blip(880,0.1,'square',0.15),60); },
  deny(){ this.blip(140,0.12,'sawtooth',0.12); },
  select(){ this.blip(760,0.06,'square',0.13); setTimeout(()=>this.blip(1000,0.05,'square',0.1),40); },
  menuOpen(){ this.blip(300,0.04,'square',0.08); setTimeout(()=>this.blip(500,0.04,'square',0.08),30); },
  padTone(i){ const freqs=[329.63,392.00,493.88,587.33]; this.blip(freqs[i%freqs.length], 0.14, 'sine', 0.17); },
  harvest(){ [392,494,587,784].forEach((f,i)=> setTimeout(()=>this.blip(f,0.1,'sine',0.15), i*70)); },
  drip(){ this.blip(560+Math.random()*220,0.05,'sine',0.12); },
  goldDrip(){ [700,900,1100].forEach((f,i)=> setTimeout(()=>this.blip(f,0.06,'sine',0.14), i*30)); },
  beeBuzz(){ this.blip(180,0.12,'sawtooth',0.08); },
  potOpen(){ this.blip(220,0.08,'sine',0.1); setTimeout(()=>this.blip(500,0.1,'sine',0.12),60); setTimeout(()=>this.blip(820,0.12,'sine',0.14),140); },
  potClose(){ this.blip(700,0.06,'sine',0.1); setTimeout(()=>this.blip(320,0.1,'sine',0.1),50); },
  /* --- narrative voices: each creator has a signature timbre --- */
  goblinSpeak(){ this.blip(180+Math.random()*80,0.05,'sawtooth',0.07); setTimeout(()=>this.blip(140+Math.random()*60,0.04,'sawtooth',0.05),55); },
  artificerSpeak(){ this.blip(520,0.05,'sine',0.07); setTimeout(()=>this.blip(700,0.05,'sine',0.06),60); },
  bossAppear(){ [110,98,87,73].forEach((f,i)=> setTimeout(()=>this.blip(f,0.3,'sawtooth',0.16), i*140)); },
  bossHit(){ this.blip(240,0.07,'square',0.16); setTimeout(()=>this.blip(160,0.09,'sawtooth',0.12),50); },
  bossDown(){ [523,659,784,1046,1318].forEach((f,i)=> setTimeout(()=>this.blip(f,0.16,'square',0.16), i*110)); },
  actStart(){ [330,415,494,622].forEach((f,i)=> setTimeout(()=>this.blip(f,0.18,'triangle',0.13), i*130)); },
  victory(){ [523,659,784,1046,784,1046,1318].forEach((f,i)=> setTimeout(()=>this.blip(f,0.22,'square',0.17), i*170)); }
};
