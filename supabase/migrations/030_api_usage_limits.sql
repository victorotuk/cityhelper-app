-- API usage and rate limiting for nava-api (OpenClaw, etc.)
-- Monthly cap and per-minute cap enforced per tier in nava-api Edge Function

-- Monthly API request count per user (one row per user per month)
CREATE TABLE IF NOT EXISTS api_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  request_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month)
);

CREATE INDEX IF NOT EXISTS idx_api_usage_user_month ON api_usage(user_id, month);

ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role manages api_usage" ON api_usage
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Sliding window for per-minute rate limit (insert on each request; cleanup old rows in function)
CREATE TABLE IF NOT EXISTS api_request_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_request_log_user_time ON api_request_log(user_id, created_at);

-- No RLS: only nava-api (service role) reads/writes
COMMENT ON TABLE api_usage IS 'Monthly API call count per user for tier limits';
COMMENT ON TABLE api_request_log IS 'Recent API requests for per-minute rate limit; prune rows older than 5 min';
