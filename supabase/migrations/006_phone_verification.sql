-- ============================================
-- OPTIONAL PHONE VERIFICATION
-- Run this in Supabase SQL Editor
-- ============================================

-- Table to store pending verification codes
CREATE TABLE IF NOT EXISTS phone_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for phone verifications
ALTER TABLE phone_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own verifications" ON phone_verifications
  FOR ALL USING (auth.uid() = user_id);

-- Add phone_verified column to user_settings
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_phone_verifications_user 
ON phone_verifications(user_id);

