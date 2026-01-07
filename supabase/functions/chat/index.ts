// Supabase Edge Function for AI Chat
// This uses YOUR API key so users don't need their own
// Note: You CAN see these conversations (not zero-knowledge)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT = `You are CityHelper, a friendly AI assistant specializing in Canadian compliance for individuals and businesses.

You help with:
- Immigration: work permits, study permits, visitor visas, PR applications, citizenship
- Taxes: personal (T1), corporate (T2), GST/HST, tax deadlines, deductions
- Business: federal/provincial registration, annual returns, licenses
- Driving: license renewals, registration, insurance requirements
- Government fees and deadlines

Guidelines:
- Be concise but thorough
- Always mention relevant deadlines
- Cite official sources when possible (CRA, IRCC, ServiceOntario, etc.)
- If unsure, recommend consulting a professional
- Be warm and encouraging - compliance can be stressful

Never provide specific legal or tax advice - always recommend consulting professionals for complex situations.`

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { messages } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      throw new Error('Messages array required')
    }

    // Get your API key from environment
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
    
    if (!OPENAI_API_KEY) {
      throw new Error('AI service not configured. Contact support.')
    }

    // Call OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages
        ],
        max_tokens: 1000,
        temperature: 0.7
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'AI service error')
    }

    const data = await response.json()
    const aiResponse = data.choices[0].message.content

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})

