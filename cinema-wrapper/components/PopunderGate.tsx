'use client';

import { useEffect, useState } from 'react';
import ScriptRunner from './ScriptRunner';

/**
 * Pop-under / pop-up execution gate.
 *
 * The ad script stored in the database is NOT injected on page load.
 * It is armed on the visitor's first interaction (click / tap / key press /
 * scroll) and only then parsed and executed by ScriptRunner — exactly the
 * "run advertising scripts on user click/interaction" behaviour.
 */
export default function PopunderGate({ code }: { code: string }) {
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    if (!code || !code.trim()) return;

    const trigger = () => setTriggered(true);
    window.addEventListener('pointerdown', trigger, { once: true });
    window.addEventListener('touchstart', trigger, { once: true, passive: true });
    window.addEventListener('keydown', trigger, { once: true });
    window.addEventListener('scroll', trigger, { once: true, passive: true });

    return () => {
      window.removeEventListener('pointerdown', trigger);
      window.removeEventListener('touchstart', trigger);
      window.removeEventListener('keydown', trigger);
      window.removeEventListener('scroll', trigger);
    };
  }, [code]);

  if (!triggered || !code || !code.trim()) return null;
  return <ScriptRunner html={code} id="popunder" />;
}
