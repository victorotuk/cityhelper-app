-- Mileage trips and tracking preference
-- source: 'manual' | 'obd' | 'gps_maps'

CREATE TABLE IF NOT EXISTS mileage_trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  distance_km NUMERIC(10,2) NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual', -- 'manual' | 'obd' | 'gps_maps'
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  start_lat NUMERIC,
  start_lng NUMERIC,
  end_lat NUMERIC,
  end_lng NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE mileage_trips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own trips" ON mileage_trips FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_mileage_trips_user ON mileage_trips(user_id);
CREATE INDEX IF NOT EXISTS idx_mileage_trips_asset ON mileage_trips(asset_id);
CREATE INDEX IF NOT EXISTS idx_mileage_trips_created ON mileage_trips(created_at DESC);

COMMENT ON TABLE mileage_trips IS 'Vehicle mileage trips from manual entry, OBD-II, or GPS+Maps';
COMMENT ON COLUMN mileage_trips.source IS 'manual: user entered | obd: OBD-II dongle | gps_maps: GPS speed + Google Roads API';

-- User preference: how to track mileage
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS mileage_preference TEXT DEFAULT 'manual';
COMMENT ON COLUMN user_settings.mileage_preference IS 'manual | obd | gps_maps. obd=gps_maps when OBD unavailable';
