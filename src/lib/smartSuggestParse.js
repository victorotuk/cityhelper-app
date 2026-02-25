/**
 * Parse text for dates/events - ALL ON DEVICE. Nothing sent to servers.
 * Used for Paste & suggest, Share, and (future) Notification suggestions.
 * We only ever save what the user explicitly chooses to add.
 */

import { isValid } from 'date-fns';

// Common date patterns
const PATTERNS = [
  // "Friday 7pm", "Friday at 7", "Fri 7pm"
  { regex: /\b(?:next\s+)?(mon|tue|wed|thu|fri|sat|sun)(?:day)?\s+(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i, type: 'weekday_time' },
  // "March 15", "Mar 15 2025", "15 March"
  { regex: /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})(?:,?\s+(\d{4}))?/i, type: 'month_day' },
  { regex: /\b(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{4})?/i, type: 'day_month' },
  // "2025-03-15", "03/15/2025", "15-03-2025"
  { regex: /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/, type: 'iso' },
  { regex: /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/, type: 'us_date' },
  // "next Friday", "this Saturday"
  { regex: /\b(?:next|this)\s+(mon|tue|wed|thu|fri|sat|sun)(?:day)?\b/i, type: 'next_weekday' },
  // "in 2 weeks", "in 3 days"
  { regex: /\bin\s+(\d+)\s+(day|days|week|weeks|month|months)\b/i, type: 'relative' },
  // "tomorrow", "tonight"
  { regex: /\b(tomorrow|tonight|today)\b/i, type: 'relative_word' },
];

const MONTHS = { jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12 };
const WEEKDAYS = { sun:0,mon:1,tue:2,wed:3,thu:4,fri:5,sat:6 };

function parseMatch(text, match, type) {
  const now = new Date();
  let date = null;

  try {
    if (type === 'weekday_time') {
      const day = WEEKDAYS[match[1].toLowerCase().slice(0,3)];
      let hour = parseInt(match[2], 10);
      const min = match[3] ? parseInt(match[3], 10) : 0;
      const ampm = (match[4] || '').toLowerCase();
      if (ampm === 'pm' && hour < 12) hour += 12;
      if (ampm === 'am' && hour === 12) hour = 0;
      const next = [0,1,2,3,4,5,6].map(d => {
        const d2 = new Date(now);
        const diff = (d - d2.getDay() + 7) % 7;
        if (diff === 0 && d2.getHours() >= hour) d2.setDate(d2.getDate() + 7);
        else d2.setDate(d2.getDate() + (diff || 7));
        return d2;
      });
      date = next[day];
      date.setHours(hour, min, 0, 0);
    } else if (type === 'month_day') {
      const m = MONTHS[match[1].toLowerCase().slice(0,3)];
      const d = parseInt(match[2], 10);
      const y = match[3] ? parseInt(match[3], 10) : now.getFullYear();
      date = new Date(y, m - 1, d);
    } else if (type === 'day_month') {
      const d = parseInt(match[1], 10);
      const m = MONTHS[match[2].toLowerCase().slice(0,3)];
      const y = match[3] ? parseInt(match[3], 10) : now.getFullYear();
      date = new Date(y, m - 1, d);
    } else if (type === 'iso') {
      date = new Date(match[1], match[2] - 1, match[3]);
    } else if (type === 'us_date') {
      date = new Date(match[3], match[1] - 1, match[2]);
    } else if (type === 'next_weekday') {
      const day = WEEKDAYS[match[1].toLowerCase().slice(0,3)];
      const diff = (day - now.getDay() + 7) % 7;
      date = new Date(now);
      date.setDate(now.getDate() + (diff || 7));
    } else if (type === 'relative') {
      const n = parseInt(match[1], 10);
      const unit = (match[2] || '').toLowerCase();
      date = new Date(now);
      if (unit.startsWith('day')) date.setDate(date.getDate() + n);
      else if (unit.startsWith('week')) date.setDate(date.getDate() + n * 7);
      else if (unit.startsWith('month')) date.setMonth(date.getMonth() + n);
    } else if (type === 'relative_word') {
      date = new Date(now);
      if (/tomorrow/i.test(match[1])) date.setDate(date.getDate() + 1);
      else if (/tonight/i.test(match[1])) date.setHours(19, 0, 0, 0);
    }
  } catch { /* ignore */ }

  if (date && isValid(date)) {
    return date.toISOString().slice(0, 10);
  }
  return null;
}

/**
 * Parse text and suggest a tracking item. Returns { name, due_date, category } or null.
 * All processing is on-device. No data is sent anywhere.
 */
export function parseTextForSuggestion(text) {
  if (!text || typeof text !== 'string') return null;
  const trimmed = text.trim();
  if (trimmed.length < 5) return null;

  let dueDate = null;
  let name = trimmed;

  for (const { regex, type } of PATTERNS) {
    const m = trimmed.match(regex);
    if (m) {
      dueDate = parseMatch(trimmed, m, type);
      if (dueDate) {
        // Extract a cleaner name - remove the date part
        name = trimmed.replace(regex, '').replace(/\s+/g, ' ').trim();
        if (name.length < 2) name = trimmed.slice(0, 50);
        break;
      }
    }
  }

  // Heuristics for category
  let category = 'important_dates';
  const lower = trimmed.toLowerCase();
  if (/\b(dinner|lunch|coffee|drinks|date|meet|meeting)\b/i.test(lower)) category = 'important_dates';
  else if (/\b(flight|trip|travel|vacation)\b/i.test(lower)) category = 'travel';
  else if (/\b(doctor|dentist|appointment|checkup)\b/i.test(lower)) category = 'health';
  else if (/\b(payment|bill|due|invoice)\b/i.test(lower)) category = 'credit_banking';

  return {
    name: name.slice(0, 120) || 'Event',
    due_date: dueDate,
    category,
  };
}

/**
 * Parse notification text for tracking suggestions.
 * Optimized for common notification patterns: parking tickets, renewals, bills, etc.
 * Returns { name, due_date, category } or null. All on-device.
 */
export function parseNotificationForSuggestion(text, title = '') {
  if (!text || typeof text !== 'string') return null;
  const combined = `${title || ''} ${text}`.trim();
  if (combined.length < 5) return null;

  const lower = combined.toLowerCase();

  // Skip irrelevant notifications
  if (/\b(verification|code|otp|2fa|login|sign in)\b/i.test(lower)) return null;
  if (/\b(ads?|promo|sale|discount)\b/i.test(lower) && !/\b(due|renew|expir)\b/i.test(lower)) return null;

  // Parking ticket patterns
  if (/\b(parking|ticket|fine|violation)\b/i.test(lower)) {
    const parsed = parseTextForSuggestion(combined);
    if (parsed) {
      parsed.category = 'credit_banking';
      parsed.name = parsed.name || 'Parking ticket / fine';
      return parsed;
    }
  }

  // Renewal / expiry patterns
  if (/\b(renew|renewal|expir|expiry|expires?|valid until)\b/i.test(lower)) {
    const parsed = parseTextForSuggestion(combined);
    if (parsed) {
      parsed.category = parsed.category === 'important_dates' ? 'credit_banking' : parsed.category;
      return parsed;
    }
  }

  // Bill / payment due
  if (/\b(bill|payment|due|invoice|overdue)\b/i.test(lower)) {
    const parsed = parseTextForSuggestion(combined);
    if (parsed) {
      parsed.category = 'credit_banking';
      return parsed;
    }
  }

  // DMV / license / registration
  if (/\b(dmv|license|registration|plate|vehicle)\b/i.test(lower)) {
    const parsed = parseTextForSuggestion(combined);
    if (parsed) {
      parsed.category = 'important_dates';
      return parsed;
    }
  }

  // Generic date detection
  return parseTextForSuggestion(combined);
}
