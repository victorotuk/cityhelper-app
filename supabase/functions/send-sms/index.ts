// Supabase Edge Function: Send SMS Verification via Twilio
// ONLY for phone number verification (OTP codes)
// NOT for reminders or marketing
//
// Required Supabase secrets:
//   TWILIO_ACCOUNT_SID
//   TWILIO_AUTH_TOKEN
//   TWILIO_PHONE_NUMBER  (your Twilio number, e.g. +1234567890)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Generate 6-digit code
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phone, userId } = await req.json()

    if (!phone || !userId) {
      throw new Error('Missing phone or userId')
    }

    // Clean phone number (ensure +1 for Canada/US)
    let cleanPhone = phone.replace(/\D/g, '')
    if (cleanPhone.length === 10) {
      cleanPhone = '1' + cleanPhone // Add country code
    }
    cleanPhone = '+' + cleanPhone

    // Generate verification code
    const code = generateCode()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Store code in database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Delete any existing codes for this user
    await supabase
      .from('phone_verifications')
      .delete()
      .eq('user_id', userId)

    // Insert new code
    const { error: insertError } = await supabase
      .from('phone_verifications')
      .insert({
        user_id: userId,
        phone_number: cleanPhone,
        code,
        expires_at: expiresAt.toISOString()
      })

    if (insertError) throw insertError

    // Send SMS via Twilio
    const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')
    const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')
    const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER')

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      throw new Error('Twilio credentials not configured')
    }

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
      },
      body: new URLSearchParams({
        To: cleanPhone,
        From: TWILIO_PHONE_NUMBER,
        Body: `Your CityHelper verification code is: ${code}`,
      }).toString(),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('Twilio error:', result)
      throw new Error(result.message || 'Failed to send SMS')
    }

    console.log(`SMS sent to ${cleanPhone}, SID: ${result.sid}`)

    return new Response(
      JSON.stringify({ success: true, message: 'Verification code sent' }),
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
