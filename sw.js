const CACHE_NAME = 'deo-legal-v2';
const PRECACHE_URLS = [
  './',
  './index.html',
  './css/app.css',
  './js/app.js',
  './js/auth.js',
  './js/db.js',
  './js/firebase.js',
  './js/sync.js',
  './js/notifications.js',
  './js/pdf.js',
  './js/screens/login.js',
  './js/screens/dashboard.js',
  './js/screens/case-list.js',
  './js/screens/case-form.js',
  './js/screens/case-detail.js',
  './js/screens/proceedings-form.js',
  './js/screens/compliance.js',
  './js/screens/search.js',
  './js/screens/settings.js',
  './manifest.json',
  './firebase-config.js'
];

// Install: Pre-cache app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate: Delete old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: Cache-first for app shell, network-first for Firebase
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Network-first for Firebase API calls
  if (url.hostname.includes('firebaseio.com') ||
      url.hostname.includes('googleapis.com') ||
      url.hostname.includes('firestore.googleapis.com')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Stale-while-revalidate for CDN resources (fonts, libraries)
  if (url.hostname.includes('cdn.jsdelivr.net') ||
      url.hostname.includes('cdnjs.cloudflare.com') ||
      url.hostname.includes('fonts.googleapis.com') ||
      url.hostname.includes('fonts.gstatic.com') ||
      url.hostname.includes('gstatic.com/firebasejs')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(event.request).then(cached => {
          const fetched = fetch(event.request).then(response => {
            if (response.ok) cache.put(event.request, response.clone());
            return response;
          }).catch(() => cached);
          return cached || fetched;
        })
      )
    );
    return;
  }

  // Cache-first for app shell
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response.ok && event.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    }).catch(() => {
      if (event.request.destination === 'document') {
        return caches.match('./index.html');
      }
    })
  );
});

// Push notification handler
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'DEO Legal Cases';
  const options = {
    body: data.body || '',
    icon: './icons/icon-192.png',
    badge: './icons/icon-192.png',
    tag: data.tag || 'deo-notification',
    data: data.url || './'
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      if (windowClients.length > 0) {
        windowClients[0].focus();
        windowClients[0].navigate(event.notification.data);
      } else {
        clients.openWindow(event.notification.data);
      }
    })
  );
});

// Background sync
self.addEventListener('sync', event => {
  if (event.tag === 'deo-sync') {
    event.waitUntil(
      clients.matchAll().then(clients => {
        clients.forEach(client => client.postMessage({ type: 'SYNC_REQUESTED' }));
      })
    );
  }
});
