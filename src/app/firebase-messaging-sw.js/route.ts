export const dynamic = 'force-dynamic';

export function GET() {
  const source = `
self.skipWaiting();
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch {}
  event.waitUntil(self.registration.showNotification(data.title || 'Tarrito Barber Shop', {
    body: data.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: data.tag,
    data: { url: data.url || '/' }
  }));
});
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.stopImmediatePropagation();
  event.waitUntil((async () => {
    const requested = new URL(event.notification.data?.url || '/', self.location.origin);
    const destination = requested.origin === self.location.origin ? requested.href : self.location.origin + '/';
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const existing = windows.find(client => new URL(client.url).origin === self.location.origin);
    if (existing) { await existing.navigate(destination); return existing.focus(); }
    return self.clients.openWindow(destination);
  })());
});
`;
  return new Response(source, { headers: {
    'Content-Type': 'application/javascript; charset=utf-8',
    'Cache-Control': 'no-cache',
    'Service-Worker-Allowed': '/',
  } });
}
