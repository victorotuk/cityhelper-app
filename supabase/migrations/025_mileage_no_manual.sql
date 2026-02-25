-- Remove manual as option: default to gps_maps, migrate existing manual users
UPDATE user_settings SET mileage_preference = 'gps_maps' WHERE mileage_preference = 'manual';
-- New users get gps_maps by default (already in 024, but ensure)
ALTER TABLE user_settings ALTER COLUMN mileage_preference SET DEFAULT 'gps_maps';
