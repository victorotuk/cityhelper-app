-- Fix: migrations 008 was marked as applied via `migration repair` but the SQL
-- never actually ran, so these columns are missing from user_settings.

ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS countries JSONB;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS last_sms_sent TIMESTAMPTZ;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS last_email_sent TIMESTAMPTZ;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS last_notif_sent TIMESTAMPTZ;

COMMENT ON COLUMN user_settings.country IS 'Primary country (e.g. ca, us)';
COMMENT ON COLUMN user_settings.countries IS 'Additional countries, e.g. ["us"]';
