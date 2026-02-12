// Web Push: native browser API, no OneSignal. Fast and reliable.

import { supabase } from './supabase'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || ''

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const output = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) output[i] = rawData.charCodeAt(i)
  return output
}

async function getSwRegistration() {
  if (!('serviceWorker' in navigator)) return null
  const reg = await navigator.serviceWorker.getRegistration()
  if (reg) return reg
  return navigator.serviceWorker.register('/sw.js', { scope: '/' })
}

/** No-op for compatibility; Web Push doesn't need preloading. */
export function preloadPushSDK() {}

/**
 * Enable push: permission → subscribe → save. No third-party, usually &lt; 2s.
 * @returns {{ success: boolean, reason?: 'denied' | 'timeout' }}
 */
export async function requestPushPermission(userId) {
  // Step 1: Check VAPID key
  if (!VAPID_PUBLIC_KEY) {
    return { success: false, reason: 'denied', detail: 'VAPID key not configured. Check .env file.' }
  }

  // Step 2: Check browser support
  if (typeof Notification === 'undefined') {
    return { success: false, reason: 'denied', detail: 'This browser does not support notifications.' }
  }
  if (!('serviceWorker' in navigator)) {
    return { success: false, reason: 'denied', detail: 'This browser does not support service workers (required for push).' }
  }
  if (!('PushManager' in window)) {
    return { success: false, reason: 'denied', detail: 'This browser does not support push notifications. Try Chrome or Edge.' }
  }

  try {
    // Step 3: Request permission
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      return { success: false, reason: 'denied', detail: `Browser permission is "${permission}". If you blocked it, go to browser Settings > Site Settings > Notifications and allow this site.` }
    }

    // Step 4: Register service worker
    const reg = await getSwRegistration()
    if (!reg) {
      return { success: false, reason: 'timeout', detail: 'Service worker failed to register. Try reloading the page.' }
    }

    // Step 5: Subscribe to push
    const existing = await reg.pushManager.getSubscription()
    let subscription = existing
    if (!subscription) {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })
    }

    // Step 6: Save to database
    const subscriptionJson = subscription.toJSON()
    const { error: upsertError } = await supabase.from('user_settings').upsert(
      {
        user_id: userId,
        push_subscription: subscriptionJson,
        push_enabled: true,
      },
      { onConflict: 'user_id' }
    )
    if (upsertError) {
      console.error('Push upsert failed:', upsertError)
      return { success: false, reason: 'timeout', detail: `Database save failed: ${upsertError.message}` }
    }

    return { success: true }
  } catch (err) {
    console.error('Push subscribe error:', err)
    const detail = err.message || String(err)
    return { success: false, reason: err.name === 'NotAllowedError' ? 'denied' : 'timeout', detail }
  }
}

export async function disablePush(userId) {
  if (userId) {
    await supabase
      .from('user_settings')
      .update({ push_enabled: false, push_subscription: null })
      .eq('user_id', userId)
  }
  try {
    const reg = await getSwRegistration()
    if (reg) {
      const sub = await reg.pushManager.getSubscription()
      if (sub) await sub.unsubscribe()
    }
  } catch { /* ignore */ }
}

export async function isPushEnabled() {
  return false // UI uses DB push_enabled from fetchSettings
}
