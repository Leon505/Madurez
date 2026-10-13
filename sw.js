// ¡REGLA DE ORO!: Cada vez que modifiques tu app en GitHub, 
// AUMENTA LA VERSIÓN (ej. v6) para forzar a tu celular a reinstalar el Service Worker
```javascript
const CACHE_NAME = 'comasa-madurez-v8';
const CACHE_PREFIX = 'comasa-madurez-';
const BASE = self.registration.scope;

const CORE_FILES = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icon-192x192.png',
  './icon-512x512.png',
  './LOGO.png'
];

const OPTIONAL_FILES = [
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
];

// INSTALACIÓN
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);

    // Si falta un archivo esencial, la instalación debe fallar.
    const coreUrls = CORE_FILES.map(file =>
      new URL(file, BASE).href
    );

    await cache.addAll(coreUrls);

    // Intentar guardar bibliotecas externas.
    for (const url of OPTIONAL_FILES) {
      try {
        await cache.add(url);
      } catch (error) {
        console.warn('No se pudo guardar recurso externo:', url);
      }
    }

    await self.skipWaiting();
  })());
});

// ACTIVACIÓN
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();

    await Promise.all(
      names
        .filter(name =>
          name.startsWith(CACHE_PREFIX) &&
          name !== CACHE_NAME
        )
        .map(name => caches.delete(name))
    );

    await self.clients.claim();
  })());
});

// SOLICITUDES
self.addEventListener('fetch', event => {
  const request = event.request;

  if (request.method !== 'GET') return;

  const requestUrl = new URL(request.url);

  // No interceptar otros sitios ni protocolos.
  if (requestUrl.protocol !== 'http:' &&
      requestUrl.protocol !== 'https:') return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);

    // Navegación: red primero y página guardada como respaldo.
    if (request.mode === 'navigate') {
      try {
        return await fetch(request);
      } catch (error) {
        const offlinePage = await cache.match(
          new URL('./index.html', BASE).href
        );

        if (offlinePage) return offlinePage;

        return new Response(
          'Sin conexión. Abre la aplicación con Internet al menos una vez.',
          {
            status: 503,
            headers: {
              'Content-Type': 'text/plain; charset=utf-8'
            }
          }
        );
      }
    }

    // Recursos: caché primero y red como alternativa.
    const cached = await cache.match(request);

    if (cached) return cached;

    return fetch(request);
  })());
});
```
