// Supabase Edge Function: Verify Phone Number
// Checks the OTP code the user entered

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAX_ATTEMPTS = 5

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401
      })
    }
    const authSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: authError } = await authSupabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401
      })
    }

    const { code } = await req.json()
    const userId = user.id

    if (!code) {
      throw new Error('Missing code')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: verification, error: fetchError } = await supabase
      .from('phone_verifications')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (fetchError || !verification) {
      throw new Error('No verification pending. Please request a new code.')
    }

    if (new Date(verification.expires_at) < new Date()) {
      await supabase.from('phone_verifications').delete().eq('user_id', userId)
      throw new Error('Code expired. Please request a new one.')
    }

    const attempts = (verification.attempts ?? 0) + 1
    if (attempts > MAX_ATTEMPTS) {
      await supabase.from('phone_verifications').delete().eq('user_id', userId)
      throw new Error('Too many attempts. Please request a new code.')
    }

    if (verification.code !== code) {
      await supabase.from('phone_verifications').update({ attempts }).eq('user_id', userId)
      throw new Error(`Invalid code. ${MAX_ATTEMPTS - attempts} attempts remaining.`)
    }

    // Success! Update user settings with verified phone
    const { error: updateError } = await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        phone_number: verification.phone_number,
        phone_verified: true
      }, { onConflict: 'user_id' })

    if (updateError) throw updateError

    // Delete verification record
    await supabase.from('phone_verifications').delete().eq('user_id', userId)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Phone verified!',
        phone: verification.phone_number 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err: unknown) {
    console.error('Error:', err)
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

