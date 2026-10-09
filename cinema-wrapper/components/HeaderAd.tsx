import ScriptRunner from './ScriptRunner';

/**
 * Top header ad space — a responsive 728x90 leaderboard container.
 * Renders the admin-provided banner code (scripts included) via ScriptRunner.
 */
export default function HeaderAd({ code }: { code: string }) {
  const hasCode = Boolean(code && code.trim());

  return (
    <div className="z-10 w-full shrink-0 border-b border-zinc-800/70 bg-zinc-900/40">
      <div className="mx-auto flex min-h-[90px] w-full max-w-[760px] items-center justify-center px-4 py-2">
        {hasCode ? (
          <ScriptRunner html={code} id="top-banner" />
        ) : (
          <div className="flex h-[90px] w-full max-w-[728px] items-center justify-center rounded-md border border-dashed border-zinc-700/60 text-[11px] uppercase tracking-[0.3em] text-zinc-600">
            Ad Space · 728 × 90
          </div>
        )}
      </div>
    </div>
  );
}
