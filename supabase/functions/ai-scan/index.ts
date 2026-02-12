import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Scan limits per pricing tier (per month)
const SCAN_LIMITS: Record<string, number> = {
  free: 10,
  personal: 50,
  business: 200,
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

  // Service-role Supabase client (bypasses RLS for usage tracking)
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    const { image, prompt } = await req.json()

    if (!image) {
      throw new Error('Image is required')
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
    if (!OPENAI_API_KEY) {
      throw new Error('AI service not configured')
    }

    // ── 1. Get user from JWT ──────────────────────────────────
    let userId: string | null = null
    let userEmail: string | null = null
    const authHeader = req.headers.get('authorization')

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user } } = await supabase.auth.getUser(token)
      if (user) {
        userId = user.id
        userEmail = user.email ?? null
      }
    }

    // Default prompt
    const extractPrompt = prompt || `Extract all relevant information from this document. 
Return the data as a JSON object with clear field names. 
Be thorough and include all visible text, dates, amounts, names, and reference numbers.
Return ONLY valid JSON, no markdown or explanation.`

    // ── 2. Check cache ────────────────────────────────────────
    // Hash the image (use first 50k chars for performance on large images)
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
      // Cache hit — no OpenAI call, no usage counted
      console.log('Cache hit for scan')
      return new Response(
        JSON.stringify({ extracted: cached.result, raw: cached.raw_text, cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── 3. Rate limiting (only for authenticated users) ──────
    if (userId) {
      const month = currentMonth()

      // Get user's plan tier
      let tier = 'free'
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('tier, status')
        .or(`user_id.eq.${userId},email.eq.${userEmail}`)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (sub?.tier) {
        tier = sub.tier
      }

      const scanLimit = SCAN_LIMITS[tier] ?? SCAN_LIMITS.free

      // Get or create usage record for this month
      const { data: usage } = await supabase
        .from('scan_usage')
        .select('id, scan_count')
        .eq('user_id', userId)
        .eq('month', month)
        .single()

      const currentCount = usage?.scan_count ?? 0

      if (currentCount >= scanLimit) {
        const upgradeMsg = tier === 'free'
          ? 'Upgrade to Personal for 50 scans/month.'
          : tier === 'personal'
            ? 'Upgrade to Business for 200 scans/month.'
            : 'Contact support for higher limits.'

        return new Response(
          JSON.stringify({
            error: `Scan limit reached (${currentCount}/${scanLimit} this month). ${upgradeMsg}`,
            limit_reached: true,
            scan_count: currentCount,
            scan_limit: scanLimit,
            tier,
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Increment usage (upsert)
      if (usage?.id) {
        await supabase
          .from('scan_usage')
          .update({ scan_count: currentCount + 1, updated_at: new Date().toISOString() })
          .eq('id', usage.id)
      } else {
        await supabase
          .from('scan_usage')
          .insert({ user_id: userId, month, scan_count: 1 })
      }
    }

    // ── 4. Call OpenAI ────────────────────────────────────────
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
