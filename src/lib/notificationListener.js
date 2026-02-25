/**
 * Android notification listener for Smart Suggestions.
 * When enabled, parses system notifications (parking, renewals, bills) and
 * suggests adding items. All processing on-device.
 *
 * NOTE: Requires a Capacitor 5+ compatible NotificationListener plugin.
 * The capacitor-notificationlistener package targets Capacitor 2 and is incompatible.
 * When a compatible plugin exists, uncomment the plugin usage below.
 */

import { Capacitor } from '@capacitor/core';

let listenerCleanup = null;

/**
 * Start listening for notifications when user has enabled the feature.
 * @param {string} _userId - For fetching user_settings
 * @param {Function} getEnabled - () => Promise<boolean> - whether notification_suggestions_enabled
 * @param {Function} _setPendingText - (text) => void - from sharedSuggestStore (used when plugin exists)
 */
export async function startNotificationListener(_userId, getEnabled, _setPendingText) {
  if (Capacitor.getPlatform() !== 'android') return;
  const enabled = await getEnabled?.();
  if (!enabled) return;

  // TODO: When a Capacitor 5+ compatible NotificationListener plugin exists:
  // const { NotificationListener } = await import('@capacitor/notification-listener');
  // const listener = await NotificationListener.addListener('notificationReceived', (ev) => {
  //   const text = [ev.title, ev.text].filter(Boolean).join(' ');
  //   const suggestion = parseNotificationForSuggestion(ev.text, ev.title);
  //   if (suggestion) setPendingText(text);
  // });
  // listenerCleanup = () => listener.remove();
  // For now, no-op. The setting is saved and UI is ready.
}

export function stopNotificationListener() {
  if (listenerCleanup) {
    listenerCleanup();
    listenerCleanup = null;
  }
}
