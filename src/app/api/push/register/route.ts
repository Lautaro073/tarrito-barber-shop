import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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
    await setDoc(doc(db, 'pushSubscriptions', id), {
      installationId,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return NextResponse.json({ success: true });
  } catch {
    console.error('No se pudo registrar la suscripcion push');
    return NextResponse.json({ error: 'No se pudo registrar el dispositivo' }, { status: 503 });
  }
}
