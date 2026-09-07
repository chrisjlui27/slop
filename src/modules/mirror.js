import { Sound } from "../audio.js";

/**
 * Microgame module. The chassis calls these hooks and catches anything
 * they throw, so a crash here becomes an in-fiction GLITCH, never a
 * broken page. See docs/ADDING-A-MICROGAME.md.
 */
export default {
  id:'mirror', verb:'MIRROR!', color:'#2fe1ff',
  hint:'tap the mirrored spot',
  init(g){
    g.local.px = 40+Math.random()*(g.W/2-80);
    g.local.py = 60+Math.random()*(g.H-120);
    g.local.answered=false;
  },
  render(g){
    const c=g.ctx, l=g.local;
    c.clearRect(0,0,g.W,g.H);
    c.strokeStyle='#22203a'; c.beginPath(); c.moveTo(g.W/2,0); c.lineTo(g.W/2,g.H); c.stroke();
    c.beginPath(); c.arc(l.px,l.py,22,0,Math.PI*2); c.fillStyle='#2fe1ff'; c.fill();
  },
  onDown(g,x,y){
    const l=g.local;
    if(l.answered) return;
    l.answered=true;
    const mx = g.W-l.px, my=l.py;
    if(Math.hypot(x-mx,y-my) <= 40) g.win(); else g.lose();
  }
};
