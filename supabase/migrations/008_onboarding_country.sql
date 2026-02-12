-- Onboarding: primary country (required) and optional other countries (multi-country / dual citizens)
ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS countries JSONB,
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

COMMENT ON COLUMN user_settings.country IS 'Primary country for app (e.g. ca, us)';
COMMENT ON COLUMN user_settings.countries IS 'Other countries user operates in (up to 5), e.g. ["us"] when primary is ca';
