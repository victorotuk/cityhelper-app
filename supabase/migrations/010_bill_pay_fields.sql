-- Add optional pay URL and phone for bill items (hydro, internet, etc.)
ALTER TABLE compliance_items
ADD COLUMN IF NOT EXISTS pay_url TEXT;

ALTER TABLE compliance_items
ADD COLUMN IF NOT EXISTS pay_phone TEXT;

COMMENT ON COLUMN compliance_items.pay_url IS 'Optional URL to pay this bill online';
COMMENT ON COLUMN compliance_items.pay_phone IS 'Optional phone number to call and pay';
