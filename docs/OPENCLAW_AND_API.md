# OpenClaw & Nava API

How the Nava API works, how **we** run OpenClaw for everyone who doesn’t want to run it themselves (and charge for it), how to scale to many users who never touch OpenClaw, and how limits and limit-increase requests work.

---

## 1. Nava API key vs OpenClaw

- **Nava API key** is what authenticates requests to the Nava API (`nava-api` Edge Function). Users get it from **Nava app → Settings → OpenClaw & API → Generate API key** (if they run their own OpenClaw).
- **OpenClaw** is a bridge that connects WhatsApp, iMessage, etc. to Nava. It uses a **Nava API key** in its config so that messages are handled under the right account.
- **We run OpenClaw for users** who don’t want to run it themselves. They pay a fee; they never sign up for or touch OpenClaw. We route their messages to Nava using their account (see §3).

---

## 2. We run OpenClaw and charge for it

- **Product:** “Nava over WhatsApp (or iMessage)” for people who don’t want to bring their own OpenClaw. **We** run the bridge; **we** charge a fee for doing this for them.
- **Flow:** User has a Nava account, pays for the “managed messaging” / “we run OpenClaw for you” tier. They link their phone number to their Nava account (in app or during onboarding). When they message **our** Nava WhatsApp number (or channel), our bridge looks up their phone number → Nava user (and API key or server-side token), calls `nava-api` with that identity, and sends the reply back. They never see or install OpenClaw.
- **Scaling to many users (e.g. millions):** One shared bridge, not one OpenClaw instance per user.
  - **Ingress:** Messages arrive at our system (e.g. WhatsApp Business API, or wacli/custom gateway that supports many senders).
  - **Routing:** For each incoming message we have a **sender identifier** (e.g. phone number). We store in DB: `linked_phone → user_id` (and optionally a server-side Nava API key or token for that user). We look up sender → user, then call `nava-api` with that user’s credentials.
  - **Outbound:** We send the reply back to that sender (same channel). So one bridge serves all users; differentiation is by linked phone (or other stable id), not by “one OpenClaw per person.”
- **What to build (when you’re ready):**
  - **Phone (or channel) linking:** In Nava, a flow where the user links their WhatsApp (or future channel) identity to their Nava account (e.g. “Connect WhatsApp” → send a code to our number, we verify and store `user_id ↔ phone`).
  - **Message ingress:** A service that receives messages from WhatsApp (and later others), looks up sender in `linked_phones` (or similar), gets `user_id` and that user’s Nava API key (or a server-side token that nava-api accepts), calls `nava-api` with the right auth, and posts the reply back.
  - **Billing:** The “managed messaging” / “we run OpenClaw for you” fee is a paid add-on or tier; only users who pay get their phone linked and routed.

So: “setting up OpenClaw for them” at scale = we run one (or a few) bridges, we link each user’s phone to their Nava account, we route by phone and charge a fee. No need for each of a million users to run OpenClaw.

---

## 3. API limits and limit-increase requests

Enforced in the `nava-api` Edge Function. Tables: `api_usage`, `api_request_log` (see migration 030).

| Tier       | Monthly cap | Per-minute cap |
|-----------|-------------|----------------|
| **Free**  | 0           | 0              |
| **Personal** | 2,000    | 20             |
| **Business** | 25,000   | 40             |
| **Enterprise** | 100,000 | 60          |

- **Why these numbers:** See “Why these numbers” in the previous version of this doc (abuse prevention, normal use, burst control). They’re intentionally conservative by default.
- **Need more?** Users can **request a limit increase** (e.g. “Request higher API limit” in Settings or support). Process:
  - They submit a short form (use case, expected volume, optional documentation).
  - We review: if usage looks honest and an increase would genuinely help (not abuse, not resale), we approve and raise their cap (e.g. in `subscriptions` or a separate `api_limit_overrides` table keyed by `user_id`).
  - We can also **auto-flag** users who are near cap and have clean usage for a manual or semi-automated “offer increase” flow.
- **Implementation note:** Today limits are fixed per tier in `nava-api` (API_LIMITS). To support overrides: store per-user overrides (e.g. `api_limit_monthly`, `api_limit_per_minute`) in DB and have nava-api read them when present; otherwise use tier default.

---

## 4. Tier → user category (summary)

| Tier        | Typical user                         | Main need                          |
|------------|--------------------------------------|------------------------------------|
| **Free**   | Trying the app, light personal use   | Reminders, 10 items, BYOK AI       |
| **Personal** | Individual, family, freelancer     | Unlimited items, vault, sharing, some API / “Nava over WhatsApp” (we run it) |
| **Business** | Small business, side gigs, small team | Team, business categories, estate, more API |
| **Enterprise** | Agency, multi-user, heavy automation | High API volume, integrations, support |

Differentiation for people who **don’t** care about API: Free = 10 items; Personal = unlimited items + vault + sharing + optional “we run OpenClaw for you” (fee); Business = team + business/estate; Enterprise = all of that + high API and “we handle it” story.

---

## 5. Where to configure

- **Pricing and limits (app-facing):** `src/lib/config.js` → `pricing` (e.g. `apiMonthly`, `apiPerMinute`, feature lists).
- **Enforcement:** `supabase/functions/nava-api/index.ts` → `API_LIMITS` and the checks that run before handling each request.
- **Migrations:** `api_usage` and `api_request_log` in `supabase/migrations/030_api_usage_limits.sql`.

See also: **docs/AI_PROVIDERS.md** (OpenRouter as server backup when Groq is down), **openclaw-nava/README.md** (plugin config), **PROJECT_STATUS.md** (API and OpenClaw section).
