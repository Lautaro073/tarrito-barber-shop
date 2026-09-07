import { app } from '@/lib/firebase';

let pending: Promise<void> | null = null;
let listening = false;

async function withTimeout<T>(operation: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([operation, new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('Push registration timed out')), 20000);
    })]);
  } finally {
    clearTimeout(timer);
  }
}

export function registerPushDevice(vapidKey: string): Promise<void> {
  if (pending) return pending;
  pending = (async () => {
    const { getMessaging, getToken, onMessage } = await import('firebase/messaging');
    await withTimeout(navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' }));
    const registration = await withTimeout(navigator.serviceWorker.ready);
    const messaging = getMessaging(app);
    const token = await withTimeout(getToken(messaging, { vapidKey, serviceWorkerRegistration: registration }));
    if (!token) throw new Error('No token');
    const response = await fetch('/api/push/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }), signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error('Registration failed');
    if (!listening) {
      onMessage(messaging, (payload) => {
        const data = payload.notification || payload.data || {};
        void registration.showNotification(data.title || 'Tarrito Barber Shop', {
          body: data.body || '', icon: '/icons/icon-192.png',
          tag: payload.data?.tag, data: { url: payload.data?.url || '/' },
        }).catch(() => undefined);
      });
      listening = true;
    }
  })().finally(() => { pending = null; });
  return pending;
}
