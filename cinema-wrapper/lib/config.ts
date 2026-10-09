/**
 * Shared types + factory defaults for the platform-wide configuration.
 * The config is stored once (JSON file store) and served to every visitor.
 */
export interface SiteConfig {
  /** Display name of the site (public header + browser tab title). */
  siteName: string;
  /** Short tagline shown under the logo; also used as the meta description. */
  siteTagline: string;
  /** External streaming platform URL embedded inside the cinema iframe. */
  siteUrl: string;
  /** Raw HTML/JS (ad network tags) rendered in the 728x90 header slot. */
  topBannerCode: string;
  /** Raw script(s) injected and executed on the first visitor interaction. */
  popunderScript: string;
  /** Whether the floating bottom ad banner is shown. */
  bottomAdEnabled: boolean;
  /** Raw HTML/JS for the dismissible bottom sticky banner. */
  bottomAdCode: string;
  /** ISO timestamp of the last published change. */
  updatedAt: string;
}

export const DEFAULT_CONFIG: SiteConfig = {
  siteName: 'CineStream',
  siteTagline: 'Cinema Wrapper Platform',
  siteUrl: 'https://meowtv.ru',
  topBannerCode: '',
  popunderScript: '',
  bottomAdEnabled: false,
  bottomAdCode: '',
  updatedAt: new Date(0).toISOString(),
};
