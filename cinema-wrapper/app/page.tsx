import type { Metadata } from 'next';
import { getConfig } from '@/lib/store';
import SiteHeader from '@/components/SiteHeader';
import HeaderAd from '@/components/HeaderAd';
import CinemaFrame from '@/components/CinemaFrame';
import PopunderGate from '@/components/PopunderGate';
import BottomAd from '@/components/BottomAd';

// Always render from the live store so published admin changes are
// visible to every incoming visitor immediately.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Browser tab title + meta description follow the admin-configured identity.
export async function generateMetadata(): Promise<Metadata> {
  const config = await getConfig();
  return {
    title: config.siteName,
    description: config.siteTagline,
  };
}

export default async function HomePage() {
  const config = await getConfig();

  return (
    <div className="flex h-[100dvh] flex-col bg-zinc-950">
      <SiteHeader name={config.siteName} tagline={config.siteTagline} />
      <HeaderAd code={config.topBannerCode} />
      <main className="relative min-h-0 flex-1">
        <CinemaFrame src={config.siteUrl} />
      </main>
      {/* Injects + executes the pop-under script on first user interaction */}
      <PopunderGate code={config.popunderScript} />
      {/* Optional, toggleable, dismissible bottom sticky ad */}
      <BottomAd enabled={config.bottomAdEnabled} code={config.bottomAdCode} />
    </div>
  );
}
