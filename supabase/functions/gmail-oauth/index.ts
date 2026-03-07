// Gmail OAuth: GET = callback (exchange code), POST = get auth URL
// Requires: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, APP_URL (e.g. https://yourapp.com)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { encode } from 'https://deno.land/std@0.168.0/encoding/base64url.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GMAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly'

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const url = new URL(req.url)
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const clientId = Deno.env.get('GOOGLE_CLIENT_ID')
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')
  const appUrl = Deno.env.get('APP_URL') || 'http://localhost:5173'

  if (!clientId || !clientSecret) {
    return Response.redirect(`${appUrl}/settings?error=email_not_configured`, 302)
  }

  const baseUrl = `${Deno.env.get('SUPABASE_URL')?.replace('.co', '.co')}/functions/v1/gmail-oauth`
  const redirectUri = `${url.origin}${url.pathname}`

  // ── GET: OAuth callback (code + state) ──
  if (req.method === 'GET' && url.searchParams.has('code')) {
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    if (!code || !state) {
      return Response.redirect(`${appUrl}/settings?error=invalid_callback`, 302)
    }

    const { data: row } = await supabase.from('oauth_states').select('user_id').eq('state', state).single()
    if (!row) {
      return Response.redirect(`${appUrl}/settings?error=expired_or_invalid`, 302)
    }
    await supabase.from('oauth_states').delete().eq('state', state)

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
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
      provider: 'gmail',
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || null,
      token_expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,provider' })

    return Response.redirect(`${appUrl}/settings?email_connected=true`, 302)
  }

  // ── POST: Get auth URL (requires Authorization header) ──
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

    const state = encode(crypto.getRandomValues(new Uint8Array(24)))
    await supabase.from('oauth_states').insert({ state, user_id: user.id, provider: 'gmail' })

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', GMAIL_SCOPE)
    authUrl.searchParams.set('state', state)
    authUrl.searchParams.set('access_type', 'offline')
    authUrl.searchParams.set('prompt', 'consent')

    return new Response(JSON.stringify({ url: authUrl.toString() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // ── GET with Authorization (no code): return connection status ──
  if (req.method === 'GET') {
    const authHeader = req.headers.get('Authorization')
    if (authHeader) {
      const tok = authHeader.replace('Bearer ', '')
      const { data: { user: u } } = await supabase.auth.getUser(tok)
      if (u) {
        const { data: conn } = await supabase
          .from('email_connections')
          .select('provider, email_address, last_synced_at')
          .eq('user_id', u.id)
          .eq('provider', 'gmail')
          .single()
        return new Response(JSON.stringify({
          connected: !!conn,
          email: conn?.email_address || null,
          last_synced_at: conn?.last_synced_at || null,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }
    return new Response(JSON.stringify({ connected: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return new Response('Method not allowed', { status: 405 })
})
