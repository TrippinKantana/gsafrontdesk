// Service Worker for PWA
// DISABLED CACHING IN DEVELOPMENT
const isDev = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';
const CACHE_NAME = isDev ? 'frontdesk-dev-disabled' : 'frontdesk-v1';
const urlsToCache = isDev ? [] : [
  '/',
  '/visitor',
  '/manifest.json',
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  if (isDev) {
    console.log('SW: Development mode - caching disabled');
    return self.skipWaiting();
  }
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Cache failed:', error);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete ALL caches in development
          if (isDev || cacheName !== CACHE_NAME) {
            console.log('Deleting cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // In development, NEVER use cache - always fetch from network
  if (isDev) {
    return; // This allows the browser to handle the fetch normally
  }
  
  const url = new URL(event.request.url);
  
  // Don't intercept API requests, auth requests, Next.js internals, or service worker requests
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/_next/') ||
    url.pathname.includes('/sign-in') ||
    url.pathname.includes('/sign-up') ||
    url.pathname === '/sw.js'
  ) {
    // Let these requests pass through to network
    return;
  }
  
  // Only cache static assets and pages in production
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        return fetch(event.request).catch(() => {
          // If network fails and it's a document request, show offline page
          if (event.request.destination === 'document') {
            return caches.match('/offline.html');
          }
        });
      })
  );
});
