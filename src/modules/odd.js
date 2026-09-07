import { Sound } from "../audio.js";

/**
 * Microgame module. The chassis calls these hooks and catches anything
 * they throw, so a crash here becomes an in-fiction GLITCH, never a
 * broken page. See docs/ADDING-A-MICROGAME.md.
 */
export default {
  id:'odd', verb:'ODD ONE!', color:'#fff02f',
  init(g){
    const n=9;
    const colors=['#ff2f9e','#c9ff2f','#2fe1ff','#fff02f','#7a3cff','#ff7a2f'];
    const baseColor = colors[Math.floor(Math.random()*colors.length)];
    let oddColor = colors[Math.floor(Math.random()*colors.length)];
    while(oddColor===baseColor) oddColor = colors[Math.floor(Math.random()*colors.length)];
    const oddIdx = Math.floor(Math.random()*n);
    const cells=[];
    const cols=3, pad=70, gap=(g.W-pad*2)/(cols-1);
    for(let i=0;i<n;i++){
      const cx = pad + (i%cols)*gap;
      const cy = pad + Math.floor(i/cols)*gap;
      cells.push({x:cx,y:cy,color: i===oddIdx? oddColor: baseColor, odd:i===oddIdx});
    }
    g.local.cells=cells;
  },
  render(g){
    const c=g.ctx, l=g.local;
    c.clearRect(0,0,g.W,g.H);
    l.cells.forEach(cell=>{
      c.beginPath(); c.arc(cell.x,cell.y,32,0,Math.PI*2);
      c.fillStyle=cell.color; c.fill();
    });
    c.fillStyle='#f5f2ff'; c.font='13px sans-serif'; c.textAlign='center';
    c.fillText('tap the odd one out', g.W/2, 26);
  },
  onDown(g,x,y){
    const l=g.local;
    for(const cell of l.cells){
      if(Math.hypot(x-cell.x,y-cell.y)<=36){
        if(cell.odd) g.win(); else g.lose();
        return;
      }
    }
  }
};
