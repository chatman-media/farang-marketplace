const CACHE = "mkt-v1"
const PRECACHE = ["/", "/listings"]

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)))
  self.skipWaiting()
})

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))))
  self.clients.claim()
})

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return
  if (e.request.url.includes("/api/")) return
  e.respondWith(
    caches.match(e.request).then((cached) => cached ?? fetch(e.request).then((res) => {
      if (res.ok && res.type === "basic") {
        const clone = res.clone()
        caches.open(CACHE).then((c) => c.put(e.request, clone))
      }
      return res
    }))
  )
})

self.addEventListener("push", (e) => {
  const data = e.data?.json() ?? {}
  e.waitUntil(
    self.registration.showNotification(data.title ?? "Thailand Marketplace", {
      body: data.body ?? "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { url: data.url ?? "/" },
    })
  )
})

self.addEventListener("notificationclick", (e) => {
  e.notification.close()
  e.waitUntil(clients.openWindow(e.notification.data?.url ?? "/"))
})
