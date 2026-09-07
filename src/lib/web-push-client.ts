export function vapidKeyToArrayBuffer(value: string): ArrayBuffer {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const base64 = `${value}${padding}`.replace(/-/g, '+').replace(/_/g, '/');
  const raw = globalThis.atob(base64);
  const bytes = new Uint8Array(raw.length);
  for (let index = 0; index < raw.length; index++) bytes[index] = raw.charCodeAt(index);
  return bytes.buffer;
}

export function subscriptionUsesVapidKey(subscription: PushSubscription, vapidKey: string): boolean {
  const key = subscription.options.applicationServerKey;
  if (!key) return false;
  const bytes = new Uint8Array(key);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return globalThis.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') === vapidKey.replace(/=+$/, '');
}
