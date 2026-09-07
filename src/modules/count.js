import { Sound } from "../audio.js";

/**
 * Microgame module. The chassis calls these hooks and catches anything
 * they throw, so a crash here becomes an in-fiction GLITCH, never a
 * broken page. See docs/ADDING-A-MICROGAME.md.
 */
export default {
  id:'count', verb:'COUNT!', color:'#ff7a2f',
  init(g){
    g.local.correct = 2 + Math.floor(Math.random()*4);
    g.local.decoys = 1 + Math.floor(Math.random()*3);
    const items = [];
    for(let i=0;i<g.local.correct;i++) items.push({ x:40+Math.random()*(g.W-80), y:40+Math.random()*(g.H-160), good:true });
    for(let i=0;i<g.local.decoys;i++) items.push({ x:40+Math.random()*(g.W-80), y:40+Math.random()*(g.H-160), good:false });
    g.local.items = items;
    g.local.phase = 'show';
    g.local.showT = 900;
    const answers = [g.local.correct-1, g.local.correct, g.local.correct+1].filter(n=>n>=0);
    for(let i=answers.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [answers[i],answers[j]]=[answers[j],answers[i]]; }
    g.local.answers = answers.map((n,i)=>({ n, x: 90+i*150, y: g.H-70 }));
  },
  update(g,dt){ if(g.local.phase==='show'){ g.local.showT-=dt; if(g.local.showT<=0) g.local.phase='answer'; } },
  render(g){
    const c=g.ctx, l=g.local;
    c.clearRect(0,0,g.W,g.H);
    if(l.phase==='show'){
      l.items.forEach(it=>{
        c.beginPath(); c.arc(it.x,it.y,18,0,Math.PI*2);
        c.fillStyle = it.good ? '#c9ff2f' : '#ff2f9e'; c.fill();
      });
      c.fillStyle='#f5f2ff'; c.font='13px sans-serif'; c.textAlign='center';
      c.fillText('count the GREEN ones', g.W/2, 26);
    }else{
      c.fillStyle='#f5f2ff'; c.font='13px sans-serif'; c.textAlign='center';
      c.fillText('how many green?', g.W/2, g.H/2-60);
      l.answers.forEach(a=>{
        c.fillStyle='#ff7a2f'; c.beginPath(); c.arc(a.x,a.y,38,0,Math.PI*2); c.fill();
        c.fillStyle='#0c0a15'; c.font='bold 22px sans-serif'; c.fillText(a.n, a.x, a.y+2);
      });
    }
  },
  onDown(g,x,y){
    const l=g.local;
    if(l.phase!=='answer') return;
    for(const a of l.answers){
      if(Math.hypot(x-a.x,y-a.y)<=42){
        if(a.n===l.correct) g.win(); else g.lose();
        return;
      }
    }
  }
};
