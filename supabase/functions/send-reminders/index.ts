// Supabase Edge Function: Send Push Notifications
// Uses OneSignal for push notifications
// Runs daily, sends push if user inactive for 2+ days

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Send Push Notification via OneSignal
async function sendPushNotification(playerIds: string[], title: string, message: string) {
  const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID')
  const ONESIGNAL_API_KEY = Deno.env.get('ONESIGNAL_API_KEY')

  if (!ONESIGNAL_APP_ID || !ONESIGNAL_API_KEY) {
    console.log('OneSignal not configured, skipping push')
    return false
  }

  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_player_ids: playerIds,
        headings: { en: title },
        contents: { en: message },
        // iOS specific
        ios_badgeType: 'Increase',
        ios_badgeCount: 1,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('OneSignal error:', error)
      return false
    }

    console.log(`Push sent to ${playerIds.length} users`)
    return true
  } catch (err) {
    console.error('Push failed:', err)
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

    const now = new Date()
    const results = { push_sent: 0, in_app_sent: 0, users_checked: 0 }

    // Get users with push enabled and their OneSignal player IDs
    const { data: users, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('push_enabled', true)
      .not('onesignal_player_id', 'is', null)

    if (error) throw new Error(`Failed to fetch users: ${error.message}`)

    results.users_checked = users?.length || 0

    for (const user of users || []) {
      const lastActive = new Date(user.last_active || user.created_at)
      const daysSinceActive = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24))

      // Only notify if inactive for 2+ days
      if (daysSinceActive < 2) continue

      // Check when we last sent a push (don't spam - max once per 2 days)
      const lastPushSent = user.last_push_sent ? new Date(user.last_push_sent) : null
      const daysSincePush = lastPushSent 
        ? Math.floor((now.getTime() - lastPushSent.getTime()) / (1000 * 60 * 60 * 24))
        : 999

      if (daysSincePush < 2) continue

      // Send push notification
      const sent = await sendPushNotification(
        [user.onesignal_player_id],
        '🍁 CityHelper',
        'You have upcoming deadlines. Tap to check.'
      )

      if (sent) {
        results.push_sent++
        
        // Update last_push_sent
        await supabase
          .from('user_settings')
          .update({ last_push_sent: now.toISOString() })
          .eq('user_id', user.user_id)

        // Also add in-app notification
        await supabase.from('notifications').insert({
          user_id: user.user_id,
          title: 'Check your deadlines',
          message: 'You have upcoming compliance deadlines.',
          type: 'reminder'
        })
        results.in_app_sent++
      }
    }

    return new Response(
      JSON.stringify({ success: true, ...results, timestamp: now.toISOString() }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Error:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
