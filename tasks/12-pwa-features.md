# Task 12: Implement PWA Features and Offline Capability

**Status:** ⏳ PENDING  
**Priority:** Low  
**Dependencies:** Tasks 04-07 (Core functionality)

## Description

Transform the web application into a Progressive Web App (PWA) with offline capabilities, as specified in SPEC.md for reliability in restaurant environments.

## Requirements from SPEC.md

- PWA with Service Worker for basic offline functionality
- Cache game catalog for browsing when connection is poor
- Queue checkout/return actions when offline, sync when reconnected
- Offline-first design for reliability in restaurant environment

## User Stories

- **As a customer**, I want to browse games even with poor WiFi
- **As a customer**, I want my checkout to work even if connection drops
- **As staff**, I want the app to work reliably during busy periods
- **As a manager**, I want consistent uptime for customer experience

## Technical Implementation

### PWA Manifest

```json
// public/manifest.json
{
  "name": "Tybee Games",
  "short_name": "Tybee Games",
  "description": "Board game catalog for The Pool Turtle restaurant",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "categories": ["games", "entertainment"],
  "screenshots": [
    {
      "src": "/screenshots/games-browse.png",
      "sizes": "1024x768",
      "type": "image/png",
      "label": "Browse available games"
    }
  ]
}
```

### Service Worker Strategy

```javascript
// public/sw.js
const CACHE_NAME = 'tybee-games-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  // CSS and critical resources
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// Fetch event - network first with cache fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Handle different types of requests
  if (request.url.includes('/partials/games')) {
    // Game catalog - cache for offline browsing
    event.respondWith(cacheFirstStrategy(request));
  } else if (
    request.url.includes('/checkout') ||
    request.url.includes('/return')
  ) {
    // Critical actions - queue for later if offline
    event.respondWith(queueActionStrategy(request));
  } else {
    // Static assets - cache first
    event.respondWith(cacheFirstStrategy(request));
  }
});

// Cache first strategy for game catalog
async function cacheFirstStrategy(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    // Return cached version if network fails
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page for HTML requests
    if (request.headers.get('accept').includes('text/html')) {
      return caches.match('/offline.html');
    }

    throw error;
  }
}

// Queue actions for offline sync
async function queueActionStrategy(request) {
  try {
    return await fetch(request);
  } catch (error) {
    // Queue the action for later
    await queueAction(request);
    return new Response(
      JSON.stringify({
        queued: true,
        message: 'Action queued for when connection returns',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
```

### Background Sync for Offline Actions

```javascript
// Background sync for queued actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-actions') {
    event.waitUntil(syncQueuedActions());
  }
});

async function queueAction(request) {
  const action = {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body: await request.text(),
    timestamp: Date.now(),
  };

  // Store in IndexedDB
  const db = await openDB();
  const tx = db.transaction(['actions'], 'readwrite');
  await tx.objectStore('actions').add(action);
}

async function syncQueuedActions() {
  const db = await openDB();
  const tx = db.transaction(['actions'], 'readwrite');
  const actions = await tx.objectStore('actions').getAll();

  for (const action of actions) {
    try {
      const response = await fetch(action.url, {
        method: action.method,
        headers: action.headers,
        body: action.body,
      });

      if (response.ok) {
        // Remove from queue
        await tx.objectStore('actions').delete(action.id);

        // Notify user of successful sync
        self.registration.showNotification('Action synced successfully');
      }
    } catch (error) {
      console.log('Sync failed for action:', action.url);
    }
  }
}
```

### Offline Game Catalog

```html
<!-- Enhanced game browsing with offline support -->
<div
  id="games-container"
  hx-get="/partials/games"
  hx-trigger="load, online from:window"
  data-offline-fallback="#offline-games"
>
  <!-- Online games -->
</div>

<template id="offline-games">
  <div class="offline-notice">
    <p>📶 You're offline. Showing cached games.</p>
    <button onclick="location.reload()">Try Again</button>
  </div>
  <!-- Cached game cards will be inserted here -->
</template>
```

### Enhanced Checkout with Offline Queueing

```javascript
// Enhanced checkout form with offline handling
document.addEventListener('htmx:beforeRequest', (event) => {
  const { target, detail } = event;

  if (!navigator.onLine && target.matches('[hx-post*="/checkout"]')) {
    // Queue checkout for later
    event.preventDefault();
    queueCheckoutAction(detail.parameters);
    showOfflineMessage('Checkout queued for when connection returns');
  }
});

function queueCheckoutAction(formData) {
  const actions = JSON.parse(localStorage.getItem('queuedActions') || '[]');
  actions.push({
    type: 'checkout',
    data: formData,
    timestamp: Date.now(),
  });
  localStorage.setItem('queuedActions', JSON.stringify(actions));
}

// Sync when back online
window.addEventListener('online', () => {
  syncQueuedActions();
  showOnlineMessage('Connection restored - syncing actions...');
});
```

### IndexedDB for Offline Storage

```javascript
// IndexedDB setup for offline data
async function setupOfflineDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('TybeeGamesDB', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Store for cached games
      if (!db.objectStoreNames.contains('games')) {
        const gamesStore = db.createObjectStore('games', { keyPath: 'id' });
        gamesStore.createIndex('name', 'name', { unique: false });
      }

      // Store for queued actions
      if (!db.objectStoreNames.contains('actions')) {
        const actionsStore = db.createObjectStore('actions', {
          keyPath: 'id',
          autoIncrement: true,
        });
        actionsStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}
```

## Installation Prompts

```javascript
// PWA installation prompt
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  deferredPrompt = e;
  showInstallButton();
});

function showInstallButton() {
  const installButton = document.getElementById('install-app');
  installButton.style.display = 'block';

  installButton.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User ${outcome} the install prompt`);
      deferredPrompt = null;
    }
  });
}
```

## Files to Create/Modify

- `public/manifest.json` - PWA manifest
- `public/sw.js` - Service worker
- `public/offline.html` - Offline fallback page
- `src/index.ts` - Add PWA headers and service worker registration
- `public/icons/` - PWA icons (192px, 512px)
- `src/lib/offline.js` - Offline functionality helpers

## Caching Strategy

1. **Static Assets**: Cache first (HTML, CSS, JS, images)
2. **Game Catalog**: Network first with cache fallback
3. **Dynamic Content**: Network only with offline queue
4. **Critical Actions**: Queue for background sync

## Offline Features

- Browse cached game catalog
- View game details from cache
- Queue checkout/return actions
- Show offline status indicators
- Sync actions when reconnected

## Testing Offline Functionality

```javascript
// Development tools for testing offline
function simulateOffline() {
  // Override fetch to simulate network failure
  const originalFetch = window.fetch;
  window.fetch = () => Promise.reject(new Error('Simulated offline'));

  setTimeout(() => {
    window.fetch = originalFetch;
    window.dispatchEvent(new Event('online'));
  }, 5000);
}
```

## Acceptance Criteria

- [ ] App installs as PWA on devices
- [ ] Works offline for game browsing
- [ ] Checkout/return actions queue when offline
- [ ] Actions sync automatically when reconnected
- [ ] Clear offline/online status indicators
- [ ] Cached data stays fresh with updates
- [ ] Install prompt appears appropriately
- [ ] App icon appears on home screen

## Performance Optimizations

- Selective caching of game images
- Lazy loading of non-critical resources
- Compression of cached data
- Periodic cache cleanup
- Background sync batching

## Browser Support

- Service Workers: All modern browsers
- Background Sync: Chrome, Edge (graceful fallback)
- Install prompts: Chrome, Edge, Safari (iOS 14.3+)
- IndexedDB: Universal support

## Future Enhancements

- Push notifications for game returns
- Offline-first game recommendations
- Cached analytics for staff
- Sync conflict resolution
- Advanced caching strategies
