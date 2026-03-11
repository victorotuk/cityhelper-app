# AI Providers (BYOK & Server Fallback)

How Nava uses AI (chat and document scanning), how to set up each provider (including OpenRouter), and how we handle provider downtime with a temporary backup.

---

## 1. Supported providers

| Provider   | Key prefix    | Chat | Scan (vision) | Free tier |
|-----------|----------------|------|----------------|-----------|
| **Groq**  | `gsk_`         | Yes  | Yes (Llama 4 Scout) | Yes (1k req/day) |
| **OpenRouter** | `sk-or-v1-` | Yes  | Yes (e.g. Gemini)   | Many free models |
| **OpenAI** | `sk-` (and not sk-ant-, sk-or-) | Yes | Yes (gpt-4o-mini) | No |
| **Anthropic** | `sk-ant-` | No (chat falls back to Groq) | Yes (Claude) | No |
| **Gemini** | `AI` (Google) | No (chat falls back to Groq) | Yes | Yes |

Nava **auto-detects** the provider from the key prefix. Users paste one key in Settings → AI; no need to pick the provider manually (optional UI can show detected provider).

---

## 2. OpenRouter setup (for you or for users)

**What OpenRouter is:** One API key that can call 400+ models (AllenAI Olmo, Meta Llama, DeepSeek, Google, etc.). Many models are free; paid ones are per-token. Good for users who want one key for “all AIs” or free models beyond Groq.

**Steps:**

1. Go to [openrouter.ai](https://openrouter.ai) and sign up.
2. Create an API key: **Keys** or **API Keys** → **Create** → copy the key (starts with `sk-or-v1-`).
3. In Nava, **Settings → AI** → paste the key and save. Nava will use it for both chat and scan (OpenRouter is detected from the prefix).

**In the app (for agents/support):**

- No extra env vars needed. User key is sent from the client; Edge Functions call OpenRouter with that key.
- For **scan**, we use a default vision model (e.g. `google/gemini-2.0-flash-001:free`). OpenRouter routes to the right backend.
- For **chat**, we use a default model (e.g. `meta-llama/llama-3.1-8b-instruct`). Both are configured in `supabase/functions/ai-scan/index.ts` and `ai-chat/index.ts` under the `openrouter` provider.

**If you add a new OpenRouter model:** Edit the `model` string for `openrouter` in those two Edge Functions (and optionally allow the client to pass a model name later).

---

## 3. Provider downtime: notify and temporary backup

**Goal:** If the user’s chosen provider (e.g. Groq) is down or returns 5xx/timeout, we should:

1. **Try a temporary backup** so the user’s request still succeeds (e.g. retry with server-side `GROQ_API_KEY`).
2. **Notify the user** that we used a backup so they’re not confused if behavior differs slightly.

**Implementation (in code):**

- In **ai-scan** and **ai-chat**, when we call the user’s provider and get a **5xx** or **timeout** (or network error), we retry **once** using the server’s `GROQ_API_KEY` (if set). If the retry succeeds, we return the result and include a response flag or header, e.g. `X-AI-Backup-Used: true`, so the client can show a short message: “We temporarily used a backup AI; your provider may be having issues.”
- If the user has no key and we only have the server key, no “backup” message is needed (we’re already on the primary path).
- If the backup also fails, we return the same error we would have (e.g. “Document scanning temporarily unavailable” or “AI error: …”).

**In the UI (optional):**

- When the client sees `X-AI-Backup-Used: true` (or equivalent in the JSON body), show a one-line toast or banner: “We used a backup AI provider temporarily. Your usual provider may be experiencing issues.”
- No need to “notify” outside the app (e.g. email) unless we later add a status page or incident alerts.

**Summary:** Backup = one retry with server `GROQ_API_KEY` on 5xx/timeout; notify = expose a flag so the app can show “backup was used” in-session. See Edge Function code for the exact retry and header.

---

## 4. Where it’s implemented

- **Detection and provider config:** `supabase/functions/ai-scan/index.ts` → `PROVIDERS`, `detectProvider`; `supabase/functions/ai-chat/index.ts` → `CHAT_PROVIDERS`, `detectChatProvider`.
- **OpenRouter:** Same files; `openrouter` entry in `PROVIDERS` / `CHAT_PROVIDERS` with URL `https://openrouter.ai/api/v1/chat/completions`.
- **Server fallback key:** Env var `GROQ_API_KEY` in Supabase Edge Function secrets. Used when the user sends no key or when we do the downtime retry.
- **Client:** Settings → AI is in `src/components/settings/SettingsAISection.jsx`; it lists OpenRouter and detects provider from the pasted key.

---

## 5. Adding a new provider

1. Add the provider in the relevant Edge Function(s) (`ai-scan` and/or `ai-chat`): endpoint URL, model name, request body shape, and how to read the response (e.g. `choices[0].message.content` vs provider-specific path).
2. Add key-prefix detection in `detectProvider` / `detectChatProvider` so the right provider is chosen when the user pastes a key.
3. In **Settings → AI** (`SettingsAISection.jsx`), add an entry to `AI_PROVIDERS` (name, prefix, hint, optional signup URL) and to `detectProviderFromKey`.
4. Update this doc and PROJECT_STATUS with the new provider and any free-tier notes.
