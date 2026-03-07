// Weekly digest email - sends summary of upcoming deadlines
// Run via cron: 0 9 * * 1 (Mondays 9am UTC) or similar

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const APP_NAME = Deno.env.get('APP_NAME') || 'Nava'
const APP_URL = Deno.env.get('APP_URL') || 'https://nava.ai'
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

function getDigestDay(day: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[day] || 'Monday'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY not set' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      })
    }

    const now = new Date()
    const todayDay = now.getDay() // 0=Sun, 1=Mon, ...

    // Get users who want digest today
    const { data: users } = await supabase
      .from('user_settings')
      .select('user_id, digest_day, last_digest_sent')
      .eq('digest_email_enabled', true)

    if (!users?.length) {
      return new Response(JSON.stringify({ sent: 0, message: 'No users with digest enabled' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get email from auth.users
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    const emailMap = new Map<string, string>()
    authUsers?.users?.forEach(u => {
      if (u.email) emailMap.set(u.id, u.email)
    })

    let sent = 0
    for (const u of users) {
      if (u.digest_day !== todayDay) continue

      // Throttle: don't send if we sent in last 6 days
      const lastSent = u.last_digest_sent ? new Date(u.last_digest_sent) : null
      if (lastSent && (now.getTime() - lastSent.getTime()) < 6 * 24 * 60 * 60 * 1000) continue

      const email = emailMap.get(u.user_id)
      if (!email) continue

      // Get items (exclude snoozed)
      const nowIso = now.toISOString()
      const { data: items } = await supabase
        .from('compliance_items')
        .select('id, name, category, due_date, status')
        .eq('user_id', u.user_id)
        .not('due_date', 'is', null)
        .in('status', ['active', 'pending', null])
        .or(`snooze_until.is.null,snooze_until.lte.${nowIso}`)
        .order('due_date', { ascending: true })
        .limit(20)

      if (!items?.length) continue

      const overdue = items.filter(i => new Date(i.due_date) < now)
      const upcoming = items.filter(i => new Date(i.due_date) >= now).slice(0, 10)

      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px; background: #0a0a0c; color: #f5f5f4;">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 36px;">🍁</span>
            <h1 style="color: #e8c47c; font-size: 24px; margin: 16px 0 8px;">Your ${getDigestDay(todayDay)} Digest</h1>
            <p style="color: #a1a1a6; margin: 0;">${APP_NAME} — Upcoming deadlines</p>
          </div>
          ${overdue.length > 0 ? `
            <div style="margin-bottom: 24px; padding: 16px; background: rgba(220, 38, 38, 0.15); border-radius: 8px; border-left: 4px solid #dc2626;">
              <h3 style="margin: 0 0 8px; color: #dc2626;">Overdue (${overdue.length})</h3>
              <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
                ${overdue.slice(0, 5).map(i => `<li>${i.name} — ${i.due_date}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          <div style="margin-bottom: 24px;">
            <h3 style="margin: 0 0 12px; color: #e8c47c;">Coming up</h3>
            <ul style="margin: 0; padding-left: 20px; line-height: 1.8; color: #a1a1a6;">
              ${upcoming.map(i => `<li>${i.name} — ${i.due_date}</li>`).join('')}
            </ul>
          </div>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${APP_URL}/dashboard" style="display: inline-block; padding: 14px 32px; background: #e8c47c; color: #0a0a0c; text-decoration: none; border-radius: 8px; font-weight: 600;">Open ${APP_NAME}</a>
          </div>
          <p style="color: #6b6b70; font-size: 12px; text-align: center;">Turn off in Settings → Smart Suggestions</p>
        </div>
      `

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: `${APP_NAME} <${Deno.env.get('FROM_EMAIL') || 'noreply@resend.dev'}>`,
          to: email,
          subject: `🍁 Your ${getDigestDay(todayDay)} digest — ${items.length} items to track`,
          html
        })
      })

      if (res.ok) {
        sent++
        await supabase.from('user_settings').update({
          last_digest_sent: now.toISOString()
        }).eq('user_id', u.user_id)
      }
    }

    return new Response(JSON.stringify({ sent, total: users.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})
