// public/sw.js
const CACHE_VERSION = 'v1';
const RUNTIME_IMAGE_CACHE = `image-cache-${CACHE_VERSION}`;
const RUNTIME_STATIC_CACHE = `static-cache-${CACHE_VERSION}`;

// 可选：在这里列出要预缓存的关键静态资源（首页 html、logo 等）
// 如果不需要 precache，把数组留空或只放很少的文件
const PRECACHE_URLS = [
  '/', // 可选：首页
  '/favicon.ico',
  // '/_next/static/...', // 若需精确 precache，你可以手动列出
];

self.addEventListener('install', (event) => {
  // 安装时预缓存一些资源（可选）
  event.waitUntil(
    caches.open(RUNTIME_STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    }).then(() => {
      // 立即激活新的 SW（可撤去）
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // 清理旧缓存（保留当前版本）
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => ![RUNTIME_IMAGE_CACHE, RUNTIME_STATIC_CACHE].includes(k))
          .map((k) => caches.delete(k))
      );
      // 立即接管页面
      return self.clients.claim();
    })()
  );
});

// 辅助：判断是不是图片请求
function isImageRequest(request) {
  return request.destination === 'image' ||
    /\.(png|jpg|jpeg|svg|gif|webp|avif|bmp|ico|tiff|mp4|mov)$/i.test(new URL(request.url).pathname);
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 只处理 GET 请求
  if (req.method !== 'GET') return;

  // 图片：Cache First 策略
  if (isImageRequest(req)) {
    event.respondWith(
      caches.open(RUNTIME_IMAGE_CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        if (cached) return cached;
        try {
          const resp = await fetch(req);
          // 仅缓存成功响应
          if (resp && resp.status === 200) {
            cache.put(req, resp.clone()).catch(() => {});
          }
          return resp;
        } catch (err) {
          // 如果网络失败且缓存没有，则返回 fallback（可改为内嵌占位图片）
          return caches.match('/fallback-image.png') || new Response('', { status: 503 });
        }
      })
    );
    return;
  }

  // 对其它静态资源（JS/CSS）使用 Stale-While-Revalidate
  if (req.destination === 'script' || req.destination === 'style' || url.pathname.startsWith('/_next/')) {
    event.respondWith(
      caches.open(RUNTIME_STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        const networkFetch = fetch(req).then((resp) => {
          if (resp && resp.status === 200) cache.put(req, resp.clone()).catch(() => {});
          return resp;
        }).catch(() => null);

        // 优先返回缓存（如果有），同时触发网络更新
        return cached || networkFetch;
      })
    );
    return;
  }

  // 其他默认行为：走网络
});
