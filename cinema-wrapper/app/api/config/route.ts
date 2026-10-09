import { NextRequest, NextResponse } from 'next/server';
import { getConfig, saveConfig } from '@/lib/store';
import { requireAuth } from '@/lib/auth';
import type { SiteConfig } from '@/lib/config';

// Never cache: every visitor must receive the latest published config.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/** GET /api/config — public. Returns the platform-wide configuration. */
export async function GET() {
  const config = await getConfig();
  return NextResponse.json(config);
}

/** PUT /api/config — admin only. Validates, sanitizes and publishes changes. */
export async function PUT(req: NextRequest) {
  const authed = await requireAuth();
  if (!authed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Partial<SiteConfig>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const patch: Partial<SiteConfig> = {};

  if (typeof body.siteName === 'string') {
    patch.siteName = body.siteName.trim().slice(0, 100);
  }
  if (typeof body.siteTagline === 'string') {
    patch.siteTagline = body.siteTagline.trim().slice(0, 300);
  }
  if (typeof body.siteUrl === 'string') {
    const url = body.siteUrl.trim();
    if (url.length > 0) {
      try {
        const parsed = new URL(url);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          throw new Error('Unsupported protocol');
        }
        patch.siteUrl = parsed.toString();
      } catch {
        return NextResponse.json(
          { error: 'siteUrl must be a valid http(s) URL' },
          { status: 400 }
        );
      }
    }
  }
  if (typeof body.topBannerCode === 'string') patch.topBannerCode = body.topBannerCode;
  if (typeof body.popunderScript === 'string') patch.popunderScript = body.popunderScript;
  if (typeof body.bottomAdCode === 'string') patch.bottomAdCode = body.bottomAdCode;
  if (typeof body.bottomAdEnabled === 'boolean') patch.bottomAdEnabled = body.bottomAdEnabled;

  const saved = await saveConfig(patch);
  return NextResponse.json(saved);
}
