# Web Push setup (no OneSignal)

Push uses the browser’s native Web Push API. One-time setup:

## 1. Run migration

```bash
supabase db push
# or apply supabase/migrations/007_web_push.sql in the SQL editor
```

## 2. Generate VAPID keys (already done once)

Keys were generated and `.env` was updated. If you need to regenerate:

```bash
node scripts/generate-vapid-keys.mjs
```

## 3. Frontend env

In `.env`:

- Remove `VITE_ONESIGNAL_APP_ID` (no longer used).
- Add the public key from the script output:
  ```
  VITE_VAPID_PUBLIC_KEY=<the long base64url string>
  ```

## 4. Supabase secrets

Set the full VAPID JSON for the send-reminders function:

```bash
supabase secrets set VAPID_KEYS_JSON='{"publicKey":{...},"privateKey":{...}}'
```

Use the exact JSON from the script output (one line, no line breaks).

## 5. Deploy send-reminders

```bash
supabase functions deploy send-reminders
```

After this, “Turn on” in Settings uses the browser’s permission prompt and subscribes in a couple of seconds with no third-party SDK.
