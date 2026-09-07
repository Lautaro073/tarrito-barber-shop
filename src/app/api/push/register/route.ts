import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { pushAdmin } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: 'Origen no permitido' }, { status: 403 });
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Datos invalidos' }, { status: 400 });
  }
  const endpoint = body?.subscription?.endpoint;
  const p256dh = body?.subscription?.keys?.p256dh;
  const auth = body?.subscription?.keys?.auth;
  if (typeof endpoint !== 'string' || endpoint.length > 2048 || !endpoint.startsWith('https://') ||
      typeof p256dh !== 'string' || !p256dh || p256dh.length > 256 ||
      typeof auth !== 'string' || !auth || auth.length > 256) {
    return NextResponse.json({ error: 'Suscripcion invalida' }, { status: 400 });
  }
  try {
    const id = createHash('sha256').update(endpoint).digest('hex');
    const { db } = pushAdmin();
    await db.collection('pushSubscriptions').doc(id).set({
      endpoint,
      p256dh,
      auth,
      userAgent: request.headers.get('user-agent') || '',
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('No se pudo registrar la suscripcion push', error);
    return NextResponse.json({ error: 'No se pudo registrar el dispositivo' }, { status: 503 });
  }
}
