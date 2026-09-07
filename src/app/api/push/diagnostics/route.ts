import { NextRequest, NextResponse } from 'next/server';
import { toPushDiagnostic } from '@/lib/push-diagnostics';

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: 'Origen no permitido' }, { status: 403 });
  }
  try {
    const diagnostic = toPushDiagnostic('client', await request.json());
    console.error(JSON.stringify({
      level: 'error',
      event: 'push-registration-failed',
      ...diagnostic,
    }));
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: 'Diagnostico invalido' }, { status: 400 });
  }
}
