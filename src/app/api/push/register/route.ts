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
  const token = body?.token;
  if (typeof token !== 'string' || token.length < 20 || token.length > 4096 || /\s/.test(token)) {
    return NextResponse.json({ error: 'Token invalido' }, { status: 400 });
  }
  try {
    const id = createHash('sha256').update(token).digest('hex');
    await setDoc(doc(db, 'pushSubscriptions', id), {
      token,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return NextResponse.json({ success: true });
  } catch {
    console.error('No se pudo registrar la suscripcion push');
    return NextResponse.json({ error: 'No se pudo registrar el dispositivo' }, { status: 503 });
  }
}
