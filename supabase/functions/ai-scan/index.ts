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
    const { image, prompt } = await req.json()
    
    if (!image) {
      throw new Error('Image is required')
    }

    // Get OpenAI API key from Supabase secrets
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
    
    if (!OPENAI_API_KEY) {
      throw new Error('AI service not configured')
    }

    // Default prompt for document extraction
    const extractPrompt = prompt || `Extract all relevant information from this document. 
Return the data as a JSON object with clear field names. 
Be thorough and include all visible text, dates, amounts, names, and reference numbers.
Return ONLY valid JSON, no markdown or explanation.`

    // Prepare the image - ensure it has the data URL prefix
    let imageUrl = image
    if (!image.startsWith('data:')) {
      imageUrl = `data:image/jpeg;base64,${image}`
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: extractPrompt },
            { type: 'image_url', image_url: { url: imageUrl, detail: 'low' } }
          ]
        }],
        max_tokens: 1000,
        temperature: 0.1
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('OpenAI vision error:', error)
      throw new Error('Document scanning temporarily unavailable')
    }

    const data = await response.json()
    const extractedText = data.choices?.[0]?.message?.content || ''

    // Try to parse as JSON if it looks like JSON
    let extracted = extractedText
    try {
      // Find JSON in the response
      const jsonMatch = extractedText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        extracted = JSON.parse(jsonMatch[0])
      }
    } catch {
      // Keep as text if not valid JSON
    }

    return new Response(
      JSON.stringify({ extracted, raw: extractedText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('AI Scan error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
