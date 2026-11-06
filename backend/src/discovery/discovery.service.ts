import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import {
  DiscoveredEvent,
  DiscoverySearch,
  DiscoverySource,
  DiscoverySourceStatus,
} from './discovery.types';
import { fetchJson } from './geo';
import { OpenAgendaSource } from './sources/openagenda.source';
import { TicketmasterSource } from './sources/ticketmaster.source';

export interface NearbyResult {
  place: string | null;
  latitude: number;
  longitude: number;
  radiusKm: number;
  from: string;
  to: string;
  events: DiscoveredEvent[];
  sources: DiscoverySourceStatus[];
}

export interface GeocodeResult {
  label: string;
  latitude: number;
  longitude: number;
}

const CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_RESULTS = 150;
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org';
// Nominatim's usage policy asks every app to identify itself.
const NOMINATIM_HEADERS = {
  'user-agent': 'Knitted/1.0 (+https://knitted-web.vercel.app)',
  'accept-language': 'en',
};

/** Finds events near a point across free public event sources, not just events hosted on Knitted. */
@Injectable()
export class DiscoveryService {
  private readonly logger = new Logger(DiscoveryService.name);
  private readonly sources: DiscoverySource[];
  private readonly cache = new Map<string, { expires: number; value: unknown }>();
  private nominatimQueue: Promise<unknown> = Promise.resolve();

  constructor() {
    this.sources = [new OpenAgendaSource(), new TicketmasterSource()];
  }

  async nearby(latitude: number, longitude: number, radiusKm = 25, days = 30): Promise<NearbyResult> {
    // Round to ~1 km so nearby users share cached results.
    const lat = Math.round(latitude * 100) / 100;
    const lng = Math.round(longitude * 100) / 100;
    const key = `nearby:${lat}:${lng}:${radiusKm}:${days}`;
    return this.cached(key, async () => {
      const from = new Date();
      const to = new Date(from.getTime() + days * 86_400_000);
      const query: DiscoverySearch = { latitude: lat, longitude: lng, radiusKm, from, to };

      const enabled = this.sources.filter((source) => source.isEnabled());
      const [settled, place] = await Promise.all([
        Promise.allSettled(enabled.map((source) => source.search(query))),
        this.reverseGeocode(lat, lng).catch(() => null),
      ]);

      const sources: DiscoverySourceStatus[] = this.sources.map((source) => {
        const index = enabled.indexOf(source);
        if (index < 0) return { id: source.id, name: source.name, status: 'disabled', count: 0 };
        const outcome = settled[index];
        if (outcome.status === 'fulfilled') {
          return { id: source.id, name: source.name, status: 'ok', count: outcome.value.length };
        }
        this.logger.warn(`${source.name} search failed: ${String(outcome.reason)}`);
        return { id: source.id, name: source.name, status: 'error', count: 0, message: 'Temporarily unavailable' };
      });

      if (sources.every((source) => source.status !== 'ok')) {
        throw new ServiceUnavailableException('We couldn’t reach any event sources. Please try again shortly.');
      }

      const events = this.dedupe(settled.flatMap((outcome) => (outcome.status === 'fulfilled' ? outcome.value : [])))
        .filter((event) => event.distanceKm <= radiusKm + 1)
        .sort((a, b) => Date.parse(a.start) - Date.parse(b.start) || a.distanceKm - b.distanceKm)
        .slice(0, MAX_RESULTS)
        .map((event) => ({ ...event, distanceKm: Math.round(event.distanceKm * 10) / 10 }));

      return {
        place,
        latitude: lat,
        longitude: lng,
        radiusKm,
        from: from.toISOString(),
        to: to.toISOString(),
        events,
        sources,
      };
    });
  }

  /** Turns a typed place ("Lille", "Brooklyn, NY") into coordinates. */
  async geocode(text: string): Promise<GeocodeResult> {
    const q = text.trim();
    return this.cached(`geocode:${q.toLowerCase()}`, async () => {
      const params = new URLSearchParams({ q, format: 'jsonv2', limit: '1', addressdetails: '1' });
      const results = await this.nominatim(`${NOMINATIM_URL}/search?${params}`) as {
        lat: string; lon: string; display_name: string; name?: string;
        address?: Record<string, string>;
      }[];
      const first = results?.[0];
      if (!first) throw new NotFoundException(`We couldn’t find “${q}”. Try a city or postcode.`);
      return {
        label: this.placeLabel(first.address) ?? first.name ?? first.display_name,
        latitude: Number(first.lat),
        longitude: Number(first.lon),
      };
    });
  }

  private async reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
    return this.cached(`reverse:${latitude}:${longitude}`, async () => {
      const params = new URLSearchParams({
        lat: String(latitude), lon: String(longitude), format: 'jsonv2', zoom: '10',
      });
      const result = await this.nominatim(`${NOMINATIM_URL}/reverse?${params}`) as {
        address?: Record<string, string>; name?: string;
      };
      return this.placeLabel(result?.address) ?? result?.name ?? null;
    });
  }

  private placeLabel(address?: Record<string, string>): string | null {
    if (!address) return null;
    const town = address['city'] ?? address['town'] ?? address['village'] ?? address['municipality'] ?? address['county'];
    return [town, address['country']].filter(Boolean).join(', ') || null;
  }

  /** Nominatim allows one request per second, so calls are queued with a gap between them. */
  private nominatim(url: string): Promise<unknown> {
    const run = this.nominatimQueue.then(() => fetchJson(url, 8000, NOMINATIM_HEADERS));
    this.nominatimQueue = run.catch(() => undefined).then(() => new Promise((resolve) => setTimeout(resolve, 1100)));
    return run;
  }

  /** The same event can be listed on several sources; keep the first of each title + day + venue. */
  private dedupe(events: DiscoveredEvent[]): DiscoveredEvent[] {
    const seen = new Set<string>();
    return events.filter((event) => {
      const key = `${event.title.toLowerCase().replace(/[^a-z0-9]/g, '')}|${event.start.slice(0, 10)}|${(event.venue ?? '').toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private async cached<T>(key: string, load: () => Promise<T>): Promise<T> {
    const hit = this.cache.get(key);
    if (hit && hit.expires > Date.now()) return hit.value as T;
    const value = await load();
    this.cache.set(key, { expires: Date.now() + CACHE_TTL_MS, value });
    if (this.cache.size > 500) {
      const oldest = this.cache.keys().next().value;
      if (oldest !== undefined) this.cache.delete(oldest);
    }
    return value;
  }
}
