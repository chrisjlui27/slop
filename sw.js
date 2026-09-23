/* SLOP — service worker.

   This ships as ES modules rather than one bundled file, which changes the
   caching problem compared to a single-document app. Four dozen files have to
   agree with each other: a fresh index.html next to a stale game.js is a
   broken build, not a slightly old one. So the cache is treated as one
   indivisible generation — CACHE names it, activate deletes every other
   generation outright, and module requests are served cache-first so a session
   can never mix two generations mid-play.

   Bump CACHE on every deploy that touches any shell file. Forget and phones
   keep running the previous build until they evict it themselves. */
const CACHE = 'slop-v14';

const SHELL = [
  '.',
  'index.html',
  'manifest.webmanifest',
  'icon-192.png',
  'icon-512.png',
  'icon-maskable-512.png',
  'styles/main.css',
  'assets/fonts/press-start-2p-latin.woff2',
  'assets/fonts/space-grotesk-latin.woff2',
  'src/main.js',
  'src/game.js',
  'src/save.js',
  'src/defense.js',
  'src/understudy.js',
  'src/ledger.js',
  'src/archive.js',
  'src/pot.js',
  'src/patchbay.js',
  'src/audio.js',
  'src/fx.js',
  'src/content/lore.js',
  'src/content/mutators.js',
  'src/content/shop.js',
  'src/content/stats.js',
  'src/content/defense.js',
  'src/content/understudy.js',
  'src/content/ledger.js',
  'src/content/archive.js',
  'src/content/pot.js',
  'src/content/patchbay.js',
  'src/modules/index.js',
  'src/modules/balance.js',
  'src/modules/count.js',
  'src/modules/dodge.js',
  'src/modules/grab.js',
  'src/modules/hold.js',
  'src/modules/match.js',
  'src/modules/mirror.js',
  'src/modules/odd.js',
  'src/modules/smash.js',
  'src/modules/sort.js',
  'src/modules/squeeze.js',
  'src/modules/stop.js',
  'src/modules/swipe.js',
  'src/modules/trace.js',
  'src/modules/chase.js',
  'src/modules/stack.js',
  'src/modules/rhythm.js',
  'src/modules/wire.js',
  'src/modules/weigh.js',
  'src/modules/flee.js',
  'src/modules/peel.js',
  'src/modules/crank.js',
  'src/modules/split.js',
  'src/modules/steady.js',
  'src/modules/sling.js'
];

self.addEventListener('install', e => {
  // addAll rejects the whole batch if any single entry 404s, which would leave
  // the phone with no cache at all. Individual puts degrade instead: whatever
  // resolved is still cached, and the rest falls through to the network.
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // Navigations are network-first so an online phone picks up a new deploy on
  // the next open rather than waiting for a cache eviction. The document is the
  // only file where this is safe — see the module note below.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put('index.html', copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match('index.html').then(r => r || caches.match('.')))
    );
    return;
  }

  // Modules, CSS, icons and fonts are cache-first with NO
  // background refresh. That is deliberate and is the one place this worker
  // differs from the usual stale-while-revalidate advice: refreshing a single
  // module in the background would let the next reload pair it with siblings
  // from the older generation. Consistency beats freshness here; the CACHE bump
  // is what ships new code.
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res && (res.ok || res.type === 'opaque')) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      }
      return res;
    }))
  );
});
