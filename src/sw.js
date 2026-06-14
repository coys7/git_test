import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { CacheFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

// Cache Google Fonts
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts',
    plugins: [
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }),
      new CacheableResponsePlugin({ statuses: [0, 200] })
    ]
  })
)

// Daily reminder via Periodic Background Sync
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'lectio-reminder') {
    event.waitUntil(
      self.registration.showNotification('Your daily lesson is ready.', {
        body: 'Five minutes of real learning. Open Paideia.',
        icon: '/icon.svg',
        badge: '/icon.svg',
        tag: 'paideia-daily',
        renotify: true
      })
    )
  }
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus()
      }
      if (clients.openWindow) return clients.openWindow('/')
    })
  )
})
