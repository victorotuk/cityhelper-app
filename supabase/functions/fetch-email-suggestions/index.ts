// Fetch trackable items from connected email (Gmail, Outlook)
// Searches for: subscriptions, tickets, renewals, bills, court dates, etc.
// Uses AI to extract structured data and suggest category

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SEARCH_TERMS = 'subscription renewal "payment due" ticket invoice "court date" "amount due" bill confirmation expir renew expires'

function decodeBase64Url(str: string): string {
  try {
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/')
    return atob(base64)
  } catch {
    return ''
  }
}

function getGmailBody(payload: any): string {
  if (!payload) return ''
  if (payload.body?.data) return decodeBase64Url(payload.body.data)
  if (payload.parts) {
    return payload.parts.map((p: any) => p.body?.data ? decodeBase64Url(p.body.data) : '').join('\n')
  }
  return ''
}

function getOutlookBody(msg: any): string {
  const body = msg.body?.content || ''
  if (msg.body?.contentType === 'html') {
    return body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  }
  return body
}

async function refreshGmailToken(supabase: any, conn: any): Promise<string> {
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID')
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')
  if (!clientId || !clientSecret || !conn.refresh_token) throw new Error('Cannot refresh Gmail token')
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: conn.refresh_token,
      grant_type: 'refresh_token',
    }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error_description || data.error)
  const expiresAt = data.expires_in ? new Date(Date.now() + data.expires_in * 1000).toISOString() : null
  await supabase.from('email_connections').update({
    access_token: data.access_token,
    token_expires_at: expiresAt,
    updated_at: new Date().toISOString(),
  }).eq('user_id', conn.user_id).eq('provider', 'gmail')
  return data.access_token
}

async function refreshOutlookToken(supabase: any, conn: any): Promise<string> {
  const clientId = Deno.env.get('MICROSOFT_CLIENT_ID')
  const clientSecret = Deno.env.get('MICROSOFT_CLIENT_SECRET')
  if (!clientId || !clientSecret || !conn.refresh_token) throw new Error('Cannot refresh Outlook token')
  const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/email-oauth`
  const res = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: conn.refresh_token,
      redirect_uri: redirectUri,
      grant_type: 'refresh_token',
    }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error_description || data.error)
  const expiresAt = data.expires_in ? new Date(Date.now() + data.expires_in * 1000).toISOString() : null
  await supabase.from('email_connections').update({
    access_token: data.access_token,
    refresh_token: data.refresh_token || conn.refresh_token,
    token_expires_at: expiresAt,
    updated_at: new Date().toISOString(),
  }).eq('user_id', conn.user_id).eq('provider', 'outlook')
  return data.access_token
}

async function fetchGmailMessages(accessToken: string, afterStr: string): Promise<any[]> {
  const q = `(${SEARCH_TERMS}) after:${afterStr}`
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=30&q=${encodeURIComponent(q)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  const data = await res.json()
  if (data.error) throw new Error(data.error.message || 'Gmail API error')
  return data.messages || []
}

async function fetchGmailMessage(accessToken: string, id: string): Promise<any> {
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  return res.json()
}

async function fetchOutlookMessages(accessToken: string, afterStr: string): Promise<any[]> {
  const filter = `receivedDateTime ge ${afterStr}`
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/me/messages?$filter=${encodeURIComponent(filter)}&$top=30&$orderby=receivedDateTime desc&$select=id,subject,from,body,receivedDateTime`,
    { headers: { Authorization: `Bearer ${accessToken}`, 'Prefer': 'outlook.body-content-type=text' } }
  )
  const data = await res.json()
  if (data.error) throw new Error(data.error.message || 'Microsoft Graph error')
  const messages = data.value || []
  return messages.filter((m: any) => {
    const subj = (m.subject || '').toLowerCase()
    const body = (m.body?.content || '').toLowerCase()
    const text = subj + ' ' + body
    return /subscription|renewal|payment due|ticket|invoice|court date|amount due|bill|confirmation|expir|renew|expires/.test(text)
  })
}

const EXTRACT_PROMPT = `Extract trackable compliance items from this email. Return a JSON array of objects. Each object: { "name": "short item name", "category": "subscriptions|parking|driving|tax|health|legal_court|housing|immigration|other", "due_date": "YYYY-MM-DD or null", "amount": "string or null", "notes": "brief extra info" }. Use category "subscriptions" for recurring services (Netflix, SaaS). Use "parking" for parking/toll tickets. Use "driving" for license/registration. Use "tax" for tax deadlines. Use "legal_court" for court dates. Use "health" for medical. Use "housing" for rent/lease. Use "immigration" for visas/permits. If nothing trackable, return []. Return ONLY valid JSON array.`

async function extractSuggestions(text: string, emailMessageId: string, openaiKey: string): Promise<any[]> {
  const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: EXTRACT_PROMPT },
        { role: 'user', content: text.slice(0, 6000) },
      ],
      temperature: 0.2,
    }),
  })
  const aiData = await aiRes.json()
  const content = aiData.choices?.[0]?.message?.content || '[]'
  try {
    const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, '').trim())
    const items = Array.isArray(parsed) ? parsed : [parsed]
    return items.filter((i: any) => i?.name && i?.category).map((i: any) => ({
      email_message_id: emailMessageId,
      name: i.name,
      category: i.category,
      due_date: i.due_date || null,
      amount: i.amount || null,
      notes: i.notes || null,
    }))
  } catch {
    return []
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const token = authHeader.replace('Bearer ', '')
  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
  if (!OPENAI_API_KEY) {
    return new Response(JSON.stringify({ error: 'AI not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const { data: conns } = await supabase
      .from('email_connections')
      .select('*')
      .eq('user_id', user.id)

    if (!conns?.length) {
      return new Response(JSON.stringify({ error: 'No email connected. Connect Gmail or Outlook in Settings.', suggestions: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: dismissed } = await supabase
      .from('email_suggestion_dismissed')
      .select('email_message_id')
      .eq('user_id', user.id)
    const dismissedSet = new Set((dismissed || []).map((d: any) => d.email_message_id))

    const after = new Date()
    after.setMonth(after.getMonth() - 3)
    const gmailAfter = `${after.getFullYear()}/${after.getMonth() + 1}/${after.getDate()}`
    const outlookAfter = `${after.getFullYear()}-${String(after.getMonth() + 1).padStart(2, '0')}-${String(after.getDate()).padStart(2, '0')}T00:00:00Z`

    const allSuggestions: any[] = []
    const processed = new Set<string>()

    for (const conn of conns) {
      let accessToken = conn.access_token
      const expiresAt = conn.token_expires_at ? new Date(conn.token_expires_at).getTime() : 0

      if (conn.provider === 'gmail') {
        if (Date.now() > expiresAt - 60000 && conn.refresh_token) {
          accessToken = await refreshGmailToken(supabase, conn)
        }
        const messages = await fetchGmailMessages(accessToken, gmailAfter)
        for (const msg of messages.slice(0, 15)) {
          const prefixedId = `gmail:${msg.id}`
          if (dismissedSet.has(prefixedId) || processed.has(prefixedId)) continue
          processed.add(prefixedId)
          const fullData = await fetchGmailMessage(accessToken, msg.id)
          const body = getGmailBody(fullData.payload)
          const subject = fullData.payload?.headers?.find((h: any) => h.name === 'Subject')?.value || ''
          const from = fullData.payload?.headers?.find((h: any) => h.name === 'From')?.value || ''
          const text = `Subject: ${subject}\nFrom: ${from}\n\n${body}`
          const items = await extractSuggestions(text, prefixedId, OPENAI_API_KEY)
          allSuggestions.push(...items)
        }
        await supabase.from('email_connections').update({
          last_synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }).eq('user_id', user.id).eq('provider', 'gmail')
      } else if (conn.provider === 'outlook') {
        if (Date.now() > expiresAt - 60000 && conn.refresh_token) {
          accessToken = await refreshOutlookToken(supabase, conn)
        }
        const messages = await fetchOutlookMessages(accessToken, outlookAfter)
        for (const msg of messages.slice(0, 15)) {
          const prefixedId = `outlook:${msg.id}`
          if (dismissedSet.has(prefixedId) || processed.has(prefixedId)) continue
          processed.add(prefixedId)
          const body = getOutlookBody(msg)
          const subject = msg.subject || ''
          const from = msg.from?.emailAddress?.address || msg.from?.emailAddress?.name || ''
          const text = `Subject: ${subject}\nFrom: ${from}\n\n${body}`
          const items = await extractSuggestions(text, prefixedId, OPENAI_API_KEY)
          allSuggestions.push(...items)
        }
        await supabase.from('email_connections').update({
          last_synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }).eq('user_id', user.id).eq('provider', 'outlook')
      }
    }

    return new Response(JSON.stringify({ suggestions: allSuggestions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('fetch-email-suggestions:', err)
    return new Response(JSON.stringify({
      error: (err as Error).message || 'Failed to fetch suggestions',
      suggestions: [],
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
