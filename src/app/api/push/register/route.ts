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
  const installationId = body?.installationId;
  if (typeof installationId !== 'string' || installationId.length < 10 || installationId.length > 256 || /\s/.test(installationId)) {
    return NextResponse.json({ error: 'Identificador invalido' }, { status: 400 });
  }
  try {
    const id = createHash('sha256').update(installationId).digest('hex');
    const { db } = pushAdmin();
    await db.collection('pushSubscriptions').doc(id).set({
      installationId,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('No se pudo registrar la suscripcion push', error);
    return NextResponse.json({ error: 'No se pudo registrar el dispositivo' }, { status: 503 });
  }
}
