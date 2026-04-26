const CACHE_NAME = 'manhwahub-cache';

self.addEventListener('fetch', (event) => {
  // Only intercept GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached response if found
      if (response) return response;

      // Otherwise fetch from network
      return fetch(event.request).then((fetchRes) => {
        // If it's a proxy image or an API request, we could cache dynamically,
        // but here we only want to serve what the download button explicitly cached.
        return fetchRes;
      }).catch(err => {
        console.error("SW Fetch failed:", err);
        throw err;
      });
    })
  );
});
