import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * Persistent store for the admin master passcode.
 *
 * The passcode is NEVER stored in plain text — only a salted scrypt hash
 * lives in data/admin.json. It is kept in a separate file from the public
 * site config so the hash can never be exposed through GET /api/config.
 */

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const ADMIN_FILE = path.join(DATA_DIR, 'admin.json');

export interface AdminRecord {
  passSalt: string;
  passHash: string;
  updatedAt: string;
}

const SCRYPT_KEYLEN = 64;

let cache: AdminRecord | null | undefined; // undefined = not loaded yet
// Serialize writes so concurrent saves can never interleave or corrupt the file.
let writeChain: Promise<unknown> = Promise.resolve();

export function hashPasscode(passcode: string, salt?: string): { salt: string; hash: string } {
  const passSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(passcode, passSalt, SCRYPT_KEYLEN).toString('hex');
  return { salt: passSalt, hash };
}

/** Returns the stored admin record, or null when no custom password has been set. */
export async function getAdminRecord(): Promise<AdminRecord | null> {
  if (cache !== undefined) return cache;
  try {
    const raw = await fs.readFile(ADMIN_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<AdminRecord>;
    cache =
      typeof parsed.passSalt === 'string' && typeof parsed.passHash === 'string'
        ? {
            passSalt: parsed.passSalt,
            passHash: parsed.passHash,
            updatedAt: parsed.updatedAt || '',
          }
        : null;
  } catch {
    // Missing or unreadable store -> no custom password set yet.
    cache = null;
  }
  return cache;
}

/** Hashes and persists a new admin passcode (atomic write via temp-file + rename). */
export async function setAdminPasscode(passcode: string): Promise<void> {
  const { salt, hash } = hashPasscode(passcode);
  const record: AdminRecord = {
    passSalt: salt,
    passHash: hash,
    updatedAt: new Date().toISOString(),
  };
  cache = record;

  writeChain = writeChain.then(async () => {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const tmp = `${ADMIN_FILE}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(record, null, 2), 'utf8');
    await fs.rename(tmp, ADMIN_FILE);
  });

  await writeChain.catch((err) => {
    console.error('[admin-store] Failed to persist admin record:', err);
  });
}
