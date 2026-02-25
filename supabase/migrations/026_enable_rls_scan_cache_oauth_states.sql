-- Enable RLS on scan_cache and oauth_states (Supabase security advisory)
-- Both tables are only accessed by Edge Functions (service role), not by users.

ALTER TABLE scan_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only: scan_cache" ON scan_cache
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

ALTER TABLE oauth_states ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only: oauth_states" ON oauth_states
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
