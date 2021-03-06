const currentCacheVersion = 'mws-restaurant-v2';
const imagesToCache = [
  '/img/1.webp',
  '/img/2.webp',
  '/img/3.webp',
  '/img/4.webp',
  '/img/5.webp',
  '/img/6.webp',
  '/img/7.webp',
  '/img/8.webp',
  '/img/9.webp',
  '/img/10.webp',
  '/img/1_400.webp',
  '/img/2_400.webp',
  '/img/3_400.webp',
  '/img/4_400.webp',
  '/img/5_400.webp',
  '/img/6_400.webp',
  '/img/7_400.webp',
  '/img/8_400.webp',
  '/img/9_400.webp',
  '/img/10_400.webp',
  '/img/1_800.webp',
  '/img/2_800.webp',
  '/img/3_800.webp',
  '/img/4_800.webp',
  '/img/5_800.webp',
  '/img/6_800.webp',
  '/img/7_800.webp',
  '/img/8_800.webp',
  '/img/9_800.webp',
  '/img/10_800.webp',
  '/img/1.jpg',
  '/img/2.jpg',
  '/img/3.jpg',
  '/img/4.jpg',
  '/img/5.jpg',
  '/img/6.jpg',
  '/img/7.jpg',
  '/img/8.jpg',
  '/img/9.jpg',
  '/img/10.jpg',
  '/img/1_400.jpg',
  '/img/2_400.jpg',
  '/img/3_400.jpg',
  '/img/4_400.jpg',
  '/img/5_400.jpg',
  '/img/6_400.jpg',
  '/img/7_400.jpg',
  '/img/8_400.jpg',
  '/img/9_400.jpg',
  '/img/10_400.jpg',
  '/img/1_800.jpg',
  '/img/2_800.jpg',
  '/img/3_800.jpg',
  '/img/4_800.jpg',
  '/img/5_800.jpg',
  '/img/6_800.jpg',
  '/img/7_800.jpg',
  '/img/8_800.jpg',
  '/img/9_800.jpg',
  '/img/10_800.jpg'

];

const resourcesToCache = [
  '/',
  '/index.html',
  '/restaurant.html',
  '/css/styles.min.css',
  '/js/idb.min.js',
  '/js/dbhelper.min.js',
  '/js/main.min.js',
  '/js/restaurant_info.min.js',
  ...imagesToCache
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(currentCacheVersion)
      .then(cache => cache.addAll(resourcesToCache))
      .then(self.skipWaiting())
  );
});


self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => {
            return (
              cacheName.startsWith('mws-restaurant') &&
              currentCacheVersion != cacheName
            );
          })
          .map(cacheName => {
            return caches.delete(cacheName);
          })
      );
    })
  );
});


self.addEventListener('fetch', event => {
  event.respondWith(
    caches.open(currentCacheVersion).then(cache => {
      return cache.match(event.request).then(response => {
        if (response) return response;
        return fetch(event.request).then(netResponse => {
          if (
            netResponse.url.includes('.jpg') ||
            netResponse.url.includes('.webp')
          ) {
            if (netResponse.url.includes(window.location.origin)) {
              cache.put(event.request.url, netResponse.clone());
              return netResponse;
            }
            return;
          }
          console.log(netResponse);
          cache.put(event.request.url, netResponse.clone());
          return netResponse;
        });
      });
    })
  );
});
