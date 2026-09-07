import { Sound } from "./audio.js";

/* ================================ FX ================================ */
export const FX = {
  layer: document.getElementById('fxLayer'),
  app: document.getElementById('app'),
  palette: ['#ff2f9e','#c9ff2f','#2fe1ff','#fff02f','#7a3cff','#ff7a2f'],
  shake(big){
    this.app.classList.remove('shaking','shakeBig');
    void this.app.offsetWidth;
    this.app.classList.add(big ? 'shakeBig' : 'shaking');
  },
  chroma(){
    const d = document.createElement('div');
    d.className = 'chromaFlash';
    this.layer.appendChild(d);
    setTimeout(()=> d.remove(), 260);
  },
  glitchBars(){
    const n = 4 + Math.floor(Math.random()*3);
    for(let i=0;i<n;i++){
      const d = document.createElement('div');
      d.className = 'glitchBar';
      d.style.height = (4+Math.random()*14)+'px';
      d.style.top = (Math.random()*100)+'%';
      d.style.background = this.rand();
      d.style.transform = 'translateX('+(Math.random()*40-20)+'px)';
      this.layer.appendChild(d);
      setTimeout(()=> d.remove(), 260);
    }
  },
  tapRipple(x,y){
    const d = document.createElement('div');
    d.className = 'ripple';
    d.style.left = x+'px'; d.style.top = y+'px';
    d.style.width='8px'; d.style.height='8px';
    d.style.marginLeft='-4px'; d.style.marginTop='-4px';
    const c = this.rand();
    d.style.background = c;
    d.style.boxShadow = '0 0 14px 4px '+c;
    this.layer.appendChild(d);
    setTimeout(()=> d.remove(), 420);
  },
  ambientSparkle(){
    const d = document.createElement('div');
    d.className = 'twinkle arcade';
    d.textContent = '✦';
    d.style.left = (10+Math.random()*80)+'%';
    d.style.top = (10+Math.random()*80)+'%';
    d.style.fontSize = (8+Math.random()*8)+'px';
    d.style.color = this.rand();
    this.layer.appendChild(d);
    setTimeout(()=> d.remove(), 2700);
  },
  stamp(text, color, color2){
    const d = document.createElement('div');
    d.className = 'stamp arcade';
    d.textContent = text;
    d.style.setProperty('--rot', (Math.random()*24-12)+'deg');
    d.style.setProperty('--stampColor', color || this.rand());
    d.style.setProperty('--stampColor2', color2 || this.rand());
    d.style.left = (35 + Math.random()*30) + '%';
    d.style.top = (35 + Math.random()*30) + '%';
    this.layer.appendChild(d);
    setTimeout(()=> d.remove(), 700);
  },
  combo(x, y, text){
    const d = document.createElement('div');
    d.className = 'combo arcade';
    d.textContent = text;
    d.style.left = x+'px'; d.style.top = y+'px';
    this.layer.appendChild(d);
    setTimeout(()=> d.remove(), 750);
  },
  confetti(cx, cy, n){
    const glyphs = ['★','♥','✦','●','◆','🍯','🐝'];
    for(let i=0;i<(n||24);i++){
      const d = document.createElement('div');
      d.className = 'confetti';
      const ang = Math.random()*Math.PI*2;
      const dist = 60 + Math.random()*130;
      if(Math.random()<0.4){
        d.textContent = glyphs[Math.floor(Math.random()*glyphs.length)];
        d.style.fontSize = (10+Math.random()*10)+'px';
        d.style.color = this.rand();
      }else{
        d.style.background = this.rand();
        d.style.borderRadius = Math.random()<0.5 ? '50%' : '2px';
      }
      d.style.setProperty('--x0', cx+'px');
      d.style.setProperty('--y0', cy+'px');
      d.style.setProperty('--x1', (cx + Math.cos(ang)*dist)+'px');
      d.style.setProperty('--y1', (cy + Math.sin(ang)*dist + 80)+'px');
      d.style.animationDuration = (0.6 + Math.random()*0.6)+'s';
      this.layer.appendChild(d);
      setTimeout(()=> d.remove(), 1300);
    }
  },
  /* `ms` lets the caller shorten the slam. The banner is opaque over the middle
     of the board while the round clock is already running, so a fixed 600ms is
     14% of an early round and 44% of a late one — by Act VIII nearly half of
     every trial was spent looking at a word instead of the game. The verb also
     persists in the lane label for the whole round, so shortening this costs
     no information at all; it was always juice, never the source. */
  verbBanner(text, color, ms){
    const dur = Math.max(220, Math.min(600, ms || 600));
    const d = document.createElement('div');
    d.className = 'verbBanner arcade';
    d.textContent = text;
    d.style.setProperty('--bannerColor', color || this.rand());
    d.style.animationDuration = (dur/1000) + 's';
    this.layer.appendChild(d);
    setTimeout(()=> d.remove(), dur);
  },
  rand(){ return this.palette[Math.floor(Math.random()*this.palette.length)]; },
  chaosEvent(){
    this.shake(true);
    this.chroma();
    this.glitchBars();
    const words = ['MAXIMUM SLOP','TOO MUCH!!','CHAOS BONUS','OVERDRIVE','NO NOTES','SEND IT','BRAIN ROT','GLITCH JUICE','TOO CRUNCHY','SO WIGGLY','CRAB RAVE','PURE CHAOS','HONEY DRIP','UNPLAYTESTED','SHIP IT ANYWAY'];
    this.stamp(words[Math.floor(Math.random()*words.length)]);
    this.confetti(240,240,30);
    Sound.chaos();
  }
};
