-- Web Push: replace OneSignal with native Web Push API
-- push_subscription stores the browser's PushSubscription (endpoint + keys)
-- push_token + push_platform for native iOS/Android (FCM/APNs) when using Capacitor

ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS push_subscription JSONB;

ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS push_token TEXT;

ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS push_platform TEXT;

COMMENT ON COLUMN user_settings.push_subscription IS 'Web Push subscription: {endpoint, keys: {p256dh, auth}}';
COMMENT ON COLUMN user_settings.push_token IS 'Native push token (FCM/APNs) for Capacitor iOS/Android';
COMMENT ON COLUMN user_settings.push_platform IS 'ios | android when using native push';
