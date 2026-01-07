-- ============================================
-- ADD REMINDER TRACKING FIELDS
-- Run this in Supabase SQL Editor
-- ============================================

-- Add missing columns to user_settings if they don't exist
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS last_email_sent TIMESTAMPTZ;

ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS last_notif_sent TIMESTAMPTZ;

-- Update the last_active timestamp when user logs in
-- (You can call this from your app when user accesses dashboard)
CREATE OR REPLACE FUNCTION update_last_active()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_settings 
  SET last_active = NOW() 
  WHERE user_id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- CRON JOB SETUP (requires pg_cron extension)
-- This runs the reminder function daily at 9 AM EST
-- ============================================

-- Enable pg_cron if not already enabled (do this in Supabase Dashboard > Database > Extensions)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the reminder function to run daily
-- Note: You need to set this up via Supabase Dashboard > Database > Cron Jobs
-- Or use this SQL after enabling pg_cron:

-- SELECT cron.schedule(
--   'daily-reminders',
--   '0 14 * * *',  -- 9 AM EST (14:00 UTC)
--   $$
--   SELECT net.http_post(
--     url := 'https://qyisjxfugogimgzhualw.supabase.co/functions/v1/send-reminders',
--     headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
--   );
--   $$
-- );

