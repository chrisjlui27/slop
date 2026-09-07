import { Sound } from "../audio.js";

/**
 * Microgame module. The chassis calls these hooks and catches anything
 * they throw, so a crash here becomes an in-fiction GLITCH, never a
 * broken page. See docs/ADDING-A-MICROGAME.md.
 */
export default {
  id:'stop', verb:'STOP!', color:'#7a3cff',
  init(g){
    g.local.pos = 0; g.local.dir = 1;
    g.local.speed = 0.0011 + Math.min(0.0012, g.round*0.00004);
    const zw = Math.max(0.1, 0.24 - g.round*0.006);
    const zs = Math.random()*(1-zw);
    g.local.zoneStart = zs; g.local.zoneEnd = zs+zw;
    g.local.stopped = false;
  },
  update(g,dt){
    const l=g.local;
    if(l.stopped) return;
    l.pos += l.dir*l.speed*dt;
    if(l.pos>=1){ l.pos=1; l.dir=-1; }
    if(l.pos<=0){ l.pos=0; l.dir=1; }
  },
  render(g){
    const c=g.ctx, l=g.local;
    c.clearRect(0,0,g.W,g.H);
    const trackY = g.H/2, x0=40, x1=g.W-40, tw=x1-x0;
    c.fillStyle='#1a1522'; c.fillRect(x0, trackY-14, tw, 28);
    c.fillStyle='#c9ff2f'; c.fillRect(x0+l.zoneStart*tw, trackY-14, (l.zoneEnd-l.zoneStart)*tw, 28);
    const nx = x0 + l.pos*tw;
    c.fillStyle='#fff02f'; c.fillRect(nx-4, trackY-24, 8, 48);
    c.fillStyle='#f5f2ff'; c.font='13px sans-serif'; c.textAlign='center';
    c.fillText('tap anywhere to STOP', g.W/2, trackY+60);
  },
  onDown(g){
    const l=g.local;
    if(l.stopped) return;
    l.stopped = true;
    if(l.pos>=l.zoneStart && l.pos<=l.zoneEnd) g.win(); else g.lose();
  }
};
