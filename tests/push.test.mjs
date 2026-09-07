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

test('converts a URL-safe VAPID key for PushManager', async () => {
  const { vapidKeyToArrayBuffer } = await loadTs('../src/lib/web-push-client.ts');
  const bytes = new Uint8Array([4, 255, 10, 100]);
  const key = Buffer.from(bytes).toString('base64url');

  assert.deepEqual([...new Uint8Array(vapidKeyToArrayBuffer(key))], [...bytes]);
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

test('stores push registrations with Firebase Admin instead of the client SDK', async () => {
  const source = await readFile(new URL('../src/app/api/push/register/route.ts', import.meta.url), 'utf8');

  assert.match(source, /pushAdmin/);
  assert.match(source, /endpoint/);
  assert.match(source, /p256dh/);
  assert.match(source, /auth/);
  assert.doesNotMatch(source, /installationId/);
  assert.doesNotMatch(source, /firebase\/firestore/);
  assert.doesNotMatch(source, /@\/lib\/firebase['"]/);
});

test('sends availability alerts through standard Web Push', async () => {
  const source = await readFile(new URL('../src/lib/availability-notifications.ts', import.meta.url), 'utf8');

  assert.match(source, /webpush\.sendNotification/);
  assert.doesNotMatch(source, /sendEachForMulticast/);
});

test('worker displays native push messages and opens the app on click', async () => {
  const { GET } = await loadTs('../src/app/firebase-messaging-sw.js/route.ts');
  const response = GET();
  assert.match(response.headers.get('Content-Type'), /javascript/);
  let handler;
  let click;
  const shown = [];
  const opened = [];
  vm.runInNewContext(await response.text(), {
    URL,
    self: {
      location: { origin: 'https://example.com' },
      skipWaiting() {},
      addEventListener(name, fn) {
        if (name === 'push') handler = fn;
        if (name === 'notificationclick') click = fn;
      },
      registration: { showNotification(...args) { shown.push(args); } },
      clients: { claim: async () => {}, matchAll: async () => [], openWindow: async (url) => opened.push(url) },
    },
  });
  let pushed;
  handler({ data: { json: () => ({ title: 'Test', body: 'Message', url: '/reservar' }) }, waitUntil(promise) { pushed = promise; } });
  await pushed;
  assert.equal(shown.length, 1);
  assert.equal(shown[0][0], 'Test');
  let pending;
  click({ notification: { close() {} }, stopImmediatePropagation() {}, waitUntil(promise) { pending = promise; } });
  await pending;
  assert.deepEqual(opened, ['https://example.com/']);
});
