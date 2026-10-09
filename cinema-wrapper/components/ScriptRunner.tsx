'use client';

import { useEffect, useRef } from 'react';

interface ScriptRunnerProps {
  /** Raw HTML/JS pasted in the admin dashboard (may include <script> tags). */
  html: string;
  /** Logical slot name, used for debugging / DOM tagging. */
  id: string;
}

/**
 * ScriptRunner — safe ad-code execution engine.
 *
 * Why this exists: markup assigned through `innerHTML` or React's
 * `dangerouslySetInnerHTML` is parsed but its <script> tags are NEVER
 * executed by the browser. Ad networks (Adsterra, PropellerAds, …) ship
 * tags that only work when the scripts actually run.
 *
 * How it works:
 *  1. The markup is parsed off-screen with DOMParser (never touches the live DOM).
 *  2. Non-script nodes are imported into a mount point inside React's tree,
 *     so React stays in control of that subtree (it is wiped on cleanup).
 *  3. Every <script> is re-created as a real DOM element and appended to
 *     <body>, which the browser then executes. External scripts are inserted
 *     with `async = false` and awaited one-by-one, so they run in the exact
 *     order the admin wrote them — after any inline bootstrap code.
 *
 * React lifecycle is never broken: scripts live outside React's managed
 * nodes, and the effect re-runs cleanly whenever the admin saves new code.
 */
export default function ScriptRunner({ html, id }: ScriptRunnerProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Clean slate (also runs on unmount via the cleanup below).
    mount.innerHTML = '';

    const markup = (html || '').trim();
    if (!markup) return;

    const parsed = new DOMParser().parseFromString(
      `<!DOCTYPE html><html><body>${markup}</body></html>`,
      'text/html'
    );

    const scripts: HTMLScriptElement[] = [];

    for (const node of Array.from(parsed.body.childNodes)) {
      const isScript =
        node.nodeType === Node.ELEMENT_NODE &&
        (node as HTMLElement).tagName === 'SCRIPT';

      if (isScript) {
        const source = node as HTMLScriptElement;
        const script = document.createElement('script');
        for (const attr of Array.from(source.attributes)) {
          script.setAttribute(attr.name, attr.value);
        }
        script.textContent = source.textContent || '';
        scripts.push(script);
      } else {
        mount.appendChild(document.importNode(node, true));
      }
    }

    let cancelled = false;

    const runScripts = async () => {
      for (const script of scripts) {
        if (cancelled) return;
        await new Promise<void>((resolve) => {
          const el = document.createElement('script');
          for (const attr of Array.from(script.attributes)) {
            el.setAttribute(attr.name, attr.value);
          }
          el.textContent = script.textContent || '';
          const hasSrc = Boolean(script.getAttribute('src'));
          if (hasSrc) {
            // Ordered execution: async=false queues dynamic scripts in
            // insertion order, and we additionally await each load.
            el.async = false;
            el.addEventListener('load', () => resolve());
            el.addEventListener('error', () => resolve());
          }
          document.body.appendChild(el);
          if (!hasSrc) resolve(); // Inline scripts execute synchronously.
        });
      }
    };

    void runScripts();

    return () => {
      cancelled = true;
      // Remove the inert markup React rendered. Scripts that already ran
      // cannot be "un-executed" (browser limitation), which is expected for
      // ad tags; the slot is fully rebuilt on the next save.
      mount.innerHTML = '';
    };
  }, [html, id]);

  // `display: contents` keeps the wrapper from affecting ad layout while
  // still giving us a stable mount node owned by React.
  return <div ref={mountRef} data-script-runner={id} className="contents" />;
}
