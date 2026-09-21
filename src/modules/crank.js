import { Sound } from "../audio.js";

/**
 * Microgame module. The chassis calls these hooks and catches anything
 * they throw, so a crash here becomes an in-fiction GLITCH, never a
 * broken page. See docs/ADDING-A-MICROGAME.md.
 *
 * Rotational drag — the one gesture a thumb does naturally that the pool had
 * no game for. Everything else that reads onMove wants a straight pull
 * (peel, sort, wire) or a chase; this wants a circle, which makes it safe to
 * pair with any of them in a DOUBLE SLOP round.
 */
export default {
  id:'crank', verb:'CRANK!', color:'#7a3cff',
  hint:g=>'drag in circles '+(g.local.cw?'clockwise':'anticlockwise'),
  init(g){
    const l=g.local;
    l.cw = Math.random()<0.5;
    l.hx = g.W/2; l.hy = g.H/2; l.r = 130;
    l.ang = Math.PI/2;          // handle starts at the bottom, where a thumb is
    l.wound = 0;                // radians of travel in the asked-for direction
    // A fast thumb circle is about a third of a second and a late round is
    // barely over one second long, so the goal grows almost not at all. The
    // shrinking round timer is this game's difficulty curve.
    l.goal = Math.PI*2*(1.25 + Math.min(0.35, g.round*0.012));
    l.dragging = false;
    l.last = 0;
    l.ticks = 0;
    l.done = false;
  },
  render(g){
    const c=g.ctx, l=g.local;
    c.clearRect(0,0,g.W,g.H);
    const frac = Math.min(1, l.wound/l.goal);

    // The winch: a crate hauled up as the drum turns, so progress is legible
    // from the left edge without reading the ring.
    c.fillStyle='#1a1522'; c.fillRect(30, 60, 44, g.H-140);
    c.fillStyle='#7a3cff';
    c.fillRect(30, 60+(g.H-200)*(1-frac), 44, 60);

    c.strokeStyle='#1a1522'; c.lineWidth=16;
    c.beginPath(); c.arc(l.hx,l.hy,l.r,0,Math.PI*2); c.stroke();
    c.strokeStyle='#c9ff2f'; c.lineWidth=16;
    c.beginPath(); c.arc(l.hx,l.hy,l.r,-Math.PI/2,-Math.PI/2+Math.PI*2*frac); c.stroke();

    c.strokeStyle='#7a3cff'; c.lineWidth=10;
    const hx=l.hx+Math.cos(l.ang)*l.r, hy=l.hy+Math.sin(l.ang)*l.r;
    c.beginPath(); c.moveTo(l.hx,l.hy); c.lineTo(hx,hy); c.stroke();
    c.beginPath(); c.arc(l.hx,l.hy,26,0,Math.PI*2); c.fillStyle='#7a3cff'; c.fill();
    c.beginPath(); c.arc(hx,hy,30,0,Math.PI*2); c.fillStyle='#fff02f'; c.fill();
  },
  onDown(g,x,y){
    const l=g.local;
    if(l.done) return;
    // Dead zone at the hub: angle is meaningless there, and a thumb landing on
    // the middle should read as a miss, not as a wild spin.
    if(Math.hypot(x-l.hx, y-l.hy) < 45) return;
    l.dragging = true;
    l.last = Math.atan2(y-l.hy, x-l.hx);
    l.ang = l.last;
  },
  onMove(g,x,y){
    const l=g.local;
    if(l.done || !l.dragging) return;
    const a = Math.atan2(y-l.hy, x-l.hx);
    // Shortest way round, so crossing the atan2 seam is not a whole turn.
    let d = a - l.last;
    while(d > Math.PI) d -= Math.PI*2;
    while(d < -Math.PI) d += Math.PI*2;
    l.last = a; l.ang = a;
    const forward = l.cw ? d : -d;
    // Backwards travel is ignored rather than subtracted: a thumb wobbling at
    // the top of a circle should not undo the circle.
    if(forward <= 0) return;
    l.wound += forward;
    const t = Math.floor(l.wound/Math.PI);
    if(t > l.ticks){ l.ticks = t; Sound.pop(true); }
    if(l.wound >= l.goal){ l.done=true; Sound.tap(); g.win(); }
  },
  onUp(g){ g.local.dragging = false; }
};
