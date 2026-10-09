import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, verifyPasscode } from '@/lib/auth';
import { setAdminPasscode } from '@/lib/admin-store';

export const dynamic = 'force-dynamic';

const MIN_PASSWORD_LENGTH = 8;

/**
 * POST /api/auth/password — admin only. Changes the master passcode.
 * Body: { currentPassword, newPassword, confirmPassword }
 * The new passcode is stored as a salted scrypt hash (never plain text).
 */
export async function POST(req: NextRequest) {
  const authed = await requireAuth();
  if (!authed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { currentPassword?: unknown; newPassword?: unknown; confirmPassword?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { currentPassword, newPassword, confirmPassword } = body;

  if (
    typeof currentPassword !== 'string' ||
    typeof newPassword !== 'string' ||
    typeof confirmPassword !== 'string' ||
    !currentPassword ||
    !newPassword ||
    !confirmPassword
  ) {
    return NextResponse.json({ error: 'All password fields are required.' }, { status: 400 });
  }
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `New password must be at least ${MIN_PASSWORD_LENGTH} characters.` },
      { status: 400 }
    );
  }
  if (newPassword !== confirmPassword) {
    return NextResponse.json({ error: 'New passwords do not match.' }, { status: 400 });
  }
  if (!(await verifyPasscode(currentPassword))) {
    return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 401 });
  }

  await setAdminPasscode(newPassword);
  return NextResponse.json({ ok: true });
}
