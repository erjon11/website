const CACHE = 'weekly-earnings-shell-v5';
const FILES = ['./','./index.html','./style.css','./app.mjs','./core.mjs','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES))));
self.addEventListener('activate', event=>event.waitUntil((async()=>{
  // Remove only this app's older caches. Other applications may share the origin.
  for(const key of await caches.keys())if(key.startsWith('weekly-earnings-shell-')&&key!==CACHE)await caches.delete(key);
  await self.clients.claim();
})()));
self.addEventListener('fetch', event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    if(event.request.mode==='navigate')return await cache.match('./index.html') || fetch(event.request);
    return await cache.match(event.request) || fetch(event.request);
  })());
});
