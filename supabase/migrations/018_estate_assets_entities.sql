-- Executor/nominee management (estate)
CREATE TABLE IF NOT EXISTS estate_executors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT, -- 'executor', 'nominee', 'trustee', 'power_of_attorney'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE estate_executors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own executors" ON estate_executors FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_estate_executors_user ON estate_executors(user_id);

-- Asset inventory with photos
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'vehicle', 'equipment', 'property', 'jewelry', 'electronics', 'other'
  value_estimate TEXT, -- freeform or number as text
  purchase_date DATE,
  photo_url TEXT, -- Supabase Storage URL
  location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own assets" ON assets FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_assets_user ON assets(user_id);

-- Entity/location management (business)
CREATE TABLE IF NOT EXISTS business_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  entity_type TEXT, -- 'corporation', 'llc', 'partnership', 'sole_proprietor', 'nonprofit'
  registration_number TEXT,
  jurisdiction TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE business_entities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own entities" ON business_entities FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_business_entities_user ON business_entities(user_id);

CREATE TABLE IF NOT EXISTS business_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_id UUID REFERENCES business_entities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  province_state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'ca',
  is_primary BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE business_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own locations" ON business_locations FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_business_locations_user ON business_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_business_locations_entity ON business_locations(entity_id);
