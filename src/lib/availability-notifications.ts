import { after } from 'next/server';
import { FieldPath } from 'firebase-admin/firestore';
import webpush, { type PushSubscription } from 'web-push';
import { pushAdmin } from '@/lib/firebase-admin';
import { availability, availabilityMessage, transition, upcomingDates, type Availability, type ScheduleDay } from '@/lib/availability-policy';

let webPushConfigured = false;

function configureWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) throw new Error('Faltan credenciales VAPID para Web Push');
  if (!webPushConfigured) {
    webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:lautarojimenez02@gmail.com', publicKey, privateKey);
    webPushConfigured = true;
  }
}

function toPushSubscription(data: FirebaseFirestore.DocumentData): PushSubscription | null {
  if (typeof data.endpoint !== 'string' || typeof data.p256dh !== 'string' || typeof data.auth !== 'string') return null;
  return { endpoint: data.endpoint, keys: { p256dh: data.p256dh, auth: data.auth } };
}

function isGonePushSubscription(error: unknown) {
  return typeof error === 'object' && error !== null && 'statusCode' in error &&
    (error.statusCode === 404 || error.statusCode === 410);
}

// A transaction serializes the daily state and creates its notification together.
async function observe(date: string, seed: boolean, refresh = false) {
  const { db } = pushAdmin();
  const stateRef = db.collection('pushAvailability').doc(date);
  await db.runTransaction(async tx => {
    const [state, scheduleDocs, serviceDocs, citas] = await Promise.all([
      tx.get(stateRef), tx.get(db.collection('horarios')), tx.get(db.collection('servicios')),
      tx.get(db.collection('citas').where('fecha', '>=', date + 'T00:00:00').where('fecha', '<=', date + 'T23:59:59')),
    ]);
    const now = new Date();
    const schedules = (scheduleDocs.docs[0]?.data().horarios || []) as ScheduleDay[];
    const durations = serviceDocs.docs.filter(doc => doc.data().activo).map(doc => Number(doc.data().duracionMinutos));
    const appointments = citas.docs.map(doc => ({ hora: String(doc.data().hora), estado: String(doc.data().estado) }));
    const current = availability(date, schedules, durations, appointments, now);
    if (availability(date, schedules, durations, [], now).remaining === 0) current.enabled = false;
    const previous = state.data();
    if (seed && state.exists && !refresh) return;
    const event = !seed && previous ? transition(previous as Availability, current) : null;
    const revision = Number(previous?.revision || 0) + (event ? 1 : 0);
    tx.set(stateRef, { ...current, revision, updatedAt: now.toISOString() });
    if (event) {
      tx.create(db.collection('pushEvents').doc(`${date}-${revision}`), {
        ...availabilityMessage(event, date), date, type: event,
        status: 'pending', createdAt: now.toISOString(), leaseUntil: 0,
      });
    }
  });
}

export async function seedAvailability(dates: string[]) {
  try {
    for (const date of new Set(dates)) await observe(date.slice(0, 10), true);
  } catch {
    console.error('Push: no se pudo preparar el estado de disponibilidad; revisar Firebase Admin');
  }
}

export function notifyAvailability(dates: string[]) {
  after(async () => {
    try {
      for (const date of new Set(dates)) await observe(date.slice(0, 10), false);
      await deliverPendingPush();
    } catch {
      console.error('Push: fallo al procesar la disponibilidad; revisar credenciales y logs de Firebase');
    }
  });
}

export async function deliverPendingPush() {
  const { db } = pushAdmin();
  configureWebPush();
  const events = await db.collection('pushEvents').where('status', '==', 'pending').limit(20).get();
  for (const event of events.docs) {
    const claimed = await db.runTransaction(async tx => {
      const fresh = await tx.get(event.ref);
      if (fresh.data()?.status !== 'pending' || fresh.data()?.leaseUntil > Date.now()) return false;
      tx.update(event.ref, { leaseUntil: Date.now() + 300000 });
      return true;
    });
    if (!claimed) continue;
    try {
      const payload = event.data();
      // Old alerts are no longer useful after an outage or a later transition.
      const latest = payload.date ? await db.collection('pushAvailability').doc(payload.date).get() : null;
      if (Date.now() - Date.parse(payload.createdAt) > 6 * 3600000 ||
          (latest?.exists && event.id !== `${payload.date}-${latest.data()?.revision}`)) {
        await event.ref.update({ status: 'expired', leaseUntil: 0 });
        continue;
      }
      const completed = await event.ref.collection('deliveries').get();
      const sent = new Set(completed.docs.map(doc => doc.id));
      let cursor: string | undefined;
      let failed = 0;
      while (true) {
        let query = db.collection('pushSubscriptions').orderBy(FieldPath.documentId()).limit(100);
        if (cursor) query = query.startAfter(cursor);
        const page = await query.get();
        if (page.empty) break;
        cursor = page.docs[page.docs.length - 1].id;
        const recipients = page.docs.filter(doc => !sent.has(doc.id));
        if (!recipients.length) continue;
        const message = JSON.stringify({ title: payload.title, body: payload.body, tag: event.id, url: '/reservar' });
        const results = await Promise.all(recipients.map(async recipient => {
          const subscription = toPushSubscription(recipient.data());
          if (!subscription) return { success: false, invalid: true };
          try {
            await webpush.sendNotification(subscription, message, { TTL: 3600, urgency: 'high' });
            return { success: true, invalid: false };
          } catch (error) {
            return { success: false, invalid: isGonePushSubscription(error) };
          }
        }));
        const batch = db.batch();
        results.forEach((result, index) => {
          const recipient = recipients[index];
          if (result.success || result.invalid) batch.set(event.ref.collection('deliveries').doc(recipient.id), { at: new Date().toISOString() });
          else failed++;
          if (result.invalid) batch.delete(recipient.ref);
        });
        await batch.commit();
        await event.ref.update({ leaseUntil: Date.now() + 300000 });
      }
      await event.ref.update({ status: failed ? 'pending' : 'sent', leaseUntil: 0, failures: failed });
    } catch {
      await event.ref.update({ leaseUntil: 0 });
      console.error('Push: envio pendiente para reintentar', event.id);
    }
  }
}

export async function weeklyOpening() {
  const { db } = pushAdmin();
  const now = new Date();
  const dates = upcomingDates(now);
  const schedules = await db.collection('horarios').get();
  const services = await db.collection('servicios').get();
  const config = (schedules.docs[0]?.data().horarios || []) as ScheduleDay[];
  const durations = services.docs.filter(doc => doc.data().activo).map(doc => Number(doc.data().duracionMinutos));
  const opened = dates.filter(date => {
    const before = availability(date, config, durations, [], new Date(now.getTime() - 3600000));
    const current = availability(date, config, durations, [], now);
    return !before.enabled && current.enabled && current.remaining > 0;
  });
  if (opened.length) {
    const ref = db.collection('pushEvents').doc(`weekly-${opened[0]}`);
    await db.runTransaction(async tx => {
      if ((await tx.get(ref)).exists) return;
      tx.create(ref, { title: 'Turnos habilitados', body: 'Ya están habilitados los turnos de la próxima semana. Reservá el tuyo.', status: 'pending', createdAt: now.toISOString(), leaseUntil: 0 });
    });
    // The weekly announcement already covers these openings.
    for (const date of opened) await observe(date, true, true);
  }
  await seedAvailability(dates);
  await deliverPendingPush();
}
