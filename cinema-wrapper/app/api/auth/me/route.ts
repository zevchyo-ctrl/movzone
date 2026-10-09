import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getAdminRecord } from '@/lib/admin-store';

export const dynamic = 'force-dynamic';

/** GET /api/auth/me — session status + whether a custom admin password is set. */
export async function GET() {
  const record = await getAdminRecord();
  return NextResponse.json({
    authenticated: await requireAuth(),
    hasCustomPassword: Boolean(record),
  });
}
