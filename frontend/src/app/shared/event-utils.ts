import { KnittedEvent } from '../interfaces/event.interface';

export const EVENT_CATEGORIES = ['Art & Design', 'Food & Wine', 'Active & Outdoors'];

export const CATEGORY_ICONS: Record<string, string> = {
  'Art & Design': 'fa-palette',
  'Food & Wine': 'fa-wine-glass',
  'Active & Outdoors': 'fa-person-hiking',
};

export const DEFAULT_COVER = 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=1200';

export function formatPrice(price: number): string {
  if (!price) return 'Free';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: Number.isInteger(price) ? 0 : 2,
  }).format(price);
}

export function spotsLabel(event: Pick<KnittedEvent, 'availableTickets' | 'totalCapacity'>): string | null {
  if (event.availableTickets <= 0) return 'Sold out';
  if (event.availableTickets <= Math.max(3, Math.ceil(event.totalCapacity * 0.2))) {
    return `Only ${event.availableTickets} ${event.availableTickets === 1 ? 'spot' : 'spots'} left`;
  }
  return null;
}

export function isPast(date: string): boolean {
  const day = new Date(date);
  day.setHours(23, 59, 59, 999);
  return day.getTime() < Date.now();
}

export function splitTags(tags: string | null | undefined): string[] {
  return (tags ?? '').split(',').map((tag) => tag.trim()).filter(Boolean);
}

export function initials(name: string | null | undefined, fallback = '?'): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback.charAt(0).toUpperCase();
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

/** Local YYYY-MM-DD for date inputs and API date filters. */
export function toDateInput(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Converts "07:00 PM" or "19:00" into minutes after midnight. */
export function parseTime(value: string | null | undefined): number | null {
  const match = (value ?? '').trim().match(/^(\d{1,2}):(\d{2})\s*([ap]\.?m\.?)?$/i);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3]?.toLowerCase().replace(/\./g, '');
  if (meridiem === 'pm' && hours < 12) hours += 12;
  if (meridiem === 'am' && hours === 12) hours = 0;
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/** "19:30" (time input) -> "07:30 PM", the format stored on events. */
export function to12Hour(value: string): string {
  const minutes = parseTime(value);
  if (minutes === null) return value;
  const hours = Math.floor(minutes / 60);
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const display = hours % 12 === 0 ? 12 : hours % 12;
  return `${String(display).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')} ${suffix}`;
}

function eventBoundaries(event: KnittedEvent): { start: Date; end: Date } {
  const day = new Date(event.date);
  const startMinutes = parseTime(event.startTime) ?? day.getHours() * 60 + day.getMinutes();
  const endMinutes = parseTime(event.endTime) ?? startMinutes + 120;
  const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, startMinutes);
  const end = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, endMinutes > startMinutes ? endMinutes : startMinutes + 120);
  return { start, end };
}

function calendarStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

export function googleCalendarUrl(event: KnittedEvent, pageUrl: string): string {
  const { start, end } = eventBoundaries(event);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${calendarStamp(start)}/${calendarStamp(end)}`,
    details: `${event.description}\n\n${pageUrl}`,
    location: event.location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function icsFile(event: KnittedEvent, pageUrl: string): string {
  const { start, end } = eventBoundaries(event);
  const escape = (text: string) => text.replace(/\\/g, '\\\\').replace(/([,;])/g, '\\$1').replace(/\r?\n/g, '\\n');
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Knitted//Events//EN',
    'BEGIN:VEVENT',
    `UID:knitted-event-${event.id}@knitted-web.vercel.app`,
    `DTSTAMP:${calendarStamp(new Date())}`,
    `DTSTART:${calendarStamp(start)}`,
    `DTEND:${calendarStamp(end)}`,
    `SUMMARY:${escape(event.title)}`,
    `DESCRIPTION:${escape(`${event.description}\n\n${pageUrl}`)}`,
    `LOCATION:${escape(event.location)}`,
    `URL:${pageUrl}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

/** Pulls a readable message out of an HttpErrorResponse from the Nest API. */
export function apiErrorMessage(error: unknown, fallback: string): string {
  const response = error as { status?: number; error?: unknown; message?: string } | null;
  const body = response?.error as { message?: string | string[] } | string | undefined;
  if (response?.status === 0) return 'Can’t reach Knitted right now. Check your connection and try again.';
  if (typeof body === 'string' && body.trim()) return body;
  if (body && typeof body === 'object' && body.message) {
    return Array.isArray(body.message) ? body.message.join(' ') : body.message;
  }
  return fallback;
}
