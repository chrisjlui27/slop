import { Sound } from "../audio.js";

/**
 * Microgame module. The chassis calls these hooks and catches anything
 * they throw, so a crash here becomes an in-fiction GLITCH, never a
 * broken page. See docs/ADDING-A-MICROGAME.md.
 */
export default {
  id:'grab', verb:'GRAB!', color:'#c9ff2f',
  init(g){
    g.local.items = [];
    g.local.spawnT = 0;
    g.local.good = 0;
    g.local.target = 5;
    g.local.done = false;
  },
  update(g,dt){
    const l=g.local;
    if(l.done) return;
    l.spawnT -= dt;
    if(l.spawnT<=0){
      l.spawnT = 260 - Math.min(120, g.round*4);
      l.items.push({ x: 30+Math.random()*(g.W-60), y:-20, r:20, vy: 0.09+Math.random()*0.05, bad: Math.random()<0.35, alive:true });
    }
    l.items.forEach(it=>{ if(it.alive) it.y += it.vy*dt; });
    l.items = l.items.filter(it=> it.y < g.H+40);
  },
  render(g){
    const c=g.ctx, l=g.local;
    c.clearRect(0,0,g.W,g.H);
    l.items.forEach(it=>{
      if(!it.alive) return;
      c.beginPath(); c.arc(it.x,it.y,it.r,0,Math.PI*2);
      c.fillStyle = it.bad ? '#ff2f9e' : '#c9ff2f'; c.fill();
      c.fillStyle = '#0c0a15'; c.font='bold 16px sans-serif'; c.textAlign='center'; c.textBaseline='middle';
      c.fillText(it.bad ? '✕' : '★', it.x, it.y+1);
    });
    c.fillStyle='#f5f2ff'; c.font='14px sans-serif'; c.textAlign='left';
    c.fillText('good: '+l.good+'/'+l.target, 12, 22);
  },
  onDown(g,x,y){
    const l=g.local;
    for(const it of l.items){
      if(!it.alive) continue;
      if(Math.hypot(x-it.x,y-it.y) <= it.r){
        it.alive = false;
        if(it.bad){ g.lose(); }
        else{ l.good++; Sound.tap(); if(l.good>=l.target){ l.done=true; g.win(); } }
        break;
      }
    }
  }
};
