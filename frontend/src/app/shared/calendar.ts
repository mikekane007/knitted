/** "Add to calendar" helpers: a Google Calendar link and a downloadable .ics file (Apple, Outlook…). */
export interface CalendarEvent {
  title: string;
  start: string;
  end: string | null;
  location: string | null;
  description: string | null;
  url: string;
}

/** 20261106T170000Z */
function utcStamp(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/** Events without an end time are given two hours. */
function endOf(event: CalendarEvent): string {
  return event.end ?? new Date(Date.parse(event.start) + 2 * 3_600_000).toISOString();
}

export function googleCalendarUrl(event: CalendarEvent): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${utcStamp(event.start)}/${utcStamp(endOf(event))}`,
    details: [event.description, event.url].filter(Boolean).join('\n\n'),
    location: event.location ?? '',
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

/** RFC 5545 text escaping. */
function icsText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');
}

export function icsContent(event: CalendarEvent, uid: string): string {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Knitted//Events//EN',
    'BEGIN:VEVENT',
    `UID:${uid}@knitted`,
    `DTSTAMP:${utcStamp(new Date().toISOString())}`,
    `DTSTART:${utcStamp(event.start)}`,
    `DTEND:${utcStamp(endOf(event))}`,
    `SUMMARY:${icsText(event.title)}`,
    event.location ? `LOCATION:${icsText(event.location)}` : '',
    `DESCRIPTION:${icsText([event.description, event.url].filter(Boolean).join('\n\n'))}`,
    `URL:${event.url}`,
    // Reminder the day before.
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder',
    'TRIGGER:-P1D',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');
}

export function downloadIcs(event: CalendarEvent, uid: string): void {
  const blob = new Blob([icsContent(event, uid)], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${event.title.replace(/[^\w\- ]+/g, '').trim().slice(0, 60) || 'event'}.ics`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}
