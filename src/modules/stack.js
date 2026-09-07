import { Sound } from "../audio.js";

/**
 * Microgame module. The chassis calls these hooks and catches anything
 * they throw, so a crash here becomes an in-fiction GLITCH, never a
 * broken page. See docs/ADDING-A-MICROGAME.md.
 *
 * Timing. One tap, but the tap has to land in a window rather than on a
 * target — the skill is reading the swing, not finding the thing.
 */
export default {
  id:'stack', verb:'DROP IT!', color:'#ff7a2f',
  init(g){
    const l=g.local;
    l.baseW = Math.max(66, 132 - g.round*3);
    l.blockW = l.baseW;
    l.x = 60;
    l.dir = Math.random() < 0.5 ? 1 : -1;
    l.speed = Math.min(0.46, 0.20 + g.round*0.008);
    l.dropping = false;
    l.y = 140;
    l.done = false;
  },
  update(g,dt){
    const l=g.local;
    if(l.done) return;
    if(l.dropping){
      l.y += 1.1*dt;
      if(l.y >= g.H/2 + 60){
        l.done = true;
        // Overlap with the plinth below decides it. Anything that clips an
        // edge counts as a miss, which is what makes the swing worth reading.
        const overlap = Math.min(l.x+l.blockW/2, g.W/2+l.baseW/2) -
                        Math.max(l.x-l.blockW/2, g.W/2-l.baseW/2);
        if(overlap >= l.blockW*0.62){ Sound.tap(); g.win(); } else g.lose();
      }
      return;
    }
    l.x += l.dir * l.speed * dt;
    if(l.x < 50){ l.x = 50; l.dir = 1; }
    if(l.x > g.W-50){ l.x = g.W-50; l.dir = -1; }
  },
  render(g){
    const c=g.ctx, l=g.local;
    c.clearRect(0,0,g.W,g.H);

    c.fillStyle='#2a2238';
    c.fillRect(g.W/2-l.baseW/2, g.H/2+72, l.baseW, 44);

    c.fillStyle='#ff7a2f';
    c.fillRect(l.x-l.blockW/2, l.y, l.blockW, 34);

    if(!l.dropping){
      c.strokeStyle='#ff7a2f55'; c.lineWidth=2;
      c.beginPath(); c.moveTo(l.x, l.y+34); c.lineTo(l.x, g.H/2+72); c.stroke();
    }

    c.fillStyle='#f5f2ff'; c.font='13px sans-serif'; c.textAlign='center';
    c.fillText('tap when it lines up', g.W/2, g.H-40);
  },
  onDown(g){
    const l=g.local;
    if(l.done || l.dropping) return;
    l.dropping = true;
  }
};
