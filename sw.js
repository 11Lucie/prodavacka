// Service worker: aplikace pak funguje i bez internetu. Při změně souborů zvýšit VERZE.
const VERZE = 'prodavacka-3';
const SOUBORY = [
  './', 'index.html', 'styles.css', 'app.js', 'sound.js', 'printer.js', 'receipt.js',
  'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERZE).then((c) => c.addAll(SOUBORY)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERZE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// nejdřív síť (aby se projevily opravy), bez internetu z mezipaměti
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  // Wi-Fi bez internetu: po 4 s to vzdát a vzít uloženou verzi
  const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 4000));
  e.respondWith(
    Promise.race([fetch(e.request), timeout])
      .then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(VERZE).then((c) => c.put(e.request, copy)); }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match('index.html')))
  );
});
