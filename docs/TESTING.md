# Testing & optimization guide

Use this to test the site thoroughly and keep it working and optimized.

## How to check desktop changes

```bash
npm run tauri:dev
```

This opens the native desktop app. Sign in, then scroll on Dashboard, Settings, Tax, Apply, Assistant, and Documents — content should stay below the sticky header (no overlap). Resize the window to confirm layout adapts.

**Title bar overlap:** If content scrolls under the native window title bar (close/minimize/maximize), we add `padding-top: 38px` on desktop. To use a content-under-titlebar style instead, set `--tauri-titlebar-height: 0` in your CSS.

---

## View & test all platforms (one click)

| Platform | How to open |
|----------|-------------|
| **Web** | `npm run dev` → open http://localhost:5173 in Chrome/Safari |
| **Desktop (Tauri)** | `npm run tauri:dev` → opens native window (same URL, no browser chrome) |
| **Mobile (simulated)** | `npm run dev` → Chrome DevTools (Mac: Cmd+Option+I) → Toggle device toolbar (Cmd+Shift+M) → pick iPhone/Android |
| **Mobile (real device)** | `npm run dev` → ensure phone and Mac on same Wi‑Fi → open http://YOUR_MAC_IP:5173 on phone |

**Quick test all three:**
1. Terminal 1: `npm run dev`
2. Browser: http://localhost:5173 (web)
3. Chrome DevTools → device toolbar → iPhone 14 (mobile view)
4. Terminal 2: `npm run tauri:dev` (desktop app)

## Quick checks (before every release)

```bash
npm run build    # Must pass
npm run lint     # Fix any new errors
```

## Manual QA checklist

Run through these flows on **web** (and optionally mobile/desktop) to confirm nothing is broken.

### Auth & onboarding
- [ ] **Landing** – Hero, features, CTA, footer; “Sign in” goes to auth.
- [ ] **Sign up** – Email + password and/or Google/Microsoft; account created.
- [ ] **Sign in** – Email + password and/or OAuth; redirect to dashboard.
- [ ] **Forgot password** – Request reset; email received (if configured).
- [ ] **Welcome guide** – New user sees onboarding; can skip or complete; choices saved.

### Dashboard
- [ ] **Load** – Items load (or empty state); no console errors.
- [ ] **Add item** – Open “Track Item” → pick category → fill form → save; item appears.
- [ ] **Paste & suggest** – Paste text with a date in Add Item; suggestion pre-fills.
- [ ] **Edit / bulk edit** – Select multiple items → bulk edit (e.g. due date); changes apply.
- [ ] **Mark done, snooze, delete** – Per-item actions work; list updates.
- [ ] **Country switcher** – If 2+ countries: switch country; list filters correctly.
- [ ] **Quick actions** – Documents, Apply, Export Calendar, Import Calendar open correct flows.

### AI & chat
- [ ] **Chat bubble** – Opens overlay; type message; reply received (or graceful error).
- [ ] **Assistant page** – Full /assistant page works; same chat behavior.
- [ ] **AI suggestions** – “AI suggests” card: refresh loads suggestions; “Ask AI” opens chat.

### Key flows
- [ ] **Apply** – Apply flow: type → form → review → guide; no hard errors.
- [ ] **Documents** – Upload file; view/delete; scan (if enabled); scan result shows.
- [ ] **Tax estimator** – Enter income/region; calculate; summary and breakdown look correct.
- [ ] **Assets** – Add asset; optional mileage; list and delete work.
- [ ] **Settings** – All sections load; toggle push, digest, phone (if used); save succeeds.
- [ ] **OpenClaw** – Generate key; copy URL/key; (if you use OpenClaw) plugin works.

### Modals & edge cases
- [ ] **Dispute ticket** – Open from dashboard/menu; steps 1–4; can back/continue.
- [ ] **Pay ticket** – Open with initial values; pay link opens.
- [ ] **Share item** – Share modal; enter email; success/error handling.
- [ ] **Calendar import** – (Mobile) permission and event list; add items.
- [ ] **Unlock screen** – (Password user) after lock; unlock with password.

### Logout & re-entry
- [ ] **Sign out** – Clears session; redirect to landing or auth.
- [ ] **Sign in again** – Same account; data and settings restored.

## Performance & optimization

### Build output
- After `npm run build`, check for:
  - **Large chunks** – If main chunk > 500 KB, consider code-splitting or lazy routes.
  - **Warnings** – “dynamic import will not move module” etc.; fix if they affect tree-shaking.

### Runtime (optional)
- **Lighthouse** (Chrome DevTools → Lighthouse): run for Performance, Accessibility, Best Practices. Aim for no red scores on critical metrics.
- **Network** – Throttle to “Fast 3G”; main app and key API calls should still complete without long freezes.

### What’s already in place
- Lazy-loaded Dashboard.
- Component/code splitting from folder refactor.
- Local-first reads (IndexedDB) for fast list load.

## Automated testing (recommended next step)

To lock in behavior and catch regressions:

1. **E2E with Playwright**
   - Install: `npm i -D @playwright/test`
   - Add smoke tests: landing → sign in (or mock) → dashboard loads → add item flow.
   - Run in CI on every push.

2. **Component/unit tests (optional)**
   - Vitest + React Testing Library for critical components (e.g. AddItemModal, compliance list).
   - Run with `npm test` and in CI.

See [Playwright](https://playwright.dev/) and [Vitest](https://vitest.dev/) docs for setup. A minimal Playwright smoke test is often the highest ROI.

### Desktop (Tauri)

**How to verify desktop changes (including overlap fix):**

1. Run `npm run tauri:dev` — opens the native desktop window.
2. Sign in (or sign up) — desktop skips landing and goes straight to auth.
3. On **Dashboard**: scroll down — content should stay below the sticky header (no overlap).
4. On **Settings**, **Tax**, **Apply**, **Assistant**, **Documents**: same — scroll and confirm content doesn’t go under the top bar.
5. Resize the window — layout should adapt without breaking.

- [ ] **Dev mode** – `npm run tauri:dev` opens desktop window; UI matches web.
- [ ] **Auth-first** – Desktop opens to sign-in/sign-up (not the landing page promo).
- [ ] **Scroll/overlap** – Scroll dashboard and settings; content does not overlap the top nav bar or native window controls.
- [ ] **Headers** – Dashboard and page headers are solid (no transparency bleeding) with `tauri-desktop` class.
- [ ] **Resize** – Drag window edges to resize; layout adjusts fluidly (min 320×400).
- [ ] **Check for updates** – Settings → Check for updates button works (will say "latest version" if no update published).
- [ ] **Startup update check** – On launch, if a newer `latest.json` exists on GitHub Releases, a confirm dialog appears.
- [ ] **Logo** – Nava logo (dark/light) renders correctly in header and auth page.

## Environment notes

- **Web** – Use same env as production (e.g. `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`) or a staging Supabase project.
- **Mobile** – Test on device or emulator; push, calendar, and share target need real or mocked native APIs.
- **Desktop** – `npm run tauri:dev` for dev, `npm run release -- <version>` for signed builds. Signing key at `~/.tauri/nava.key`.
- **OpenClaw** – Use a real OpenClaw gateway + Nava plugin against your Supabase project to verify end-to-end messaging.
