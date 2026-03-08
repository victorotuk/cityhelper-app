## Nava — Project Status
Updated: 2026-03-08

**→ For AI: Read this file first when user returns.** Full context: Vision, Recent (features), Changelog (what was built), What's Left, All Prompts & Outcomes. Project: cityhelper → Nava. React + Vite, Supabase, Capacitor.

### Vision (North Star)
Nava is **not just compliance/deadline tracking**. The goal: users interact via **any channel they prefer** (app, WhatsApp, iMessage, etc.) to get things done with one message.

**Examples:**
- "Nava please file my taxes for the year" → user sends via WhatsApp, Nava does it
- Nava suggests proactively (e.g. "You might want to file taxes") → user replies "go ahead" via app or WhatsApp
- Nava suggests trust fund + life insurance structure → user says "go ahead" via app or WhatsApp

**Current reality:** We don't have many APIs; there are restrictions on doing certain things for people (filing, disputing). **Build the best version now** that works without those APIs — get as close as possible. When APIs/channels become available, Nava is ready.

**Best version now (without APIs):**
- AI chat that feels like messaging — natural, proactive, one-message intent ("file my taxes" → collect info, explain what would happen when APIs exist, prepare checklist)
- Proactive suggestions (AISuggestionsCard) — Nava suggests trust renewal, tax prep, dispute steps; user approves with "go ahead" or one tap
- Preparation flows — gather documents, answer questions, generate summaries/letters; user does the final submit when required
- Multi-channel-ready UX — conversational, approval-based; when WhatsApp/iMessage APIs land, same flows work

### Deployment Model (3 Options, OpenClaw-Inspired)
Three ways to run Nava; privacy-first, user chooses control level.

| Option | Hosting | Updates | Support | Monetization |
|--------|---------|---------|---------|--------------|
| **1. Nava Cloud** | We host | We push (included) | Included | Free tier (BYOK) + paid (hosting, API mgmt) |
| **2. Self-Hosted DIY** | User runs (VPS, Mac, Docker) | User pulls (we provide image/script) | Community / docs | Free |
| **3. Managed Self-Hosted** | We run on user's infra | We push (we do it) | Paid support | Paid — we get paid for the work |

**Managed Self-Hosted — what we do for them:**
- User provides: their VPS, or we provision one in their AWS/GCP/Azure account
- We: install Nava (Docker/Compose), configure Supabase (theirs or ours), handle updates, backups, monitoring, SSL
- They get: Nava running on their infra, full data control, we handle the ops
- They pay: for our management time (monthly retainer or per-incident)

**Platforms:** Web, Mobile (Capacitor), Desktop (Tauri). All three.

**LLM choice:** Users can run any LLM — local (Ollama, etc.) or web (OpenAI, Anthropic, Groq). BYOK or we manage keys (paid).

**Local vs Online split (Path A — Supabase + client-side E2E):**
- **LOCAL (IndexedDB on web/mobile/desktop):** compliance_items, user_settings (country, persona). Read/write local first. Encrypted before sync. Autobackup. Web uses IndexedDB too — not just mobile.
- **ONLINE (Supabase + Edge Functions):** Auth, OAuth (email, calendar), email suggestions, AI chat. Server-based; required for those features.
- **Isolation:** Local data cannot be tampered by online. We PULL from server when we choose (merge/sync). Server never pushes into local. Online reads local only when user opts in (e.g. AI context).
- **Flow:** Local-first. Write to IndexedDB → update UI → sync encrypted to Supabase in background. Fetch: read IndexedDB first (instant) → merge from Supabase if online.

**Database / Privacy:** Supabase + client-side E2E (Path A). Sensitive fields encrypted before storage. Key: email users = password (PBKDF2); OAuth users = auto-generated key (localStorage).

**Revenue:** Free core. Paid: hosting, API key management, managed self-hosted, paid support. More work = we get paid.

### Overall
- Status: In progress
- Single workspace: `nava` on Desktop (merged nava-app)
- Stack: React + Vite, Capacitor (Android/iOS), Supabase, Tauri (desktop)

### Recent
- **Landing downloads**: Footer has "Download for Mac" (direct), "All downloads" (GitHub releases), and App Store / Play Store links when `appStoreUrl` / `playStoreUrl` are set in `config.js`.
- **Desktop app (Tauri)**: Native desktop apps for macOS, Windows, Linux. Signed in-app updates (auto-check on startup + Settings). Release script: `npm run release -- <version>`. New Nava logo (3 waves, large sphere) — dark/light, theme-aware. Desktop-specific CSS (solid headers, no scroll overlap). Auth-first screen on desktop (no landing promo). Window 1280×840, fully resizable.
- **OpenClaw integration**: Nava as OpenClaw plugin (`openclaw-nava`). Settings → OpenClaw & API (API URL, generate key). Edge functions: `nava-api` (HTTP API), `create-api-key`. Migration 028 (`nava_api_keys`). Setup script `scripts/setup-openclaw.sh`, README docs. Use Nava from WhatsApp, iMessage, etc. via OpenClaw.
- **Local-first + E2E (Path A)**: compliance_items in IndexedDB, read/write local first, sync encrypted to Supabase. OAuth users get auto-generated encryption key (no passphrase). Email users use password.
- **Mileage tracking (vehicles)**: GPS + Maps trip detection (mobile only, disabled on web). Options: OBD-II (GPS fallback) | GPS+Maps. Migrations 023–025.
- **Trip detection (planned)**: Speed threshold >15 mph = driving vs walk/jog. Snap to Roads (Google) for road vs sidewalk. Note: We cannot read Google/Apple Maps "driving mode" — apps are sandboxed.
- **Email suggestions**: Connect Gmail or Outlook to scan inbox for trackable items (subscriptions, tickets, renewals, bills). Multi-provider OAuth (email-oauth), AI extraction (fetch-email-suggestions). Migrations 019–021. Configured: Google OAuth, Microsoft Entra.
- **Merged**: nava-app merged into nava. Single project now contains full React app, Android, iOS, Supabase, stripe-webhook.
- **Bill Pay**: pay_url and pay_phone on compliance_items (migration 010). Housing, Office, Property items support "Pay online" URL and "Call to pay" phone.
- **Android**: Built successfully via Codemagic. App installed on Android device, ready for iteration.
- AI chat (Groq), document scanning (OpenAI), ScanUpload, ChatBubble, codemagic.yaml.
- **AI chat overlay**: Slide-out panel from ChatBubble (no blur, dashboard stays interactive). Full /assistant page for deep chats. Chat persists (sessionStorage), delete individual messages, clear chat.
- **AI chat tools**: Context awareness (page, selectedItem, country), export_to_calendar (.ics), proactive suggestions (AISuggestionsCard on dashboard).
- **Per-item country**: Migration 027. Items can belong to Canada or US. Dashboard filters by active country. Add/BulkEdit: country picker when 2+ countries. ai-chat add_item supports country.

### Mobile
- **Android**: ✅ Built and installed. Codemagic `android-build` workflow. APK on device.
- **iOS**: On hold until Xcode available for manual provisioning profile.
  - GitHub + Apple Developer connected. Bundle ID `com.nava.app` registered.

### Pending Tasks
- Android: Set up app signing keys for Play Store when ready.
- iOS: When Xcode available, create provisioning profile and test build.

### Desktop (Tauri) — all desktops, not just Mac
**Tauri** builds one codebase into native desktop apps for **Windows, macOS, and Linux**. Anyone with any of those computers can use the Nava desktop app; it's not Mac-only. Run `tauri build` (per platform or in CI) to get: macOS `.app`/`.dmg`, Windows `.exe`/installer, Linux binary/`.AppImage`/`.deb`.

### Before desktop build (Tauri) — completed
| Step | Status |
|------|--------|
| 1. **App icons** | Done — `npx tauri icon public/nava-logo-dark.png` (new logo: 3 waves, large sphere). Dark/light logos in `public/`. |
| 2. **Web build** | OK — `npm run build` passes; desktop uses `dist/`. |
| 3. **Bundle identifier** | `npm run tauri:dev` — opens desktop window; app runs as “web” (Capacitor.getPlatform() === 'web'), so no mobile-only features. |

**Already in place:** Tauri 2 config (`src-tauri/`), `npm run tauri:dev` / `npm run tauri:build`, app name “Nava”, default window 1280×840 (desktop-app feel). Window is fully resizable (min 320×400); layout adjusts with flex/fluid CSS. Desktop uses same code as web; IndexedDB, auth, and API work unchanged.

**In-place updates (fully wired):** Signing key at `~/.tauri/nava.key`, public key in `tauri.conf.json`. GitHub Secrets: `TAURI_SIGNING_PRIVATE_KEY`, `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` — CI builds signed artifacts. App auto-checks on startup; manual check in **Settings → Check for updates**. Release: `npm run release -- <version>`. See **docs/TAURI_UPDATES.md**.

**Domain & email:** `vicomnava.com` verified with Resend (DKIM, SPF, DMARC). Supabase secrets: `FROM_EMAIL` = `noreply@vicomnava.com`, `APP_URL` = `https://vicomnava.com`. Digest, onboarding, reminders send from verified domain.

### What's Left to Do
| Priority | Item | Status |
|----------|------|--------|
| **Low** | user_settings local storage (optional) | Not wired |

**Done:** OpenClaw integration — `openclaw-nava` plugin, nava-api + create-api-key Edge Functions, migration 028 (API keys), Settings → OpenClaw & API, setup script, README.

**Completed (2026-02-01):** Lint fixes, UnlockScreen, Ask AI on items, autobackup, Docker, Supabase configurable, **LLM BYOK** (Settings → AI — Bring Your Own Key), **OAuth recovery passphrase** (Settings → Recovery passphrase for OAuth users).

**Build:** ✅ OK. **Lint:** 0 errors, 3 warnings.

### Codebase refactor (large-file split)
- **Dashboard.jsx** (was ~1523 lines): Split into `ItemCard`, `AddItemModal`, `ComplianceHealth`, `FocusOnThree`, `EmptyState`, `SuggestedForYou` in `components/` and `components/dashboard/`. Added `lib/renewalPortals.js`, `lib/addItemExtractPrompts.js`, `components/dashboard/constants.js`. Dashboard.jsx now ~646 lines.
- **Settings.jsx** (was ~906 lines): Extracted section components under `components/settings/`: `SettingsCountrySection`, `SettingsDataBackupSection`, `SettingsAISection`, `SettingsOpenClawSection`, `SettingsRecoverySection`, `SettingsPersonalizationSection`, `SettingsWealthSection`, `SettingsDangerSection`. Settings.jsx reduced accordingly.
- **WelcomeGuide.jsx** (was ~809 lines): Extracted `QuizTextInput` and `QuizTextareaMic` to `WelcomeGuideQuizInput.jsx`. WelcomeGuide.jsx reduced by ~130 lines.

### Cursor Crashes (macOS 26+)
See **CURSOR_STABILITY.md** for crash-reduction steps. `.cursorignore` updated to reduce indexing.

### Links
- GitHub: `https://github.com/victorotuk/cityhelper-app`
- Codemagic: `https://codemagic.io/app/695ded806dc729a6cfbc5215/build/695dededcec99af532b9b1ca`

### Security
- **npm audit** (2026-02-01): Fixed 4 vulnerabilities (ajv ReDoS, minimatch ReDoS, rollup path traversal, tar symlink escape). `npm audit fix` → 0 vulnerabilities.
- If Supabase or other security advisories arrive, address promptly. Privacy is key.

### Changelog
- 2026-03-08 (get-started page + download flow)
  - **New /get-started page:** Landing CTAs ("Start Free", "Get started") now go to /get-started instead of /auth. Page shows 3 options: Use on web (primary, links to /auth), Desktop app (Mac/Windows/Linux download buttons), Mobile app (App Store/Play Store). Desktop/mobile app skips this page entirely.
  - **Footer cleaned up:** Removed download links from footer. Footer now just has tagline + copyright + Privacy/Terms.
  - **Platform logic:** /get-started redirects to /auth on desktop/mobile app (no download links shown in-app).
- 2026-03-08 (mobile UX + desktop fix)
  - **CRITICAL FIX:** Added `withGlobalTauri: true` to tauri.conf.json — root cause of desktop redirect never working. Without it, Tauri never injects `window.__TAURI__`.
  - **Mobile bottom tab bar:** Dashboard shows Home / Add / Docs / Settings at ≤640px (replaces hamburger-only nav).
  - **Landing nav hamburger:** Mobile gets hamburger; desktop keeps full links. From DESKTOP_MOBILE_UX.md.
  - **Full-screen modals on mobile:** Modals fill the screen at ≤640px instead of centered overlay.
  - **Chat overlay full-screen on mobile:** 100% width/height at ≤640px instead of 420px slide-over.
  - **44px touch targets:** btn-icon, snooze menu, mobile menu items meet minimum 44px on mobile.
- 2026-03-08 (desktop redirect + overlap, round 2)
  - **Desktop redirect:** Polling in index.html for __TAURI__ (up to 2s); sets tauri-desktop class + dispatches 'tauri-ready'. App listens and redirects to /auth. Handles async Tauri injection.
  - **Overlap fix:** landing-nav, dashboard-header, page-header use solid var(--bg-deep) (no transparency). isolation + box-shadow for crisp edges. Content no longer shows through when scrolling.
- 2026-03-08 (desktop redirect + overlap)
  - **Desktop redirect:** Robust detection (__TAURI__ + tauri-desktop class); useEffect redirect to /auth when on desktop at /. Desktop no longer shows landing.
  - **Landing overlap:** Fixed nav, landing-main padding; tauri title bar clearance; solid headers.
  - **LogoImg:** variant prop for landing nav (light on dark).
  - **docs/ROADMAP.md** added.
- 2026-03-08
  - **ESLint:** Ignore `src-tauri/target/**`; scripts use Node globals. Lint: 0 errors, 3 warnings.
  - **Docs:** TESTING.md — "How to check desktop changes" section; desktop overlap verification steps.
- 2026-03-07 (overlap fix)
  - **Sticky header overlap fixed:** Desktop (Tauri): `padding-top: 100px` on dashboard-main, settings-main, tax-main, apply-main, assistant-main, documents-main so content doesn’t scroll under the sticky header. Web landing: hero and features-section `padding-top: 100px`, `scroll-padding-top` / `scroll-margin-top: 100px` for anchor links.
- 2026-03-07
  - **Domain & email:** vicomnava.com verified with Resend (Namecheap DNS: DKIM, SPF, DMARC). Supabase secrets FROM_EMAIL and APP_URL set. Digest, onboarding, reminders send from noreply@vicomnava.com.
  - **GitHub Secrets:** TAURI_SIGNING_PRIVATE_KEY and TAURI_SIGNING_PRIVATE_KEY_PASSWORD added to repo — CI produces signed desktop builds.
  - **Full audit fixes:** 27 issues across 33 files. Critical: stripe-webhook verify_jwt=false, fetch-email-suggestions outlookAfter bug. Security: auth on chat/send-sms/verify-phone, admin.listUsers→RPC in ai-chat/nava-api/share-item. Cleanup: app.html + assets/ removed. Branding: com.nava.app, Cargo.toml metadata, release.sh Cargo bump + platforms.
  - **In-app updates fully wired:** Signing key, public key in tauri.conf.json. Builds produce signed .tar.gz + .sig. Auto-check on startup; manual check in Settings. Release script: npm run release -- 0.2.0. Full workflow in docs/TAURI_UPDATES.md.
- 2026-03-06
  - **New Nava logo (3 waves, large sphere):** Dark (`nava-logo-dark.png`) and light (`nava-logo-light.png`) versions in `public/`. Theme-aware `LogoImg` component; Dashboard, PageHeader, LandingNav, Auth use it. Favicon and Tauri app icons regenerated from dark logo. Config: `logoImageDark`, `logoImageLight`.
  - **Tauri in-place updates:** Updater plugin + process plugin; Settings → “Check for updates” (desktop only). `createUpdaterArtifacts: true`, endpoints for GitHub Releases; `docs/TAURI_UPDATES.md` for key generation and release workflow.
  - **Desktop-only layout fix:** `tauri-desktop` class on `<html>` when `window.__TAURI__`; CSS so landing/dashboard headers are solid and content doesn’t overlap the window bar; scroll behavior improved in Tauri window only (web unchanged).
  - **Lint:** ChatBubble catch, WealthLearn unused handler, Dashboard `requireCountryForTracking` order + useCallback + deferred setState; 0 errors, 3 warnings. npm audit fix.
- 2026-03-05
  - **Generic Item Setup Wizard:** One step-by-step flow for all compliance categories at `/setup` and `/setup/:category`. Step 0: pick category. Step 1: name (+ trust type for trust, or template quick-picks). Step 2: details (trustee/beneficiaries for trust, notes for others). Step 3: due date + optional document. Step 4: review & add. No AI chat. Dashboard: "Set up (step-by-step)" quick action; EmptyState: "Set up an item step-by-step" link. Wealth Learn: "Set up a trust" → `/setup/trust`; other topics: "Set up an item" → `/setup`. `/trust-setup` redirects to `/setup/trust`. Replaces previous trust-only flow: step-by-step form (trust type + name → trustee & beneficiaries → review date + optional document link → add to dashboard). No AI chat; users fill fields, optionally link a doc from Document Vault, and click through. Wealth Learn: removed “Ask the AI” / “Get step-by-step guidance” for trust setup; primary CTA is “Set up a trust” (→ `/trust-setup`) and “I already have one — track it” (→ dashboard Add Item). Workflow copy updated to describe the form flow.
  - **Advanced options toggle:** Settings now show an “Advanced options” section (on by default: off). When off, AI (BYOK) and OpenClaw sections are hidden so non-technical users never see API/key wording. Toggle stored in `localStorage` per user (`nava_show_advanced_<user_id>`). Users who want their own AI key or WhatsApp/iMessage setup can turn “Show advanced” on to see those sections.
  - **Testing & OpenClaw UX:** Added `docs/TESTING.md` with manual QA checklist, build/lint and performance notes, and recommendation for Playwright E2E. Settings → OpenClaw: friendlier copy for non-technical users (“Use Nava in WhatsApp & iMessage”), “What’s OpenClaw?” explainer, “Generate my Nava key”, and “Copy full setup for OpenClaw” (YAML block).
  - **Folder reorganization:** Components grouped into subfolders by concern. `components/ui/`: ErrorBoundary, ChatBubble, ChatOverlay. `components/chat/`: ChatPanel. `components/modals/`: UnlockScreen, ShareItemModal, BulkEditModal, CalendarImportModal, AuditModal, SuggestionBox, PayTicket. `components/common/`: AddressAutocomplete, AISuggestionsCard, NotificationBell, WelcomeGuideQuizInput. Feature folders: `dashboard/` (ItemCard, ComplianceHealth, FocusOnThree, EmptyState, SuggestedForYou, constants), `addItem/` (AddItemModal, AddItemCategoryPicker, AddItemFormFields), `dispute/` (DisputeTicket, DisputeStep1–4), `documents/` (DocumentCard, DocumentViewModal, ScanResultCard), `welcomeGuide/` (WelcomeGuide, quizConfig, WelcomeStep*), `auth/`, `settings/`, `emailSuggestions/` (EmailSuggestions, emailSuggestionsConfig), `scanUpload/` (ScanUpload, ScanUsageBar). Pages: `landing/` now has `index.jsx` (Landing); App imports from `./pages/landing`. All imports updated; build passes.
  - **Component breakdown (round 3):** WelcomeGuide: `welcomeGuide/quizConfig.js`, step components (WelcomeStepWelcome, AccountType, Roles, FocusAreas, LifeMoments, OtherNeeds, OrgInfo, OrgFocusAreas). TaxEstimator: `taxEstimator/taxConfig.js`, TaxEstimatorForm, TaxEstimatorSummary. Assets: `assets/assetsConfig.js`, AssetForm, AssetList, TripList, TripAssignModal, MileagePreferenceCard. Auth: AuthSocialButtons, AuthForm, AuthModeSwitch. Landing: LandingNav, LandingHero, LandingFeatures, LandingCta, LandingFooter. AddItemModal: AddItemCategoryPicker, AddItemFormFields. EmailSuggestions: `emailSuggestions/emailSuggestionsConfig.js`. ScanUpload: ScanUsageBar. Build passes.
  - **Large-file refactor (round 2):** Apply.jsx: extracted `src/pages/apply/applyConfig.js`, `ApplyTypeSelect.jsx`, `ApplyFormStep.jsx`, `ApplyReviewStep.jsx`, `ApplyGuideStep.jsx`. Documents.jsx: extracted `src/lib/documentUtils.js`, `src/components/documents/DocumentCard.jsx`, `DocumentViewModal.jsx`, `ScanResultCard.jsx`. DisputeTicket.jsx: extracted `src/components/dispute/DisputeStep1Ticket.jsx`, `DisputeStep2Reason.jsx`, `DisputeStep3Contact.jsx`, `DisputeStep4Review.jsx`. Settings.jsx: extracted `SettingsPushSection`, `SettingsDigestSection`, `SettingsPhoneSection`, `SettingsNotificationSuggestionsSection`, `SettingsInAppSection`, `SettingsSmartSuggestionsSection`, `SettingsSuggestFeatureSection`, `SettingsPrivacySection`. All use components and imports; build and lint pass (0 errors, 3 existing warnings).
  - **Large-file refactor (round 1):** Split Dashboard.jsx (~1523→646 lines), Settings.jsx (~906→~618 lines), WelcomeGuide.jsx (~809→~678 lines). New: `src/lib/renewalPortals.js`, `src/lib/addItemExtractPrompts.js`, `src/components/dashboard/constants.js`, `src/components/ItemCard.jsx`, `src/components/AddItemModal.jsx`, `src/components/dashboard/ComplianceHealth.jsx`, `FocusOnThree.jsx`, `EmptyState.jsx`, `SuggestedForYou.jsx`, `src/components/settings/*Section.jsx` (8 sections), `src/components/WelcomeGuideQuizInput.jsx`. All imports/references updated; build and lint pass.
- 2026-02-26
  - **Per-item country**: Migration 027 adds `country` to compliance_items. Dashboard filters by active country. AddItemModal + BulkEditModal: country picker when user has 2+ countries. ai-chat add_item: optional country param, uses context.country from dashboard.
  - **AI chat overlay**: ChatBubble opens slide-out panel (no blur, non-blocking backdrop). ChatPanel shared between overlay and /assistant. chatStore: persistence (sessionStorage), removeMessage, clearMessages. Delete button per message, Clear in status bar.
  - **AI chat enhancements**: Context (page, selectedItem, country) passed to ai-chat. export_to_calendar tool (.ics download). AISuggestionsCard on dashboard (refresh for suggestions, Ask AI). Dashboard sets context.country for AI-add.
  - **Logo**: Click Nava logo on dashboard scrolls to top (when already on /dashboard).
- 2026-02-21
  - **Rebrand to Nava**: name, formalName (Nava.ai for domains/copyright), UI palette (serene horizon — warm gold #d4a574, soft blues).
  - **AI agent**: ai-chat function calling — add/list/update items via natural language.
  - **Email suggestions**: Gmail + Outlook support. Settings → Email suggestions: Connect Gmail/Outlook, scan inbox, add or dismiss AI-extracted items. Edge functions: email-oauth (unified OAuth), fetch-email-suggestions (multi-provider). Migrations: 019 (email_connections, email_suggestion_dismissed), 020 (oauth_states), 021 (oauth_states.provider). Supabase secrets: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, APP_URL.
- 2026-02-10
  - **Mileage: GPS + OBD only (no manual)**: Removed manual option. Options: OBD-II (GPS fallback) | GPS+Maps. Implemented GPS trip detection: @capacitor/geolocation, speed >15 mph, Haversine distance. Trip detected → assign to vehicle modal. Migration 025. Android location permissions.
  - **Mileage tracking**: Migration 023 adds `current_mileage`, `last_mileage_update` to assets table. Assets.jsx: vehicle category with manual odometer entry. Planned: OBD-II auto-read when available; GPS + Maps API fallback; trip detection (speed threshold, Snap to Roads).
- 2026-02-05
  - **"Do everything" session**: Lint fixes (onAskAI wired, setState in effect → derived state). UnlockScreen for password users. Ask AI button on item cards (opens chat with selectedItem). Autobackup in Settings → Data & Backup. Docker: Dockerfile, docker-compose.yml, nginx.conf, .env.example. Supabase URL/key configurable (VITE_SUPABASE_*).
  - **OAuth auto-encryption**: OAuth users (Google/Azure) get an auto-generated encryption key on first sign-in. No passphrase required. Key stored in localStorage, restored to sessionStorage on return. Encryption works immediately.
  - **Local vs online split (Path A)**: compliance_items now local-first. IndexedDB (src/lib/localStorage.js) for web/mobile/desktop. Read local first (instant), merge from Supabase. Add/update/delete/snooze write local first, sync to Supabase. clearLocalData on logout. Managed self-hosted explained.
  - **Deployment model**: Added 3-option model (Cloud, Self-Hosted DIY, Managed Self-Hosted). LLM choice (local or web). Local vs online split, isolation boundary. Database privacy notes.
  - **npm audit fix**: Resolved ajv, minimatch, rollup, tar vulnerabilities.
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

### All Prompts & Outcomes (from Cursor aiService.generations)
Recovered from `~/Library/Application Support/Cursor/User/workspaceStorage/.../state.vscdb`. AI replies are inferred from changelog/codebase.

| # | Your Prompt | Outcome |
|---|-------------|---------|
| 1 | "I don't see the option of signing in with Microsoft/Outlook" | Added Microsoft/Outlook OAuth to Auth.jsx. |
| 2 | "Restart the server for me" | Restarted dev server. |
| 3 | "What was the issue?" (Microsoft sign-in) | Dev server restart fixed visibility. |
| 4 | "In the quiz can you add Other? For all the steps?" | Added Other option to roles, focus areas, life moments, org type, org focus areas. |
| 5 | "I don't want to call it struggles – better way to keep track?" | Renamed to "focus areas" (data: focusAreas, orgFocusAreas). |
| 6 | "You can't update them?" (quiz options) | Text inputs always visible; users can type or select. |
| 7 | "You didn't give them a space to type? AI chatbot needed here?" | Text inputs + speech recognition with mic; continuous mode for paragraphs. |
| 8 | "Cursor crashed" | Continued; verified state. |
| 9 | "Yes pls" (implement) | Implemented. |
| 10 | "They should be able to use text instead of selecting. Text box there regardless. Speech recognition in chat." | Textareas for paragraph input; speech with review bar ("We heard: …", Speak again, dismiss). |
| 11 | "Prompt them to enter needs using text, speech or selecting from menu." | Updated placeholders and flow. |
| 12 | "If mic grabs gibberish, give option to speak again before send." | Speech review bar with "Speak again" and dismiss. |
| 13 | "Deploy changes and restart server" | Deployed; restarted. |
| 14 | "I want them to type a paragraph, not one or two words. Or speak a whole paragraph." | Paragraph textareas (max 1000 chars); speech continuous mode. |
| 15 | "So much about taxes – seems like a tax app. I want trusts more important." | Rebalanced config, landing, features: trusts/estate first; tax de-emphasized. |
| 16 | "Cursor crashed again" | Continued; verified. |
| 17 | "Yes proceed" | Proceeded. |
| 18 | "Deploy and restart server if needed" | Deployed ai-chat; restarted. |
| 19 | "Deploy for me" | Deployed. |
| 20 | "Not Netlify – I mean Supabase ai-chat. Deploy to live later." | Deployed ai-chat Edge Function. |
| 21 | "What's the difference between AI assistant and app's assistant?" | Same feature: ChatBubble links to Assistant. Discussed making more functional. |
| 22 | "Can't we make this more functional? Does it make sense to keep it separate?" | Explained 5 ways + recommendation: slide-out overlay. User approved. |
| 23 | "When I click the Nava logo nothing happens?" | Added scroll-to-top when already on /dashboard. |
| 24 | "Implement the 5 ways + recommendation" | Slide-out overlay, context, proactive suggestions, calendar export, ChatPanel. |
| 25 | "Cursor crashed, continue and make sure nothing got fucked up" | Verified build; summarized. |
| 26 | "Redeploy for me please" | Deployed ai-chat. |
| 27 | "Restart the server" | Restarted npm run dev. |
| 28 | "Why does everything blur? What if I need to drag and drop? Selected item only?" | Removed blur; backdrop non-blocking. selectedItem in context, not yet wired from UI. |
| 29 | "How do I test selectedItem context?" | Would add "Ask AI about this" on item cards; selectedItem in context. |
| 30 | "Chat doesn't clear until user clears it right?" | Clarified: was reset on close. User wanted persistence. |
| 31 | "Yes persist, and let users delete messages" | chatStore, persistence, delete per message, Clear. |
| 32 | "Site still goes blurry" | Removed blur (again). |
| 33 | "Did you redeploy?" | ai-chat was deployed earlier; blur is frontend-only. |
| 34 | "Yes pls" (deploy) | Pushed to git for CI/CD. |
| 35 | "Deployment isn't finished – deploy on dev server?" | Started npm run dev (local). |
| 36 | "Kill process and restart server" | Killed port 5173; restarted. |
| 37 | "Dashboard shows only Canadian compliance. What if I want some in one country, some in another?" | Explained; proposed per-item country. |
| 38 | "Wait – is there already a process? What are you doing?" | Paused; explained. User approved. |
| 39 | "Finish the implementation" | Migration 027, filter, AddItemModal/BulkEdit country, ai-chat country. |
| 40 | "Cursor crashed again" | Verified build. |
| 41 | "Run migration and redeploy" | supabase db push; ai-chat deploy. |
| 42 | "Everything saved in project status?" | Updated changelog. |
| 43 | "If I close/restart, will you get the whole context?" | No; codebase + PROJECT_STATUS persist. |
| 44 | "Update project status with all my prompts and replies" | Added Session Log. |
| 45 | "I want all my prompts from all time in project status" | Added this section. |
| 46 | "Search my whole computer for old prompts and replies" | Found aiService.generations in Cursor workspaceStorage; extracted 46 prompts. |
| 47 | Vision: not just compliance; WhatsApp/iMessage; one-message actions (file taxes, dispute ticket, trust fund); Nava suggests, user says go ahead; best version without APIs | Added Vision section, "best version now" bullets. |
| 48 | Deployment model: 3 options (Cloud, DIY, Managed), LLM choice (local/web), local vs online split, isolation, stronger DB if needed, security vulns | Added Deployment Model section. Fixed npm vulnerabilities (ajv, minimatch, rollup, tar). |
| 49 | OAuth auto-encryption — don't like no encryption until passphrase | Auto-generated key for OAuth users on first sign-in. Key in localStorage, restored on return. |
| 50 | Update and check PROJECT_STATUS, what's left to do | Updated date, Recent, What's Left table. Build OK, lint 2 errors. |

*Source: Cursor stores prompts in `state.vscdb` (ItemTable, aiService.generations). AI replies are not stored; outcomes inferred from changelog.*

### Notes
- Keep API keys in Supabase secrets.
- Config: `src/lib/config.js`
- `app.html` = Predictably Human (separate flow)
