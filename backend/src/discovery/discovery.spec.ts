import { distanceKm, geohash, plainText } from './geo';
import { DiscoveryService } from './discovery.service';
import { DiscoveredEvent } from './discovery.types';
import { OpenAgendaSource } from './sources/openagenda.source';

describe('discovery helpers', () => {
  it('measures distance between cities', () => {
    // Paris to Lille is about 204 km as the crow flies.
    expect(distanceKm(48.8566, 2.3522, 50.6292, 3.0573)).toBeGreaterThan(200);
    expect(distanceKm(48.8566, 2.3522, 50.6292, 3.0573)).toBeLessThan(208);
    expect(distanceKm(10, 10, 10, 10)).toBe(0);
  });

  it('encodes geohashes', () => {
    expect(geohash(57.64911, 10.40744, 11)).toBe('u4pruydqqvj');
  });

  it('turns HTML into short plain text', () => {
    expect(plainText('<p>Hello <strong>world</strong></p>')).toBe('Hello world');
    expect(plainText('a'.repeat(20), 10)).toBe(`${'a'.repeat(9)}…`);
    expect(plainText('   ')).toBeNull();
  });

  it('reads free/paid from OpenAgenda price text', () => {
    const source = new OpenAgendaSource();
    expect(source.isFree('Entrée libre')).toBe(true);
    expect(source.isFree('Gratuit')).toBe(true);
    expect(source.isFree('De 10.3 € à 25.69 €')).toBe(false);
    expect(source.isFree('Entrée : 4 € (2€ réduit)')).toBe(false);
    expect(source.isFree('Sur réservation')).toBeNull();
    expect(source.isFree(null)).toBeNull();
  });

  it('picks the right booking button for OpenAgenda events', () => {
    const source = new OpenAgendaSource();
    const page = 'https://openagenda.com/x/events/y';
    expect(source.action('https://shotgun.live/e', false, page)).toEqual({
      kind: 'register', label: 'Book on the organiser’s site', url: 'https://shotgun.live/e',
    });
    expect(source.action('https://form.example/e', true, page).label).toBe('Register for free');
    expect(source.action(null, true, page)).toEqual({ kind: 'free', label: 'Free, just turn up', url: page });
    expect(source.action(null, null, page).kind).toBe('info');
  });
});

describe('Ticketmaster affiliate links', () => {
  const service = new DiscoveryService({} as never);
  const event = {
    source: 'ticketmaster',
    url: 'https://www.ticketmaster.fr/event/1',
    action: { kind: 'tickets', label: 'Get tickets on Ticketmaster', url: 'https://www.ticketmaster.fr/event/1' },
    affiliate: false,
  } as DiscoveredEvent;

  afterEach(() => {
    delete process.env.TICKETMASTER_AFFILIATE_URL;
  });

  it('leaves links alone until a tracking link is configured', () => {
    expect(service.withAffiliate(event)).toEqual(event);
  });

  it('wraps Ticketmaster links in the tracking link', () => {
    process.env.TICKETMASTER_AFFILIATE_URL = 'https://ticketmaster.evyy.net/c/1/2/3?u={url}';
    const wrapped = service.withAffiliate(event);
    const expected = 'https://ticketmaster.evyy.net/c/1/2/3?u=https%3A%2F%2Fwww.ticketmaster.fr%2Fevent%2F1';
    expect(wrapped.affiliate).toBe(true);
    expect(wrapped.url).toBe(expected);
    expect(wrapped.action.url).toBe(expected);
  });

  it('never wraps other sources', () => {
    process.env.TICKETMASTER_AFFILIATE_URL = 'https://ticketmaster.evyy.net/c/1/2/3?u={url}';
    expect(service.withAffiliate({ ...event, source: 'openagenda' }).affiliate).toBe(false);
  });
});
