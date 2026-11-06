import { DiscoveredEvent, DiscoverySearch, DiscoverySource } from '../discovery.types';
import { distanceKm, fetchJson, plainText } from '../geo';

const DATASET_URL =
  'https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/evenements-publics-openagenda/records';

interface OpenAgendaRecord {
  uid?: string;
  canonicalurl?: string;
  title_fr?: string;
  description_fr?: string;
  conditions_fr?: string;
  keywords_fr?: string[];
  image?: string;
  firstdate_begin?: string;
  firstdate_end?: string;
  timings?: string;
  location_coordinates?: { lat: number; lon: number };
  location_name?: string;
  location_address?: string;
  location_city?: string;
  originagenda_title?: string;
  registration?: string;
}

/**
 * Public events published on OpenAgenda (concerts, workshops, markets, festivals, talks…),
 * served by OpenDataSoft's open dataset. Free and keyless; strongest in France, Belgium and Switzerland.
 */
export class OpenAgendaSource implements DiscoverySource {
  readonly id = 'openagenda' as const;
  readonly name = 'OpenAgenda';

  isEnabled(): boolean {
    return true;
  }

  async search(query: DiscoverySearch): Promise<DiscoveredEvent[]> {
    const point = `geom'POINT(${query.longitude} ${query.latitude})'`;
    const where = [
      `within_distance(location_coordinates, ${point}, ${query.radiusKm}km)`,
      `lastdate_end >= '${query.from.toISOString()}'`,
      `firstdate_begin <= '${query.to.toISOString()}'`,
    ].join(' AND ');
    const params = new URLSearchParams({
      where,
      order_by: 'lastdate_begin',
      limit: '100',
    });
    const payload = await fetchJson(`${DATASET_URL}?${params}`) as { results?: OpenAgendaRecord[] };
    const events: DiscoveredEvent[] = [];
    for (const record of payload.results ?? []) {
      const event = this.toEvent(record, query);
      if (event) events.push(event);
    }
    return events;
  }

  private toEvent(record: OpenAgendaRecord, query: DiscoverySearch): DiscoveredEvent | null {
    const coordinates = record.location_coordinates;
    if (!record.uid || !record.title_fr || !coordinates) return null;
    const occurrence = this.nextOccurrence(record, query);
    if (!occurrence) return null;

    const rawConditions = plainText(record.conditions_fr, 90);
    // Some organisers paste a booking link here instead of a price.
    const conditions = rawConditions && !/https?:\/\/|www\./i.test(rawConditions) ? rawConditions : null;
    const isFree = this.isFree(conditions);

    return {
      id: `openagenda:${record.uid}`,
      source: this.id,
      sourceName: record.originagenda_title ? `OpenAgenda · ${record.originagenda_title}` : this.name,
      title: plainText(record.title_fr, 200) ?? 'Event',
      description: plainText(record.description_fr),
      start: occurrence.begin,
      end: occurrence.end,
      venue: record.location_name ?? null,
      address: record.location_address ?? null,
      city: record.location_city ?? null,
      latitude: coordinates.lat,
      longitude: coordinates.lon,
      distanceKm: distanceKm(query.latitude, query.longitude, coordinates.lat, coordinates.lon),
      imageUrl: record.image ?? null,
      url: this.ticketUrl(record) ?? record.canonicalurl ?? 'https://openagenda.com',
      category: record.keywords_fr?.[0] ?? null,
      tags: (record.keywords_fr ?? []).slice(0, 5),
      priceLabel: isFree ? 'Free' : conditions,
      isFree,
    };
  }

  /** Picks the first session that hasn't finished yet and starts inside the search window. */
  private nextOccurrence(record: OpenAgendaRecord, query: DiscoverySearch): { begin: string; end: string | null } | null {
    let timings: { begin?: string; end?: string }[] = [];
    try {
      const parsed: unknown = JSON.parse(record.timings ?? '[]');
      if (Array.isArray(parsed)) timings = parsed;
    } catch {
      timings = [];
    }
    const from = query.from.getTime();
    const to = query.to.getTime();
    const upcoming = timings
      .filter((t) => t.begin && t.end && Date.parse(t.end) >= from && Date.parse(t.begin) <= to)
      .sort((a, b) => Date.parse(a.begin!) - Date.parse(b.begin!));
    if (upcoming.length) {
      return { begin: new Date(upcoming[0].begin!).toISOString(), end: new Date(upcoming[0].end!).toISOString() };
    }
    if (!timings.length && record.firstdate_begin) {
      return { begin: record.firstdate_begin, end: record.firstdate_end ?? null };
    }
    return null;
  }

  /** OpenAgenda prices are free text ("Entrée libre", "De 10 € à 25 €"): true, false, or null if unclear. */
  isFree(conditions: string | null): boolean | null {
    if (!conditions) return null;
    if (/(^|[^\d])[1-9]\d*([.,]\d+)?\s?€|€\s?[1-9]/.test(conditions)) return false;
    if (/gratuit|entrée libre|accès libre|libre accès|free|^\s*0\s?€/i.test(conditions)) return true;
    return null;
  }

  private ticketUrl(record: OpenAgendaRecord): string | null {
    try {
      const links: unknown = JSON.parse(record.registration ?? '[]');
      if (Array.isArray(links)) {
        const link = links.find((item) => item?.type === 'link' && typeof item.value === 'string');
        if (link && /^https?:\/\//.test(link.value)) return link.value;
      }
    } catch {
      // Registration is optional and free-form; fall back to the OpenAgenda page.
    }
    return null;
  }
}
