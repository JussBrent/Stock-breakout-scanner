/**
 * Orbis service worker — handles incoming Web Push notifications.
 * Registered from the frontend via navigator.serviceWorker.register('/sw.js').
 */

self.addEventListener('push', (event) => {
  let data = { title: 'Orbis Alert', body: 'A new breakout setup has been detected.' }

  if (event.data) {
    try {
      data = event.data.json()
    } catch {
      // Plain-text payload fallback
      data.body = event.data.text()
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      // tag deduplicates: a second alert for the same stock replaces the first
      tag: data.tag || 'orbis-alert',
      requireInteraction: false,
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  // Focus an existing app tab, or open a new one
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.startsWith(self.location.origin) && 'focus' in client) {
            return client.focus()
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/')
        }
      })
  )
})
