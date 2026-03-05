# Nava Plugin for OpenClaw

Use Nava from messaging apps (WhatsApp, iMessage, Signal, etc.) via OpenClaw.

## Setup

### 1. Get your Nava API key

1. Open Nava → **Settings** → **OpenClaw & API**
2. Copy the **API URL**
3. Click **Generate API key** and copy the key (it’s shown only once)

### 2. Install the plugin

```bash
# From the cityhelper repo
openclaw plugins install ./openclaw-nava

# Or link for development (no copy)
openclaw plugins install -l ./openclaw-nava
```

### 3. Configure

Add to your OpenClaw config (`~/.openclaw/config.yaml` or equivalent):

```yaml
plugins:
  entries:
    nava:
      enabled: true
      config:
        api_url: "https://YOUR-PROJECT.supabase.co/functions/v1/nava-api"
        api_key: "nava_xxxx..."
```

### 4. Enable tools for your agent

Nava tools are optional. Add them to your agent’s tool allowlist:

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
          # Or enable all Nava tools:
          # - nava
```

### 5. Restart OpenClaw

```bash
openclaw gateway
```

## Tools

| Tool | Description |
|------|-------------|
| `nava_add_item` | Add a compliance item (renewal, bill, deadline) |
| `nava_list_items` | List all items |
| `nava_get_upcoming` | Items due in next 30 days |
| `nava_update_item` | Update due date, name, notes |
| `nava_delete_item` | Delete an item |
| `nava_mark_done` | Mark done (recurring items get next due date) |
| `nava_snooze_item` | Snooze reminders 1, 3, or 7 days |
| `nava_filter_items` | Filter by category |
| `nava_get_completed` | Recently completed items |
| `nava_get_application_guide` | Government application guides (work permit, etc.) |
