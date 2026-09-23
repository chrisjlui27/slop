import { Sound } from "../audio.js";

/**
 * Microgame module. The chassis calls these hooks and catches anything
 * they throw, so a crash here becomes an in-fiction GLITCH, never a
 * broken page. See docs/ADDING-A-MICROGAME.md.
 *
 * Stillness. Every other drag game in the pool is about going somewhere —
 * peel pulls, trace follows, chase pursues, flee runs. This one is about a
 * thumb that does not move while the board tries very hard to make it, which
 * is the one thing a touch screen can ask for that none of them do.
 */
export default {
  id:'steady', verb:'HOLD STILL!', color:'#2fe1ff', surviveOnTimeout:true,
  hint:g=> g.local.down ? 'do not move' : 'press and hold anywhere',
  init(g){
    const l=g.local;
    l.down=false; l.ax=0; l.ay=0;
    l.grace=1100;                        // time to get a thumb down at all
    // The allowance shrinks with the round but floors well above a thumb's
    // own tremor — a target nobody can hold is not a game about holding.
    l.tol = Math.max(26, 44 - g.round*0.4);
    l.drift = 0;
    l.done=false;
    l.lures = Array.from({length:3},(_,i)=>({ a:i*2.1, r:110+i*38, s:0.0016+i*0.0006 }));
    l.t = 0;
  },
  update(g,dt){
    const l=g.local;
    if(l.done) return;
    l.t += dt;
    l.lures.forEach(u=>{ u.a += u.s*dt; });
    if(!l.down){
      l.grace -= dt;
      // Never putting a thumb down is not surviving, it is not playing.
      if(l.grace<=0){ l.done=true; g.lose(); }
    }
  },
  render(g){
    const c=g.ctx, l=g.local;
    c.clearRect(0,0,g.W,g.H);

    // The lures: things that move, fast, near where the finger has to not.
    c.fillStyle='#1a1522';
    l.lures.forEach(u=>{
      const x=g.W/2+Math.cos(u.a)*u.r, y=g.H/2+Math.sin(u.a)*u.r;
      c.beginPath(); c.arc(x,y,16,0,Math.PI*2); c.fill();
    });

    if(!l.down){
      c.beginPath(); c.arc(g.W/2,g.H/2,l.tol,0,Math.PI*2);
      c.strokeStyle='#2fe1ff'; c.lineWidth=3; c.stroke();
      return;
    }
    // Once a thumb is down the ring is where it landed, and it closes as the
    // drift grows — the feedback has to be on the finger, not in a corner.
    const slack = Math.max(0, l.tol - l.drift);
    c.beginPath(); c.arc(l.ax,l.ay,l.tol,0,Math.PI*2);
    c.strokeStyle='#1e2a33'; c.lineWidth=3; c.stroke();
    c.beginPath(); c.arc(l.ax,l.ay,slack,0,Math.PI*2);
    c.fillStyle = slack>l.tol*0.4 ? '#2fe1ff' : '#ff2f9e';
    c.globalAlpha=0.35; c.fill(); c.globalAlpha=1;
  },
  onDown(g,x,y){
    const l=g.local;
    if(l.done || l.down) return;
    l.down=true; l.ax=x; l.ay=y; l.drift=0;
    Sound.tap();
  },
  onMove(g,x,y){
    const l=g.local;
    if(l.done || !l.down) return;
    // Distance from where the thumb landed, not distance travelled: a slow
    // wander back to the start is steady enough, and measuring the path would
    // fail anyone whose finger shakes in place.
    l.drift = Math.hypot(x-l.ax, y-l.ay);
    if(l.drift > l.tol){ l.done=true; g.lose(); }
  },
  onUp(g){
    const l=g.local;
    if(l.done) return;
    // Letting go is moving.
    l.done=true; g.lose();
  }
};
