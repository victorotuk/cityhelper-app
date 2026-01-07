import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { messages } = await req.json()
    
    if (!messages || !Array.isArray(messages)) {
      throw new Error('Messages array is required')
    }

    // Get Groq API key from Supabase secrets (free, fast)
    const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')
    
    if (!GROQ_API_KEY) {
      throw new Error('AI service not configured')
    }

    // System prompt for CityHelper
    const systemPrompt = `You are CityHelper AI, a friendly Canadian compliance assistant. You help users with:

- Immigration (work permits, study permits, PR cards, visas)
- Taxes (personal T1, business T2, HST/GST)
- Housing (leases, rent increases, tenant rights)
- Driving (license renewals, vehicle registration, insurance)
- Parking tickets (disputes, payments)
- Business compliance (licenses, WSIB, payroll)
- Property (municipal taxes, pet licenses)

Be helpful, concise, and friendly. Use Canadian terminology (provinces, CRA, IRCC, etc.).
When users ask about finding professionals (lawyers, accountants, immigration consultants), suggest they search for licensed professionals in their province.
Keep responses focused and actionable. Use bullet points for lists.
If you don't know something specific, say so and suggest they verify with official sources.`

    // Build messages for Groq (OpenAI-compatible format)
    const groqMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content
      }))
    ]

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: groqMessages,
        temperature: 0.7,
        max_tokens: 1024,
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Groq error:', errorText)
      throw new Error(`AI error: ${errorText}`)
    }

    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content || 'Sorry, I couldn\'t generate a response.'

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('AI Chat error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

