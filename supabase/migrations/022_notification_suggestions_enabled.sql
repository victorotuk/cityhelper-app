-- Add notification_suggestions_enabled to user_settings (Android only)
-- When enabled, Nava can suggest tracking items from system notifications
-- (parking tickets, renewal reminders, etc.). All processing on-device.
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS notification_suggestions_enabled BOOLEAN DEFAULT false;
COMMENT ON COLUMN user_settings.notification_suggestions_enabled IS 'When true (Android only), suggest tracking when relevant dates appear in system notifications';
