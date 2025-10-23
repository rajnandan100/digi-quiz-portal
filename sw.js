// Service Worker for Digi Quiz Portal
const CACHE_NAME = 'digi-quiz-v1.0.0';
const urlsToCache = [
    '/',
    '/index.html',
    '/quiz.html',
    '/result.html',
    '/leaderboard.html',
    '/adminotoyaram.html',
    '/css/style.css',
    '/js/api.js',
    '/js/utils.js',
    '/js/app.js',
    '/js/quiz.js',
    '/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📦 Cache opened');
                return cache.addAll(urlsToCache);
            })
    );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                return fetch(event.request);
            }
        )
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

console.log('✅ Service Worker loaded');
