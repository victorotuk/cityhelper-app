-- Document linking: compliance_items.document_id already exists (015)
-- Add FK if documents table exists (skip if not - some deploys may not have it)
-- ALTER TABLE compliance_items ADD CONSTRAINT fk_doc FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL;
-- (Skipped - documents may not exist on all deploys)

-- Weekly digest: user_settings
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS digest_email_enabled BOOLEAN DEFAULT false;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS digest_day INTEGER DEFAULT 1; -- 0=Sun, 1=Mon, ..., 6=Sat
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS last_digest_sent TIMESTAMPTZ;

-- Family sharing: item_shares
CREATE TABLE IF NOT EXISTS item_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES compliance_items(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(item_id, shared_with_user_id)
);

ALTER TABLE item_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage shares" ON item_shares
  FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Shared users can view" ON item_shares
  FOR SELECT USING (auth.uid() = shared_with_user_id);

-- Allow shared users to read the compliance_items they have access to
DROP POLICY IF EXISTS "Users can view own compliance items" ON compliance_items;
CREATE POLICY "Users can view own compliance items" ON compliance_items
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM item_shares s WHERE s.item_id = id AND s.shared_with_user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_item_shares_item ON item_shares(item_id);
CREATE INDEX IF NOT EXISTS idx_item_shares_shared_with ON item_shares(shared_with_user_id);

-- Multi-recipient: shared_alert_emails on compliance_items
ALTER TABLE compliance_items ADD COLUMN IF NOT EXISTS alert_emails TEXT[]; -- extra emails to notify

-- Audit trail: compliance_item_audit
CREATE TABLE IF NOT EXISTS compliance_item_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES compliance_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'created','updated','renewed','snoozed','deleted'
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE compliance_item_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own item audit" ON compliance_item_audit
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM compliance_items c WHERE c.id = item_id AND c.user_id = auth.uid())
  );

CREATE POLICY "Users can insert audit for own items" ON compliance_item_audit
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM compliance_items c WHERE c.id = item_id AND c.user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_audit_item ON compliance_item_audit(item_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON compliance_item_audit(created_at DESC);

-- Life moments: add to persona
-- persona JSONB already has roles, struggles; we add lifeMoments: ['moving','pregnant','new_job',...]
-- No schema change needed - stored in persona JSONB
