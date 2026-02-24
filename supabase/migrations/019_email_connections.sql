-- Email connections for Gmail/Outlook (OAuth tokens)
CREATE TABLE IF NOT EXISTS email_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'gmail', -- 'gmail', 'outlook'
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  email_address TEXT,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, provider)
);

ALTER TABLE email_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own email connections" ON email_connections
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_email_connections_user ON email_connections(user_id);

-- Track which emails we've already suggested (avoid duplicates)
CREATE TABLE IF NOT EXISTS email_suggestion_dismissed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_message_id TEXT NOT NULL, -- Gmail message ID
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, email_message_id)
);

ALTER TABLE email_suggestion_dismissed ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own dismissed" ON email_suggestion_dismissed FOR ALL USING (auth.uid() = user_id);
