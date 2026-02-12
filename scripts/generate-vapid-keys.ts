/**
 * Generate VAPID keys for Web Push (run once with Deno).
 * Run: deno run --allow-env scripts/generate-vapid-keys.ts
 *
 * Then:
 * 1. Add VITE_VAPID_PUBLIC_KEY to .env (use the "Public key (base64url)" line)
 * 2. Add VAPID_KEYS_JSON to Supabase secrets (use the full JSON object):
 *    supabase secrets set VAPID_KEYS_JSON='{"publicKey":...,"privateKey":...}'
 */
import { exportApplicationServerKey, exportVapidKeys, generateVapidKeys } from 'jsr:@negrel/webpush@0.5'

const keys = generateVapidKeys()
const exported = exportVapidKeys(keys)
const publicBase64 = exportApplicationServerKey(keys.publicKey)

console.log('\n1. Add to your .env file:\n')
console.log(`VITE_VAPID_PUBLIC_KEY=${publicBase64}`)
console.log('\n2. Set Supabase secret (one line, no line breaks):\n')
console.log(`supabase secrets set VAPID_KEYS_JSON='${JSON.stringify(exported)}'`)
console.log('')
