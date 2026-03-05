/**
 * Province/state name to code mapping and renewal URL resolution for compliance items.
 * Used by Dashboard ItemCard for "Renew now" links.
 */

import { APP_CONFIG } from './config.js';

export const PROVINCE_NAME_TO_CODE = {
  ontario: 'ON', 'british columbia': 'BC', 'b.c.': 'BC', bc: 'BC',
  alberta: 'AB', ab: 'AB', quebec: 'QC', qc: 'QC', manitoba: 'MB', mb: 'MB',
  saskatchewan: 'SK', sk: 'SK', 'nova scotia': 'NS', ns: 'NS',
  'new brunswick': 'NB', nb: 'NB', 'newfoundland': 'NL', nl: 'NL',
  'prince edward island': 'PE', pei: 'PE', pe: 'PE',
  yukon: 'YT', yt: 'YT', 'northwest territories': 'NT', nt: 'NT',
  nunavut: 'NU', nu: 'NU',
  'new york': 'NY', ny: 'NY', california: 'CA', ca: 'CA', texas: 'TX', tx: 'TX',
  florida: 'FL', fl: 'FL', illinois: 'IL', il: 'IL', pennsylvania: 'PA', pa: 'PA',
  arizona: 'AZ', az: 'AZ', washington: 'WA', wa: 'WA', massachusetts: 'MA', ma: 'MA'
};

/**
 * Get renewal URL for an item. Returns URL or null.
 * @param {string} itemName - Item name (e.g. "Driver's License (ON)")
 * @param {string} country - Country code (ca, us)
 * @returns {string|null}
 */
export function getRenewalUrl(itemName, country) {
  const portals = APP_CONFIG.renewalPortals?.[country];
  if (!portals) return null;
  const name = (itemName || '').trim();
  for (const [key, val] of Object.entries(portals)) {
    if (name === key || name.toLowerCase().includes(key.toLowerCase())) {
      if (typeof val === 'string') return val;
      if (typeof val === 'object' && val !== null) {
        const prov2Match = name.match(/\(([A-Z]{2})\)/);
        let prov = prov2Match ? prov2Match[1] : null;
        if (!prov) {
          const provNameMatch = name.match(/\(([^)]+)\)/);
          if (provNameMatch) {
            const p = provNameMatch[1].toLowerCase().trim();
            prov = PROVINCE_NAME_TO_CODE[p] || null;
          }
        }
        return val[prov] || val.default || null;
      }
    }
  }
  return null;
}
