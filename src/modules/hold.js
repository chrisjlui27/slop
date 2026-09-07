import { Sound } from "../audio.js";

/**
 * Microgame module. The chassis calls these hooks and catches anything
 * they throw, so a crash here becomes an in-fiction GLITCH, never a
 * broken page. See docs/ADDING-A-MICROGAME.md.
 */
export default {
  id:'hold', verb:'HOLD!', color:'#7a3cff',
  hint:'hold, then release inside the zone',
  init(g){
    g.local.charge=0; g.local.holding=false; g.local.done=false;
    g.local.rate = 0.7 + Math.min(0.4, g.round*0.02);
    const zw = Math.max(0.14, 0.32 - g.round*0.006);
    const zs = Math.random()*(1-zw);
    g.local.zoneStart=zs; g.local.zoneEnd=zs+zw;
  },
  update(g,dt){
    const l=g.local;
    if(l.done) return;
    const d = dt/1000;
    if(l.holding) l.charge = Math.min(1, l.charge + l.rate*d);
    else l.charge = Math.max(0, l.charge - 1.2*d);
  },
  render(g){
    const c=g.ctx, l=g.local;
    c.clearRect(0,0,g.W,g.H);
    const x=g.W/2, y0=50, y1=g.H-50, h=y1-y0;
    c.fillStyle='#1a1522'; c.fillRect(x-22,y0,44,h);
    const zy0 = y1 - l.zoneEnd*h, zy1 = y1 - l.zoneStart*h;
    c.fillStyle='#c9ff2f'; c.fillRect(x-22, zy0, 44, zy1-zy0);
    const fy = y1 - l.charge*h;
    c.fillStyle='#7a3cff'; c.fillRect(x-14, fy, 28, y1-fy);
  },
  onDown(g){ g.local.holding=true; },
  onUp(g){
    const l=g.local;
    l.holding=false;
    if(l.done) return;
    l.done=true;
    if(l.charge>=l.zoneStart && l.charge<=l.zoneEnd) g.win(); else g.lose();
  }
};
