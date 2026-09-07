// ---- The Workshop. Nominally the Artificer's, in practice a shared shelf:
// goblin contraband, and whatever the Crab has talked someone into stocking.
// "owner" decides whose standing a purchase credits — see docs/PARALLEL-LOOPS.md.
export const ShopItems = [
  { id:'metabolism', owner:'goblin', label:'FAST METABOLISM', desc:'buddy hunger drains slower — goblin tech', color:'#c9ff2f', max:5, baseCost:12 },
  { id:'appetite', owner:'goblin', label:'BIG APPETITE', desc:'feeding the buddy pays more — goblin tech', color:'#fff02f', max:5, baseCost:12 },
  { id:'goldenbuddy', owner:'goblin', label:'GOLDEN BUDDY', desc:'passive income multiplied — goblin tech', color:'#ff7a2f', max:3, baseCost:20 },
  { id:'splash', owner:'crab', label:'SPLASH SHOT', desc:'turret hits 2 per volley — the crab insisted', color:'#2fe1ff', max:1, baseCost:30 },
  { id:'secondturret', owner:'crab', label:'SECOND TURRET', desc:'another auto-turret — the crab insisted, twice', color:'#ff2f9e', max:1, baseCost:40 },
  { id:'breath', owner:'artificer', label:'EXTRA BREATH', desc:'+300ms on every trial — Artificer issue', color:'#7a3cff', max:5, baseCost:14 },
  { id:'battery', owner:'artificer', label:'METER BATTERY', desc:'slop meter fills faster — Artificer issue', color:'#fff02f', max:3, baseCost:18 },
  { id:'whetstone', owner:'artificer', label:'WHETSTONE', desc:'+1 boss damage per hit — Artificer issue', color:'#2fe1ff', max:4, baseCost:26 },
  { id:'scholar', owner:'artificer', label:"SCHOLAR'S LENS", desc:'+25% XP from every trial — Artificer issue', color:'#c9ff2f', max:3, baseCost:22 }
];
