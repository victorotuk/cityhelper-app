-- ============================================
-- APPLICATIONS TABLE
-- Stores user application data for guided & future automated applications
-- Run this in Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- work_permit, study_permit, visitor_visa, pr_card, etc.
  form_data JSONB DEFAULT '{}', -- All form fields stored as JSON
  status TEXT DEFAULT 'draft', -- draft, submitted, approved, rejected
  submitted_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "View own applications" ON applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Insert own applications" ON applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own applications" ON applications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Delete own applications" ON applications FOR DELETE USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_applications_user_type ON applications(user_id, type);

