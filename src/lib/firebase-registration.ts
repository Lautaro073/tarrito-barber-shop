import type { Messaging, onRegistered, register } from 'firebase/messaging';

interface RegistrationDependencies {
  messaging: Messaging;
  register: typeof register;
  onRegistered: typeof onRegistered;
  vapidKey: string;
  serviceWorkerRegistration: ServiceWorkerRegistration;
}

const REGISTRATION_TIMEOUT_MS = 20_000;

export function registerFirebaseInstallation({
  messaging,
  register,
  onRegistered,
  vapidKey,
  serviceWorkerRegistration,
}: RegistrationDependencies): Promise<string> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const listener: { unsubscribe?: () => void } = {};
    const timeout = setTimeout(() => finish(new Error('Firebase registration timed out')), REGISTRATION_TIMEOUT_MS);

    const finish = (error?: Error, installationId?: string) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      listener.unsubscribe?.();
      if (error) reject(error);
      else resolve(installationId as string);
    };

    listener.unsubscribe = onRegistered(messaging, installationId => {
      if (installationId.trim()) finish(undefined, installationId);
    });
    void register(messaging, { vapidKey, serviceWorkerRegistration }).catch(error => {
      finish(error instanceof Error ? error : new Error('Firebase registration failed'));
    });
  });
}
