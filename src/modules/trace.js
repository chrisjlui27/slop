import { Sound } from "../audio.js";

/**
 * Microgame module. The chassis calls these hooks and catches anything
 * they throw, so a crash here becomes an in-fiction GLITCH, never a
 * broken page. See docs/ADDING-A-MICROGAME.md.
 *
 * Drag-precision. Most of the pool resolves on a single tap; this one asks the
 * finger to stay somewhere for a whole second, which is a different skill and
 * plays very differently beside a tap game in a DOUBLE SLOP round.
 */

// Module scope is fine for a pure function — the rule against module state is
// about anything mutable, since two lanes can run this file at once.
const pathY = (g, x) => {
  const l = g.local;
  return g.H / 2 + Math.sin(l.phase + (x / g.W) * Math.PI * 2 * l.freq) * l.amp;
};

export default {
  id:'trace', verb:'TRACE!', color:'#2fe1ff',
  init(g){
    const l=g.local;
    l.amp = 50 + Math.random()*55;
    l.phase = Math.random()*Math.PI*2;
    l.freq = 1.2 + Math.random()*1.1;
    // Capped, or late acts hand you a corridor narrower than a fingertip.
    l.width = Math.max(30, 58 - g.round*0.9);
    l.x = 46;
    l.dragging = false;
    // The grab radius has to be thumb-sized (46px) while the corridor is only
    // ~27px half-width, so an accepted grab can start outside the line. Judging
    // deviation immediately would then fail the player for a grab the game just
    // accepted. Instead the first move inside the corridor "settles" them, and
    // only after that can leaving it lose. A finger that never settles simply
    // makes no progress and the timer decides.
    l.settled = false;
    l.done = false;
  },
  render(g){
    const c=g.ctx, l=g.local;
    c.clearRect(0,0,g.W,g.H);

    c.strokeStyle='#1a1522'; c.lineWidth=l.width; c.lineCap='round';
    c.beginPath();
    for(let x=40;x<=g.W-40;x+=6){
      const y=pathY(g,x);
      if(x===40) c.moveTo(x,y); else c.lineTo(x,y);
    }
    c.stroke();

    // The goal end glows so it is obvious which way to go.
    c.fillStyle='#c9ff2f';
    c.beginPath(); c.arc(g.W-40, pathY(g,g.W-40), 14, 0, Math.PI*2); c.fill();

    c.fillStyle = l.settled ? '#2fe1ff' : (l.dragging ? '#fff02f' : '#7a3cff');
    c.beginPath(); c.arc(l.x, pathY(g,l.x), 13, 0, Math.PI*2); c.fill();

    c.fillStyle='#f5f2ff'; c.font='13px sans-serif'; c.textAlign='center';
    c.fillText(l.settled ? 'stay on the line'
      : (l.dragging ? 'get on the line' : 'drag from the dot'), g.W/2, g.H-40);
  },
  onDown(g,x,y){
    const l=g.local;
    if(l.done) return;
    if(Math.hypot(x-l.x, y-pathY(g,l.x)) < 46) l.dragging=true;
  },
  onMove(g,x,y){
    const l=g.local;
    if(l.done || !l.dragging) return;
    // Only forward progress counts, so you cannot scrub back and forth over
    // the easy stretch until the clock runs out.
    if(x > l.x) l.x = Math.min(g.W-40, x);
    const off = Math.abs(y - pathY(g,l.x));
    if(!l.settled){
      if(off <= l.width/2) l.settled = true;
      return;
    }
    if(off > l.width/2){ l.done=true; g.lose(); return; }
    if(l.x >= g.W-42){ l.done=true; Sound.tap(); g.win(); }
  },
  onUp(g){
    const l=g.local;
    if(l.done) return;
    // Letting go partway is a decision, and it is the wrong one.
    l.done=true; g.lose();
  }
};
