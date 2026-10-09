'use client';

import { useState } from 'react';
import { Film, Loader2 } from 'lucide-react';

/**
 * Main cinema iframe — full-height, responsive embed of the configured
 * external streaming URL, with a loading skeleton shown until the frame
 * fires its load event.
 */
export default function CinemaFrame({ src }: { src: string }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      {!loaded && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-zinc-950">
          <div className="relative flex items-center justify-center">
            <div className="absolute h-28 w-28 rounded-full bg-cyan-500/10 blur-2xl" />
            <Film className="h-10 w-10 text-cyan-400" />
          </div>
          <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
            Loading cinema stream…
          </p>
        </div>
      )}
      <iframe
        key={src}
        src={src}
        title="Cinema Stream"
        onLoad={() => setLoaded(true)}
        className={`h-full w-full border-0 transition-opacity duration-500 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
        allow="fullscreen; autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
