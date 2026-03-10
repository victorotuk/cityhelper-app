// Smart deadline-aware reminder system with escalating urgency.
// Checks each user's compliance items and sends specific notifications
// about what's due, with increasing frequency as deadlines approach.

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

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const APP_NAME = Deno.env.get('APP_NAME') || 'Nava'
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'noreply@vicomnava.com'

async function sendAlertEmail(to: string, itemName: string, daysUntil: number, emoji: string): Promise<boolean> {
  if (!RESEND_API_KEY) return false
  const status = daysUntil < 0
    ? `${Math.abs(daysUntil)} day${Math.abs(daysUntil) === 1 ? '' : 's'} overdue`
    : daysUntil === 0 ? 'due today' : `due in ${daysUntil} day${daysUntil === 1 ? '' : 's'}`
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: `${APP_NAME} Alerts <${FROM_EMAIL}>`,
        to,
        subject: `${emoji} ${itemName} is ${status}`,
        html: `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px 20px;background:#0a0a0c;color:#f5f5f4;">
          <h2 style="color:#e8c47c;margin:0 0 12px">${emoji} ${itemName}</h2>
          <p style="font-size:16px;margin:0 0 20px;color:#a1a1a6;">This item is <strong style="color:#f5f5f4">${status}</strong>.</p>
          <p style="color:#6b6b70;font-size:12px;margin:0;">You were added as an alert recipient on ${APP_NAME}.</p>
        </div>`
      })
    })
    return res.ok
  } catch { return false }
}

// Urgency levels determine how often we bug the user
// and what the message tone is
function getUrgency(daysUntilDue: number): {
  level: 'overdue' | 'critical' | 'urgent' | 'warning' | 'upcoming' | 'none'
  shouldNotify: boolean
  minHoursBetweenNotifs: number
  emoji: string
} {
  if (daysUntilDue < 0) {
    return { level: 'overdue', shouldNotify: true, minHoursBetweenNotifs: 12, emoji: '🚨' }
  }
  if (daysUntilDue <= 1) {
    return { level: 'critical', shouldNotify: true, minHoursBetweenNotifs: 6, emoji: '⚠️' }
  }
  if (daysUntilDue <= 3) {
    return { level: 'critical', shouldNotify: true, minHoursBetweenNotifs: 12, emoji: '⚠️' }
  }
  if (daysUntilDue <= 7) {
    return { level: 'urgent', shouldNotify: true, minHoursBetweenNotifs: 24, emoji: '⏰' }
  }
  if (daysUntilDue <= 14) {
    return { level: 'warning', shouldNotify: true, minHoursBetweenNotifs: 48, emoji: '📋' }
  }
  if (daysUntilDue <= 30) {
    return { level: 'upcoming', shouldNotify: true, minHoursBetweenNotifs: 168, emoji: '📅' }
  }
  return { level: 'none', shouldNotify: false, minHoursBetweenNotifs: 999, emoji: '' }
}

function buildMessage(items: Array<{ name: string; category: string; daysUntil: number }>): {
  title: string
  body: string
} {
  if (items.length === 0) {
    return { title: '', body: '' }
  }

  const overdue = items.filter(i => i.daysUntil < 0)
  const critical = items.filter(i => i.daysUntil >= 0 && i.daysUntil <= 3)
  const urgent = items.filter(i => i.daysUntil > 3 && i.daysUntil <= 7)
  const warning = items.filter(i => i.daysUntil > 7)

  // Pick the most urgent item for the title
  const top = overdue[0] || critical[0] || urgent[0] || warning[0]
  const daysText = top.daysUntil < 0
    ? `${Math.abs(top.daysUntil)} day${Math.abs(top.daysUntil) === 1 ? '' : 's'} overdue`
    : top.daysUntil === 0
    ? 'due TODAY'
    : top.daysUntil === 1
    ? 'due TOMORROW'
    : `due in ${top.daysUntil} days`

  const { emoji } = getUrgency(top.daysUntil)
  const title = `${emoji} ${top.name} is ${daysText}`

  // Build body with summary of other items
  const parts: string[] = []
  if (overdue.length > 1) parts.push(`${overdue.length - (top.daysUntil < 0 ? 1 : 0)} more overdue`)
  if (critical.length > (top.daysUntil >= 0 && top.daysUntil <= 3 ? 1 : 0))
    parts.push(`${critical.length - (top.daysUntil >= 0 && top.daysUntil <= 3 ? 1 : 0)} due within 3 days`)
  if (urgent.length > 0) parts.push(`${urgent.length} due this week`)
  if (warning.length > 0) parts.push(`${warning.length} coming up`)

  const body = parts.length > 0
    ? `Plus: ${parts.join(', ')}. Tap to review.`
    : 'Tap to review your deadlines.'

  return { title, body }
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
      contactInformation: Deno.env.get('APP_SUPPORT_EMAIL') || 'mailto:support@vicomnava.com',
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
      throw e // caller handles 410 Gone
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
    const results = { push_sent: 0, in_app_sent: 0, users_checked: 0, items_checked: 0 }

    // Get all users with push enabled
    const { data: users, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('push_enabled', true)
      .not('push_subscription', 'is', null)

    if (error) throw new Error(`Failed to fetch users: ${error.message}`)
    results.users_checked = users?.length ?? 0

    if (!appServer || !users?.length) {
      return new Response(
        JSON.stringify({ success: true, ...results, timestamp: now.toISOString() }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    for (const user of users) {
      const sub = user.push_subscription as {
        endpoint: string
        keys: { p256dh: string; auth: string }
      } | null
      if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) continue

      const { data: items } = await supabase
        .from('compliance_items')
        .select('id, name, category, due_date, status, snooze_until, alert_emails')
        .eq('user_id', user.user_id)
        .not('due_date', 'is', null)
        .in('status', ['active', 'pending', null])

      if (!items?.length) continue
      results.items_checked += items.length

      // Filter out snoozed items
      const nowIso = now.toISOString()
      const notSnoozed = items.filter(
        (i: { snooze_until?: string | null }) => !i.snooze_until || i.snooze_until <= nowIso
      )

      // Calculate urgency for each item
      const actionableItems = notSnoozed
        .map(item => {
          const dueDate = new Date(item.due_date)
          const daysUntil = Math.floor(
            (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          )
          const urgency = getUrgency(daysUntil)
          return { ...item, daysUntil, urgency }
        })
        .filter(item => item.urgency.shouldNotify)
        .sort((a, b) => a.daysUntil - b.daysUntil)

      if (actionableItems.length === 0) continue

      // Check the most urgent item's notification threshold
      const mostUrgent = actionableItems[0]
      const lastPushSent = user.last_push_sent ? new Date(user.last_push_sent) : null
      const hoursSincePush = lastPushSent
        ? (now.getTime() - lastPushSent.getTime()) / (1000 * 60 * 60)
        : 999

      if (hoursSincePush < mostUrgent.urgency.minHoursBetweenNotifs) continue

      // Build and send the notification
      const { title, body } = buildMessage(
        actionableItems.map(i => ({ name: i.name, category: i.category, daysUntil: i.daysUntil }))
      )

      if (!title) continue

      try {
        const sent = await sendWebPush(appServer, sub, title, body)
        if (sent) {
          results.push_sent++
          await supabase
            .from('user_settings')
            .update({ last_push_sent: now.toISOString() })
            .eq('user_id', user.user_id)

          await supabase.from('notifications').insert({
            user_id: user.user_id,
            title,
            message: body,
            type: mostUrgent.urgency.level === 'overdue' || mostUrgent.urgency.level === 'critical'
              ? 'urgent' : 'reminder',
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

      // Multi-recipient email alerts for items with alert_emails
      for (const item of actionableItems) {
        const emails = (item as { alert_emails?: string[] | null }).alert_emails
        if (!emails?.length) continue
        for (const addr of emails) {
          await sendAlertEmail(addr, item.name, item.daysUntil, item.urgency.emoji)
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
