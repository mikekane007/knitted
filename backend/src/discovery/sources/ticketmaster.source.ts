import { DiscoveredEvent, DiscoverySearch, DiscoverySource } from '../discovery.types';
import { distanceKm, fetchJson, geohash, plainText } from '../geo';

const API_URL = 'https://app.ticketmaster.com/discovery/v2';

interface TicketmasterEvent {
  id?: string;
  name?: string;
  url?: string;
  info?: string;
  pleaseNote?: string;
  images?: { url: string; width: number; ratio?: string }[];
  dates?: { start?: { dateTime?: string; localDate?: string }; end?: { dateTime?: string } };
  classifications?: { segment?: { name?: string }; genre?: { name?: string }; subGenre?: { name?: string } }[];
  priceRanges?: { min?: number; max?: number; currency?: string }[];
  _embedded?: {
    venues?: {
      name?: string;
      address?: { line1?: string };
      city?: { name?: string };
      location?: { latitude?: string; longitude?: string };
    }[];
  };
}

interface Origin {
  latitude: number;
  longitude: number;
}

/**
 * Ticketmaster Discovery API: concerts, sport, theatre, comedy and family events in ~30 countries.
 * Free tier (5,000 calls/day); enabled when TICKETMASTER_API_KEY is set.
 */
export class TicketmasterSource implements DiscoverySource {
  readonly id = 'ticketmaster' as const;
  readonly name = 'Ticketmaster';

  isEnabled(): boolean {
    return Boolean(process.env.TICKETMASTER_API_KEY);
  }

  async search(query: DiscoverySearch): Promise<DiscoveredEvent[]> {
    const isoSeconds = (date: Date) => `${date.toISOString().slice(0, 19)}Z`;
    const params = new URLSearchParams({
      apikey: process.env.TICKETMASTER_API_KEY ?? '',
      geoPoint: geohash(query.latitude, query.longitude, 9),
      radius: String(Math.round(query.radiusKm)),
      unit: 'km',
      startDateTime: isoSeconds(query.from),
      endDateTime: isoSeconds(query.to),
      sort: 'date,asc',
      size: '100',
    });
    const payload = await fetchJson(`${API_URL}/events.json?${params}`) as { _embedded?: { events?: TicketmasterEvent[] } };
    const events: DiscoveredEvent[] = [];
    for (const item of payload._embedded?.events ?? []) {
      const event = this.toEvent(item, query);
      if (event) events.push(event);
    }
    return events;
  }

  async getById(sourceId: string, origin?: Origin): Promise<DiscoveredEvent | null> {
    if (!this.isEnabled() || !/^[A-Za-z0-9_-]{1,64}$/.test(sourceId)) return null;
    const params = new URLSearchParams({ apikey: process.env.TICKETMASTER_API_KEY ?? '' });
    try {
      const item = await fetchJson(`${API_URL}/events/${sourceId}.json?${params}`) as TicketmasterEvent;
      return this.toEvent(item, origin, 3000);
    } catch (error) {
      if (error instanceof Error && error.message === 'HTTP 404') return null;
      throw error;
    }
  }

  private toEvent(item: TicketmasterEvent, origin?: Origin, descriptionLength = 600): DiscoveredEvent | null {
    const venue = item._embedded?.venues?.[0];
    const latitude = Number(venue?.location?.latitude);
    const longitude = Number(venue?.location?.longitude);
    const start = item.dates?.start?.dateTime ?? item.dates?.start?.localDate;
    if (!item.id || !item.name || !item.url || !start || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }
    const classification = item.classifications?.[0];
    const tags = [classification?.segment?.name, classification?.genre?.name, classification?.subGenre?.name]
      .filter((tag): tag is string => Boolean(tag) && tag !== 'Undefined');
    const price = item.priceRanges?.[0];
    const image = (item.images ?? [])
      .filter((img) => img.ratio === '16_9')
      .sort((a, b) => b.width - a.width)
      .find((img) => img.width <= 1200) ?? item.images?.[0];

    return {
      id: `ticketmaster:${item.id}`,
      source: this.id,
      sourceName: this.name,
      title: item.name,
      description: plainText(item.info ?? item.pleaseNote, descriptionLength),
      start: new Date(start).toISOString(),
      end: item.dates?.end?.dateTime ?? null,
      venue: venue?.name ?? null,
      address: venue?.address?.line1 ?? null,
      city: venue?.city?.name ?? null,
      latitude,
      longitude,
      distanceKm: origin ? distanceKm(origin.latitude, origin.longitude, latitude, longitude) : null,
      imageUrl: image?.url ?? null,
      url: item.url,
      category: tags[0] ?? null,
      tags,
      priceLabel: price ? this.priceLabel(price) : null,
      isFree: price ? (price.max ?? price.min ?? 0) === 0 : null,
      action: { kind: 'tickets', label: 'Get tickets on Ticketmaster', url: item.url },
      affiliate: false,
    };
  }

  private priceLabel(price: { min?: number; max?: number; currency?: string }): string {
    const format = (value: number) => new Intl.NumberFormat('en', {
      style: 'currency',
      currency: price.currency ?? 'USD',
      maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
    }).format(value);
    if (!price.max && !price.min) return 'Free';
    if (price.min !== undefined && price.max !== undefined && price.min !== price.max) {
      return `${format(price.min)} – ${format(price.max)}`;
    }
    return format(price.min ?? price.max ?? 0);
  }
}
