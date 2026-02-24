## Nava — Project Status
Updated: 2026-02-21

### Overall
- Status: In progress
- Single workspace: `nava` on Desktop (merged nava-app)
- Stack: React + Vite, Capacitor (Android/iOS), Supabase, Tauri (desktop)

### Recent
- **Email suggestions**: Connect Gmail or Outlook to scan inbox for trackable items (subscriptions, tickets, renewals, bills). Multi-provider OAuth (email-oauth), AI extraction (fetch-email-suggestions). Migrations 019–021. Configured: Google OAuth, Microsoft Entra.
- **Merged**: nava-app merged into nava. Single project now contains full React app, Android, iOS, Supabase, stripe-webhook, app.html (Predictably Human).
- **Bill Pay**: pay_url and pay_phone on compliance_items (migration 010). Housing, Office, Property items support "Pay online" URL and "Call to pay" phone.
- **Android**: Built successfully via Codemagic. App installed on Android device, ready for iteration.
- AI chat (Groq), document scanning (OpenAI), ScanUpload, ChatBubble, codemagic.yaml.

### Mobile
- **Android**: ✅ Built and installed. Codemagic `android-build` workflow. APK on device.
- **iOS**: On hold until Xcode available for manual provisioning profile.
  - GitHub + Apple Developer connected. Bundle ID `com.nava.app` registered.

### Pending Tasks
- Android: Set up app signing keys for Play Store when ready.
- iOS: When Xcode available, create provisioning profile and test build.

### Links
- GitHub: `https://github.com/victorotuk/nava-app`
- Codemagic: `https://codemagic.io/app/695ded806dc729a6cfbc5215/build/695dededcec99af532b9b1ca`

### Changelog
- 2026-02-21
  - **Rebrand to Nava**: name, formalName (Nava.ai for domains/copyright), UI palette (serene horizon — warm gold #d4a574, soft blues).
  - **AI agent**: ai-chat function calling — add/list/update items via natural language.
  - **Email suggestions**: Gmail + Outlook support. Settings → Email suggestions: Connect Gmail/Outlook, scan inbox, add or dismiss AI-extracted items. Edge functions: email-oauth (unified OAuth), fetch-email-suggestions (multi-provider). Migrations: 019 (email_connections, email_suggestion_dismissed), 020 (oauth_states), 021 (oauth_states.provider). Supabase secrets: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, APP_URL.
- 2026-02-01
  - Merged nava-app into nava. Single workspace.
  - PROJECT_STATUS updated: Android built and on device.
  - Bill Pay (migration 010, AddItemModal, ItemCard).
  - Lint fixes: all ESLint errors resolved (`npm run lint` passes). PayTicket/ScanUpload/config/Apply/store fixes; argsIgnorePattern for underscore params; Apply loadSavedApplication wrapped in queueMicrotask.
  - **Scan rate limiting**: ai-scan Edge Function now has per-user rate limits tied to pricing tiers (Free: 10/mo, Personal: 50/mo, Business: 200/mo). Migration 011 adds `scan_usage`, `scan_cache`, and `subscriptions` tables.
  - **Scan caching**: Duplicate scans (same image+prompt SHA-256 hash) return cached results — no OpenAI call, no usage counted.
  - **ScanUpload UI**: Shows "X/Y scans used this month" with warning when near limit, disables buttons when at limit.
- 2026-01-07 — Android workflow ready, iOS on hold.
- 2026-01-05 — AI chat (Groq), AI scan (OpenAI).
- 2026-01-04 — ScanUpload, ChatBubble.

### Notes
- Keep API keys in Supabase secrets.
- Config: `src/lib/config.js`
- `app.html` = Predictably Human (separate flow)
