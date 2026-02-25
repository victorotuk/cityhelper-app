-- Mileage tracking for vehicle assets
ALTER TABLE assets ADD COLUMN IF NOT EXISTS current_mileage INTEGER;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS last_mileage_update DATE;
COMMENT ON COLUMN assets.current_mileage IS 'Odometer reading in km (for vehicles)';
COMMENT ON COLUMN assets.last_mileage_update IS 'When mileage was last recorded';
