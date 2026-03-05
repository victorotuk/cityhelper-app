# Nava — Compliance & Deadline Assistant

**Never miss a deadline.** Track renewals, bills, subscriptions, immigration, taxes, trusts, and more. Use Nava from the app, AI chat, or messaging apps (WhatsApp, iMessage) via OpenClaw.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack & Architecture](#tech-stack--architecture)
- [Project Structure](#project-structure)
- [How Features Were Built](#how-features-were-built)
- [OpenClaw Integration](#openclaw-integration)
- [Development](#development)
- [Deployment](#deployment)
- [Large Files & Refactoring](#large-files--refactoring)
- [Data You Can Delete](#data-you-can-delete)

---

## Overview

Nava is a **local-first** compliance assistant for Canada and the US. Users track deadlines (renewals, bills, parking tickets, immigration, taxes, trusts, etc.), get reminders, and interact via AI chat or messaging apps.

**Vision:** One message to get things done — "Nava, file my taxes" or "What's due this month?" via app, WhatsApp, or iMessage.

---

## Tech Stack & Architecture

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 18, Vite | SPA with HMR |
| **State** | Zustand | Auth, compliance items, chat overlay |
| **Mobile** | Capacitor | Android/iOS native builds |
| **Desktop** | Tauri | Desktop app (optional) |
| **Backend** | Supabase | Auth, Edge Functions, Postgres |
| **Local storage** | IndexedDB | Local-first compliance items |
| **AI** | Groq (BYOK) | Chat, document scan, suggestions |
| **Messaging** | OpenClaw | WhatsApp, iMessage, etc. |

### Data Flow (Path A — Local-First)

```
User action → IndexedDB (instant) → UI update → Background sync to Supabase
Read: IndexedDB first → merge from Supabase if online
```

- **Local:** `compliance_items`, `user_settings` (country, persona). Encrypted before sync.
- **Online:** Auth, OAuth, AI chat, email suggestions, push, reminders.
- **Encryption:** Email users = password (PBKDF2); OAuth = auto-generated key (localStorage).

---

## Project Structure

```
cityhelper/
├── src/
│   ├── pages/           # Route pages (Dashboard, Settings, Auth, etc.)
│   ├── components/     # Reusable UI (AddItemModal, ChatPanel, etc.)
│   ├── stores/         # Zustand (authStore, complianceStore, chatOverlayStore)
│   └── lib/            # Config, supabase, localStorage, ai, calendar, etc.
├── supabase/
│   ├── functions/      # Edge Functions (ai-chat, nava-api, create-api-key, etc.)
│   └── migrations/     # SQL migrations (001–028)
├── android/            # Capacitor Android
├── ios/                # Capacitor iOS
├── openclaw-nava/      # OpenClaw plugin (Nava tools)
├── scripts/            # Setup, diagnostics
└── assets/             # Legacy/static assets
```

---

## How Features Were Built

### 1. Compliance Items (Local-First)

- **Method:** IndexedDB via `src/lib/localStorage.js`; sync to Supabase `compliance_items`.
- **Migrations:** 002 (create), 004 (reminders), 010 (bill pay), 027 (country).
- **Store:** `complianceStore.js` — fetch, add, update, delete, snooze, renew.

### 2. AI Chat

- **Method:** `supabase/functions/ai-chat/index.ts` — Groq API, function calling (add_item, list_items, get_upcoming, etc.).
- **Context:** Page, selectedItem, country passed from frontend.
- **BYOK:** User's Groq key in localStorage; sent only when calling AI.

### 3. Document Scanning

- **Method:** `ai-scan` Edge Function — OpenAI Vision, rate limits by tier, scan cache.
- **Migrations:** 011 (scan_usage, scan_cache, subscriptions).

### 4. Email Suggestions (Gmail/Outlook)

- **Method:** OAuth (`email-oauth`, `gmail-oauth`) + `fetch-email-suggestions` — AI extracts trackable items from inbox.
- **Migrations:** 019–021 (email_connections, oauth_states).

### 5. Parking Tickets (Pay & Dispute)

- **Method:** `config.js` → `parkingPortals` (city lookup, pay URL, dispute email). `PayTicket.jsx`, `DisputeTicket.jsx` use portals.
- **Templates:** `disputeReasons` in config.

### 6. OpenClaw Integration

- **Method:** `nava-api` Edge Function (API key auth) + `create-api-key` (key generation) + `openclaw-nava` plugin.
- **Migrations:** 028 (nava_api_keys).
- **Settings:** OpenClaw & API section — generate key, copy URL.

### 7. Mileage Tracking

- **Method:** GPS trip detection (speed >15 mph), Haversine distance. `mileageTracking.js`, Assets page.
- **Migrations:** 023–025 (assets mileage, trips, no manual).

### 8. Estate & Business

- **Method:** `estate_executors`, `business_entities`, `business_locations` tables. Estate, Business, Assets pages.
- **Migration:** 018.

### 9. Push Notifications

- **Method:** Web Push (VAPID), `send-reminders` cron. Migrations 005, 009.

---

## OpenClaw Integration

Use Nava from WhatsApp, iMessage, Signal, etc.

### 1. Install OpenClaw

```bash
npm install -g openclaw@latest
# If openclaw not found: export PATH="$(npm prefix -g)/bin:$PATH"
```

### 2. Get Nava API Key

1. Nava app → **Settings** → **OpenClaw & API**
2. Copy **API URL**
3. Click **Generate API key** — copy it (shown once)

### 3. Install Nava Plugin

```bash
cd /path/to/cityhelper
openclaw plugins install -l ./openclaw-nava   # link for dev
# or: openclaw plugins install ./openclaw-nava
```

### 4. Configure OpenClaw

Add to `~/.openclaw/config.yaml`:

```yaml
plugins:
  entries:
    nava:
      enabled: true
      config:
        api_url: "https://YOUR-PROJECT.supabase.co/functions/v1/nava-api"
        api_key: "nava_xxxx..."
```

### 5. Enable Tools for Agent

```yaml
agents:
  list:
    - id: main
      tools:
        allow:
          - nava_add_item
          - nava_list_items
          - nava_get_upcoming
          - nava_update_item
          - nava_delete_item
          - nava_mark_done
          - nava_snooze_item
          - nava_filter_items
          - nava_get_completed
          - nava_get_application_guide
```

### 6. Run Gateway

```bash
openclaw gateway
```

**Setup script:** `./scripts/setup-openclaw.sh` automates install + plugin.

---

## Development

```bash
npm install
npm run dev          # Vite dev server (http://localhost:5173)
npm run build        # Production build
npm run lint         # ESLint
```

**Supabase (local):**

```bash
supabase start
supabase db push
supabase functions serve
```

**Environment:** `.env` or `.env.local` with `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

---

## Deployment

- **Web:** Build → deploy `dist/` to Netlify, Vercel, or static host.
- **Docker:** `docker-compose up` (see `Dockerfile`, `docker-compose.yml`).
- **Mobile:** `npx cap sync` → build in Android Studio / Xcode.
- **Edge Functions:** `supabase functions deploy ai-chat nava-api create-api-key`

---

## Large Files & Refactoring

| File | Lines | Recommendation |
|------|-------|----------------|
| `src/lib/config.js` | ~905 | Split: `config/parkingPortals.js`, `config/renewalPortals.js`, `config/templates.js`; `config.js` imports and re-exports. |
| `src/pages/Dashboard.jsx` | ~1523 | Extract: `DashboardHeader`, `DashboardItemList`, `DashboardModals`, `DashboardCountryFilter`. |
| `src/pages/Settings.jsx` | ~906 | Extract: `SettingsSection` components (Country, AI, OpenClaw, Push, etc.). |
| `src/components/WelcomeGuide.jsx` | ~809 | Extract: quiz steps into `WelcomeGuideSteps/`. |

**Config split approach:** Create `src/lib/config/parkingPortals.js`, `renewalPortals.js`, `templates.js`; in `config.js`:

```js
import { parkingPortals } from './config/parkingPortals';
import { renewalPortals } from './config/renewalPortals';
import { templates } from './config/templates';
// ... merge into APP_CONFIG
```

---

## Data You Can Delete

See **DELETABLE_DATA.md** for a full list. Summary:

- `cursor-crash-report-*.txt` — diagnostic reports
- `android/app/build/`, `android/app/src/main/assets/public/` — build artifacts (regenerated by `cap sync`)
- `ios/App/App/public/` — same for iOS
- `node_modules/` — reinstall with `npm install`
- Old Cursor logs in `~/Library/Application Support/Cursor/logs/` (outside repo)

---

## Cursor Crashes?

See **CURSOR_STABILITY.md** for steps to reduce crashes (macOS 26+ known issue).

---

## Links

- **PROJECT_STATUS.md** — Vision, changelog, prompts & outcomes
- **openclaw-nava/README.md** — Plugin setup
- **REBRAND.md** — Customize app name/branding
