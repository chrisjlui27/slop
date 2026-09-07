import { Sound } from "../audio.js";

/**
 * Microgame module. The chassis calls these hooks and catches anything
 * they throw, so a crash here becomes an in-fiction GLITCH, never a
 * broken page. See docs/ADDING-A-MICROGAME.md.
 *
 * Rhythm. The only module that asks for several taps in a fixed cadence rather
 * than one decisive one, so it reads completely differently next to anything
 * else in a double round.
 */
export default {
  id:'rhythm', verb:'KEEP TIME!', color:'#ff2f9e',
  init(g){
    const l=g.local;
    l.line = g.W - 110;
    l.speed = Math.min(0.40, 0.20 + g.round*0.007);
    l.tol = Math.max(30, 52 - g.round*0.7);
    l.notes = [];
    const gap = 150 + Math.random()*40;
    for(let i=0;i<3;i++) l.notes.push({ x: -i*gap, hit:false, missed:false });
    l.done = false;
  },
  update(g,dt){
    const l=g.local;
    if(l.done) return;
    l.notes.forEach(n=>{
      n.x += l.speed*dt;
      // A note that sails past the line unhit ends it immediately — waiting
      // for the timer would leave the player watching a lost round.
      if(!n.hit && !n.missed && n.x > l.line + l.tol){
        n.missed = true;
        l.done = true;
        g.lose();
      }
    });
    if(!l.done && l.notes.every(n=>n.hit)){ l.done=true; g.win(); }
  },
  render(g){
    const c=g.ctx, l=g.local;
    c.clearRect(0,0,g.W,g.H);

    c.strokeStyle='#2a2238'; c.lineWidth=2;
    c.beginPath(); c.moveTo(0,g.H/2); c.lineTo(g.W,g.H/2); c.stroke();

    c.fillStyle='#7a3cff'; c.fillRect(l.line-2, g.H/2-58, 4, 116);
    c.strokeStyle='#7a3cff44'; c.lineWidth=1;
    c.strokeRect(l.line-l.tol, g.H/2-58, l.tol*2, 116);

    l.notes.forEach(n=>{
      if(n.hit) return;
      c.fillStyle = n.missed ? '#4a2a3a' : '#ff2f9e';
      c.beginPath(); c.arc(n.x, g.H/2, 20, 0, Math.PI*2); c.fill();
    });

    const left = l.notes.filter(n=>!n.hit).length;
    c.fillStyle='#f5f2ff'; c.font='13px sans-serif'; c.textAlign='center';
    c.fillText('tap each one on the line · '+left+' left', g.W/2, g.H-40);
  },
  onDown(g){
    const l=g.local;
    if(l.done) return;
    // Always judges the nearest unhit note, so a mistimed tap costs that note
    // rather than silently doing nothing.
    let best=null, bestD=Infinity;
    l.notes.forEach(n=>{
      if(n.hit) return;
      const d=Math.abs(n.x-l.line);
      if(d<bestD){ bestD=d; best=n; }
    });
    if(!best) return;
    if(bestD <= l.tol){ best.hit=true; Sound.padTone(l.notes.indexOf(best)); }
    else { l.done=true; g.lose(); }
  }
};
