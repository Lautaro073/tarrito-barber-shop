import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export function GET() {
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  return NextResponse.json({ vapidKey: vapidKey || null }, {
    status: vapidKey ? 200 : 503,
    headers: { 'Cache-Control': 'no-store' },
  });
}
