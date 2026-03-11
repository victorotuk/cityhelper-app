# OpenClaw & Nava API

How the Nava API and OpenClaw integration work, how to set them up for users (including non-technical), and how API limits and tiers are defined.

---

## 1. Nava API key vs OpenClaw

- **Nava API key** is the only key users need. They get it from **Nava app → Settings → OpenClaw & API → Generate API key**. It authenticates requests to the Nava API (`nava-api` Edge Function).
- **OpenClaw** is a separate app (bridge) that connects messaging apps (WhatsApp, iMessage, etc.) to tools like Nava. OpenClaw does **not** give users a key; it uses the **Nava API key** in its config so that when someone messages via WhatsApp, OpenClaw can call Nava on their behalf.
- So: **one key = Nava API key.** When we "set up OpenClaw for them," we are configuring OpenClaw (or our own bridge) to use **their** Nava API key.

---

## 2. Setting up OpenClaw for someone else (e.g. your sister)

**Case:** Your sister wants to message Nava on WhatsApp. She doesn’t want to install or configure OpenClaw herself.

**Ways to do it:**

### Option A: You run OpenClaw and add her key (DIY)

1. Sister has a Nava account and generates her **Nava API key** (Settings → OpenClaw & API).
2. She sends you the key (or you generate it with her logged in, if you have access).
3. You run OpenClaw on your own computer or server (see [openclaw-nava/README.md](../openclaw-nava/README.md)).
4. In OpenClaw config you add the Nava plugin with:
   - `api_url`: your Nava project URL (e.g. `https://xxx.supabase.co/functions/v1/nava-api`)
   - `api_key`: **her** Nava API key (so all requests are under her account).
5. You connect WhatsApp (e.g. wacli for personal WhatsApp, or Business API if you have it).
6. You give sister the WhatsApp number/link that goes to this OpenClaw instance. When she (or anyone you allow) messages that number, OpenClaw forwards to Nava using her key.

**Limitation:** That OpenClaw instance is tied to one Nava account (one API key). If you want to support multiple people, you either run one OpenClaw per person or build routing (see Option B).

### Option B: Hosted “Nava over WhatsApp” (future)

To offer “WhatsApp to Nava” for many users who don’t know OpenClaw:

- **We** run the bridge (OpenClaw or a custom service) that:
  - Receives messages (e.g. WhatsApp Business API or wacli linked to a shared number).
  - Identifies the user (e.g. by linking their phone number to their Nava account in our DB).
  - Calls `nava-api` with **that user’s Nava API key** (stored server-side for their linked phone).
- Users never see OpenClaw; they just message a Nava WhatsApp number and get replies. This requires building (or wiring) the routing layer and possibly WhatsApp Business API approval.

**Today:** Option A is what “we set up OpenClaw for them” means: someone technical runs OpenClaw once and configures it with the end user’s Nava API key so that WhatsApp traffic is tied to that user’s account.

---

## 3. API limits (tiered)

Enforced in the `nava-api` Edge Function. Tables: `api_usage` (monthly count per user), `api_request_log` (recent requests for per-minute cap).

| Tier       | Monthly cap | Per-minute cap | Who it’s for |
|-----------|-------------|----------------|----------------------------------------------|
| **Free**  | 0           | 0              | No API access; app-only use.                  |
| **Personal** | 2,000    | 20             | Single user, OpenClaw at home, light automation. |
| **Business** | 25,000   | 40             | Small team or power user, several integrations. |
| **Enterprise** | 100,000 | 60          | Agencies, heavy automation, many API clients.  |

### Why these numbers

- **2,000/month (Personal):** ~65–70 requests per day. Enough for daily OpenClaw use (e.g. a few dozen messages/day) plus some script/automation, without allowing resale or heavy scraping.
- **25,000/month (Business):** ~800/day. Small team or one power user with multiple tools hitting the API.
- **100,000/month (Enterprise):** ~3.3k/day. High-volume or many concurrent clients; avoids abuse while allowing serious use.
- **Per-minute (20 / 40 / 60):** Prevents burst abuse (e.g. one key driving a clone or script). 20/min = one request every 3 seconds; 60/min = one per second. Normal chat use stays well under these.

Free = 0 so that API/OpenClaw is a clear upgrade reason; no “free API” that could be easily abused.

---

## 4. Tier → user category (summary)

| Tier        | Typical user                         | Main need                          |
|------------|--------------------------------------|------------------------------------|
| **Free**   | Trying the app, light personal use   | Reminders, 10 items, BYOK AI       |
| **Personal** | Individual, family, freelancer     | Unlimited items, vault, sharing, some API (OpenClaw) |
| **Business** | Small business, side gigs, small team | Team, business categories, estate, more API |
| **Enterprise** | Agency, multi-user, heavy automation | High API volume, OpenClaw/integrations, support |

Differentiation for people who **don’t** care about API: Free = 10 items; Personal = unlimited items + vault + sharing; Business = team + business/estate features; Enterprise = all of that + high API and “we handle integrations” story.

---

## 5. Where to configure

- **Pricing and limits (app-facing):** `src/lib/config.js` → `pricing` (e.g. `apiMonthly`, `apiPerMinute`, feature lists).
- **Enforcement:** `supabase/functions/nava-api/index.ts` → `API_LIMITS` and the checks that run before handling each request.
- **Migrations:** `api_usage` and `api_request_log` created in `supabase/migrations/030_api_usage_limits.sql`.

See also: **docs/AI_PROVIDERS.md** (AI keys, OpenRouter, downtime backup), **openclaw-nava/README.md** (plugin setup), **PROJECT_STATUS.md** (API and OpenClaw section).
