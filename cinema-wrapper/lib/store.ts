import { promises as fs } from 'fs';
import path from 'path';
import { DEFAULT_CONFIG, SiteConfig } from './config';

/**
 * Persistent JSON-file store.
 *
 * The configuration is written to a single JSON document on disk
 * (atomic write via temp-file + rename) and cached in memory so every
 * visitor — on any route — immediately receives the latest published
 * settings. Works out of the box on any VPS or self-hosted environment.
 *
 * On fully ephemeral serverless platforms (Vercel / Netlify functions),
 * point DATA_DIR at a mounted volume or swap this module for a KV/DB
 * adapter — the public API of this module stays identical.
 */

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

let cache: SiteConfig | null = null;
// Serialize writes so concurrent saves can never interleave or corrupt the file.
let writeChain: Promise<unknown> = Promise.resolve();

export async function getConfig(): Promise<SiteConfig> {
  if (cache) return cache;
  try {
    const raw = await fs.readFile(CONFIG_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<SiteConfig>;
    cache = { ...DEFAULT_CONFIG, ...parsed };
  } catch {
    // Missing or unreadable store -> fall back to defaults.
    cache = { ...DEFAULT_CONFIG };
  }
  return cache;
}

export async function saveConfig(patch: Partial<SiteConfig>): Promise<SiteConfig> {
  const current = await getConfig();
  const next: SiteConfig = { ...current, ...patch, updatedAt: new Date().toISOString() };
  cache = next;

  writeChain = writeChain.then(async () => {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const tmp = `${CONFIG_FILE}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(next, null, 2), 'utf8');
    await fs.rename(tmp, CONFIG_FILE);
  });

  await writeChain.catch((err) => {
    console.error('[store] Failed to persist configuration:', err);
  });
  return next;
}

export async function resetConfig(): Promise<SiteConfig> {
  return saveConfig({ ...DEFAULT_CONFIG });
}
