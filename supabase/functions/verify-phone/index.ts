// Supabase Edge Function: Verify Phone Number
// Checks the OTP code the user entered

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { code, userId } = await req.json()

    if (!code || !userId) {
      throw new Error('Missing code or userId')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the verification record
    const { data: verification, error: fetchError } = await supabase
      .from('phone_verifications')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (fetchError || !verification) {
      throw new Error('No verification pending. Please request a new code.')
    }

    // Check if expired
    if (new Date(verification.expires_at) < new Date()) {
      await supabase.from('phone_verifications').delete().eq('user_id', userId)
      throw new Error('Code expired. Please request a new one.')
    }

    // Check if code matches
    if (verification.code !== code) {
      throw new Error('Invalid code. Please try again.')
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

  } catch (err) {
    console.error('Error:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

