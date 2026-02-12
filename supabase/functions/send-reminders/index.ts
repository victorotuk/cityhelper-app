// Send Web Push notifications (no OneSignal). Uses @negrel/webpush.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  ApplicationServer,
  importVapidKeys,
  type ExportedVapidKeys,
  PushMessageError,
} from 'jsr:@negrel/webpush@0.5'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function getAppServer(): Promise<ApplicationServer | null> {
  const vapidJson = Deno.env.get('VAPID_KEYS_JSON')
  if (!vapidJson) {
    console.log('VAPID_KEYS_JSON not set, skipping push')
    return null
  }
  try {
    const vapidKeys = importVapidKeys(JSON.parse(vapidJson) as ExportedVapidKeys)
    return await ApplicationServer.new({
      contactInformation: 'mailto:support@cityhelper.app',
      vapidKeys,
    })
  } catch (e) {
    console.error('ApplicationServer init failed:', e)
    return null
  }
}

async function sendWebPush(
  appServer: ApplicationServer,
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  title: string,
  body: string
): Promise<boolean> {
  try {
    const subscriber = appServer.subscribe(subscription)
    await subscriber.pushTextMessage(JSON.stringify({ title, body }), {})
    return true
  } catch (e) {
    if (e instanceof PushMessageError && e.isGone()) {
      // 410 Gone = subscription expired, caller should clear it
      throw e
    }
    console.error('Web push send failed:', e)
    return false
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const appServer = await getAppServer()
    const now = new Date()
    const results = { push_sent: 0, in_app_sent: 0, users_checked: 0 }

    const { data: users, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('push_enabled', true)
      .not('push_subscription', 'is', null)

    if (error) throw new Error(`Failed to fetch users: ${error.message}`)
    results.users_checked = users?.length ?? 0

    if (!appServer) {
      return new Response(
        JSON.stringify({ success: true, ...results, timestamp: now.toISOString() }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    for (const user of users ?? []) {
      const lastActive = new Date(user.last_active || user.created_at)
      const daysSinceActive = Math.floor(
        (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
      )
      if (daysSinceActive < 2) continue

      const lastPushSent = user.last_push_sent ? new Date(user.last_push_sent) : null
      const daysSincePush = lastPushSent
        ? Math.floor(
            (now.getTime() - lastPushSent.getTime()) / (1000 * 60 * 60 * 24)
          )
        : 999
      if (daysSincePush < 2) continue

      const sub = user.push_subscription as {
        endpoint: string
        keys: { p256dh: string; auth: string }
      } | null
      if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) continue

      try {
        const sent = await sendWebPush(
          appServer,
          sub,
          '🍁 CityHelper',
          'You have upcoming deadlines. Tap to check.'
        )
        if (sent) {
          results.push_sent++
          await supabase
            .from('user_settings')
            .update({ last_push_sent: now.toISOString() })
            .eq('user_id', user.user_id)
          await supabase.from('notifications').insert({
            user_id: user.user_id,
            title: 'Check your deadlines',
            message: 'You have upcoming compliance deadlines.',
            type: 'reminder',
          })
          results.in_app_sent++
        }
      } catch (e) {
        if (e instanceof PushMessageError && e.isGone()) {
          await supabase
            .from('user_settings')
            .update({ push_subscription: null })
            .eq('user_id', user.user_id)
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, ...results, timestamp: now.toISOString() }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Error:', err)
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
