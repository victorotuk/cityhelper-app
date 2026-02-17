-- Store user persona/profile for personalized dashboard
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS persona JSONB;

COMMENT ON COLUMN user_settings.persona IS 'User profile for personalization: {roles: ["student","employee"], struggles: ["deadlines","tickets"], completedOnboarding: true}';
