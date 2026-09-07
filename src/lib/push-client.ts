import { app } from '@/lib/firebase';
import { registerFirebaseInstallation } from '@/lib/firebase-registration';
import { pushStage } from '@/lib/push-diagnostics';

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
    const { getMessaging, onMessage, onRegistered, register } = await pushStage('firebase-module', () => import('firebase/messaging'));
    await pushStage('service-worker-register', () => withTimeout(navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' })));
    const registration = await pushStage('service-worker-ready', () => withTimeout(navigator.serviceWorker.ready));
    const messaging = getMessaging(app);
    const installationId = await pushStage('firebase-register', () => registerFirebaseInstallation({
      messaging,
      register,
      onRegistered,
      vapidKey,
      serviceWorkerRegistration: registration,
    }));
    const response = await pushStage('backend-register', () => fetch('/api/push/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ installationId }), signal: AbortSignal.timeout(15000),
    }));
    if (!response.ok) throw { stage: 'backend-register', code: `http-${response.status}`, message: 'Registration endpoint rejected the installation' };
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
