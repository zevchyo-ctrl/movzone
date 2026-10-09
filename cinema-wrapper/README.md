# 🎬 Cinema Wrapper Platform

A complete, production-ready full-stack **Cinema & Movie Wrapper Platform** with a
dynamic, passcode-protected **Admin Management System**.

- **Frontend:** Next.js (App Router) · React · Tailwind CSS · Lucide Icons
- **Backend / Data:** Node.js API Routes + persistent JSON store (server-wide config shared by all visitors)
- **Theme:** Immersive Cinema Dark UI — slate/zinc dark palette with neon cyan/amber accents

---

## ✨ Features

### Public Streaming Viewer (`/`)
- 🎨 Modern immersive **Cinema Dark UI** (slate/zinc + neon cyan/amber)
- 📢 **Top header ad space** — responsive 728×90 leaderboard container above the viewer
- 🎥 **Main cinema iframe** — full-height responsive embed of the configured streaming URL
  with `allow="fullscreen; autoplay; encrypted-media; picture-in-picture"`
- ⏳ **Loading skeleton/spinner** while the frame loads
- 🪟 **Pop-under / pop-up execution** — ad scripts from the database are injected and
  executed on the visitor's first interaction (click / tap / key press / scroll)
- 📌 **Bottom sticky ad unit** — floating, dismissible, toggleable footer banner

### Secret Admin Dashboard (`/admin7jo`)
- 🔐 Protected by a secure **master passcode** (default `admin123`)
- ⚙️ **General Settings** section:
  - 🏷️ **Site Name (Title)** — edit the brand name; updates the top header brand and browser tab title
  - ✍️ **Site Description** — textarea for the SEO meta description (search-engine snippets)
- 🔑 **Security — Password Management** — change the admin passcode
  (Current Password / New Password / Confirm New Password) with full validation
  (required fields, min 8 characters, confirmation match, current-password check).
  The password is stored as a **salted scrypt hash** in `data/admin.json` — never plain text.
- 🌐 **Target Site URL** — set/change the external platform shown inside the iframe
- 🧾 **Top Banner Code** — textarea for custom HTML / JS / ad-network tags (Adsterra, PropellerAds, …)
- 🪟 **Pop-Under / Pop-Up Script** — textarea for direct ad-network script tags
- 🔄 **Bottom Sticky Ad** — textarea + toggle switch
- 👁️ **Live Preview Panel** — real-time preview of the wrapper *before* publishing
  (unsaved edits render live via a same-origin draft overlay)
- 💾 **Save & Reset** — publishes globally (every visitor sees updates immediately)
  or restores factory defaults

### Script Injection Safety & Execution
`components/ScriptRunner.tsx` is a dedicated ad-code execution engine:

1. Markup is parsed **off-screen** with `DOMParser` (never touches the live DOM unsafely).
2. Non-script nodes are imported into a mount node owned by React (wiped on cleanup).
3. Every `<script>` — inline **or external `.js`** — is re-created as a real DOM element
   appended to `<body>`, which the browser then executes. External scripts run with
   `async = false` and are awaited **in document order**, so ad-network tags hydrate and
   execute reliably without breaking React's lifecycle.

---

## 📁 Project Structure

```
cinema-wrapper/
├── app/
│   ├── layout.tsx                 # Root layout (dark theme shell)
│   ├── globals.css                # Tailwind + cinema dark theme, scrollbars
│   ├── page.tsx                   # Public streaming viewer (server component)
│   ├── preview/page.tsx           # Live preview route (draft overlay)
│   ├── admin7jo/page.tsx          # Secret admin dashboard route
│   └── api/
│       ├── config/route.ts        # GET (public) · PUT (admin) configuration
│       ├── config/reset/route.ts  # POST (admin) reset to defaults
│       └── auth/
│           ├── login/route.ts     # POST passcode -> session cookie
│           ├── logout/route.ts    # POST clear session
│           ├── me/route.ts        # GET session status
│           └── password/route.ts  # POST (admin) change master passcode
├── components/
│   ├── ScriptRunner.tsx           # Safe HTML + <script> execution engine
│   ├── SiteHeader.tsx             # Public top bar (logo, LIVE badge)
│   ├── HeaderAd.tsx               # 728x90 responsive top ad slot
│   ├── CinemaFrame.tsx            # Iframe + loading skeleton
│   ├── PopunderGate.tsx           # First-interaction pop-under trigger
│   ├── BottomAd.tsx               # Dismissible sticky bottom banner
│   └── AdminDashboard.tsx         # Login + full management UI + live preview
├── lib/
│   ├── config.ts                  # SiteConfig type + factory defaults (incl. siteName / siteTagline)
│   ├── store.ts                   # Persistent JSON store (atomic writes)
│   └── auth.ts                    # Passcode, HMAC session cookie helpers
├── data/                          # Created at runtime (config.json)
├── .env.example                   # ADMIN_PASS / ADMIN_SECRET / DATA_DIR
├── next.config.js · tailwind.config.js · postcss.config.js · tsconfig.json
└── README.md
```

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. (Optional) configure environment
cp .env.example .env.local
#   ADMIN_PASS=your-strong-passcode
#   ADMIN_SECRET=a-long-random-string

# 3a. Development
npm run dev          # http://localhost:3000

# 3b. Production
npm run build
npm start            # http://localhost:3000
```

| URL | Purpose |
| --- | --- |
| `/` | Public cinema streaming viewer |
| `/preview` | Live preview (renders the admin's unsaved draft) |
| `/admin7jo` | Secret admin dashboard (default passcode: `admin123`) |

---

## 🧑‍💼 Admin API Reference

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/api/config` | Public | Returns the platform-wide configuration |
| `PUT` | `/api/config` | Admin | Validate + publish partial config (`siteName`, `siteTagline`, `siteUrl`, `topBannerCode`, `popunderScript`, `bottomAdEnabled`, `bottomAdCode`) |
| `POST` | `/api/config/reset` | Admin | Restore factory defaults globally |
| `POST` | `/api/auth/login` | Public | `{ "passcode": "..." }` → sets signed httpOnly cookie |
| `POST` | `/api/auth/logout` | Public | Clears the session cookie |
| `GET` | `/api/auth/me` | Public | `{ "authenticated": boolean }` |

Example:

```bash
# Login (stores cookie)
curl -c jar.txt -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' -d '{"passcode":"admin123"}'

# Publish new target URL + top banner
curl -b jar.txt -X PUT http://localhost:3000/api/config \
  -H 'Content-Type: application/json' \
  -d '{"siteUrl":"https://your-platform.example","topBannerCode":"<div id="ad-728"></div><script src="https://ad-net.example/728.js"></script>"}'
```

---

## 🔧 Configuration (Environment Variables)

| Variable | Default | Description |
| --- | --- | --- |
| `ADMIN_PASS` | `admin123` | Master passcode for `/admin7jo` |
| `ADMIN_SECRET` | *(dev fallback)* | Secret used to HMAC-sign the session cookie — **set a long random value in production** |
| `DATA_DIR` | `./data` | Directory of the JSON persistence store |
| `PORT` | `3000` | Port for `next start` |

---

## ☁️ Deployment

### Vercel
```bash
npm i -g vercel
vercel --prod
```
Set `ADMIN_PASS` and `ADMIN_SECRET` in **Project → Settings → Environment Variables**.
> ⚠️ Vercel serverless functions have an ephemeral filesystem. For durable config,
> set `DATA_DIR` to a mounted volume, or swap `lib/store.ts` for Vercel KV / Blob /
> Supabase — its public API (`getConfig` / `saveConfig` / `resetConfig`) stays identical.

### Netlify
```bash
npm run build
# Publish the `.next` output via the Next.js runtime (Netlify detects Next.js automatically),
# or: netlify deploy --prod --dir=.next
```
Set the same env vars in **Site → Configuration → Environment variables**. The same
ephemeral-filesystem note applies — use an external store adapter for persistence.

### Any VPS (Ubuntu example)
```bash
# Build
npm ci && npm run build

# Run with PM2 (keeps it alive, restarts on boot)
npm i -g pm2
pm2 start npm --name cinema-wrapper -- start
pm2 save && pm2 startup

# Put nginx in front (TLS + reverse proxy)
# /etc/nginx/sites-available/cinema-wrapper
#   server {
#     listen 443 ssl; server_name cinema.example.com;
#     location / { proxy_pass http://127.0.0.1:3000; proxy_set_header Host $host; }
#   }
```
The JSON store persists in `./data/config.json` across restarts on any VPS.

---

## 🔒 Security Notes

- All mutating endpoints (`PUT /api/config`, `POST /api/config/reset`) verify an
  HMAC-signed, `httpOnly`, `SameSite=Lax` session cookie — the passcode itself is
  compared with a timing-safe comparison.
- Change `ADMIN_PASS` and `ADMIN_SECRET` before going live; never commit `.env.local`.
- The admin route is unlisted (`robots: noindex`) and gated by the login screen; the API
  layer is the real security boundary.
- The admin session lasts 7 days; use **Logout** to end it sooner.

## ⚖️ Responsible Use

This is a configurable wrapper platform. Only embed streaming sources you own or are
licensed to display, and follow your advertising network's placement policies (pop-under
formats are restricted or banned by some networks and regions).

---

## 🛠 Tech Stack

Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · Lucide Icons · Node.js API Routes
