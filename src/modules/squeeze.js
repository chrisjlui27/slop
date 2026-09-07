import { Sound } from "../audio.js";

/**
 * Microgame module. The chassis calls these hooks and catches anything
 * they throw, so a crash here becomes an in-fiction GLITCH, never a
 * broken page. See docs/ADDING-A-MICROGAME.md.
 */
export default {
  id:'squeeze', verb:'SQUEEZE!', color:'#c9ff2f',
  init(g){
    g.local.gap = g.W-40;
    g.local.rate = 0.15 + Math.min(0.1,g.round*0.004);
    const targetW = Math.max(50, 130-g.round*3);
    g.local.targetLow = targetW*0.7; g.local.targetHigh = targetW*1.3;
    g.local.done=false;
  },
  update(g,dt){
    const l=g.local;
    if(l.done) return;
    l.gap = Math.max(0, l.gap - l.rate*dt);
    if(l.gap<=0){ l.done=true; g.lose(); }
  },
  render(g){
    const c=g.ctx, l=g.local;
    c.clearRect(0,0,g.W,g.H);
    const wallW = (g.W-l.gap)/2;
    c.fillStyle='#ff2f9e';
    c.fillRect(0,0,wallW,g.H);
    c.fillRect(g.W-wallW,0,wallW,g.H);
    c.fillStyle='#f5f2ff'; c.font='13px sans-serif'; c.textAlign='center';
    c.fillText('tap when gap feels right', g.W/2, g.H-30);
  },
  onDown(g){
    const l=g.local;
    if(l.done) return;
    l.done=true;
    if(l.gap>=l.targetLow && l.gap<=l.targetHigh) g.win(); else g.lose();
  }
};
