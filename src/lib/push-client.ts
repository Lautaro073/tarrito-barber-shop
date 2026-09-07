import { pushStage } from '@/lib/push-diagnostics';
import { subscriptionUsesVapidKey, vapidKeyToArrayBuffer } from '@/lib/web-push-client';

let pending: Promise<void> | null = null;

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
    const registered = await pushStage('service-worker-register', () => withTimeout(navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' })));
    await pushStage('service-worker-update', async () => {
      await registered.update();
      const nextWorker = registered.installing || registered.waiting;
      if (!nextWorker || nextWorker.state === 'activated') return;
      await withTimeout(new Promise<void>((resolve) => {
        nextWorker.addEventListener('statechange', () => {
          if (nextWorker.state === 'activated') resolve();
        });
      }));
    });
    const registration = await pushStage('service-worker-ready', () => withTimeout(navigator.serviceWorker.ready));
    let subscription = await pushStage('push-subscription-read', () => registration.pushManager.getSubscription());
    if (subscription && !subscriptionUsesVapidKey(subscription, vapidKey)) {
      await pushStage('push-subscription-replace', () => subscription!.unsubscribe());
      subscription = null;
    }
    subscription ??= await pushStage('push-subscribe', () => withTimeout(registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: vapidKeyToArrayBuffer(vapidKey),
    })));
    const response = await pushStage('backend-register', () => fetch('/api/push/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription: subscription.toJSON() }), signal: AbortSignal.timeout(15000),
    }));
    if (!response.ok) throw { stage: 'backend-register', code: `http-${response.status}`, message: 'Registration endpoint rejected the installation' };
  })().finally(() => { pending = null; });
  return pending;
}
