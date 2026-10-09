import { Activity, Clapperboard } from 'lucide-react';

interface SiteHeaderProps {
  /** Configurable site name — the last word is rendered with the neon accent. */
  name?: string;
  /** Configurable tagline shown under the logo. */
  tagline?: string;
}

export default function SiteHeader({
  name = 'CineStream',
  tagline = 'Cinema Wrapper Platform',
}: SiteHeaderProps) {
  const words = (name || 'CineStream').trim().split(/\s+/).filter(Boolean);
  const head = words.slice(0, -1).join(' ');
  const last = words.length > 1 ? words[words.length - 1] : words[0];

  return (
    <header className="z-20 flex shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-950/90 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10 ring-1 ring-cyan-500/30 shadow-glow-cyan">
          <Clapperboard className="h-5 w-5 text-cyan-400" />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-sm font-bold tracking-wide text-zinc-100">
            {head ? `${head} ` : ''}
            <span className="text-cyan-400">{last}</span>
          </h1>
          <p className="truncate text-[10px] uppercase tracking-[0.25em] text-zinc-500">
            {tagline || 'Cinema Wrapper Platform'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-widest text-emerald-400">
          <Activity className="h-3 w-3" />
          Live
        </span>
      </div>
    </header>
  );
}
