-- Competitor parity: recurring, snooze, document link, completion history
ALTER TABLE compliance_items ADD COLUMN IF NOT EXISTS document_id UUID;
ALTER TABLE compliance_items ADD COLUMN IF NOT EXISTS snooze_until TIMESTAMPTZ;
ALTER TABLE compliance_items ADD COLUMN IF NOT EXISTS recurrence_interval TEXT; -- '1_month', '3_months', '6_months', '1_year'
ALTER TABLE compliance_items ADD COLUMN IF NOT EXISTS last_completed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_compliance_items_snooze ON compliance_items(snooze_until) WHERE snooze_until IS NOT NULL;
