-- Add account_type and org_info columns to user_settings
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'personal';
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS org_info JSONB;
