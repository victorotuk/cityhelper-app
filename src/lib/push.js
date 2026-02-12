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
  if (!VAPID_PUBLIC_KEY) return { success: false, reason: 'timeout' }
  if (typeof Notification === 'undefined') return { success: false, reason: 'denied' }

  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return { success: false, reason: 'denied' }

    const reg = await getSwRegistration()
    if (!reg) return { success: false, reason: 'timeout' }

    const existing = await reg.pushManager.getSubscription()
    let subscription = existing
    if (!subscription) {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })
    }

    const subscriptionJson = subscription.toJSON()
    await supabase.from('user_settings').upsert(
      {
        user_id: userId,
        push_subscription: subscriptionJson,
        push_enabled: true,
      },
      { onConflict: 'user_id' }
    )
    return { success: true }
  } catch (err) {
    console.error('Push subscribe error:', err)
    return { success: false, reason: err.name === 'NotAllowedError' ? 'denied' : 'timeout' }
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
