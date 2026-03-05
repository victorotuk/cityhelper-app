-- Per-item country: track which country each item belongs to (for multi-country users)
ALTER TABLE compliance_items ADD COLUMN IF NOT EXISTS country TEXT;

COMMENT ON COLUMN compliance_items.country IS 'Country this item belongs to (ca, us). Null = legacy item, shown in all country views.';
