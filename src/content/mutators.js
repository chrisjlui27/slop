// ---- Mutators, recast as the Goblin's sabotage ----
export const Mutators = [
  { id:'mirrored', label:'MIRRORED', flavor:'he flipped your input axis', color:'#2fe1ff', transformPos:(p,W)=>({x:W-p.x,y:p.y}) },
  { id:'inverted', label:'INVERTED', flavor:'he inverted the whole canvas', color:'#7a3cff', cssClass:'mut-invert', cssTarget:'stageWrap' },
  { id:'giant', label:'GIANT MODE', flavor:'he scaled the stage past its frame', color:'#c9ff2f', cssClass:'mut-giant', cssTarget:'laneRow' },
  { id:'rush', label:'RUSH HOUR', flavor:'less time, more score', color:'#ff7a2f', timeMult:0.7, scoreMult:1.6 },
  { id:'quake', label:'EARTHQUAKE', flavor:'everything shakes, including the turret lane', color:'#ff2f9e', cssClass:'mut-quake', cssTarget:'stageWrap' },
  { id:'lucky', label:'LUCKY CHARM', flavor:'he feels bad. one free save', color:'#fff02f', shield:true },
  { id:'goostorm', label:'GOO STORM', flavor:'double goo, his favourite currency', color:'#c9ff2f', gooMult:2 }
];
