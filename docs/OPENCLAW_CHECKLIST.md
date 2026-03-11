# OpenClaw Setup Checklist

Step-by-step checklist to get Nava working from WhatsApp, iMessage, Signal, etc. via OpenClaw.

**No signup required for OpenClaw** — it's software you install and run locally. You *do* need a Nava account (for the API key) and whatever OpenClaw uses to connect to your messaging app (e.g. linking WhatsApp).

---

## Prerequisites

- [ ] **Node 22+** (OpenClaw requires it)
- [ ] **Nava account** (to get the API key)
- [ ] **Supabase project URL** for your Nava deployment (e.g. `https://xxx.supabase.co`)

---

## Checklist

### 1. Install OpenClaw

```bash
npm install -g openclaw@latest
```

If `openclaw` is not found, add npm global bin to PATH:

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

### 2. Run the setup script (from this repo)

```bash
cd /path/to/cityhelper
./scripts/setup-openclaw.sh
```

This installs the Nava plugin and creates `~/.openclaw/extensions`.

### 3. Get your Nava API key

1. Open **Nava** → **Settings** → **OpenClaw & API**
2. Copy the **API URL** (e.g. `https://YOUR-PROJECT.supabase.co/functions/v1/nava-api`)
3. Click **Generate API key** and copy it (shown only once; store it safely)

### 4. Configure OpenClaw

Edit `~/.openclaw/config.yaml` (create it if it doesn’t exist) and add:

```yaml
plugins:
  entries:
    nava:
      enabled: true
      config:
        api_url: "https://YOUR-PROJECT.supabase.co/functions/v1/nava-api"
        api_key: "nava_xxxx..."
```

Replace `YOUR-PROJECT` and `nava_xxxx...` with your values.

### 5. Enable Nava tools for your agent

In the same config file (or wherever your agent is defined), add the Nava tools to the agent’s allowlist:

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
          # Or enable all: - nava
```

### 6. Connect your messaging app (WhatsApp, etc.)

OpenClaw uses adapters/connectors for each messaging platform. Follow OpenClaw’s docs for your platform:

- **WhatsApp**: Typically involves running the gateway and linking your number (e.g. QR code or similar). Check [OpenClaw documentation](https://github.com/openclaw-ai/openclaw) for the current flow.
- **iMessage, Signal**: Same — see OpenClaw docs for each adapter.

You do **not** need to sign up for Facebook/WhatsApp Business API for personal use with OpenClaw.

### 7. Start the gateway

```bash
openclaw gateway
```

Keep this running. When someone messages your linked number/channel, OpenClaw will forward to Nava using your API key.

---

## Quick reference: Nava tools

| Tool | Description |
|------|-------------|
| `nava_add_item` | Add a compliance item |
| `nava_list_items` | List all items |
| `nava_get_upcoming` | Items due in next 30 days |
| `nava_update_item` | Update due date, name, notes |
| `nava_delete_item` | Delete an item |
| `nava_mark_done` | Mark done |
| `nava_snooze_item` | Snooze 1, 3, or 7 days |
| `nava_filter_items` | Filter by category |
| `nava_get_completed` | Recently completed items |
| `nava_get_application_guide` | Government application guides |

---

## Appendix: Server AI — Groq vs OpenRouter (free tier only)

When **you** provide the AI (users don’t bring their own key), you use a server-side key. For free tier only:

| | **Groq** | **OpenRouter** |
|---|----------|----------------|
| **Signup** | [console.groq.com](https://console.groq.com) | [openrouter.ai](https://openrouter.ai) |
| **Free limits** | ~14,400 req/day (Llama 3.1 8B), 1,000/day (70B) | ~200 req/day per model, 20 req/min |
| **Models** | Llama (Meta), Mixtral, etc. | 27+ free models (Llama, Gemini, Mistral, Qwen, etc.) |
| **Has Grok (xAI)?** | No (Groq ≠ Grok; Groq hosts Llama) | No |
| **Vision (scan)** | Yes (Llama 4 Scout) | Yes (e.g. Gemini, Llama) |
| **Tool calling (chat)** | Yes | Yes |

**Recommendation for free-tier-only setup:**

- **Groq** — better choice for primary: higher free limits (14k+ vs 200/day), fast inference, one key. Use `GROQ_API_KEY` in Supabase Edge Function secrets.
- **OpenRouter** — useful as *backup* when Groq has 5xx (already wired in ai-scan/ai-chat). Set `OPENROUTER_API_KEY` for redundancy. Or use OpenRouter as primary if you prefer one dashboard for many models; just be aware of the 200/day free limit per model.

**Same AI for scan + chat:** Yes. Nava uses the same server key (and provider) for both document scanning and chat when the user has no key. Groq supports vision and tool calling; OpenRouter can route to models that do both.
