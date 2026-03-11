import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Provider configs: endpoint, model, and how to build the request body
const PROVIDERS: Record<string, {
  url: string
  model: string
  supportsVision: boolean
  buildBody: (model: string, prompt: string, imageUrl: string) => unknown
}> = {
  groq: {
    url: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
    supportsVision: true,
    buildBody: (model, prompt, imageUrl) => ({
      model, max_tokens: 1000, temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: imageUrl } },
      ]}],
    }),
  },
  openai: {
    url: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o-mini',
    supportsVision: true,
    buildBody: (model, prompt, imageUrl) => ({
      model, max_tokens: 1000, temperature: 0.1,
      messages: [{ role: 'user', content: [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: imageUrl, detail: 'low' } },
      ]}],
    }),
  },
  anthropic: {
    url: 'https://api.anthropic.com/v1/messages',
    model: 'claude-3-5-haiku-20241022',
    supportsVision: true,
    buildBody: (model, prompt, imageUrl) => {
      const base64Match = imageUrl.match(/^data:(image\/\w+);base64,(.+)/)
      const mediaType = base64Match?.[1] || 'image/jpeg'
      const b64data = base64Match?.[2] || imageUrl
      return {
        model, max_tokens: 1000, temperature: 0.1,
        messages: [{ role: 'user', content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: b64data } },
          { type: 'text', text: prompt },
        ]}],
      }
    },
  },
  gemini: {
    url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    model: 'gemini-2.0-flash',
    supportsVision: true,
    buildBody: (_model, prompt, imageUrl) => {
      const base64Match = imageUrl.match(/^data:(image\/\w+);base64,(.+)/)
      const mimeType = base64Match?.[1] || 'image/jpeg'
      const b64data = base64Match?.[2] || imageUrl
      return {
        contents: [{ parts: [
          { inline_data: { mime_type: mimeType, data: b64data } },
          { text: prompt + '\nReturn ONLY valid JSON, no markdown fences.' },
        ]}],
        generationConfig: { temperature: 0.1, maxOutputTokens: 1000 },
      }
    },
  },
}

function detectProvider(apiKey: string): string {
  if (apiKey.startsWith('gsk_')) return 'groq'
  if (apiKey.startsWith('sk-ant-')) return 'anthropic'
  if (apiKey.startsWith('sk-')) return 'openai'
  if (apiKey.startsWith('AI')) return 'gemini'
  return 'groq'
}

/** SHA-256 hash a string, return hex digest */
async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(input)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/** Get the current month as YYYY-MM */
function currentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    const { image, prompt, apiKey: userApiKey, provider: userProvider } = await req.json()

    if (!image) {
      throw new Error('Image is required')
    }

    // Resolve API key: user's key first, then server fallback (GROQ_API_KEY)
    const serverKey = Deno.env.get('GROQ_API_KEY')
    const resolvedKey = (userApiKey && typeof userApiKey === 'string' && userApiKey.trim())
      ? userApiKey.trim()
      : serverKey
    if (!resolvedKey) {
      throw new Error('Add your AI key in Settings → AI to scan documents. Groq is free at console.groq.com.')
    }

    // Detect provider from explicit param or key prefix
    const providerName = userProvider || detectProvider(resolvedKey)
    const provider = PROVIDERS[providerName]
    if (!provider) {
      throw new Error(`Unsupported AI provider: ${providerName}`)
    }

    // ── 1. Get user from JWT ──────────────────────────────────
    let userId: string | null = null
    const authHeader = req.headers.get('authorization')

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user } } = await supabase.auth.getUser(token)
      if (user) userId = user.id
    }

    const extractPrompt = prompt || `Extract all relevant information from this document. 
Return the data as a JSON object with clear field names. 
Be thorough and include all visible text, dates, amounts, names, and reference numbers.
Return ONLY valid JSON, no markdown or explanation.`

    // ── 2. Check cache ────────────────────────────────────────
    const imageForHash = image.length > 50000 ? image.substring(0, 50000) : image
    const imageHash = await sha256(imageForHash)
    const promptHash = await sha256(extractPrompt)

    const { data: cached } = await supabase
      .from('scan_cache')
      .select('result, raw_text')
      .eq('image_hash', imageHash)
      .eq('prompt_hash', promptHash)
      .single()

    if (cached) {
      console.log('Cache hit for scan')
      return new Response(
        JSON.stringify({ extracted: cached.result, raw: cached.raw_text, cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── 3. Usage tracking (no hard limits when BYOK) ──────────
    if (userId) {
      const month = currentMonth()
      const { data: usage } = await supabase
        .from('scan_usage')
        .select('id, scan_count')
        .eq('user_id', userId)
        .eq('month', month)
        .single()

      const currentCount = usage?.scan_count ?? 0

      if (usage?.id) {
        await supabase.from('scan_usage')
          .update({ scan_count: currentCount + 1, updated_at: new Date().toISOString() })
          .eq('id', usage.id)
      } else {
        await supabase.from('scan_usage')
          .insert({ user_id: userId, month, scan_count: 1 })
      }
    }

    // ── 4. Call AI provider ───────────────────────────────────
    let imageUrl = image
    if (!image.startsWith('data:')) {
      imageUrl = `data:image/jpeg;base64,${image}`
    }

    const requestBody = provider.buildBody(provider.model, extractPrompt, imageUrl)

    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    let fetchUrl = provider.url

    if (providerName === 'anthropic') {
      headers['x-api-key'] = resolvedKey
      headers['anthropic-version'] = '2023-06-01'
    } else if (providerName === 'gemini') {
      fetchUrl = `${provider.url}?key=${resolvedKey}`
    } else {
      headers['Authorization'] = `Bearer ${resolvedKey}`
    }

    const response = await fetch(fetchUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`${providerName} vision error:`, errorText)
      if (response.status === 401 || response.status === 403) {
        throw new Error(`Invalid ${providerName} API key. Check Settings → AI.`)
      }
      if (response.status === 429) {
        throw new Error('Rate limit reached. Try again in a minute, or add your own AI key in Settings → AI.')
      }
      throw new Error('Document scanning temporarily unavailable. Try again shortly.')
    }

    const data = await response.json()

    // Extract text from provider-specific response format
    let extractedText = ''
    if (providerName === 'anthropic') {
      extractedText = data.content?.[0]?.text || ''
    } else if (providerName === 'gemini') {
      extractedText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    } else {
      extractedText = data.choices?.[0]?.message?.content || ''
    }

    // Try to parse as JSON
    let extracted: unknown = extractedText
    try {
      const jsonMatch = extractedText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        extracted = JSON.parse(jsonMatch[0])
      }
    } catch {
      // Keep as text if not valid JSON
    }

    // ── 5. Store in cache ─────────────────────────────────────
    await supabase
      .from('scan_cache')
      .upsert({
        image_hash: imageHash,
        prompt_hash: promptHash,
        result: typeof extracted === 'object' ? extracted : { text: extracted },
        raw_text: extractedText,
      }, { onConflict: 'image_hash,prompt_hash' })
      .then(({ error }) => {
        if (error) console.error('Cache write error (non-fatal):', error)
      })

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
