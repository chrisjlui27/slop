import { Sound } from "../audio.js";

/**
 * Microgame module. The chassis calls these hooks and catches anything
 * they throw, so a crash here becomes an in-fiction GLITCH, never a
 * broken page. See docs/ADDING-A-MICROGAME.md.
 *
 * Pull back and let go. The pool has drag-to-a-place (sort, wire), drag-along
 * (trace, peel) and hold-then-release-on-time (hold), but nothing where the
 * drag sets an AIM and the release fires it — the one gesture where what you
 * are doing while dragging is choosing a direction and a force at once.
 */
export default {
  id:'sling', verb:'SLING IT!', color:'#ff7a2f',
  hint:g=> g.local.flying ? 'go on then' : 'drag back from the blob, let go',
  init(g){
    const l=g.local;
    l.ox=g.W/2; l.oy=g.H-90;             // the sling, low and thumb-side
    l.px=l.ox; l.py=l.oy;                // the blob while it is being pulled
    l.dragging=false; l.flying=false;
    l.vx=0; l.vy=0;
    // One target, placed high and to a random side, closer in early rounds.
    const spread = Math.min(110, 45 + g.round*3);
    l.tx = g.W/2 + (Math.random()<0.5?-1:1)*(40+Math.random()*spread);
    l.ty = 80 + Math.random()*90;
    // Generous, deliberately: one shot per round and a thumb aiming by feel.
    l.tr = Math.max(52, 76 - g.round*0.5);
    l.done=false;
  },
  update(g,dt){
    const l=g.local;
    if(l.done || !l.flying) return;
    l.px += l.vx*dt; l.py += l.vy*dt;
    // Gentle gravity: enough that a shot arcs, little enough that being ten
    // pixels off on the pull is not a miss. One shot per round buys a lot of
    // forgiveness.
    l.vy += 0.00022*dt;
    if(Math.hypot(l.px-l.tx, l.py-l.ty) <= l.tr){
      l.done=true; Sound.tap(); g.win(); return;
    }
    if(l.px<-30 || l.px>g.W+30 || l.py>g.H+40){ l.done=true; g.lose(); }
  },
  render(g){
    const c=g.ctx, l=g.local;
    c.clearRect(0,0,g.W,g.H);

    c.beginPath(); c.arc(l.tx,l.ty,l.tr,0,Math.PI*2);
    c.strokeStyle='#fff02f'; c.lineWidth=4; c.stroke();
    c.beginPath(); c.arc(l.tx,l.ty,l.tr*0.35,0,Math.PI*2);
    c.fillStyle='#fff02f'; c.fill();

    c.fillStyle='#1a1522';
    c.fillRect(l.ox-38, l.oy+18, 76, 12);

    if(l.dragging){
      // The band, and a dotted line the other way: the shot goes opposite the
      // pull, and nobody should have to learn that by losing a round.
      c.strokeStyle='#ff7a2f'; c.lineWidth=5;
      c.beginPath(); c.moveTo(l.ox,l.oy); c.lineTo(l.px,l.py); c.stroke();
      /* The arc it would actually take, simulated with the same numbers
         update() uses. A straight dotted line was a lie the moment gravity was
         added, and a one-shot aiming game that lies about its aim is a
         coin flip with extra steps. */
      let sx=l.ox, sy=l.oy;
      let svx=(l.ox-l.px)*0.0135, svy=(l.oy-l.py)*0.0135;
      c.fillStyle='#ff7a2f55';
      for(let i=0;i<26;i++){
        for(let k=0;k<3;k++){ sx+=svx*16; sy+=svy*16; svy+=0.00022*16; }
        if(sy>g.H+20||sx<-20||sx>g.W+20) break;
        c.beginPath(); c.arc(sx,sy,3,0,Math.PI*2); c.fill();
      }
    }

    c.beginPath(); c.arc(l.px,l.py,15,0,Math.PI*2);
    c.fillStyle='#c9ff2f'; c.fill();
  },
  onDown(g,x,y){
    const l=g.local;
    if(l.done || l.flying) return;
    if(Math.hypot(x-l.ox, y-l.oy) < 90) l.dragging=true;
  },
  onMove(g,x,y){
    const l=g.local;
    if(l.done || !l.dragging) return;
    // The pull is capped so the shot's power is a decision within a range
    // rather than "drag to the far corner every time".
    const dx=x-l.ox, dy=y-l.oy, d=Math.hypot(dx,dy) || 1;
    const pull=Math.min(120, d);
    l.px = l.ox + dx/d*pull;
    l.py = l.oy + dy/d*pull;
  },
  onUp(g){
    const l=g.local;
    if(l.done || !l.dragging) return;
    l.dragging=false;
    const dx=l.ox-l.px, dy=l.oy-l.py;
    const pull=Math.hypot(dx,dy);
    // A tap with no pull is not a shot; the blob just sits there and the clock
    // takes it, which is a fairer lesson than an instant loss.
    if(pull < 12) return;
    l.flying=true;
    const power=0.0135;
    l.vx=dx*power; l.vy=dy*power;
    Sound.pop(true);
  }
};
