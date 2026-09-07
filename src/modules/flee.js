import { Sound } from "../audio.js";

/**
 * Microgame module. The chassis calls these hooks and catches anything
 * they throw, so a crash here becomes an in-fiction GLITCH, never a
 * broken page. See docs/ADDING-A-MICROGAME.md.
 *
 * Survive-by-dragging. surviveOnTimeout means the clock is the win condition,
 * so this is one of the few trials where the timer bar is a friend — which
 * inverts the read of every other round and is the point of including it.
 */
export default {
  id:'flee', verb:'SURVIVE!', color:'#ff2f9e', surviveOnTimeout:true,
  hint:'drag to keep away from them',
  init(g){
    const l=g.local;
    l.x = g.W/2; l.y = g.H/2;
    const n = Math.min(4, 2 + Math.floor(g.round/6));
    l.hunters = [];
    for(let i=0;i<n;i++){
      const a = (i/n)*Math.PI*2;
      l.hunters.push({
        x: g.W/2 + Math.cos(a)*190,
        y: g.H/2 + Math.sin(a)*190,
        // Capped well below a comfortable drag speed, or it is unwinnable.
        speed: Math.min(0.13, 0.070 + g.round*0.0022)
      });
    }
    l.r = 15;
    l.done = false;
  },
  update(g,dt){
    const l=g.local;
    if(l.done) return;
    for(const h of l.hunters){
      const dx=l.x-h.x, dy=l.y-h.y, d=Math.hypot(dx,dy)||1;
      h.x += (dx/d)*h.speed*dt;
      h.y += (dy/d)*h.speed*dt;
      if(d < l.r+14){ l.done=true; g.lose(); return; }
    }
  },
  render(g){
    const c=g.ctx, l=g.local;
    c.clearRect(0,0,g.W,g.H);
    l.hunters.forEach(h=>{
      c.fillStyle='#ff2f9e';
      c.beginPath(); c.arc(h.x,h.y,14,0,Math.PI*2); c.fill();
    });
    c.fillStyle='#c9ff2f';
    c.beginPath(); c.arc(l.x,l.y,l.r,0,Math.PI*2); c.fill();
  },
  onDown(g,x,y){ this.onMove(g,x,y); },
  onMove(g,x,y){
    const l=g.local;
    if(l.done) return;
    // Clamped inside the canvas so the corner is not a safe pocket the
    // hunters cannot reach.
    l.x = Math.max(l.r, Math.min(g.W-l.r, x));
    l.y = Math.max(l.r, Math.min(g.H-l.r, y));
  }
};
