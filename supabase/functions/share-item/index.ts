// Share a compliance item with another user by email
// POST { itemId, email }

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing authorization')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (!user) throw new Error('Unauthorized')

    const { itemId, email } = await req.json()
    if (!itemId || !email) throw new Error('Missing itemId or email')

    const emailTrim = String(email).trim().toLowerCase()
    if (!emailTrim) throw new Error('Invalid email')

    // Verify item belongs to user
    const { data: item, error: itemErr } = await supabase
      .from('compliance_items')
      .select('id, user_id')
      .eq('id', itemId)
      .eq('user_id', user.id)
      .single()

    if (itemErr || !item) throw new Error('Item not found')

    // Find user by email (admin API)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    const { data: targetList } = await supabaseAdmin.rpc('get_user_id_by_email', { lookup_email: emailTrim })
    const targetUser = targetList?.[0]
    if (!targetUser) {
      return new Response(JSON.stringify({ error: 'No account found with that email. They need to sign up first.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      })
    }

    if (targetUser.id === user.id) {
      return new Response(JSON.stringify({ error: "You can't share with yourself" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      })
    }

    const { error: shareErr } = await supabaseAdmin
      .from('item_shares')
      .upsert({
        item_id: itemId,
        owner_id: user.id,
        shared_with_user_id: targetUser.id
      }, { onConflict: 'item_id,shared_with_user_id' })

    if (shareErr) throw shareErr

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})
