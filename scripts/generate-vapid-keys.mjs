#!/usr/bin/env node
/**
 * Generate VAPID keys for Web Push (Node). Compatible with @negrel/webpush importVapidKeys.
 * Run: node scripts/generate-vapid-keys.mjs
 */
import crypto from 'crypto'

const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
  namedCurve: 'P-256',
  publicKeyEncoding: { type: 'spki', format: 'der' },
  privateKeyEncoding: { type: 'pkcs8', format: 'der' },
})

// Export as JWK for @negrel/webpush (need raw key objects)
const pubKeyObject = crypto.createPublicKey({ key: publicKey, format: 'der', type: 'spki' })
const privKeyObject = crypto.createPrivateKey({ key: privateKey, format: 'der', type: 'pkcs8' })
const publicJwk = pubKeyObject.export({ format: 'jwk' })
const privateJwk = privKeyObject.export({ format: 'jwk' })

const exported = { publicKey: publicJwk, privateKey: privateJwk }

// Application server key = uncompressed point (04 || x || y) as base64url
const rawPub = pubKeyObject.export({ type: 'spki', format: 'der' })
const spki = crypto.createPublicKey({ key: rawPub, format: 'der', type: 'spki' })
const jwk = spki.export({ format: 'jwk' })
const x = Buffer.from(jwk.x, 'base64url')
const y = Buffer.from(jwk.y, 'base64url')
const uncompressed = Buffer.concat([Buffer.from([0x04]), x, y])
const base64url = uncompressed.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

console.log('\n1. Add to .env (replace existing VITE_ONESIGNAL_APP_ID or add):\n')
console.log(`VITE_VAPID_PUBLIC_KEY=${base64url}`)
console.log('\n2. Set Supabase secret (copy the line below; run in terminal):\n')
console.log(`supabase secrets set VAPID_KEYS_JSON='${JSON.stringify(exported)}'`)
console.log('')
