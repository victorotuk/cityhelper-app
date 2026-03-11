/**
 * Location-based country suggestion for Nava (CA/US).
 * Uses device timezone only — no GPS, no IP, no permission.
 * Users can disable in Settings and choose country manually (privacy).
 */

const STORAGE_KEY = (userId) => `nava_use_location_country_${userId || ''}`;

const CANADA_TZ_PREFIXES = [
  'America/St_Johns', 'America/Halifax', 'America/Toronto', 'America/Winnipeg',
  'America/Regina', 'America/Edmonton', 'America/Vancouver', 'America/Atikokan',
  'America/Blanc-Sablon', 'America/Glace_Bay', 'America/Goose_Bay', 'America/Moncton',
  'America/Iqaluit', 'America/Rainy_River', 'America/Rankin_Inlet', 'America/Resolute', 'America/Nipigon', 'America/Thunder_Bay'
];

/** Infer suggested country from browser timezone. Returns 'ca' | 'us' | null. */
export function getSuggestedCountryFromTimezone() {
  if (typeof Intl === 'undefined' || !Intl.DateTimeFormat) return null;
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (!tz) return null;
    if (tz.startsWith('Canada/') || CANADA_TZ_PREFIXES.some(prefix => tz === prefix || tz.startsWith(prefix + '/'))) return 'ca';
    if (tz.startsWith('America/') || tz.startsWith('US/')) return 'us';
    return null;
  } catch {
    return null;
  }
}

/** Whether to use location (timezone) to suggest/auto-set country. Default true. */
export function getUseLocationForCountry(userId) {
  if (!userId) return true;
  const stored = localStorage.getItem(STORAGE_KEY(userId));
  if (stored === 'false') return false;
  return true;
}

export function setUseLocationForCountry(userId, useLocation) {
  if (!userId) return;
  localStorage.setItem(STORAGE_KEY(userId), useLocation ? 'true' : 'false');
}
