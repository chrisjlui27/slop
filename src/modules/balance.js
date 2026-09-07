import { Sound } from "../audio.js";

/**
 * Microgame module. The chassis calls these hooks and catches anything
 * they throw, so a crash here becomes an in-fiction GLITCH, never a
 * broken page. See docs/ADDING-A-MICROGAME.md.
 */
export default {
  id:'balance', verb:'BALANCE!', color:'#ff7a2f', surviveOnTimeout:true,
  hint:'tap the side it is drifting toward',
  init(g){
    g.local.x = g.W/2;
    g.local.vx = 0;
    g.local.done=false;
  },
  update(g,dt){
    const l=g.local;
    if(l.done) return;
    l.vx += (Math.random()-0.5)*0.02*dt;
    l.vx = Math.max(-0.5,Math.min(0.5,l.vx));
    l.x += l.vx*dt*0.06;
    if(l.x<40 || l.x>g.W-40){ l.done=true; g.lose(); }
  },
  render(g){
    const c=g.ctx, l=g.local;
    c.clearRect(0,0,g.W,g.H);
    c.fillStyle='#1a1522'; c.fillRect(20,g.H/2-4,g.W-40,8);
    c.beginPath(); c.arc(l.x,g.H/2,22,0,Math.PI*2); c.fillStyle='#ff7a2f'; c.fill();
  },
  onDown(g,x){
    const l=g.local;
    if(l.done) return;
    const push = x < g.W/2 ? 1 : -1;
    l.vx += push*0.4;
  }
};
