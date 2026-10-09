import crypto from 'crypto';
import { cookies } from 'next/headers';
import { getAdminRecord, hashPasscode } from './admin-store';

/**
 * Admin authentication helpers.
 *
 * The dashboard is protected by a master passcode. Until an admin changes it
 * from the dashboard, the passcode comes from the ADMIN_PASS env var
 * (default "admin123"). Once changed, the new passcode is stored as a salted
 * scrypt hash in data/admin.json (see lib/admin-store.ts) and takes precedence.
 *
 * A successful login issues an HMAC-signed, httpOnly, SameSite=Lax session
 * cookie. All mutating API routes verify that cookie before touching the store.
 */

export const COOKIE_NAME = 'cw_admin';
const TOKEN_PAYLOAD = 'cinema-wrapper-admin-session';
const SECRET = process.env.ADMIN_SECRET || 'cw-dev-secret-change-me';

/** Fallback passcode (env var / built-in default) — used until a custom password is set. */
export function getPasscode(): string {
  return process.env.ADMIN_PASS || 'admin123';
}

export function signToken(): string {
  return `v1.${crypto.createHmac('sha256', SECRET).update(TOKEN_PAYLOAD).digest('hex')}`;
}

export function verifyToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const expected = signToken();
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

/** Returns true when the current request carries a valid admin session cookie. */
export async function requireAuth(): Promise<boolean> {
  const store = cookies();
  return verifyToken(store.get(COOKIE_NAME)?.value);
}

/**
 * Verifies a passcode against the stored (scrypt-hashed) admin password.
 * Falls back to ADMIN_PASS / "admin123" until the password is changed
 * from the admin dashboard.
 */
export async function verifyPasscode(passcode: string): Promise<boolean> {
  const record = await getAdminRecord();
  if (record && record.passSalt && record.passHash) {
    const { hash } = hashPasscode(passcode, record.passSalt);
    return safeEqual(hash, record.passHash);
  }
  return safeEqual(passcode, getPasscode());
}
