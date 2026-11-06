import { googleCalendarUrl, icsContent } from './calendar';

describe('calendar helpers', () => {
  const event = {
    title: 'Jazz, wine; and more',
    start: '2026-11-20T19:00:00.000Z',
    end: null,
    location: 'Le Bistrot, Lille',
    description: 'Line one\nLine two',
    url: 'https://example.com/e',
  };

  it('builds a Google Calendar link with a two-hour default length', () => {
    const url = new URL(googleCalendarUrl(event));
    expect(url.searchParams.get('text')).toBe('Jazz, wine; and more');
    expect(url.searchParams.get('dates')).toBe('20261120T190000Z/20261120T210000Z');
    expect(url.searchParams.get('location')).toBe('Le Bistrot, Lille');
  });

  it('writes a valid, escaped .ics event with a reminder the day before', () => {
    const ics = icsContent(event, 'openagenda-1');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('DTSTART:20261120T190000Z');
    expect(ics).toContain(String.raw`SUMMARY:Jazz\, wine\; and more`);
    expect(ics).toContain(String.raw`DESCRIPTION:Line one\nLine two`);
    expect(ics).toContain('TRIGGER:-P1D');
    expect(ics.split('\r\n').every((line) => line.length > 0)).toBeTrue();
  });
});
