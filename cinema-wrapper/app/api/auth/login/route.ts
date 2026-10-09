import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAME, signToken, verifyPasscode } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/** POST /api/auth/login — { passcode } -> sets signed httpOnly session cookie. */
export async function POST(req: NextRequest) {
  let body: { passcode?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (typeof body.passcode !== 'string' || !(await verifyPasscode(body.passcode))) {
    return NextResponse.json({ error: 'Invalid passcode' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, signToken(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return res;
}
