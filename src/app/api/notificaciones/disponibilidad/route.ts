import { NextRequest, NextResponse } from 'next/server';
import { weeklyOpening } from '@/lib/availability-notifications';

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  if (!process.env.CRON_SECRET || request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  try {
    await weeklyOpening();
    return NextResponse.json({ success: true });
  } catch {
    console.error('Push: no se pudo ejecutar la apertura semanal');
    return NextResponse.json({ error: 'No se pudo procesar disponibilidad' }, { status: 503 });
  }
}
