import { Sound } from "../audio.js";

/**
 * Microgame module. The chassis calls these hooks and catches anything
 * they throw, so a crash here becomes an in-fiction GLITCH, never a
 * broken page. See docs/ADDING-A-MICROGAME.md.
 */
export default {
  id:'sort', verb:'SORT!', color:'#2fe1ff',
  init(g){
    const colors = ['#ff2f9e','#c9ff2f','#2fe1ff'];
    g.local.itemColor = colors[Math.floor(Math.random()*colors.length)];
    g.local.item = { x: g.W/2, y: 70, r: 26 };
    g.local.dragging = false;
    g.local.bins = colors.map((c,i)=>({ color:c, x: (g.W/6)+i*(g.W/3), y:g.H-50, w:g.W/3-20, h:70 }));
  },
  render(g){
    const c=g.ctx, l=g.local;
    c.clearRect(0,0,g.W,g.H);
    l.bins.forEach(b=>{
      c.fillStyle = b.color+'55';
      c.fillRect(b.x-b.w/2, b.y-b.h/2, b.w, b.h);
      c.strokeStyle = b.color; c.lineWidth=3;
      c.strokeRect(b.x-b.w/2, b.y-b.h/2, b.w, b.h);
    });
    c.beginPath(); c.arc(l.item.x, l.item.y, l.item.r, 0, Math.PI*2);
    c.fillStyle = l.itemColor; c.fill();
  },
  onDown(g,x,y){
    const l=g.local;
    if(Math.hypot(x-l.item.x,y-l.item.y) <= l.item.r+10) l.dragging = true;
  },
  onMove(g,x,y){
    const l=g.local;
    if(l.dragging){ l.item.x = Math.max(20,Math.min(g.W-20,x)); l.item.y = Math.max(20,Math.min(g.H-20,y)); }
  },
  onUp(g){
    const l=g.local;
    if(!l.dragging) return;
    l.dragging = false;
    for(const b of l.bins){
      if(Math.abs(l.item.x-b.x) <= b.w/2 && Math.abs(l.item.y-b.y) <= b.h/2){
        if(b.color === l.itemColor) g.win(); else g.lose();
        return;
      }
    }
  }
};
