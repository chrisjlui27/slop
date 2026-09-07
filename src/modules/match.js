import { Sound } from "../audio.js";

/**
 * Microgame module. The chassis calls these hooks and catches anything
 * they throw, so a crash here becomes an in-fiction GLITCH, never a
 * broken page. See docs/ADDING-A-MICROGAME.md.
 */
export default {
  id:'match', verb:'MATCH!', color:'#fff02f',
  init(g){
    const shapes=['circle','square','triangle'];
    const colors=['#ff2f9e','#c9ff2f','#2fe1ff','#fff02f'];
    g.local.shape = shapes[Math.floor(Math.random()*shapes.length)];
    g.local.color = colors[Math.floor(Math.random()*colors.length)];
    g.local.phase = 'show';
    g.local.showT = 750;
    const opts = [{shape:g.local.shape,color:g.local.color}];
    while(opts.length<4){
      const s = shapes[Math.floor(Math.random()*shapes.length)];
      const c = colors[Math.floor(Math.random()*colors.length)];
      if(s===g.local.shape && c===g.local.color) continue;
      opts.push({shape:s,color:c});
    }
    for(let i=opts.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [opts[i],opts[j]]=[opts[j],opts[i]]; }
    g.local.opts = opts.map((o,i)=>({ ...o, x: 90+ (i%2)*300, y: 150+Math.floor(i/2)*180 }));
  },
  update(g,dt){ if(g.local.phase==='show'){ g.local.showT -= dt; if(g.local.showT<=0) g.local.phase='choose'; } },
  drawShape(c, shape, color, x, y, r){
    c.fillStyle = color;
    c.beginPath();
    if(shape==='circle'){ c.arc(x,y,r,0,Math.PI*2); }
    else if(shape==='square'){ c.rect(x-r,y-r,r*2,r*2); }
    else{ c.moveTo(x,y-r); c.lineTo(x+r,y+r); c.lineTo(x-r,y+r); c.closePath(); }
    c.fill();
  },
  render(g){
    const c=g.ctx, l=g.local;
    c.clearRect(0,0,g.W,g.H);
    if(l.phase==='show'){
      this.drawShape(c, l.shape, l.color, g.W/2, g.H/2, 60);
    }else{
      l.opts.forEach(o=> this.drawShape(c, o.shape, o.color, o.x, o.y, 46));
    }
  },
  onDown(g,x,y){
    const l=g.local;
    if(l.phase!=='choose') return;
    for(const o of l.opts){
      if(Math.hypot(x-o.x,y-o.y) <= 50){
        if(o.shape===l.shape && o.color===l.color) g.win(); else g.lose();
        return;
      }
    }
  }
};
