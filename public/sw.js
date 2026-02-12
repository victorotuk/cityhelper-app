// Service worker: show push notifications (no third-party SDK)
self.addEventListener('push', (event) => {
  const promise = (async () => {
    const data = event.data ? await event.data.json().catch(() => ({})) : {}
    const title = data.title || 'CityHelper'
    const options = {
      body: data.body || '',
      icon: data.icon || '/vite.svg',
      badge: '/vite.svg',
      tag: data.tag || 'cityhelper-reminder',
      renotify: true,
    }
    await self.registration.showNotification(title, options)
  })()
  event.waitUntil(promise)
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const url = self.location.origin + '/'
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          return client.focus().then(() => client.navigate(url))
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url)
    })
  )
})
