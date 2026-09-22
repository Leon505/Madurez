// ¡REGLA DE ORO!: Cada vez que modifiques tu app en GitHub, 
// AUMENTA LA VERSIÓN (ej. v6) para forzar a tu celular a reinstalar el Service Worker
const CACHE_NAME = 'comasa-madurez-v6'; 

const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icon-192x192.png',
  './icon-512x512.png',
  './LOGO.png', // Debe estar exactamente igual que en tu repositorio
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
];

// 1. Instalación blindada: guarda archivo por archivo para evitar que un error rompa todo
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      for (const url of urlsToCache) {
        try {
          await cache.add(url);
        } catch (err) {
          console.error('Error guardando en caché:', url, err);
        }
      }
    })
  );
});

// 2. Limpieza de caché antiguo
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Estrategia Offline (si no hay red, entrega el archivo de la memoria)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      
      return fetch(event.request).catch(() => {
        // Si no hay internet y se intenta navegar a la app, entrega index.html guardado
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html') || caches.match('./');
        }
      });
    })
  );
});
