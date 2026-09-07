import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

async function loadTs(path) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } });
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
}

test('prompt only for installed apps with undecided permission, respecting seven days', async () => {
  const { shouldPromptPush, PUSH_SNOOZE_MS } = await loadTs('../src/lib/push-policy.ts');
  const now = 1000000000;
  assert.equal(PUSH_SNOOZE_MS, 604800000);
  assert.equal(shouldPromptPush(true, 'default', null, now), true);
  assert.equal(shouldPromptPush(false, 'default', null, now), false);
  for (const permission of ['granted', 'denied']) {
    assert.equal(shouldPromptPush(true, permission, null, now), false);
  }
  assert.equal(shouldPromptPush(true, 'default', String(now + PUSH_SNOOZE_MS), now), false);
  assert.equal(shouldPromptPush(true, 'default', String(now), now), true);
  assert.equal(shouldPromptPush(true, 'default', 'invalid', now), true);
});

test('registers Firebase messaging and resolves the installation ID', async () => {
  const { registerFirebaseInstallation } = await loadTs('../src/lib/firebase-registration.ts');
  const calls = [];
  let registeredCallback;
  const registration = { scope: '/' };
  const result = registerFirebaseInstallation({
    messaging: {},
    vapidKey: 'public-vapid-key',
    serviceWorkerRegistration: registration,
    onRegistered: (_messaging, callback) => {
      calls.push('listen');
      registeredCallback = callback;
      return () => calls.push('unsubscribe');
    },
    register: async (_messaging, options) => {
      calls.push(['register', options]);
      registeredCallback('installation-id');
    },
  });

  assert.equal(await result, 'installation-id');
  assert.deepEqual(calls, [
    'listen',
    ['register', { vapidKey: 'public-vapid-key', serviceWorkerRegistration: registration }],
    'unsubscribe',
  ]);
});

test('keeps the Firebase error code in a safe push diagnostic', async () => {
  const { toPushDiagnostic } = await loadTs('../src/lib/push-diagnostics.ts');
  const error = Object.assign(new Error('Messaging: Registration API returned 403.'), {
    code: 'messaging/token-subscribe-failed',
  });

  assert.deepEqual(toPushDiagnostic('firebase-register', error), {
    stage: 'firebase-register',
    code: 'messaging/token-subscribe-failed',
    message: 'Messaging: Registration API returned 403.',
  });
});

test('worker displays data messages once and opens the app on click', async () => {
  const { GET } = await loadTs('../src/app/firebase-messaging-sw.js/route.ts');
  const response = GET();
  assert.match(response.headers.get('Content-Type'), /javascript/);
  let handler;
  let click;
  const shown = [];
  const opened = [];
  vm.runInNewContext(await response.text(), {
    importScripts() {},
    URL,
    firebase: { initializeApp() {}, messaging: () => ({ onBackgroundMessage(fn) { handler = fn; } }) },
    self: {
      location: { origin: 'https://example.com' },
      addEventListener(name, fn) { if (name === 'notificationclick') click = fn; },
      registration: { showNotification(...args) { shown.push(args); } },
      clients: { matchAll: async () => [], openWindow: async (url) => opened.push(url) },
    },
  });
  await handler({ notification: { title: 'Already displayed by FCM' } });
  assert.equal(shown.length, 0);
  await handler({ data: { title: 'Test', body: 'Message' } });
  assert.equal(shown.length, 1);
  assert.equal(shown[0][0], 'Test');
  let pending;
  click({ notification: { close() {} }, stopImmediatePropagation() {}, waitUntil(promise) { pending = promise; } });
  await pending;
  assert.deepEqual(opened, ['https://example.com/']);
});
