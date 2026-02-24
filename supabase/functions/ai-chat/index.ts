// AI Chat with agent capabilities (function calling)
// index.ts = entry point — Supabase runs this when ai-chat is invoked

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

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'add_item',
      description: 'Add a compliance item. Use when user wants to track something (renewal, bill, deadline, subscription).',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Short name (e.g. Netflix renewal)' },
          category: { type: 'string', enum: ['subscriptions', 'parking', 'driving', 'tax', 'health', 'legal_court', 'housing', 'immigration', 'credit_banking', 'personal_insurance', 'education', 'trust', 'kids_family', 'business_tax', 'assets', 'other'] },
          due_date: { type: 'string', description: 'YYYY-MM-DD or null' },
          notes: { type: 'string', description: 'Optional extra info' },
          recurrence_interval: { type: 'string', enum: ['1_month', '3_months', '6_months', '1_year'], description: 'Make recurring (e.g. oil change every 6 months)' },
        },
        required: ['name', 'category'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_items',
      description: 'List user\'s compliance items. Use when they ask what they\'re tracking.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_upcoming',
      description: 'Get items due in next 30 days. Use when they ask what\'s due soon.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_item',
      description: 'Update an item (due date, name, notes, recurrence, alert emails).',
      parameters: {
        type: 'object',
        properties: {
          item_id: { type: 'string', description: 'UUID of item' },
          due_date: { type: 'string' },
          name: { type: 'string' },
          notes: { type: 'string' },
          recurrence_interval: { type: 'string', enum: ['1_month', '3_months', '6_months', '1_year'], description: 'Make item recurring' },
          alert_emails: { type: 'string', description: 'Comma-separated emails to notify (e.g. spouse@email.com)' },
        },
        required: ['item_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_item',
      description: 'Delete an item. Use when user wants to remove something from their list.',
      parameters: {
        type: 'object',
        properties: {
          item_id: { type: 'string', description: 'UUID of item to delete' },
        },
        required: ['item_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'mark_done',
      description: 'Mark an item as done/completed. For recurring items, sets the next due date. Use when user says they finished something.',
      parameters: {
        type: 'object',
        properties: {
          item_id: { type: 'string', description: 'UUID of item' },
        },
        required: ['item_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'snooze_item',
      description: 'Snooze reminders for an item until a later date. Use when user wants to be reminded later.',
      parameters: {
        type: 'object',
        properties: {
          item_id: { type: 'string', description: 'UUID of item' },
          days: { type: 'number', enum: [1, 3, 7], description: 'Snooze for 1, 3, or 7 days' },
        },
        required: ['item_id', 'days'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'share_item',
      description: 'Share an item with a family member or colleague by their email. They need a Nava account.',
      parameters: {
        type: 'object',
        properties: {
          item_id: { type: 'string', description: 'UUID of item to share' },
          email: { type: 'string', description: 'Email of person to share with' },
        },
        required: ['item_id', 'email'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'filter_items',
      description: 'Filter items by category. Use when user asks for a specific type (e.g. "show my parking tickets", "all my subscriptions").',
      parameters: {
        type: 'object',
        properties: {
          category: { type: 'string', enum: ['subscriptions', 'parking', 'driving', 'tax', 'health', 'legal_court', 'housing', 'immigration', 'credit_banking', 'personal_insurance', 'education', 'trust', 'kids_family', 'business_tax', 'assets', 'other'] },
        },
        required: ['category'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_completed',
      description: 'Get items user completed recently. Use when they ask "what did I complete" or "completion history".',
      parameters: {
        type: 'object',
        properties: {
          days: { type: 'number', description: 'Look back this many days (default 30)' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_application_guide',
      description: 'Get step-by-step guide for government applications (work permit, study permit, visitor visa, PR card). Use when user asks how to apply.',
      parameters: {
        type: 'object',
        properties: {
          application_type: { type: 'string', enum: ['work_permit', 'study_permit', 'visitor_visa', 'pr_card'] },
        },
        required: ['application_type'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_executor',
      description: 'Add an estate executor, nominee, trustee, or power of attorney. Use when user wants to add someone to their estate plan.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          role: { type: 'string', enum: ['executor', 'nominee', 'trustee', 'power_of_attorney'] },
          email: { type: 'string' },
          phone: { type: 'string' },
          notes: { type: 'string' },
        },
        required: ['name', 'role'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_executors',
      description: 'List estate executors, nominees, trustees. Use when user asks who is in their estate plan.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_entity',
      description: 'Add a business entity (corporation, LLC, partnership, etc.). Use when user wants to track a company.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          entity_type: { type: 'string', enum: ['corporation', 'llc', 'partnership', 'sole_proprietor', 'nonprofit'] },
          registration_number: { type: 'string' },
          jurisdiction: { type: 'string' },
          notes: { type: 'string' },
        },
        required: ['name', 'entity_type'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_entities',
      description: 'List business entities and locations. Use when user asks about their companies.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_location',
      description: 'Add a business location. Use when user wants to track an office or address.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          address: { type: 'string' },
          city: { type: 'string' },
          province_state: { type: 'string' },
          postal_code: { type: 'string' },
          country: { type: 'string', enum: ['ca', 'us'] },
          entity_id: { type: 'string', description: 'UUID of business entity to link (optional)' },
        },
        required: ['name'],
      },
    },
  },
]

async function callGroq(messages: any[], tools: any[], toolChoice: string) {
  const key = Deno.env.get('GROQ_API_KEY')
  if (!key) throw new Error('AI service not configured')
  const body: any = { model: 'llama-3.1-8b-instant', messages, temperature: 0.7, max_tokens: 1024 }
  if (tools?.length) { body.tools = tools; body.tool_choice = toolChoice }
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`AI error: ${await res.text()}`)
  return res.json()
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { messages } = await req.json()
    if (!messages || !Array.isArray(messages)) throw new Error('Messages array is required')

    const appName = Deno.env.get('APP_NAME') || 'Nava'
    const systemPrompt = `You are ${appName} AI, a compliance assistant. Users can do everything via chat — no clicking needed.

**TOOLS (use when user wants to take action):**
- add_item, list_items, get_upcoming, filter_items, get_completed
- update_item (due_date, name, notes, recurrence_interval, alert_emails)
- delete_item, mark_done, snooze_item, share_item
- add_executor, list_executors (estate: executors, nominees, trustees, POA)
- add_entity, list_entities, add_location (business: corporations, LLCs, locations)
- get_application_guide (work permit, study permit, visitor visa, PR card)

**GUIDANCE (when user asks HOW to do something — no tool needed):**
When users ask for instructions, suggestions, or "how do I" questions (e.g. "I want to start a trust and nest a corporation inside it", "how do I set up estate planning", "how do I incorporate"), provide clear step-by-step guidance, considerations, and best practices. You have general knowledge about Canadian and US compliance, business structures, trusts, corporations, estate planning, taxes. Be helpful and specific. Mention relevant Nava features when useful (e.g. "You can track your trust in our Estate section" or "Add your corporation in Business"). For complex legal/tax situations, recommend consulting a professional — never give specific legal or tax advice.

When user refers to an item by name, use list_items first to find item_id. Categories: ${CATEGORIES}. Be concise and friendly.`

    const groqMessages: any[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m: any) => ({ role: m.role, content: m.content || '' })),
    ]

    let data = await callGroq(groqMessages, TOOLS, 'auto')
    let msg = data.choices?.[0]?.message
    let iterations = 0

    while (msg?.tool_calls?.length && iterations < 5) {
      iterations++
      for (const tc of msg.tool_calls) {
        groqMessages.push(msg)
        const fn = tc.function?.name
        let args: any = {}
        try { args = JSON.parse(tc.function?.arguments || '{}') } catch { }

        let result: string
        try {
          if (fn === 'add_item') {
            const { data: d } = await supabase.from('compliance_items').insert({
              user_id: user.id, name: args.name || 'Untitled', category: args.category || 'other',
              due_date: args.due_date || null, notes: args.notes || null, recurrence_interval: args.recurrence_interval || null, status: 'active',
              encrypted_data: null, created_at: new Date().toISOString(),
            }).select('id, name, category, due_date').single()
            result = JSON.stringify({ success: true, item: d, message: `Added "${d?.name}"` })
          } else if (fn === 'list_items') {
            const { data: items } = await supabase.from('compliance_items')
              .select('id, name, category, due_date').eq('user_id', user.id).eq('status', 'active')
              .order('due_date', { ascending: true, nullsFirst: false })
            result = JSON.stringify({ items: items || [], count: (items || []).length })
          } else if (fn === 'get_upcoming') {
            const today = new Date().toISOString().slice(0, 10)
            const limit = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10)
            const { data: items } = await supabase.from('compliance_items')
              .select('id, name, category, due_date').eq('user_id', user.id).eq('status', 'active')
              .gte('due_date', today).lte('due_date', limit).order('due_date', { ascending: true })
            result = JSON.stringify({ items: items || [], count: (items || []).length })
          } else if (fn === 'update_item') {
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
              .update(updates).eq('id', args.item_id).eq('user_id', user.id)
              .select('id, name, due_date').single()
            result = JSON.stringify({ success: !!d, item: d })
          } else if (fn === 'delete_item') {
            const { error: delErr } = await supabase.from('compliance_items')
              .delete().eq('id', args.item_id).eq('user_id', user.id)
            if (delErr) throw delErr
            result = JSON.stringify({ success: true, message: 'Item deleted' })
          } else if (fn === 'mark_done') {
            const { data: item } = await supabase.from('compliance_items')
              .select('id, recurrence_interval, due_date').eq('id', args.item_id).eq('user_id', user.id).single()
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
              .update(updates).eq('id', args.item_id).eq('user_id', user.id)
              .select('id, name, due_date, last_completed_at').single()
            result = JSON.stringify({ success: true, item: d, message: nextDue ? `Done! Next due ${nextDue}` : 'Marked as done' })
          } else if (fn === 'snooze_item') {
            const days = Math.min(7, Math.max(1, Number(args.days) || 1))
            const until = new Date(Date.now() + days * 864e5).toISOString()
            const { data: d } = await supabase.from('compliance_items')
              .update({ snooze_until: until, updated_at: new Date().toISOString() })
              .eq('id', args.item_id).eq('user_id', user.id)
              .select('id, name, snooze_until').single()
            result = JSON.stringify({ success: !!d, message: `Snoozed for ${days} day${days > 1 ? 's' : ''}` })
          } else if (fn === 'share_item') {
            const emailTrim = String(args.email || '').trim().toLowerCase()
            if (!emailTrim) throw new Error('Email is required')
            const { data: item } = await supabase.from('compliance_items')
              .select('id, user_id').eq('id', args.item_id).eq('user_id', user.id).single()
            if (!item) throw new Error('Item not found')
            const { data: { users } } = await supabase.auth.admin.listUsers()
            const target = users?.find((u: any) => u.email?.toLowerCase() === emailTrim)
            if (!target) {
              result = JSON.stringify({ error: 'No Nava account found with that email. They need to sign up first.' })
            } else if (target.id === user.id) {
              result = JSON.stringify({ error: "You can't share with yourself" })
            } else {
              const { error: shareErr } = await supabase.from('item_shares')
                .upsert({ item_id: args.item_id, owner_id: user.id, shared_with_user_id: target.id }, { onConflict: 'item_id,shared_with_user_id' })
              if (shareErr) throw shareErr
              result = JSON.stringify({ success: true, message: `Shared with ${emailTrim}` })
            }
          } else if (fn === 'filter_items') {
            const { data: items } = await supabase.from('compliance_items')
              .select('id, name, category, due_date').eq('user_id', user.id).eq('status', 'active').eq('category', args.category || 'other')
              .order('due_date', { ascending: true, nullsFirst: false })
            result = JSON.stringify({ items: items || [], count: (items || []).length })
          } else if (fn === 'get_completed') {
            const days = Math.min(90, Math.max(1, Number(args.days) || 30))
            const since = new Date(Date.now() - days * 864e5).toISOString()
            const { data: items } = await supabase.from('compliance_items')
              .select('id, name, category, due_date, last_completed_at').eq('user_id', user.id)
              .not('last_completed_at', 'is', null).gte('last_completed_at', since)
              .order('last_completed_at', { ascending: false })
            result = JSON.stringify({ items: items || [], count: (items || []).length })
          } else if (fn === 'get_application_guide') {
            const guide = APPLICATION_GUIDES[args.application_type]
            if (!guide) result = JSON.stringify({ error: 'Unknown application type' })
            else result = JSON.stringify(guide)
          } else if (fn === 'add_executor') {
            const { data: d } = await supabase.from('estate_executors').insert({
              user_id: user.id, name: args.name.trim(), role: args.role || 'executor',
              email: args.email?.trim() || null, phone: args.phone?.trim() || null, notes: args.notes?.trim() || null,
            }).select('id, name, role').single()
            result = JSON.stringify({ success: true, executor: d, message: `Added ${args.name} as ${args.role}` })
          } else if (fn === 'list_executors') {
            const { data: executors } = await supabase.from('estate_executors')
              .select('id, name, role, email').eq('user_id', user.id).order('created_at', { ascending: false })
            result = JSON.stringify({ executors: executors || [], count: (executors || []).length })
          } else if (fn === 'add_entity') {
            const { data: d } = await supabase.from('business_entities').insert({
              user_id: user.id, name: args.name.trim(), entity_type: args.entity_type || 'corporation',
              registration_number: args.registration_number?.trim() || null, jurisdiction: args.jurisdiction?.trim() || null, notes: args.notes?.trim() || null,
            }).select('id, name, entity_type').single()
            result = JSON.stringify({ success: true, entity: d, message: `Added ${args.name} (${args.entity_type})` })
          } else if (fn === 'list_entities') {
            const [entitiesRes, locationsRes] = await Promise.all([
              supabase.from('business_entities').select('id, name, entity_type').eq('user_id', user.id).order('created_at', { ascending: false }),
              supabase.from('business_locations').select('id, name, city, province_state, entity_id').eq('user_id', user.id).order('created_at', { ascending: false }),
            ])
            result = JSON.stringify({ entities: entitiesRes.data || [], locations: locationsRes.data || [] })
          } else if (fn === 'add_location') {
            const { data: d } = await supabase.from('business_locations').insert({
              user_id: user.id, name: args.name.trim(), address: args.address?.trim() || null,
              city: args.city?.trim() || null, province_state: args.province_state?.trim() || null,
              postal_code: args.postal_code?.trim() || null, country: args.country || 'ca',
              entity_id: args.entity_id || null,
            }).select('id, name, city').single()
            result = JSON.stringify({ success: true, location: d, message: `Added ${args.name}` })
          } else result = JSON.stringify({ error: 'Unknown tool' })
        } catch (e) {
          result = JSON.stringify({ error: (e as Error).message })
        }
        groqMessages.push({ role: 'tool', tool_call_id: tc.id, content: result })
      }
      data = await callGroq(groqMessages, TOOLS, 'auto')
      msg = data.choices?.[0]?.message
    }

    const reply = msg?.content || 'Sorry, I couldn\'t complete that.'
    return new Response(JSON.stringify({ reply }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error) {
    console.error('AI Chat error:', error)
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

