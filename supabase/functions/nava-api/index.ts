// Nava API — HTTP API for OpenClaw and other integrations
// Auth: Bearer <nava_api_key>
// Body: { action: string, params?: object }

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const CATEGORIES = 'subscriptions, parking, driving, tax, health, legal_court, housing, immigration, credit_banking, personal_insurance, education, trust, kids_family, business_tax, assets, other'

const APPLICATION_GUIDES: Record<string, { name: string; url: string; applyUrl: string; processingTime: string; fee: string; steps: string[] }> = {
  work_permit: {
    name: 'Work Permit',
    url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/work-canada/permit.html',
    applyUrl: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/application/account.html',
    processingTime: '2-16 weeks',
    fee: '$155',
    steps: ['Create IRCC account', 'Complete application form', 'Upload supporting documents (passport, job offer, LMIA if required)', 'Pay fee', 'Submit and track status'],
  },
  study_permit: {
    name: 'Study Permit',
    url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit.html',
    applyUrl: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/application/account.html',
    processingTime: '4-16 weeks',
    fee: '$150',
    steps: ['Get letter of acceptance from DLI', 'Create IRCC account', 'Complete application', 'Upload documents (passport, proof of funds)', 'Pay fee', 'Submit and may need biometrics'],
  },
  visitor_visa: {
    name: 'Visitor Visa (TRV)',
    url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada.html',
    applyUrl: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/application/account.html',
    processingTime: '2-8 weeks',
    fee: '$100',
    steps: ['Create IRCC account', 'Complete application', 'Upload passport and proof of ties to home country', 'Pay fee', 'Submit'],
  },
  pr_card: {
    name: 'PR Card Renewal',
    url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/new-immigrants/pr-card.html',
    applyUrl: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/application/account.html',
    processingTime: '6-12 weeks',
    fee: '$50',
    steps: ['Create IRCC account', 'Complete PR card renewal form', 'Upload photo and documents', 'Pay fee', 'Submit'],
  },
}

async function sha256Hex(text: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function resolveUserFromApiKey(supabase: any, apiKey: string): Promise<{ id: string } | null> {
  const keyHash = await sha256Hex(apiKey)
  const { data } = await supabase.from('nava_api_keys').select('user_id').eq('key_hash', keyHash).single()
  return data ? { id: data.user_id } : null
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    const apiKey = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Missing or invalid Authorization header. Use: Bearer <your_api_key>' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
    const user = await resolveUserFromApiKey(supabase, apiKey)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid API key' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed. Use POST with { action, params }' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json().catch(() => ({}))
    const action = body?.action
    const args = body?.params ?? body ?? {}

    if (!action || typeof action !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing "action" in request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let result: any
    try {
      if (action === 'add_item') {
        const { data: d } = await supabase.from('compliance_items').insert({
          user_id: user.id,
          name: args.name || 'Untitled',
          category: args.category || 'other',
          due_date: args.due_date || null,
          notes: args.notes || null,
          recurrence_interval: args.recurrence_interval || null,
          status: 'active',
          country: args.country || null,
          encrypted_data: null,
          created_at: new Date().toISOString(),
        }).select('id, name, category, due_date, country').single()
        result = { success: true, item: d, message: `Added "${d?.name}"` }
      } else if (action === 'list_items') {
        const { data: items } = await supabase.from('compliance_items')
          .select('id, name, category, due_date')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('due_date', { ascending: true, nullsFirst: false })
        result = { items: items || [], count: (items || []).length }
      } else if (action === 'get_upcoming') {
        const today = new Date().toISOString().slice(0, 10)
        const limit = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10)
        const { data: items } = await supabase.from('compliance_items')
          .select('id, name, category, due_date')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .gte('due_date', today)
          .lte('due_date', limit)
          .order('due_date', { ascending: true })
        result = { items: items || [], count: (items || []).length }
      } else if (action === 'update_item') {
        const updates: any = { updated_at: new Date().toISOString() }
        if (args.due_date) updates.due_date = args.due_date
        if (args.name) updates.name = args.name
        if (args.notes !== undefined) updates.notes = args.notes
        if (args.recurrence_interval) updates.recurrence_interval = args.recurrence_interval
        if (args.alert_emails) {
          const emails = String(args.alert_emails).split(/[\s,;]+/).filter(Boolean)
          updates.alert_emails = emails.length ? emails : null
        }
        const { data: d } = await supabase.from('compliance_items')
          .update(updates)
          .eq('id', args.item_id)
          .eq('user_id', user.id)
          .select('id, name, due_date')
          .single()
        result = { success: !!d, item: d }
      } else if (action === 'delete_item') {
        const { error: delErr } = await supabase.from('compliance_items').delete().eq('id', args.item_id).eq('user_id', user.id)
        if (delErr) throw delErr
        result = { success: true, message: 'Item deleted' }
      } else if (action === 'mark_done') {
        const { data: item } = await supabase.from('compliance_items')
          .select('id, recurrence_interval, due_date')
          .eq('id', args.item_id)
          .eq('user_id', user.id)
          .single()
        if (!item) throw new Error('Item not found')
        const now = new Date()
        let nextDue: string | null = null
        if (item.recurrence_interval) {
          const d = new Date()
          if (item.recurrence_interval === '1_month') d.setMonth(d.getMonth() + 1)
          else if (item.recurrence_interval === '3_months') d.setMonth(d.getMonth() + 3)
          else if (item.recurrence_interval === '6_months') d.setMonth(d.getMonth() + 6)
          else if (item.recurrence_interval === '1_year') d.setFullYear(d.getFullYear() + 1)
          nextDue = d.toISOString().slice(0, 10)
        }
        const updates: any = { last_completed_at: now.toISOString(), snooze_until: null, updated_at: now.toISOString() }
        if (nextDue) updates.due_date = nextDue
        const { data: d } = await supabase.from('compliance_items')
          .update(updates)
          .eq('id', args.item_id)
          .eq('user_id', user.id)
          .select('id, name, due_date, last_completed_at')
          .single()
        result = { success: true, item: d, message: nextDue ? `Done! Next due ${nextDue}` : 'Marked as done' }
      } else if (action === 'snooze_item') {
        const days = Math.min(7, Math.max(1, Number(args.days) || 1))
        const until = new Date(Date.now() + days * 864e5).toISOString()
        const { data: d } = await supabase.from('compliance_items')
          .update({ snooze_until: until, updated_at: new Date().toISOString() })
          .eq('id', args.item_id)
          .eq('user_id', user.id)
          .select('id, name, snooze_until')
          .single()
        result = { success: !!d, message: `Snoozed for ${days} day${days > 1 ? 's' : ''}` }
      } else if (action === 'share_item') {
        const emailTrim = String(args.email || '').trim().toLowerCase()
        if (!emailTrim) throw new Error('Email is required')
        const { data: item } = await supabase.from('compliance_items')
          .select('id, user_id')
          .eq('id', args.item_id)
          .eq('user_id', user.id)
          .single()
        if (!item) throw new Error('Item not found')
        const { data: targetList } = await supabase.rpc('get_user_id_by_email', { lookup_email: emailTrim })
        const target = targetList?.[0]
        if (!target) result = { error: 'No Nava account found with that email. They need to sign up first.' }
        else if (target.id === user.id) result = { error: "You can't share with yourself" }
        else {
          const { error: shareErr } = await supabase.from('item_shares').upsert(
            { item_id: args.item_id, owner_id: user.id, shared_with_user_id: target.id },
            { onConflict: 'item_id,shared_with_user_id' }
          )
          if (shareErr) throw shareErr
          result = { success: true, message: `Shared with ${emailTrim}` }
        }
      } else if (action === 'filter_items') {
        const { data: items } = await supabase.from('compliance_items')
          .select('id, name, category, due_date')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .eq('category', args.category || 'other')
          .order('due_date', { ascending: true, nullsFirst: false })
        result = { items: items || [], count: (items || []).length }
      } else if (action === 'get_completed') {
        const days = Math.min(90, Math.max(1, Number(args.days) || 30))
        const since = new Date(Date.now() - days * 864e5).toISOString()
        const { data: items } = await supabase.from('compliance_items')
          .select('id, name, category, due_date, last_completed_at')
          .eq('user_id', user.id)
          .not('last_completed_at', 'is', null)
          .gte('last_completed_at', since)
          .order('last_completed_at', { ascending: false })
        result = { items: items || [], count: (items || []).length }
      } else if (action === 'get_application_guide') {
        const guide = APPLICATION_GUIDES[args.application_type]
        result = guide ? guide : { error: 'Unknown application type' }
      } else if (action === 'add_executor') {
        const { data: d } = await supabase.from('estate_executors')
          .insert({
            user_id: user.id,
            name: args.name?.trim(),
            role: args.role || 'executor',
            email: args.email?.trim() || null,
            phone: args.phone?.trim() || null,
            notes: args.notes?.trim() || null,
          })
          .select('id, name, role')
          .single()
        result = { success: true, executor: d, message: `Added ${args.name} as ${args.role}` }
      } else if (action === 'list_executors') {
        const { data: executors } = await supabase.from('estate_executors')
          .select('id, name, role, email')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        result = { executors: executors || [], count: (executors || []).length }
      } else if (action === 'add_entity') {
        const { data: d } = await supabase.from('business_entities')
          .insert({
            user_id: user.id,
            name: args.name?.trim(),
            entity_type: args.entity_type || 'corporation',
            registration_number: args.registration_number?.trim() || null,
            jurisdiction: args.jurisdiction?.trim() || null,
            notes: args.notes?.trim() || null,
          })
          .select('id, name, entity_type')
          .single()
        result = { success: true, entity: d, message: `Added ${args.name} (${args.entity_type})` }
      } else if (action === 'list_entities') {
        const [entitiesRes, locationsRes] = await Promise.all([
          supabase.from('business_entities').select('id, name, entity_type').eq('user_id', user.id).order('created_at', { ascending: false }),
          supabase.from('business_locations').select('id, name, city, province_state, entity_id').eq('user_id', user.id).order('created_at', { ascending: false }),
        ])
        result = { entities: entitiesRes.data || [], locations: locationsRes.data || [] }
      } else if (action === 'add_location') {
        const { data: d } = await supabase.from('business_locations')
          .insert({
            user_id: user.id,
            name: args.name?.trim(),
            address: args.address?.trim() || null,
            city: args.city?.trim() || null,
            province_state: args.province_state?.trim() || null,
            postal_code: args.postal_code?.trim() || null,
            country: args.country || 'ca',
            entity_id: args.entity_id || null,
          })
          .select('id, name, city')
          .single()
        result = { success: true, location: d, message: `Added ${args.name}` }
      } else if (action === 'export_to_calendar') {
        const days = Math.min(365, Math.max(7, Number(args.days_ahead) || 90))
        const today = new Date().toISOString().slice(0, 10)
        const limit = new Date(Date.now() + days * 864e5).toISOString().slice(0, 10)
        const { data: items } = await supabase.from('compliance_items')
          .select('id, name, category, due_date')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .gte('due_date', today)
          .lte('due_date', limit)
          .order('due_date', { ascending: true })
        const events = (items || []).filter((i: any) => i.due_date).map((i: any) => ({
          title: (i.name || 'Deadline').replace(/[^\x20-\x7E]/g, ''),
          date: i.due_date,
        }))
        const icsLines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Nava//Compliance//EN']
        for (const e of events) {
          icsLines.push('BEGIN:VEVENT', `DTSTART;VALUE=DATE:${e.date.replace(/-/g, '')}`, `DTEND;VALUE=DATE:${e.date.replace(/-/g, '')}`, `SUMMARY:${e.title}`, 'END:VEVENT')
        }
        icsLines.push('END:VCALENDAR')
        result = { success: true, count: events.length, ics: icsLines.join('\r\n') }
      } else {
        result = { error: `Unknown action: ${action}` }
      }
    } catch (e) {
      result = { error: (e as Error).message }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Nava API error:', error)
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
