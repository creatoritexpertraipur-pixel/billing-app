const CACHE_NAME = 'hotel-bill-v2';
const ASSETS = [
    './',
    './index.html',
    './app.js',
    './manifest.json'
];

// Saare assets ko install karte waqt cache me save karna
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

// Network na hone par cache se fast loading dena
self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((response) => {
            return response || fetch(e.request);
        })
    );
});