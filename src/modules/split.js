import { Sound } from "../audio.js";

/**
 * Microgame module. The chassis calls these hooks and catches anything
 * they throw, so a crash here becomes an in-fiction GLITCH, never a
 * broken page. See docs/ADDING-A-MICROGAME.md.
 *
 * Judgement, resolved on release. The pool's other judgement games (weigh,
 * odd, count) all ask for a tap on the right thing; this one asks where, and
 * nothing is right until the finger comes up — so the whole round is spent
 * deciding rather than reacting.
 */
export default {
  id:'split', verb:'SPLIT IT!', color:'#c9ff2f',
  hint:'drag the knife — release to cut',
  init(g){
    const l=g.local;
    l.x0 = 40; l.x1 = g.W-40;
    l.base = g.H-90;
    l.n = 24;
    l.cols = [];
    // Two sines plus a little jitter rather than flat randomness: the puddle
    // needs a bias a player can actually read in a second, and uniform noise
    // averages out into a rectangle.
    const p1=Math.random()*6.283, p2=Math.random()*6.283, k=1.4+Math.random()*1.8;
    for(let i=0;i<l.n;i++){
      const t=i/(l.n-1);
      l.cols.push(40
        + 90*(0.5+0.5*Math.sin(p1+t*3.1))
        + 55*(0.5+0.5*Math.sin(p2+t*3.1*k))
        + Math.random()*12);
    }
    l.total = l.cols.reduce((a,b)=>a+b,0);
    l.x = g.W/2;
    l.dragging = false;
    // Tolerance is a share of the whole puddle. Late rounds give barely a
    // second to look, drag and release, so this floors out early.
    l.tol = Math.max(0.055, 0.09 - g.round*0.0009);
    l.done = false;
  },
  // How much of the puddle lies left of a cut at x. Monotone in x, which is
  // what makes the goal findable at all.
  share(l,x){
    const w = (l.x1-l.x0)/l.n;
    let a = 0;
    for(let i=0;i<l.n;i++){
      const left = l.x0+i*w;
      const f = Math.max(0, Math.min(1, (x-left)/w));
      a += l.cols[i]*f;
    }
    return a;
  },
  render(g){
    const c=g.ctx, l=g.local;
    c.clearRect(0,0,g.W,g.H);
    const w = (l.x1-l.x0)/l.n;

    // The two halves are tinted apart so the comparison is a glance rather
    // than a measurement. The whole puddle is laid down in one tint and the
    // right of the cut repainted through a clip, so the tints meet on the one
    // exact edge the knife is at — tinting column by column leaves a seam at
    // every boundary and the goo reads as a bar chart.
    const puddle = () => { for(let i=0;i<l.n;i++) c.fillRect(l.x0+i*w, l.base-l.cols[i], w+1, l.cols[i]); };
    c.fillStyle='#c9ff2f'; puddle();
    c.save();
    c.beginPath(); c.rect(l.x, 0, l.x1-l.x+1, g.H); c.clip();
    c.fillStyle='#4a7a12'; puddle();
    c.restore();

    c.fillStyle='#1a1522'; c.fillRect(l.x0, l.base, l.x1-l.x0, 10);

    c.strokeStyle='#fff02f'; c.lineWidth=4;
    c.beginPath(); c.moveTo(l.x, 70); c.lineTo(l.x, l.base+10); c.stroke();
    c.beginPath();
    c.moveTo(l.x, 96); c.lineTo(l.x-22, 60); c.lineTo(l.x+22, 60); c.closePath();
    c.fillStyle='#fff02f'; c.fill();
  },
  onDown(g,x,y){
    const l=g.local;
    if(l.done) return;
    l.dragging = true;
    l.x = Math.max(l.x0, Math.min(l.x1, x));
  },
  onMove(g,x,y){
    const l=g.local;
    if(l.done || !l.dragging) return;
    l.x = Math.max(l.x0, Math.min(l.x1, x));
  },
  onUp(g){
    const l=g.local;
    if(l.done || !l.dragging) return;
    l.dragging = false;
    l.done = true;
    if(Math.abs(this.share(l,l.x)/l.total - 0.5) <= l.tol){ Sound.tap(); g.win(); }
    else g.lose();
  }
};
