import { Sound } from "../audio.js";

/**
 * Microgame module. The chassis calls these hooks and catches anything
 * they throw, so a crash here becomes an in-fiction GLITCH, never a
 * broken page. See docs/ADDING-A-MICROGAME.md.
 *
 * Pursuit. The target flees the pointer rather than sitting still, so this is
 * a drag game that punishes a straight line — you have to cut a corner off.
 */
export default {
  id:'chase', verb:'CATCH IT!', color:'#fff02f',
  init(g){
    const l=g.local;
    l.tx = g.W/2 + (Math.random()-0.5)*160;
    l.ty = g.H/2 + (Math.random()-0.5)*160;
    l.px = -999; l.py = -999;
    // Capped: a target faster than a thumb can move is not a game.
    l.speed = Math.min(0.34, 0.16 + g.round*0.006);
    l.r = Math.max(20, 32 - g.round*0.4);
    l.done = false;
  },
  update(g,dt){
    const l=g.local;
    if(l.done) return;
    const dx = l.tx - l.px, dy = l.ty - l.py;
    const d = Math.hypot(dx,dy) || 1;

    // Flees only when the pointer is close, so it drifts lazily until chased
    // and the player gets a moment to read the board.
    if(d < 210){
      l.tx += (dx/d) * l.speed * dt;
      l.ty += (dy/d) * l.speed * dt;
    }

    // Bounce off the walls rather than clamping, or it parks in a corner and
    // becomes trivial to trap.
    if(l.tx < l.r){ l.tx = l.r; l.px = g.W; }
    if(l.tx > g.W-l.r){ l.tx = g.W-l.r; l.px = 0; }
    if(l.ty < l.r){ l.ty = l.r; l.py = g.H; }
    if(l.ty > g.H-l.r){ l.ty = g.H-l.r; l.py = 0; }
  },
  render(g){
    const c=g.ctx, l=g.local;
    c.clearRect(0,0,g.W,g.H);
    c.fillStyle='#fff02f';
    c.beginPath(); c.arc(l.tx,l.ty,l.r,0,Math.PI*2); c.fill();
    c.fillStyle='#0c0a15'; c.font='16px sans-serif'; c.textAlign='center'; c.textBaseline='middle';
    c.fillText('!', l.tx, l.ty+1);
    c.fillStyle='#f5f2ff'; c.font='13px sans-serif'; c.textBaseline='alphabetic';
    c.fillText('drag onto it. it runs', g.W/2, g.H-40);
  },
  onDown(g,x,y){ this.onMove(g,x,y); },
  onMove(g,x,y){
    const l=g.local;
    if(l.done) return;
    l.px=x; l.py=y;
    if(Math.hypot(x-l.tx, y-l.ty) <= l.r){
      l.done=true; Sound.tap(); g.win();
    }
  }
};
