-- Add provider to oauth_states for multi-provider email OAuth (Gmail, Outlook)
ALTER TABLE oauth_states ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'gmail';
