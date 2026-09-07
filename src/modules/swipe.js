import { Sound } from "../audio.js";

/**
 * Microgame module. The chassis calls these hooks and catches anything
 * they throw, so a crash here becomes an in-fiction GLITCH, never a
 * broken page. See docs/ADDING-A-MICROGAME.md.
 */
export default {
  id:'swipe', verb:'SWIPE!', color:'#ff2f9e',
  init(g){
    const dirs=['up','down','left','right'];
    g.local.dir = dirs[Math.floor(Math.random()*4)];
    g.local.start=null;
  },
  render(g){
    const c=g.ctx, l=g.local;
    c.clearRect(0,0,g.W,g.H);
    const cx=g.W/2, cy=g.H/2;
    c.save(); c.translate(cx,cy);
    let rot=0;
    if(l.dir==='up') rot=-Math.PI/2; else if(l.dir==='down') rot=Math.PI/2; else if(l.dir==='left') rot=Math.PI;
    c.rotate(rot);
    c.fillStyle='#ff2f9e';
    c.beginPath(); c.moveTo(60,0); c.lineTo(-20,-40); c.lineTo(-20,40); c.closePath(); c.fill();
    c.restore();
    c.fillStyle='#f5f2ff'; c.font='13px sans-serif'; c.textAlign='center';
    c.fillText('swipe '+l.dir, cx, cy+120);
  },
  onDown(g,x,y){ g.local.start={x,y}; },
  onUp(g,x,y){
    const l=g.local;
    if(!l.start) return;
    const dx=x-l.start.x, dy=y-l.start.y;
    if(Math.hypot(dx,dy) < 30){ g.lose(); return; }
    let actual;
    if(Math.abs(dx) > Math.abs(dy)) actual = dx>0?'right':'left';
    else actual = dy>0?'down':'up';
    if(actual===l.dir) g.win(); else g.lose();
  }
};
