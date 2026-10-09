import { NextResponse } from 'next/server';
import { resetConfig } from '@/lib/store';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/** POST /api/config/reset — admin only. Restores factory defaults globally. */
export async function POST() {
  const authed = await requireAuth();
  if (!authed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const config = await resetConfig();
  return NextResponse.json(config);
}
