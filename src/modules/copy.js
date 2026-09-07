import { Sound } from "../audio.js";

/**
 * Microgame module. The chassis calls these hooks and catches anything
 * they throw, so a crash here becomes an in-fiction GLITCH, never a
 * broken page. See docs/ADDING-A-MICROGAME.md.
 */
export default {
  id:'copy', verb:'COPY!', color:'#ff2f9e',
  hint:g=>g.local.phase==='show' ? 'watch the order' : 'now repeat it',
  init(g){
    const colors = ['#ff2f9e','#c9ff2f','#2fe1ff','#fff02f'];
    g.local.pads = [
      {x:g.W/2-70,y:g.H/2-70,color:colors[0]}, {x:g.W/2+70,y:g.H/2-70,color:colors[1]},
      {x:g.W/2-70,y:g.H/2+70,color:colors[2]}, {x:g.W/2+70,y:g.H/2+70,color:colors[3]}
    ];
    const len = Math.min(5, 2 + Math.floor(g.round/6));
    g.local.seq = Array.from({length:len}, ()=> Math.floor(Math.random()*4));
    g.local.phase = 'show'; g.local.showIdx = 0; g.local.showT = 0;
    g.local.playerIdx = 0; g.local.flash = -1; g.local.flashT = 0;
  },
  update(g,dt){
    const l=g.local;
    if(l.phase==='show'){
      l.showT += dt;
      const step = 420;
      const idx = Math.floor(l.showT/step);
      if(idx !== l.showIdx){
        l.showIdx = idx;
        if(idx>=0 && idx<l.seq.length) Sound.padTone(l.seq[idx]);
      }
      if(l.showT > step*l.seq.length){ l.phase='input'; l.showIdx=-1; }
    }
    if(l.flashT>0){ l.flashT-=dt; if(l.flashT<=0) l.flash=-1; }
  },
  render(g){
    const c=g.ctx, l=g.local;
    c.clearRect(0,0,g.W,g.H);
    let activePad = -1;
    if(l.phase==='show' && l.showIdx>=0 && l.showIdx<l.seq.length){
      const step = 420, within = l.showT - l.showIdx*step;
      if(within < 260) activePad = l.seq[l.showIdx];
    }
    l.pads.forEach((p,i)=>{
      c.beginPath(); c.arc(p.x,p.y,40,0,Math.PI*2);
      c.fillStyle = (i===activePad || i===l.flash) ? '#ffffff' : p.color;
      c.globalAlpha = (i===activePad || i===l.flash) ? 1 : 0.55;
      c.fill(); c.globalAlpha = 1;
    });
  },
  onDown(g,x,y){
    const l=g.local;
    if(l.phase!=='input') return;
    for(let i=0;i<l.pads.length;i++){
      const p=l.pads[i];
      if(Math.hypot(x-p.x,y-p.y)<=44){
        l.flash=i; l.flashT=180; Sound.padTone(i);
        if(i===l.seq[l.playerIdx]){
          l.playerIdx++;
          if(l.playerIdx>=l.seq.length) g.win();
        }else{ g.lose(); }
        return;
      }
    }
  }
};
