// FinPulse Service Worker - PWA Support
const CACHE_NAME = 'finpulse-v1';
const STATIC_CACHE = 'finpulse-static-v1';
const DYNAMIC_CACHE = 'finpulse-dynamic-v1';

// Assets to cache immediately on install
const STATIC_ASSETS = [
    '/',
    '/static/style.css',
    '/static/manifest.json',
    '/static/icons/icon-192.png',
    '/static/icons/icon-512.png'
];

// Install event - cache static assets
self.addEventListener('install', event => {
    console.log('[SW] Installing Service Worker...');
    event.waitUntil(
        caches.open(STATIC_CACHE).then(cache => {
            console.log('[SW] Caching static assets');
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('[SW] Activating Service Worker...');
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys
                    .filter(key => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
                    .map(key => {
                        console.log('[SW] Removing old cache:', key);
                        return caches.delete(key);
                    })
            );
        })
    );
    self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Skip API calls - always go to network
    if (url.pathname.startsWith('/api/')) {
        return;
    }

    // For static assets, try cache first
    if (url.pathname.startsWith('/static/')) {
        event.respondWith(
            caches.match(request).then(cached => {
                return cached || fetch(request).then(response => {
                    return caches.open(STATIC_CACHE).then(cache => {
                        cache.put(request, response.clone());
                        return response;
                    });
                });
            })
        );
        return;
    }

    // For HTML pages, network first with cache fallback
    event.respondWith(
        fetch(request)
            .then(response => {
                // Clone and cache the response
                const responseClone = response.clone();
                caches.open(DYNAMIC_CACHE).then(cache => {
                    cache.put(request, responseClone);
                });
                return response;
            })
            .catch(() => {
                // Offline - try cache
                return caches.match(request).then(cached => {
                    if (cached) return cached;
                    // Return offline page for navigation requests
                    if (request.mode === 'navigate') {
                        return caches.match('/').then(homePage => {
                            return homePage || new Response(
                                '<html><body style="font-family:system-ui;text-align:center;padding:50px;"><h1>📡 Offline</h1><p>Please check your internet connection.</p></body></html>',
                                { headers: { 'Content-Type': 'text/html' } }
                            );
                        });
                    }
                });
            })
    );
});

// Handle push notifications (future feature)
self.addEventListener('push', event => {
    const options = {
        body: event.data?.text() || 'New update from FinPulse',
        icon: '/static/icons/icon-192.png',
        badge: '/static/icons/icon-72.png',
        vibrate: [100, 50, 100],
        data: { url: '/' }
    };

    event.waitUntil(
        self.registration.showNotification('FinPulse', options)
    );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url || '/')
    );
});

console.log('[SW] Service Worker loaded');
