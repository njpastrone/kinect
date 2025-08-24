// Kinect Service Worker for Self-Hosted PWA
// This service worker enables offline functionality and background sync

const CACHE_NAME = 'kinect-v1.0.0';
const OFFLINE_URL = '/offline.html';

// Files to cache for offline use
const CORE_CACHE_FILES = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// API endpoints that should be cached
const API_CACHE_ENDPOINTS = [
  '/api/contacts',
  '/api/lists',
  '/api/auth/status',
];

// Install event - cache core files
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching core files');
        return cache.addAll(CORE_CACHE_FILES);
      })
      .then(() => {
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Take control of all clients immediately
        return self.clients.claim();
      })
  );
});

// Fetch event - handle requests with cache strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Handle different types of requests
  if (request.url.includes('/api/')) {
    // API requests - network first, then cache
    event.respondWith(handleApiRequest(request));
  } else if (request.destination === 'document') {
    // HTML pages - network first, fallback to offline page
    event.respondWith(handlePageRequest(request));
  } else {
    // Static assets - cache first, then network
    event.respondWith(handleAssetRequest(request));
  }
});

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network failed for API request, trying cache:', request.url);
    
    // Fallback to cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response for API requests
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'This feature is not available offline' 
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle page requests with network-first strategy
async function handlePageRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network failed for page request, trying cache:', request.url);
    
    // Try cache first
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback to offline page
    return cache.match(OFFLINE_URL);
  }
}

// Handle asset requests with cache-first strategy
async function handleAssetRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  
  // Try cache first
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    // Fallback to network
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Failed to fetch asset:', request.url);
    
    // Return empty response for failed asset requests
    return new Response('', { 
      status: 200, 
      statusText: 'OK' 
    });
  }
}

// Background sync for contact updates
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'contact-sync') {
    event.waitUntil(syncContacts());
  } else if (event.tag === 'notification-sync') {
    event.waitUntil(syncNotifications());
  }
});

// Sync contacts when back online
async function syncContacts() {
  console.log('Syncing contacts...');
  
  try {
    // Get pending contact updates from IndexedDB or localStorage
    const pendingUpdates = await getPendingUpdates('contacts');
    
    for (const update of pendingUpdates) {
      try {
        const response = await fetch(update.url, {
          method: update.method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await getStoredToken()}`,
          },
          body: JSON.stringify(update.data),
        });
        
        if (response.ok) {
          // Remove from pending updates
          await removePendingUpdate('contacts', update.id);
          console.log('Synced contact update:', update.id);
        }
      } catch (error) {
        console.log('Failed to sync contact update:', update.id, error);
      }
    }
  } catch (error) {
    console.log('Contact sync failed:', error);
  }
}

// Sync notifications
async function syncNotifications() {
  console.log('Syncing notifications...');
  
  try {
    const response = await fetch('/api/notifications', {
      headers: {
        'Authorization': `Bearer ${await getStoredToken()}`,
      },
    });
    
    if (response.ok) {
      const notifications = await response.json();
      // Store notifications for offline access
      await storeOfflineData('notifications', notifications);
    }
  } catch (error) {
    console.log('Notification sync failed:', error);
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Push notification received');
  
  let data = {};
  
  if (event.data) {
    data = event.data.json();
  }
  
  const title = data.title || 'Kinect';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge.png',
    data: data.data || {},
    actions: [
      {
        action: 'open',
        title: 'Open',
        icon: '/icons/action-open.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/action-dismiss.png'
      }
    ],
    requireInteraction: true,
    tag: data.tag || 'kinect-notification',
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }
  
  // Handle notification click
  event.waitUntil(
    clients.matchAll().then((clientList) => {
      // Focus existing window if available
      for (const client of clientList) {
        if (client.url.includes('/dashboard') && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Open new window
      if (clients.openWindow) {
        const url = event.notification.data?.url || '/dashboard';
        return clients.openWindow(url);
      }
    })
  );
});

// Message handling from main app
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data.type === 'CACHE_CONTACT_DATA') {
    // Cache contact data for offline use
    cacheOfflineData('contacts', event.data.data);
  } else if (event.data.type === 'QUEUE_UPDATE') {
    // Queue update for when back online
    queueUpdate(event.data.update);
  }
});

// Utility functions
async function getPendingUpdates(type) {
  // In a real implementation, this would use IndexedDB
  // For now, return empty array
  return [];
}

async function removePendingUpdate(type, id) {
  // Remove update from IndexedDB
  console.log('Removing pending update:', type, id);
}

async function getStoredToken() {
  // Get auth token from localStorage or IndexedDB
  return 'stored-auth-token';
}

async function storeOfflineData(type, data) {
  // Store data in IndexedDB for offline access
  console.log('Storing offline data:', type, data.length);
}

async function cacheOfflineData(type, data) {
  await storeOfflineData(type, data);
}

async function queueUpdate(update) {
  // Queue update for background sync
  console.log('Queueing update:', update);
  
  // Register for background sync
  if (self.registration.sync) {
    await self.registration.sync.register('contact-sync');
  }
}

// Handle install prompt
self.addEventListener('beforeinstallprompt', (event) => {
  console.log('PWA install prompt triggered');
  event.preventDefault();
  
  // Store the event so it can be triggered later
  self.deferredPrompt = event;
  
  // Notify the main app
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: 'PWA_INSTALL_AVAILABLE'
      });
    });
  });
});

console.log('Kinect Service Worker loaded');