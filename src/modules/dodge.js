import { Sound } from "../audio.js";

/**
 * Microgame module. The chassis calls these hooks and catches anything
 * they throw, so a crash here becomes an in-fiction GLITCH, never a
 * broken page. See docs/ADDING-A-MICROGAME.md.
 */
export default {
  id:'dodge', verb:'DODGE!', color:'#2fe1ff',
  hint:'tap a lane — not the one it lands in',
  init(g){
    g.local.laneX = [g.W/6, g.W/2, g.W*5/6];
    g.local.hazardLane = Math.floor(Math.random()*3);
    g.local.playerLane = 1;
    g.local.y = -20;
    g.local.speed = 0.09 + Math.min(0.1, g.round*0.003);
    g.local.landed = false;
  },
  update(g,dt){
    const l=g.local;
    if(l.landed) return;
    l.y += l.speed*dt;
    if(l.y >= g.H - 50){
      l.landed = true;
      if(l.playerLane === l.hazardLane) g.lose(); else g.win();
    }
  },
  render(g){
    const c=g.ctx, l=g.local;
    c.clearRect(0,0,g.W,g.H);
    c.strokeStyle='#22203a'; c.lineWidth=2;
    [g.W/3, g.W*2/3].forEach(x=>{ c.beginPath(); c.moveTo(x,0); c.lineTo(x,g.H); c.stroke(); });
    c.fillStyle = '#2fe1ff';
    c.beginPath(); c.arc(l.laneX[l.hazardLane], l.y, 22, 0, Math.PI*2); c.fill();
    c.fillStyle = '#fff02f';
    c.fillRect(l.laneX[l.playerLane]-18, g.H-40, 36, 20);
  },
  onDown(g,x,y){
    const l=g.local;
    let lane = 0;
    if(x > g.W*2/3) lane = 2; else if(x > g.W/3) lane = 1;
    l.playerLane = lane;
  }
};
