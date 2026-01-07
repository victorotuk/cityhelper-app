-- ============================================
-- ADD PUSH NOTIFICATION FIELDS
-- Run this in Supabase SQL Editor
-- ============================================

-- Add push notification columns
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS push_enabled BOOLEAN DEFAULT true;

ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS onesignal_player_id TEXT;

ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS last_push_sent TIMESTAMPTZ;

-- Remove SMS columns (not using SMS anymore)
-- ALTER TABLE user_settings DROP COLUMN IF EXISTS sms_enabled;
-- ALTER TABLE user_settings DROP COLUMN IF EXISTS phone_number;
-- ALTER TABLE user_settings DROP COLUMN IF EXISTS last_sms_sent;

-- Keep email for account-only stuff (password reset, security)
-- email_enabled is now just for marketing emails (rare)
-- transactional emails (password reset) always go through

