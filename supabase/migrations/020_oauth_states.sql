-- Temporary OAuth state (state -> user_id) for Gmail connect flow
CREATE TABLE IF NOT EXISTS oauth_states (
  state TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-expire after 10 minutes (cleanup via cron or on read)
CREATE INDEX IF NOT EXISTS idx_oauth_states_created ON oauth_states(created_at);
