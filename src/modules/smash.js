import { Sound } from "../audio.js";

/**
 * Microgame module. The chassis calls these hooks and catches anything
 * they throw, so a crash here becomes an in-fiction GLITCH, never a
 * broken page. See docs/ADDING-A-MICROGAME.md.
 */
export default {
  id:'smash', verb:'SMASH!', color:'#ff2f9e',
  hint:g=>'tap the button fast · '+Math.max(0,g.local.target-g.local.taps)+' to go',
  init(g){
    g.local.target = 8 + Math.min(10, Math.floor(g.round/2));
    g.local.taps = 0;
    g.local.pulse = 0;
    g.local.btn = { x:g.W/2, y:g.H/2, r:80 };
  },
  update(g,dt){ g.local.pulse += dt*0.006; },
  render(g){
    const c=g.ctx, l=g.local;
    c.clearRect(0,0,g.W,g.H);
    const pr = l.btn.r + Math.sin(l.pulse)*6;
    c.beginPath(); c.arc(l.btn.x,l.btn.y,pr,0,Math.PI*2);
    c.fillStyle = 'rgba(255,47,158,0.25)'; c.fill();
    c.beginPath(); c.arc(l.btn.x,l.btn.y,l.btn.r*0.72,0,Math.PI*2);
    c.fillStyle = '#ff2f9e'; c.fill();
    c.fillStyle = '#0c0a15'; c.font = 'bold 34px sans-serif'; c.textAlign='center'; c.textBaseline='middle';
    c.fillText(l.taps+'/'+l.target, l.btn.x, l.btn.y);
  },
  onDown(g,x,y){
    const l=g.local, d=Math.hypot(x-l.btn.x,y-l.btn.y);
    if(d<=l.btn.r){ l.taps++; Sound.tap(); if(l.taps>=l.target) g.win(); }
  }
};
