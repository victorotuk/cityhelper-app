# Web vs Desktop vs Mobile — Platform Comparison

Visual guide using **your actual Nava app**. Edit the layout in `assets/nava-comparison.html`, then re-run to screenshot before building.

**Workflow:**
1. `npm run dev` (in another terminal)
2. `npm run capture:comparison` — outputs single full-size images: `nava-desktop.png` (1280×840), `nava-mobile.png` (750×1624)
3. Edit the PNGs in an image editor (or edit the HTML layout and re-run) to iterate before building

---

## 1. Layout & Chrome

*Your Nava screenshots: `assets/nava-desktop.png`, `assets/nava-mobile.png` (run `npm run capture:comparison` to generate)*

| Aspect | Web | Desktop | Mobile |
|--------|-----|---------|--------|
| **Chrome** | Browser tabs, URL bar, back button | Native window, title bar, menu bar | Full screen, status bar, notch |
| **Navigation** | URL + in-app nav | In-app only (no URL) | Bottom nav, hamburger, swipe |
| **Screen real estate** | Variable (user resizes) | User controls window | Fixed (phone size) |
| **Input** | Mouse + keyboard | Mouse + keyboard (shortcuts matter) | Touch (large targets) |

---

## 2. Desktop Best Practices

*Reference: `assets/desktop-best-practices.png` (generic patterns — adapt for Nava)*

| Pattern | What it is | Why it matters |
|---------|------------|----------------|
| **Menu bar** | File, Edit, View, Help at top | Users expect it; feels native |
| **Keyboard shortcuts** | Cmd+N, Cmd+S, Cmd+F | Power users work faster |
| **Right-click context menu** | Edit, Snooze, Delete on items | Familiar desktop interaction |
| **System tray** | Icon in menu bar; minimize to tray | Quick access without full window |

**Examples:** Slack, Notion, VS Code, Figma — all use menu bar + shortcuts + context menus.

---

## 3. Mobile Best Practices

*Reference: `assets/mobile-best-practices.png` (generic patterns — adapt for Nava)*

| Pattern | What it is | Why it matters |
|---------|------------|----------------|
| **Large touch targets** | Buttons ≥ 44px | Fingers need space |
| **Bottom nav** | Main sections at thumb reach | One-handed use |
| **Swipe gestures** | Swipe to delete, pull to refresh | Natural mobile idiom |
| **Thumb zone** | Important actions in lower half | Easier to reach |

**Examples:** Gmail, Todoist, banking apps — bottom nav, large buttons, swipe actions.

---

## 4. Web-Specific

| Pattern | What it is | Why it matters |
|---------|------------|----------------|
| **URL sharing** | Deep links to specific views | Share dashboard, item, etc. |
| **Tab behavior** | Multiple tabs = multiple sessions | Users may have several tabs |
| **Back button** | Browser back vs in-app back | Can conflict; design for both |
| **Responsive** | Resize from phone to ultrawide | One codebase, many sizes |

---

## 5. What Nava Has Today

| Platform | Status | Gaps vs best practices |
|----------|--------|------------------------|
| **Web** | ✅ Full experience | — |
| **Desktop (Tauri)** | ✅ Auth-first, solid headers, resize | No menu bar, no shortcuts, no tray |
| **Mobile (Capacitor)** | ✅ Built, on device | Bottom nav? Touch targets? Swipe? |

---

## 6. Suggested Priorities (for when you build)

**Desktop (quick wins):**
1. Native menu bar (File → New item, Help → Check for updates)
2. Keyboard shortcuts (Cmd+N add item, Cmd+Enter mark done)
3. Right-click on items (Edit, Snooze, Delete)

**Mobile (if not already there):**
1. Bottom nav for main sections
2. Swipe to snooze / mark done on item cards
3. 44px min touch targets

**Web:**
- Already strong; focus on desktop + mobile parity.

---

**Your Nava screenshots:** `assets/nava-desktop.png`, `assets/nava-mobile.png` — run `npm run capture:comparison` to generate from your running app.
