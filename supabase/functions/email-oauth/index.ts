// Unified email OAuth: Gmail, Outlook, etc.
// POST: get auth URL (body: { provider: 'gmail' | 'outlook' })
// GET: callback (exchange code) or status (with Authorization)
// Requires: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, APP_URL

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { encode } from 'https://deno.land/std@0.168.0/encoding/base64url.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PROVIDERS = {
  gmail: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scope: 'https://www.googleapis.com/auth/gmail.readonly',
    clientIdEnv: 'GOOGLE_CLIENT_ID',
    clientSecretEnv: 'GOOGLE_CLIENT_SECRET',
  },
  outlook: {
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    scope: 'Mail.Read User.Read',
    clientIdEnv: 'MICROSOFT_CLIENT_ID',
    clientSecretEnv: 'MICROSOFT_CLIENT_SECRET',
  },
} as const

type Provider = keyof typeof PROVIDERS

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const url = new URL(req.url)
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const appUrl = Deno.env.get('APP_URL') || 'https://vicomnava.com'
  const redirectUri = `${url.origin}${url.pathname}`

  // ── GET: OAuth callback (code + state) ──
  if (req.method === 'GET' && url.searchParams.has('code')) {
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    if (!code || !state) {
      return Response.redirect(`${appUrl}/settings?error=invalid_callback`, 302)
    }

    const { data: row } = await supabase.from('oauth_states').select('user_id, provider').eq('state', state).single()
    if (!row) {
      return Response.redirect(`${appUrl}/settings?error=expired_or_invalid`, 302)
    }
    await supabase.from('oauth_states').delete().eq('state', state)

    const provider = (row.provider || 'gmail') as Provider
    const config = PROVIDERS[provider]
    if (!config) {
      return Response.redirect(`${appUrl}/settings?error=unknown_provider`, 302)
    }

    const clientId = Deno.env.get(config.clientIdEnv)
    const clientSecret = Deno.env.get(config.clientSecretEnv)
    if (!clientId || !clientSecret) {
      return Response.redirect(`${appUrl}/settings?error=email_not_configured`, 302)
    }

    const tokenRes = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })
    const tokenData = await tokenRes.json()
    if (tokenData.error) {
      console.error('Token exchange failed:', tokenData)
      return Response.redirect(`${appUrl}/settings?error=token_failed`, 302)
    }

    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : null

    await supabase.from('email_connections').upsert({
      user_id: row.user_id,
      provider,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || null,
      token_expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,provider' })

    return Response.redirect(`${appUrl}/settings?email_connected=true&provider=${provider}`, 302)
  }

  // ── POST: Get auth URL (requires Authorization, body: { provider }) ──
  if (req.method === 'POST') {
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

    let body: { provider?: string } = {}
    try {
      body = await req.json()
    } catch {
      body = {}
    }
    const provider = (body.provider || 'gmail') as Provider
    const config = PROVIDERS[provider]
    if (!config) {
      return new Response(JSON.stringify({ error: 'Unknown provider. Use gmail or outlook.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const clientId = Deno.env.get(config.clientIdEnv)
    const clientSecret = Deno.env.get(config.clientSecretEnv)
    if (!clientId || !clientSecret) {
      return new Response(JSON.stringify({ error: `${provider} not configured` }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const state = encode(crypto.getRandomValues(new Uint8Array(24)))
    await supabase.from('oauth_states').insert({ state, user_id: user.id, provider })

    const authUrl = new URL(config.authUrl)
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', config.scope)
    authUrl.searchParams.set('state', state)
    if (provider === 'gmail') {
      authUrl.searchParams.set('access_type', 'offline')
      authUrl.searchParams.set('prompt', 'consent')
    }

    return new Response(JSON.stringify({ url: authUrl.toString(), provider }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // ── GET with Authorization (no code): return connection status for all providers ──
  if (req.method === 'GET') {
    const authHeader = req.headers.get('Authorization')
    if (authHeader) {
      const tok = authHeader.replace('Bearer ', '')
      const { data: { user: u } } = await supabase.auth.getUser(tok)
      if (u) {
        const { data: conns } = await supabase
          .from('email_connections')
          .select('provider, email_address, last_synced_at')
          .eq('user_id', u.id)
        const connections = (conns || []).reduce((acc: Record<string, any>, c) => {
          acc[c.provider] = { email: c.email_address, last_synced_at: c.last_synced_at }
          return acc
        }, {})
        return new Response(JSON.stringify({
          connected: Object.keys(connections).length > 0,
          connections,
          providers: Object.keys(connections),
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }
    return new Response(JSON.stringify({ connected: false, connections: {}, providers: [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return new Response('Method not allowed', { status: 405 })
})
