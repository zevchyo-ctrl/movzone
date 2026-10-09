'use client';

import { useEffect, useState } from 'react';
import type { SiteConfig } from '@/lib/config';
import SiteHeader from '@/components/SiteHeader';
import HeaderAd from '@/components/HeaderAd';
import CinemaFrame from '@/components/CinemaFrame';
import PopunderGate from '@/components/PopunderGate';
import BottomAd from '@/components/BottomAd';

const DRAFT_KEY = 'cw_admin_draft';

/**
 * Live preview route used by the admin dashboard's preview panel.
 *
 * It renders the exact public viewer, but overlays the admin's UNSAVED
 * draft (kept in this browser's localStorage under `cw_admin_draft`) on
 * top of the published configuration. The admin dashboard writes the
 * draft on every keystroke (debounced), and this page polls for it, so
 * the preview updates in real time — before anything is published.
 */
export default function PreviewPage() {
  const [config, setConfig] = useState<SiteConfig | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch('/api/config', { cache: 'no-store' });
        const base: SiteConfig = await res.json();
        let merged = base;
        try {
          const raw = window.localStorage.getItem(DRAFT_KEY);
          if (raw) merged = { ...base, ...JSON.parse(raw) };
        } catch {
          /* corrupted draft -> ignore, show published config */
        }
        if (!cancelled) setConfig(merged);
      } catch {
        /* network hiccup -> keep previous render */
      }
    };

    void load();
    const interval = window.setInterval(load, 800);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  if (!config) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-zinc-950 text-xs uppercase tracking-[0.3em] text-zinc-500">
        Loading preview…
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] flex-col bg-zinc-950">
      <SiteHeader name={config.siteName} tagline={config.siteTagline} />
      <HeaderAd code={config.topBannerCode} />
      <main className="relative min-h-0 flex-1">
        <CinemaFrame src={config.siteUrl} />
      </main>
      <PopunderGate code={config.popunderScript} />
      <BottomAd enabled={config.bottomAdEnabled} code={config.bottomAdCode} />
    </div>
  );
}
