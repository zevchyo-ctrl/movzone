'use client';

import { FormEvent, ReactNode, useEffect, useState } from 'react';
import {
  AlignLeft,
  Clapperboard,
  Code2,
  ExternalLink,
  Eye,
  Globe,
  KeyRound,
  Layers,
  Loader2,
  Lock,
  LogOut,
  MonitorPlay,
  RotateCcw,
  Save,
  Settings,
  ShieldAlert,
  ToggleLeft,
  ToggleRight,
  Type,
} from 'lucide-react';
import type { SiteConfig } from '@/lib/config';

const DRAFT_KEY = 'cw_admin_draft';

type Status = { type: 'idle' | 'ok' | 'error'; message: string };

const inputClasses =
  'w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-40';
const textareaClasses = `${inputClasses} font-mono text-xs leading-relaxed`;

function Field({
  label,
  hint,
  icon,
  children,
}: {
  label: string;
  hint?: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2">
        {icon}
        <span className="block text-xs font-medium uppercase tracking-widest text-zinc-400">
          {label}
        </span>
      </div>
      {children}
      {hint && <p className="mt-1.5 text-[11px] text-zinc-600">{hint}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const [authChecked, setAuthChecked] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const [draft, setDraft] = useState<SiteConfig | null>(null);
  const [status, setStatus] = useState<Status>({ type: 'idle', message: '' });
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Password management state (stored separately from the site config).
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwStatus, setPwStatus] = useState<Status>({ type: 'idle', message: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [hasCustomPassword, setHasCustomPassword] = useState(false);

  // Verify the session cookie on mount; load the published config if valid.
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        const data = await res.json();
        setAuthed(Boolean(data.authenticated));
        setHasCustomPassword(Boolean(data.hasCustomPassword));
        if (data.authenticated) await loadConfig();
      } catch {
        setAuthed(false);
      } finally {
        setAuthChecked(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadConfig = async () => {
    const res = await fetch('/api/config', { cache: 'no-store' });
    const base: SiteConfig = await res.json();
    let initial = base;
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (raw) initial = { ...base, ...JSON.parse(raw) };
    } catch {
      /* ignore corrupted draft */
    }
    setDraft(initial);
  };

  // Mirror every edit into localStorage (debounced) so the /preview iframe
  // — same origin, shared localStorage — re-renders in real time.
  useEffect(() => {
    if (!draft) return;
    const t = window.setTimeout(() => {
      try {
        window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      } catch {
        /* storage full / unavailable -> preview simply won't update */
      }
    }, 250);
    return () => window.clearTimeout(t);
  }, [draft]);

  const update = <K extends keyof SiteConfig>(key: K, value: SiteConfig[K]) => {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
    setStatus({ type: 'idle', message: '' });
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
      });
      if (res.ok) {
        setAuthed(true);
        setPasscode('');
        await loadConfig();
      } else {
        setLoginError('Invalid master passcode.');
      }
    } catch {
      setLoginError('Network error. Please try again.');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setAuthed(false);
    setDraft(null);
    setStatus({ type: 'idle', message: '' });
  };

  const handleSave = async () => {
    if (!draft) return;
    setSaving(true);
    setStatus({ type: 'idle', message: '' });
    try {
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      if (res.ok) {
        const saved: SiteConfig = await res.json();
        setDraft(saved);
        try {
          window.localStorage.removeItem(DRAFT_KEY);
        } catch {
          /* noop */
        }
        setStatus({
          type: 'ok',
          message: 'Saved & published. Every visitor now sees the updated configuration.',
        });
      } else if (res.status === 401) {
        setStatus({ type: 'error', message: 'Session expired. Please log in again.' });
        setAuthed(false);
      } else {
        const data = await res.json().catch(() => ({}));
        setStatus({ type: 'error', message: data.error || 'Failed to save configuration.' });
      }
    } catch {
      setStatus({ type: 'error', message: 'Network error while saving.' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (
      !window.confirm(
        'Reset ALL settings to factory defaults? This is published globally, immediately.'
      )
    ) {
      return;
    }
    setResetting(true);
    setStatus({ type: 'idle', message: '' });
    try {
      const res = await fetch('/api/config/reset', { method: 'POST' });
      if (res.ok) {
        try {
          window.localStorage.removeItem(DRAFT_KEY);
        } catch {
          /* noop */
        }
        await loadConfig();
        setStatus({ type: 'ok', message: 'Configuration reset to factory defaults.' });
      } else if (res.status === 401) {
        setStatus({ type: 'error', message: 'Session expired. Please log in again.' });
        setAuthed(false);
      } else {
        setStatus({ type: 'error', message: 'Reset failed.' });
      }
    } catch {
      setStatus({ type: 'error', message: 'Network error while resetting.' });
    } finally {
      setResetting(false);
    }
  };

  const handlePasswordChange = async () => {
    setPwStatus({ type: 'idle', message: '' });

    // Client-side validation (mirrors the server-side checks).
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwStatus({ type: 'error', message: 'All password fields are required.' });
      return;
    }
    if (newPassword.length < 8) {
      setPwStatus({ type: 'error', message: 'New password must be at least 8 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwStatus({ type: 'error', message: 'New passwords do not match.' });
      return;
    }

    setPwSaving(true);
    try {
      const res = await fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      if (res.ok) {
        setPwStatus({
          type: 'ok',
          message: 'Password updated successfully. Use the new password next time you log in.',
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setHasCustomPassword(true);
      } else if (res.status === 401) {
        setPwStatus({ type: 'error', message: 'Current password is incorrect.' });
      } else {
        const data = await res.json().catch(() => ({}));
        setPwStatus({ type: 'error', message: data.error || 'Failed to update password.' });
      }
    } catch {
      setPwStatus({ type: 'error', message: 'Network error while updating password.' });
    } finally {
      setPwSaving(false);
    }
  };

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
        <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 shadow-2xl shadow-black/50">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-cyan-500/10 ring-1 ring-cyan-500/30 shadow-glow-cyan">
              <Lock className="h-7 w-7 text-cyan-400" />
            </div>
            <h1 className="text-lg font-bold text-zinc-100">Admin Control Center</h1>
            <p className="mt-1 text-xs text-zinc-500">
              Secret route ·{' '}
              <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-cyan-400">/admin7jo</code>
            </p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="passcode"
                className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-zinc-400"
              >
                Master Passcode
              </label>
              <input
                id="passcode"
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter passcode"
                autoFocus
                className={inputClasses}
              />
            </div>
            {loginError && (
              <p className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                {loginError}
              </p>
            )}
            <button
              type="submit"
              disabled={loggingIn || !passcode}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loggingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              {loggingIn ? 'Verifying…' : 'Unlock Dashboard'}
            </button>
          </form>
          <p className="mt-6 text-center text-[11px] text-zinc-600">
            Default passcode: <code className="text-zinc-400">admin123</code> — change it with the{' '}
            <code className="text-zinc-400">ADMIN_PASS</code> env var.
          </p>
        </div>
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/90 px-4 py-3 backdrop-blur md:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 ring-1 ring-amber-500/30 shadow-glow-amber">
            <Clapperboard className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-zinc-100">Admin Control Center</h1>
            <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">
              Cinema Wrapper · /admin7jo
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 transition hover:border-cyan-500/50 hover:text-cyan-300"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View Site
          </a>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 transition hover:border-red-500/50 hover:text-red-400"
          >
            <LogOut className="h-3.5 w-3.5" />
            Logout
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 md:px-8 lg:grid-cols-2">
        {/* ============ Settings ============ */}
        <section className="space-y-6">
          {/* ---- General Settings ---- */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
            <div className="mb-5 flex items-center gap-2">
              <Settings className="h-5 w-5 text-cyan-400" />
              <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-200">
                General Settings
              </h2>
            </div>

            <div className="space-y-5">
              <Field
                label="Site Name (Title)"
                icon={<Type className="h-4 w-4 text-zinc-500" />}
                hint="Website brand name — updates the top header brand and the browser tab title. The last word gets the neon accent."
              >
                <input
                  type="text"
                  maxLength={100}
                  value={draft.siteName}
                  onChange={(e) => update('siteName', e.target.value)}
                  placeholder="CineStream"
                  className={inputClasses}
                />
              </Field>

              <Field
                label="Site Description"
                icon={<AlignLeft className="h-4 w-4 text-zinc-500" />}
                hint="SEO meta description — shown under the logo in the header and in search-engine result snippets."
              >
                <textarea
                  rows={3}
                  maxLength={300}
                  value={draft.siteTagline}
                  onChange={(e) => update('siteTagline', e.target.value)}
                  placeholder="Cinema Wrapper Platform — stream movies & series in HD"
                  className={textareaClasses}
                />
              </Field>
            </div>
          </div>

          {/* ---- Streaming Configuration ---- */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
            <div className="mb-5 flex items-center gap-2">
              <MonitorPlay className="h-5 w-5 text-cyan-400" />
              <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-200">
                Streaming Configuration
              </h2>
            </div>

            <div className="space-y-5">
              <Field
                label="Target Site URL"
                icon={<Globe className="h-4 w-4 text-zinc-500" />}
                hint="External movies / streaming platform embedded inside the cinema iframe."
              >
                <input
                  type="url"
                  value={draft.siteUrl}
                  onChange={(e) => update('siteUrl', e.target.value)}
                  placeholder="https://meowtv.ru"
                  className={inputClasses}
                />
              </Field>

              <Field
                label="Top Banner Code"
                icon={<Layers className="h-4 w-4 text-zinc-500" />}
                hint="Custom HTML, JavaScript and ad-network tags. Rendered in the responsive 728×90 header slot."
              >
                <textarea
                  rows={5}
                  value={draft.topBannerCode}
                  onChange={(e) => update('topBannerCode', e.target.value)}
                  placeholder={'<div id="adsterra-728x90"></div>\n<script src="https://example-ad-network.com/728x90.js"></script>'}
                  className={textareaClasses}
                  spellCheck={false}
                />
              </Field>

              <Field
                label="Pop-Under / Pop-Up Script"
                icon={<Code2 className="h-4 w-4 text-zinc-500" />}
                hint="Injected and executed on the visitor's first interaction (click, tap, key press or scroll)."
              >
                <textarea
                  rows={5}
                  value={draft.popunderScript}
                  onChange={(e) => update('popunderScript', e.target.value)}
                  placeholder={'<script>\n  // Adsterra / PropellerAds pop-under tag\n  // pasted exactly as provided by the ad network\n</script>'}
                  className={textareaClasses}
                  spellCheck={false}
                />
              </Field>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-zinc-500" />
                    <div>
                      <span className="block text-xs font-medium uppercase tracking-widest text-zinc-400">
                        Bottom Sticky Ad
                      </span>
                      <p className="mt-0.5 text-[11px] text-zinc-600">
                        Floating, dismissible footer banner.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={draft.bottomAdEnabled}
                    aria-label="Toggle bottom sticky ad"
                    onClick={() => update('bottomAdEnabled', !draft.bottomAdEnabled)}
                    className={`flex h-8 w-14 items-center rounded-full border px-1 transition ${
                      draft.bottomAdEnabled
                        ? 'border-cyan-500/50 bg-cyan-500/10'
                        : 'border-zinc-700 bg-zinc-900'
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full bg-zinc-950 transition ${
                        draft.bottomAdEnabled ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    >
                      {draft.bottomAdEnabled ? (
                        <ToggleRight className="h-4 w-4 text-cyan-400" />
                      ) : (
                        <ToggleLeft className="h-4 w-4 text-zinc-500" />
                      )}
                    </span>
                  </button>
                </div>
                <textarea
                  rows={4}
                  disabled={!draft.bottomAdEnabled}
                  value={draft.bottomAdCode}
                  onChange={(e) => update('bottomAdCode', e.target.value)}
                  placeholder="Dismissible footer banner code…"
                  className={textareaClasses}
                  spellCheck={false}
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 border-t border-zinc-800 pt-5 sm:flex-row">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? 'Saving…' : 'Save & Publish'}
              </button>
              <button
                onClick={handleReset}
                disabled={resetting}
                className="flex items-center justify-center gap-2 rounded-lg border border-amber-500/40 px-4 py-2.5 text-sm font-semibold text-amber-400 transition hover:bg-amber-500/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {resetting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4" />
                )}
                Reset to Defaults
              </button>
            </div>

            {status.message && (
              <p
                className={`mt-3 text-xs ${
                  status.type === 'ok'
                    ? 'text-emerald-400'
                    : status.type === 'error'
                      ? 'text-red-400'
                      : 'text-zinc-500'
                }`}
              >
                {status.message}
              </p>
            )}
            <p className="mt-4 text-[11px] text-zinc-600">
              Last published update:{' '}
              {draft.updatedAt && draft.updatedAt !== new Date(0).toISOString()
                ? new Date(draft.updatedAt).toLocaleString()
                : 'never (factory defaults)'}
            </p>
          </div>

          {/* ---- Security / Password Management ---- */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
            <div className="mb-5 flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-amber-400" />
              <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-200">
                Security — Password Management
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-zinc-400">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current passcode"
                  autoComplete="current-password"
                  className={inputClasses}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-zinc-400">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  className={inputClasses}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-zinc-400">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat the new password"
                  autoComplete="new-password"
                  className={inputClasses}
                />
              </div>

              <button
                onClick={handlePasswordChange}
                disabled={pwSaving}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-cyan-500/40 px-4 py-2.5 text-sm font-semibold text-cyan-400 transition hover:bg-cyan-500/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pwSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <KeyRound className="h-4 w-4" />
                )}
                {pwSaving ? 'Updating…' : 'Update Password'}
              </button>

              {pwStatus.message && (
                <p
                  className={`text-xs ${
                    pwStatus.type === 'ok'
                      ? 'text-emerald-400'
                      : pwStatus.type === 'error'
                        ? 'text-red-400'
                        : 'text-zinc-500'
                  }`}
                >
                  {pwStatus.message}
                </p>
              )}
              <p className="text-[11px] leading-relaxed text-zinc-600">
                The password is stored as a salted <strong>scrypt hash</strong> in{' '}
                <code className="text-zinc-400">data/admin.json</code> — never in plain text, and
                never exposed through the public config API. It is kept separate from site
                settings, so <strong>Reset to Defaults</strong> does not change it. Your current
                session stays logged in after updating.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs leading-relaxed text-amber-200/80">
            <strong className="text-amber-300">Responsible use:</strong> only embed streaming
            sources you own or are licensed to display, and follow your ad network&apos;s placement
            policies. This platform is a configurable wrapper — what you point it at is your
            responsibility.
          </div>
        </section>

        {/* ============ Live preview ============ */}
        <section>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-amber-400" />
                <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-200">
                  Live Preview
                </h2>
              </div>
              <span className="rounded-full bg-cyan-500/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-widest text-cyan-400">
                Draft mode
              </span>
            </div>
            <p className="mb-4 text-xs text-zinc-500">
              Reflects your unsaved edits in real time. Hitting <strong>Save &amp; Publish</strong>{' '}
              makes them visible to every visitor.
            </p>
            <div className="overflow-hidden rounded-xl border border-zinc-700 bg-black ring-1 ring-zinc-800">
              <iframe src="/preview" title="Live preview" className="h-[560px] w-full border-0" />
            </div>
            <a
              href="/preview"
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open preview in a new tab
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
