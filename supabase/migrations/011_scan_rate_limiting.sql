-- ============================================
-- SCAN RATE LIMITING & CACHING
-- Protects AI scan costs, ties to pricing tiers
-- ============================================

-- 1. SCAN USAGE: Track scans per user per month
CREATE TABLE IF NOT EXISTS scan_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  month TEXT NOT NULL,           -- 'YYYY-MM' format
  scan_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month)
);

ALTER TABLE scan_usage ENABLE ROW LEVEL SECURITY;

-- Users can read their own usage (for UI: "5/10 scans used")
DO $$ BEGIN
  CREATE POLICY "Users can view own scan usage" ON scan_usage
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Only service role inserts/updates (from Edge Function)
DO $$ BEGIN
  CREATE POLICY "Service role manages scan usage" ON scan_usage
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_scan_usage_user_month ON scan_usage(user_id, month);


-- 2. SCAN CACHE: Avoid duplicate OpenAI calls for same image+prompt
CREATE TABLE IF NOT EXISTS scan_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_hash TEXT NOT NULL,       -- SHA-256 of image data
  prompt_hash TEXT NOT NULL,      -- SHA-256 of extraction prompt
  result JSONB NOT NULL,          -- Extracted structured data
  raw_text TEXT,                  -- Raw AI response
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(image_hash, prompt_hash)
);

-- No RLS needed — only accessed by service role in Edge Function
-- Auto-cleanup: delete cache entries older than 90 days (optional cron)
CREATE INDEX IF NOT EXISTS idx_scan_cache_lookup ON scan_cache(image_hash, prompt_hash);


-- 3. SUBSCRIPTIONS TABLE — add missing columns if table already exists
-- (stripe-webhook may have created a simpler version)
DO $$ BEGIN
  -- Create table if it doesn't exist at all
  CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tier TEXT DEFAULT 'free',
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
EXCEPTION WHEN others THEN NULL;
END $$;

-- Add columns that may be missing (safe: IF NOT EXISTS)
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'free';
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies: create only if they don't exist
DO $$ BEGIN
  CREATE POLICY "Users can view own subscription" ON subscriptions
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role manages subscriptions" ON subscriptions
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_email ON subscriptions(email);
