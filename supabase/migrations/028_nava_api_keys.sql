-- API keys for OpenClaw and other integrations
CREATE TABLE IF NOT EXISTS nava_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  name TEXT DEFAULT 'OpenClaw',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_nava_api_keys_hash ON nava_api_keys(key_hash);
CREATE INDEX idx_nava_api_keys_user ON nava_api_keys(user_id);

ALTER TABLE nava_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own keys" ON nava_api_keys
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own keys" ON nava_api_keys
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own keys" ON nava_api_keys
  FOR DELETE USING (auth.uid() = user_id);
