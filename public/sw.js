// 考研工作台 Service Worker
// 策略:运行时缓存(网络优先,失败回退缓存)——保证核心页面可访问性,不缓存过期数据
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  const url = new URL(event.request.url)
  if (url.origin !== self.location.origin) return
  // 动态 API 不缓存
  if (url.pathname.startsWith('/api/')) return

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone()
        caches
          .open('kaoyan-desk-v1')
          .then((cache) => cache.put(event.request, copy))
          .catch(() => {})
        return response
      })
      .catch(() => caches.match(event.request)),
  )
})
