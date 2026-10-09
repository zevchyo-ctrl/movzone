'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import ScriptRunner from './ScriptRunner';

/**
 * Floating, dismissible bottom sticky ad unit.
 * Rendered only when the admin has enabled it AND provided banner code.
 */
export default function BottomAd({
  enabled,
  code,
}: {
  enabled: boolean;
  code: string;
}) {
  const [dismissed, setDismissed] = useState(false);

  if (!enabled || !code || !code.trim() || dismissed) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-cyan-500/20 bg-zinc-950/95 shadow-glow-cyan backdrop-blur">
      <div className="relative mx-auto flex min-h-[64px] w-full max-w-[970px] items-center justify-center px-4 py-2">
        <ScriptRunner html={code} id="bottom-ad" />
        <button
          type="button"
          aria-label="Dismiss advertisement"
          onClick={() => setDismissed(true)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
