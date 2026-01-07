// Calendar Export Utilities
// Supports Google Calendar, Apple Calendar, Outlook, and .ics download

import { format, parseISO, addDays } from 'date-fns';
import { APP_CONFIG } from './config';

/**
 * Generate Google Calendar URL for a single event
 */
export function getGoogleCalendarUrl(item) {
  if (!item.due_date) return null;
  
  const date = parseISO(item.due_date);
  const dateStr = format(date, "yyyyMMdd");
  const nextDay = format(addDays(date, 1), "yyyyMMdd");
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${item.name} - ${APP_CONFIG.name} Reminder`,
    dates: `${dateStr}/${nextDay}`,
    details: `This is a reminder from ${APP_CONFIG.name}.\n\nCategory: ${item.category || 'Other'}\n\nDon't miss this deadline!`,
    location: 'Canada',
  });
  
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate .ics file content for a single event
 */
export function generateICS(item) {
  if (!item.due_date) return null;
  
  const date = parseISO(item.due_date);
  const dateStr = format(date, "yyyyMMdd");
  const now = format(new Date(), "yyyyMMdd'T'HHmmss");
  const uid = `${item.id}@${APP_CONFIG.name.toLowerCase().replace(/\s/g, '')}`;
  
  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//${APP_CONFIG.name}//EN
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${now}
DTSTART;VALUE=DATE:${dateStr}
DTEND;VALUE=DATE:${dateStr}
SUMMARY:${item.name} - Deadline
DESCRIPTION:${APP_CONFIG.name} reminder for ${item.name}\\nCategory: ${item.category || 'Other'}
CATEGORIES:${APP_CONFIG.name}
STATUS:CONFIRMED
BEGIN:VALARM
TRIGGER:-P7D
ACTION:DISPLAY
DESCRIPTION:7 days until ${item.name} deadline
END:VALARM
BEGIN:VALARM
TRIGGER:-P1D
ACTION:DISPLAY
DESCRIPTION:1 day until ${item.name} deadline
END:VALARM
END:VEVENT
END:VCALENDAR`;

  return icsContent;
}

/**
 * Generate .ics file for multiple events
 */
export function generateMultipleICS(items) {
  const validItems = items.filter(item => item.due_date);
  if (validItems.length === 0) return null;
  
  const now = format(new Date(), "yyyyMMdd'T'HHmmss");
  
  let events = '';
  validItems.forEach(item => {
    const date = parseISO(item.due_date);
    const dateStr = format(date, "yyyyMMdd");
    const uid = `${item.id}@${APP_CONFIG.name.toLowerCase().replace(/\s/g, '')}`;
    
    events += `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${now}
DTSTART;VALUE=DATE:${dateStr}
DTEND;VALUE=DATE:${dateStr}
SUMMARY:${item.name} - Deadline
DESCRIPTION:${APP_CONFIG.name} reminder\\nCategory: ${item.category || 'Other'}
CATEGORIES:${APP_CONFIG.name}
STATUS:CONFIRMED
BEGIN:VALARM
TRIGGER:-P7D
ACTION:DISPLAY
DESCRIPTION:7 days until ${item.name} deadline
END:VALARM
BEGIN:VALARM
TRIGGER:-P1D
ACTION:DISPLAY
DESCRIPTION:1 day until ${item.name} deadline
END:VALARM
END:VEVENT
`;
  });

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//${APP_CONFIG.name}//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:${APP_CONFIG.name} Deadlines
${events}END:VCALENDAR`;
}

/**
 * Download ICS file
 */
export function downloadICS(content, filename = 'calendar.ics') {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Open Google Calendar to add event
 */
export function addToGoogleCalendar(item) {
  const url = getGoogleCalendarUrl(item);
  if (url) {
    window.open(url, '_blank');
  }
}

/**
 * Export all items to calendar
 */
export function exportAllToCalendar(items) {
  const ics = generateMultipleICS(items);
  if (ics) {
    downloadICS(ics, `${APP_CONFIG.name.toLowerCase()}-deadlines.ics`);
  }
}

