// Supabase Edge Function: Send Emails
// Used for: Welcome, Announcements, Security Alerts
// NOT for spam or frequent reminders

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const APP_NAME = 'CityHelper'
const APP_URL = 'https://cityhelper.app' // Change to your domain

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, type, data } = await req.json()

    if (!to || !type) {
      throw new Error('Missing required fields: to, type')
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) {
      throw new Error('Email service not configured')
    }

    // Email templates
    const templates: Record<string, { subject: string; html: string }> = {
      
      // Welcome email - sent once on signup
      welcome: {
        subject: `Welcome to ${APP_NAME} 🍁`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px; background: #0a0a0c; color: #f5f5f4;">
            <div style="text-align: center; margin-bottom: 32px;">
              <span style="font-size: 48px;">🍁</span>
              <h1 style="color: #e8c47c; font-size: 28px; margin: 16px 0 8px;">Welcome to ${APP_NAME}</h1>
              <p style="color: #a1a1a6; margin: 0;">Never miss a deadline again</p>
            </div>
            
            <p style="line-height: 1.6;">Hey${data?.name ? ` ${data.name}` : ''}!</p>
            
            <p style="line-height: 1.6;">You're all set to track your Canadian compliance — taxes, visas, licenses, renewals — all in one place.</p>
            
            <p style="line-height: 1.6;"><strong>Get started:</strong></p>
            <ul style="line-height: 1.8; color: #a1a1a6;">
              <li>Add your first deadline</li>
              <li>Enable push notifications</li>
              <li>Upload important documents</li>
            </ul>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${APP_URL}/dashboard" style="display: inline-block; padding: 14px 32px; background: #e8c47c; color: #0a0a0c; text-decoration: none; border-radius: 8px; font-weight: 600;">Open ${APP_NAME}</a>
            </div>
            
            <p style="color: #6b6b70; font-size: 13px; text-align: center; margin-top: 40px;">
              Questions? Just reply to this email.
            </p>
          </div>
        `,
      },

      // Update/announcement email - sent rarely
      update: {
        subject: data?.subject || `What's new in ${APP_NAME}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px; background: #0a0a0c; color: #f5f5f4;">
            <div style="text-align: center; margin-bottom: 32px;">
              <span style="font-size: 36px;">🍁</span>
              <h1 style="color: #e8c47c; font-size: 24px; margin: 16px 0 8px;">${data?.title || "What's New"}</h1>
            </div>
            
            <div style="line-height: 1.7;">
              ${data?.content || '<p>We have some exciting updates for you!</p>'}
            </div>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${APP_URL}/dashboard" style="display: inline-block; padding: 14px 32px; background: #e8c47c; color: #0a0a0c; text-decoration: none; border-radius: 8px; font-weight: 600;">Check It Out</a>
            </div>
            
            <p style="color: #6b6b70; font-size: 12px; text-align: center; margin-top: 40px;">
              You're receiving this because you use ${APP_NAME}.<br/>
              <a href="${APP_URL}/settings" style="color: #6b6b70;">Manage preferences</a>
            </p>
          </div>
        `,
      },

      // Security alert
      security: {
        subject: `🔒 Security alert for your ${APP_NAME} account`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px; background: #0a0a0c; color: #f5f5f4;">
            <div style="text-align: center; margin-bottom: 24px;">
              <span style="font-size: 36px;">🔒</span>
              <h1 style="color: #f87171; font-size: 22px; margin: 16px 0 8px;">Security Alert</h1>
            </div>
            
            <p style="line-height: 1.6;">${data?.message || 'We noticed unusual activity on your account.'}</p>
            
            <div style="background: #18181c; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 16px; margin: 24px 0;">
              <p style="margin: 0; color: #a1a1a6; font-size: 14px;">
                <strong>Time:</strong> ${data?.time || new Date().toLocaleString()}<br/>
                <strong>Location:</strong> ${data?.location || 'Unknown'}<br/>
                <strong>Device:</strong> ${data?.device || 'Unknown'}
              </p>
            </div>
            
            <p style="line-height: 1.6;">If this wasn't you, please reset your password immediately.</p>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${APP_URL}/auth?reset=true" style="display: inline-block; padding: 14px 32px; background: #f87171; color: #0a0a0c; text-decoration: none; border-radius: 8px; font-weight: 600;">Secure My Account</a>
            </div>
          </div>
        `,
      },

      // Sign-in notification
      signin: {
        subject: `✅ New sign-in to ${APP_NAME}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px; background: #0a0a0c; color: #f5f5f4;">
            <div style="text-align: center; margin-bottom: 24px;">
              <span style="font-size: 36px;">🍁</span>
              <h1 style="color: #4ade80; font-size: 22px; margin: 16px 0 8px;">Signed In Successfully</h1>
            </div>
            
            <p style="line-height: 1.6;">You just signed in to your ${APP_NAME} account.</p>
            
            <div style="background: #18181c; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 16px; margin: 24px 0;">
              <p style="margin: 0; color: #a1a1a6; font-size: 14px;">
                <strong>Time:</strong> ${data?.time || new Date().toLocaleString()}<br/>
                <strong>Device:</strong> ${data?.device || 'Unknown'}
              </p>
            </div>
            
            <p style="line-height: 1.6; color: #a1a1a6;">If this wasn't you, <a href="${APP_URL}/auth?reset=true" style="color: #e8c47c;">reset your password</a> immediately.</p>
            
            <p style="color: #6b6b70; font-size: 12px; text-align: center; margin-top: 40px;">
              You're receiving this because you signed in to ${APP_NAME}.
            </p>
          </div>
        `,
      },
    }

    const template = templates[type]
    if (!template) {
      throw new Error(`Unknown email type: ${type}. Use: welcome, update, security`)
    }

    // Send via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${APP_NAME} <onboarding@resend.dev>`, // Change to your verified domain
        to,
        subject: template.subject,
        html: template.html,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to send email')
    }

    const result = await response.json()
    console.log(`Email sent: ${type} to ${to}`)

    return new Response(
      JSON.stringify({ success: true, id: result.id }),
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
