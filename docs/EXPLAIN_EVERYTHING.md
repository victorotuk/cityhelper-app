# Nava — What Everything Does

## Why Vercel?

**Vercel is optional.** It's one way to host your **web app** (the site people visit at vicomnava.com). You need *something* to serve the built `dist/` folder to the internet. Options:

| Option | What it does |
|--------|--------------|
| **Vercel** | Connect your GitHub repo → auto-deploys on push. Free tier. |
| **Netlify** | Same idea as Vercel. |
| **Your own server** | Upload `dist/` to any web host (shared hosting, VPS, etc.). |
| **Supabase Hosting** | If you use Supabase, they have static site hosting. |

You can skip Vercel and use any host. The `vercel.json` we added just makes Vercel work if you choose it later.

---

## What Did Homebrew Do?

**Homebrew** is a package manager for Mac. It lets you install command-line tools easily.

We used it to install **`gh`** (GitHub CLI). Without Homebrew, we had to download `gh` to `/tmp`, which gets deleted on reboot. With Homebrew:

- `brew install gh` → `gh` is permanently installed
- `gh release create` → we used this to publish v0.2.0 to GitHub

You can now run `gh` anytime. Homebrew also lets you install other tools (e.g. `brew install vercel` if you want the Vercel CLI).

---

## Why Does the Overlap Still Happen When You Scroll?

**What was happening:** The sticky nav stays at the top. When you scroll, content scrolls *under* it. So the "Everything to stay on top of your compliance" title (and hero title) would slide behind the nav.

**What we fixed:**
1. **`scroll-padding-top`** — When you *click* "Features" (anchor link), the browser scrolls so the target has 80px clearance. That only helps for anchor clicks.
2. **`scroll-margin-top`** — Same idea for anchor links.
3. **`padding-top` on `.hero` and `.features-section`** — Each section now has 72–80px of top padding. When you scroll so a section is at the top of the viewport, that padding sits under the nav instead of the actual title text.

If overlap still happens, it may be another section or a different scroll position. Tell me exactly where you see it and we can fix that spot.

---

## Why Isn't the App Updater Prompting?

**The updater only prompts when a *newer* version exists.**

- Your installed app: **v0.2.0**
- GitHub release: **v0.2.0**
- Result: No update available → no prompt

To test the updater:
1. We release **v0.2.1** (with the overlap fix, About section, etc.)
2. You open your v0.2.0 app
3. On startup, it fetches `latest.json`, sees 0.2.1 > 0.2.0, and prompts you to update

**Manual check:** Settings → Check for updates. It will say "You're on the latest version" because 0.2.0 is the latest.

---

## Version in Settings

We added an **About** section in Settings that shows:
- App name
- Version (from Tauri on desktop, from `version.js` on web)
- Platform (desktop / web)

---

## How to Test Right Now

1. **Web:** `npm run dev` is running → open http://localhost:5173
2. **Desktop:** `npm run tauri:dev` is running → the Nava window should open
3. **Overlap:** Scroll the landing page. The hero and features titles should stay clear of the nav.
4. **Version:** Sign in → Settings → scroll to "About"
5. **Updater:** After we release v0.2.1, open the desktop app and you'll get the update prompt (or use Settings → Check for updates)
