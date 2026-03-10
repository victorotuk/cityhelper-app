# Nava — Future Roadmap

Strategic vision: web as download hub, desktop/mobile as full agent, and a phased path to APIs, licenses, buyouts, and global expansion.

---

## Platform strategy

### Web as download hub

| Role | What it does |
|------|--------------|
| **Front door** | Learn what Nava does, sign up, sign in |
| **Download funnel** | Mac / Windows / Linux / App Store / Play Store links |
| **Soft version** | Lightweight: track items, reminders, basic AI chat, docs. Enough to onboard and prove value. |

Web is the main marketing and conversion funnel. Desktop and mobile are where the richer, agent-style experience lives.

### Desktop & mobile as full agent

| Role | What it does |
|------|--------------|
| **Full experience** | Deeper AI, delegation, integrations, “do it for me” flows |
| **Agent capabilities** | Ship new agent features here first; decide later what (if anything) to expose on web |

Web stays simple and fast. Heavier agent features live in native where you have more control and better UX.

---

## Phased end goal

| Phase | Focus | Status |
|-------|-------|--------|
| **Phase 1** | Track + remind + AI guidance | ✅ Done |
| **Phase 2** | APIs and licenses — fight tickets, find lawyers/accountants, file applications | Future |
| **Phase 3** | Acquire competitors — consolidate users and features | Future |
| **Phase 4** | Add countries — Poland, Australia, Nigeria, etc. with localized compliance and providers | Future |

---

## Phase 2: APIs and licenses

- Fight tickets (dispute APIs)
- Find lawyers / accountants (provider directories)
- File applications (government APIs where available)
- Secure advanced and extensive APIs to enable “do it for me” flows

---

## Integrations & IoT (when we have users)

**Do not forget:** The `/integrations` page and vision describe smart-home and app integrations. Implement when there are enough users and partner APIs available.

| Integration | Vision | Status |
|-------------|--------|--------|
| **Washer / dryer** | Remind when laundry is done; move to dryer | Coming soon — UI at /integrations |
| **Stove / oven** | Alert if left on too long | Coming soon — UI at /integrations |
| **Fitness / gym** | Sync membership renewals; Apple Health, Strava | Coming soon — UI at /integrations |
| **Smart home hub** | Apple HomeKit, Google Home, Alexa, SmartThings | Coming soon — UI at /integrations |

**Next steps when ready:** Backend: partner OAuth or device APIs; store integration preferences per user; cron or webhooks to send reminders. Frontend: /integrations "Notify me" → collect email; turn on/off per integration.

---

## Phase 3: Acquire competitors

- Buy out competitors to consolidate users and features
- Integrate best-of-breed features into Nava
- Reduce fragmentation in the life-admin space

---

## Phase 4: Global expansion

- Add countries: Poland, Australia, Nigeria, etc.
- Localized compliance rules per country
- Local providers and APIs where available

---

## Reference

- **Current status:** `PROJECT_STATUS.md`
- **Competitor gaps:** `COMPETITOR_ANALYSIS.md`
- **Platform UX:** `docs/DESKTOP_MOBILE_UX.md`, `docs/PLATFORM_COMPARISON.md`
- **Desktop updates:** `docs/TAURI_UPDATES.md`
- **Testing:** `docs/TESTING.md`
