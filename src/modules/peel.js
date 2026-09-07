import { Sound } from "../audio.js";

/**
 * Microgame module. The chassis calls these hooks and catches anything
 * they throw, so a crash here becomes an in-fiction GLITCH, never a
 * broken page. See docs/ADDING-A-MICROGAME.md.
 *
 * Steady-drag. Every other drag game rewards moving fast; this one punishes
 * it. The failure is tearing, so the correct input is a slow deliberate pull —
 * a texture the pool did not have.
 */
export default {
  id:'peel', verb:'PEEL IT!', color:'#c9ff2f',
  init(g){
    const l=g.local;
    l.y = 96;
    l.lastY = 96;
    l.goal = g.H - 110;
    // The tear threshold is per-frame movement, so it is frame-rate sensitive
    // by nature; dt is clamped to 50ms upstream, which bounds the worst case.
    l.maxStep = Math.max(9, 20 - g.round*0.3);
    l.dragging = false;
    l.torn = 0;
    l.done = false;
  },
  render(g){
    const c=g.ctx, l=g.local;
    c.clearRect(0,0,g.W,g.H);

    c.fillStyle='#1a1522';
    c.fillRect(g.W/2-70, 90, 140, l.goal-90+40);

    c.fillStyle = l.torn>0 ? '#ff7a2f' : '#c9ff2f';
    c.fillRect(g.W/2-70, 90, 140, l.y-90);

    c.fillStyle='#7a3cff';
    c.fillRect(g.W/2-84, l.y-9, 168, 18);

    c.strokeStyle='#c9ff2f66'; c.lineWidth=2;
    c.beginPath(); c.moveTo(g.W/2-70, l.goal); c.lineTo(g.W/2+70, l.goal); c.stroke();

    c.fillStyle='#f5f2ff'; c.font='13px sans-serif'; c.textAlign='center';
    c.fillText(l.torn>0 ? 'too fast — slower' : 'drag the tab down, slowly', g.W/2, g.H-40);
  },
  onDown(g,x,y){
    const l=g.local;
    if(l.done) return;
    if(Math.abs(y-l.y) < 54){ l.dragging=true; l.lastY=y; }
  },
  onMove(g,x,y){
    const l=g.local;
    if(l.done || !l.dragging) return;
    const step = y - l.lastY;
    l.lastY = y;
    if(step <= 0) return;             // pulling back up does nothing either way
    if(step > l.maxStep){
      // One warning, then it tears. A single jerk of the thumb ending the
      // round with no feedback would read as the game being broken.
      l.torn++;
      if(l.torn >= 2){ l.done=true; g.lose(); }
      return;
    }
    l.y = Math.min(l.goal, l.y + step);
    if(l.y >= l.goal){ l.done=true; Sound.tap(); g.win(); }
  },
  onUp(g){ g.local.dragging = false; }
};
