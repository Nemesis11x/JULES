// Alter Agency - Service Worker Premium v2.0

const CACHE_NAME = 'alter-agency-v3.1';
const RUNTIME_CACHE = 'alter-runtime-v3.1';
const IMAGE_CACHE = 'alter-images-v3.1';

// Assets critiques à mettre en cache immédiatement
const CRITICAL_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/style.css?v=7',
  '/formation/style.min.css?v=2',
  '/script.js',
  '/formation/script.js?v=1',
  '/assets/alter-logo.svg',
  '/assets/favicon.png',
  '/manifest.json',
  // Polices Google Fonts (à adapter selon vos besoins)
  'https://fonts.googleapis.com/css2?family=Sora:wght@100;300;400;600;700;800&display=swap',
  'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap',
  // Bibliothèques externes critiques
  'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js',
  'https://unpkg.com/@studio-freight/lenis@1.0.42/dist/lenis.min.js'
];

// Stratégies de cache
const CACHE_STRATEGIES = {
  // Cache First - Pour les assets statiques
  cacheFirst: async (request) => {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      // Mettre à jour le cache en arrière-plan
      fetch(request).then(response => {
        if (response && response.status === 200) {
          cache.put(request, response.clone());
        }
      });
      return cachedResponse;
    }
    
    try {
      const networkResponse = await fetch(request);
      if (networkResponse && networkResponse.status === 200) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch (error) {
      console.error('Fetch failed:', error);
      // Retourner une page offline si disponible
      return caches.match('/offline.html');
    }
  },
  
  // Network First - Pour le contenu dynamique
  networkFirst: async (request) => {
    try {
      const networkResponse = await fetch(request);
      if (networkResponse && networkResponse.status === 200) {
        const cache = await caches.open(RUNTIME_CACHE);
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch (error) {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      return caches.match('/offline.html');
    }
  },
  
  // Stale While Revalidate - Pour les images
  staleWhileRevalidate: async (request) => {
    const cache = await caches.open(IMAGE_CACHE);
    const cachedResponse = await cache.match(request);
    
    const networkResponsePromise = fetch(request).then(response => {
      if (response && response.status === 200) {
        cache.put(request, response.clone());
      }
      return response;
    });
    
    return cachedResponse || networkResponsePromise;
  }
};

// Installation du Service Worker
self.addEventListener('install', event => {
  console.log('Service Worker: Installation en cours...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Mise en cache des assets critiques');
        return cache.addAll(CRITICAL_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch(error => {
        console.error('Service Worker: Erreur lors de l\'installation', error);
      })
  );
});

// Activation du Service Worker
self.addEventListener('activate', event => {
  console.log('Service Worker: Activation');
  
  event.waitUntil(
    Promise.all([
      // Nettoyer les anciens caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => {
              return cacheName !== CACHE_NAME && 
                     cacheName !== RUNTIME_CACHE && 
                     cacheName !== IMAGE_CACHE;
            })
            .map(cacheName => {
              console.log('Service Worker: Suppression du cache ancien:', cacheName);
              return caches.delete(cacheName);
            })
        );
      }),
      // Prendre le contrôle immédiatement
      self.clients.claim()
    ])
  );
});

// Interception des requêtes
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorer les requêtes non-GET
  if (request.method !== 'GET') return;
  
  // Ignorer les requêtes cross-origin non essentielles
  if (url.origin !== location.origin && 
      !url.href.includes('fonts.googleapis.com') &&
      !url.href.includes('fonts.gstatic.com') &&
      !url.href.includes('cdnjs.cloudflare.com') &&
      !url.href.includes('unpkg.com')) {
    return;
  }
  
  // Navigation/HTML -> Network First (évite de servir un HTML obsolète)
  if (request.mode === 'navigate' || url.pathname.endsWith('.html')) {
    event.respondWith(CACHE_STRATEGIES.networkFirst(request));
    return;
  }
  
  // Images -> Stale-While-Revalidate
  if (request.destination === 'image' || url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp)$/)) {
    event.respondWith(CACHE_STRATEGIES.staleWhileRevalidate(request));
    return;
  }
  
  // CSS/JS -> Network First (pour éviter les problèmes de cache en production)
  if (url.pathname.match(/\.(js|css)$/)) {
    event.respondWith(CACHE_STRATEGIES.networkFirst(request));
    return;
  }
  
  // Fonts -> Cache First (les polices ne changent pas souvent)
  if (url.pathname.match(/\.(woff2|woff|ttf|eot|otf)$/)) {
    event.respondWith(CACHE_STRATEGIES.cacheFirst(request));
    return;
  }
  
  // Par défaut -> Network First
  event.respondWith(CACHE_STRATEGIES.networkFirst(request));
});

// Gestion des messages du client
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then(cacheNames => {
      cacheNames.forEach(cacheName => {
        caches.delete(cacheName);
      });
    });
  }
});

// Synchronisation en arrière-plan
self.addEventListener('sync', event => {
  if (event.tag === 'sync-analytics') {
    event.waitUntil(syncAnalytics());
  }
});

// Fonction pour synchroniser les analytics
async function syncAnalytics() {
  // Implémenter la logique de synchronisation des analytics
  console.log('Synchronisation des analytics...');
}

// Push notifications
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/assets/favicon.png',
      badge: '/assets/favicon.png',
      vibrate: [200, 100, 200],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1
      },
      actions: [
        {
          action: 'explore',
          title: 'Découvrir',
          icon: '/assets/favicon.png'
        },
        {
          action: 'close',
          title: 'Fermer',
          icon: '/assets/favicon.png'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'explore') {
    clients.openWindow('/');
  }
});