import { Sound } from "../audio.js";

/**
 * Microgame module. The chassis calls these hooks and catches anything
 * they throw, so a crash here becomes an in-fiction GLITCH, never a
 * broken page. See docs/ADDING-A-MICROGAME.md.
 *
 * Judgement, with no reflex component at all. Nothing moves and there is
 * nothing to time — the entire round is one look and one decision. The pool
 * needs at least one of these, or every trial is a test of the same hand.
 */
export default {
  id:'weigh', verb:'HEAVIER!', color:'#7a3cff',
  hint:'tap the side with more',
  init(g){
    const l=g.local;
    // Difficulty is the closeness of the two totals, not the speed of
    // anything. Floored at 2 so it never becomes a coin flip.
    const margin = Math.max(2, 9 - Math.floor(g.round*0.35));
    const base = 7 + Math.floor(Math.random()*9);
    l.leftN = base;
    l.rightN = base + margin;
    if(Math.random() < 0.5){ const t=l.leftN; l.leftN=l.rightN; l.rightN=t; }
    l.heavy = l.leftN > l.rightN ? 'L' : 'R';
    l.dots = side => {
      const n = side==='L' ? l.leftN : l.rightN;
      const cx = side==='L' ? g.W*0.28 : g.W*0.72;
      const out=[];
      for(let i=0;i<n;i++){
        const col=i%4, row=Math.floor(i/4);
        out.push({ x: cx-42+col*28, y: 150+row*30 });
      }
      return out;
    };
    l.done=false;
  },
  render(g){
    const c=g.ctx, l=g.local;
    c.clearRect(0,0,g.W,g.H);

    c.strokeStyle='#2a2238'; c.lineWidth=2;
    c.beginPath(); c.moveTo(g.W/2,90); c.lineTo(g.W/2,g.H-90); c.stroke();

    ['L','R'].forEach(side=>{
      c.fillStyle = side==='L' ? '#7a3cff' : '#ff7a2f';
      l.dots(side).forEach(d=>{
        c.beginPath(); c.arc(d.x,d.y,11,0,Math.PI*2); c.fill();
      });
    });
  },
  onDown(g,x){
    const l=g.local;
    if(l.done) return;
    l.done=true;
    const picked = x < g.W/2 ? 'L' : 'R';
    if(picked === l.heavy){ Sound.tap(); g.win(); } else g.lose();
  }
};
