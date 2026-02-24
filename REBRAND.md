# Rebranding the App

When you change the app name, update **two places**:

## 1. Client app (UI, landing, dashboard, etc.)

Edit `src/lib/config.js`:

```js
name: "YourNewName",
```

This updates everywhere in the React app.

## 2. Supabase Edge Functions (SMS, email, AI, push)

Set these secrets in Supabase (Dashboard → Project Settings → Edge Functions → Secrets):

```bash
# Required for rebrand
supabase secrets set APP_NAME="YourNewName"

# Optional (if your domain changes)
supabase secrets set APP_URL="https://yourapp.com"
supabase secrets set APP_SUPPORT_EMAIL="mailto:support@yourapp.com"
```

Then redeploy the functions:

```bash
supabase functions deploy send-sms
supabase functions deploy send-email
supabase functions deploy ai-chat
supabase functions deploy chat
supabase functions deploy send-reminders
```

Or deploy all at once:

```bash
supabase functions deploy
```

---

**Summary:** Change `config.js` + set `APP_NAME` secret + redeploy functions.
