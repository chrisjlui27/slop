import { Sound } from "../audio.js";

/**
 * Microgame module. The chassis calls these hooks and catches anything
 * they throw, so a crash here becomes an in-fiction GLITCH, never a
 * broken page. See docs/ADDING-A-MICROGAME.md.
 *
 * Drag-to-connect. Two pairs rather than three: a four-second round has room
 * for two deliberate drags, and asking for a third turns reading the colours
 * into panic.
 */
const COLORS = ['#c9ff2f','#2fe1ff','#ff2f9e','#fff02f'];

export default {
  id:'wire', verb:'CONNECT!', color:'#c9ff2f',
  init(g){
    const l=g.local;
    const pool = COLORS.slice().sort(()=>Math.random()-0.5).slice(0,2);
    const rightOrder = pool.slice().sort(()=>Math.random()-0.5);
    l.left  = pool.map((col,i)=>({ col, x:90,        y:150+i*150, done:false }));
    l.right = rightOrder.map((col,i)=>({ col, x:g.W-90, y:150+i*150 }));
    l.from = null; l.cx = 0; l.cy = 0;
    l.done = false;
  },
  render(g){
    const c=g.ctx, l=g.local;
    c.clearRect(0,0,g.W,g.H);

    l.left.forEach(p=>{
      if(!p.done) return;
      const m = l.right.find(r=>r.col===p.col);
      c.strokeStyle=p.col; c.lineWidth=6; c.lineCap='round';
      c.beginPath(); c.moveTo(p.x,p.y); c.lineTo(m.x,m.y); c.stroke();
    });

    if(l.from){
      c.strokeStyle=l.from.col; c.lineWidth=4; c.setLineDash([7,7]);
      c.beginPath(); c.moveTo(l.from.x,l.from.y); c.lineTo(l.cx,l.cy); c.stroke();
      c.setLineDash([]);
    }

    [].concat(l.left,l.right).forEach(p=>{
      c.fillStyle=p.col;
      c.beginPath(); c.arc(p.x,p.y,26,0,Math.PI*2); c.fill();
    });

    c.fillStyle='#f5f2ff'; c.font='13px sans-serif'; c.textAlign='center';
    c.fillText('drag each colour to its match', g.W/2, g.H-40);
  },
  onDown(g,x,y){
    const l=g.local;
    if(l.done) return;
    const hit = l.left.find(p=>!p.done && Math.hypot(x-p.x,y-p.y)<52);
    if(hit){ l.from=hit; l.cx=x; l.cy=y; }
  },
  onMove(g,x,y){
    const l=g.local;
    if(l.done || !l.from) return;
    l.cx=x; l.cy=y;
  },
  onUp(g,x,y){
    const l=g.local;
    if(l.done || !l.from) return;
    const target = l.right.find(p=>Math.hypot(x-p.x,y-p.y)<52);
    const from = l.from;
    l.from = null;
    if(!target) return;               // released on nothing: no penalty, try again
    if(target.col !== from.col){ l.done=true; g.lose(); return; }
    from.done = true;
    Sound.select();
    if(l.left.every(p=>p.done)){ l.done=true; g.win(); }
  }
};
