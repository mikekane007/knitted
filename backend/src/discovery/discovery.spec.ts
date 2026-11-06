import { distanceKm, geohash, plainText } from './geo';
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
});
