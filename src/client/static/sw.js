const CACHE_NAME = 'guitar-solos';
const INITIAL_CACHE = [
    '/',
    '/style.css',
    '/app.js',
    '/manifest.json',
];

self.addEventListener('install', e => e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(INITIAL_CACHE))));
self.addEventListener('fetch', e => e.respondWith(caches.open(CACHE_NAME).then(async c => {
    try {
        const res = await fetch(e.request);
        if (e.request.method === 'GET') c.put(e.request, res.clone());
        return res;
    } catch {
        return (await c.match(e.request)) || c.match('/');
    }
})));