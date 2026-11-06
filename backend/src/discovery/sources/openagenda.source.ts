import { DiscoveredEvent, DiscoverySearch, DiscoverySource, EventAction } from '../discovery.types';
import { distanceKm, fetchJson, plainText } from '../geo';

const DATASET_URL =
  'https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/evenements-publics-openagenda/records';

interface OpenAgendaRecord {
  uid?: string;
  canonicalurl?: string;
  title_fr?: string;
  description_fr?: string;
  longdescription_fr?: string;
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

interface Origin {
  latitude: number;
  longitude: number;
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
    const params = new URLSearchParams({ where, order_by: 'lastdate_begin', limit: '100' });
    const payload = await fetchJson(`${DATASET_URL}?${params}`) as { results?: OpenAgendaRecord[] };
    const events: DiscoveredEvent[] = [];
    for (const record of payload.results ?? []) {
      const event = this.toEvent(record, query, query.from, query.to);
      if (event) events.push(event);
    }
    return events;
  }

  async getById(sourceId: string, origin?: Origin): Promise<DiscoveredEvent | null> {
    if (!/^\d{1,15}$/.test(sourceId)) return null;
    const params = new URLSearchParams({ where: `uid = "${sourceId}"`, limit: '1' });
    const payload = await fetchJson(`${DATASET_URL}?${params}`) as { results?: OpenAgendaRecord[] };
    const record = payload.results?.[0];
    if (!record) return null;
    // A single lookup shows the next session from now, however far ahead it is.
    return this.toEvent(record, origin, new Date(), new Date(Date.now() + 5 * 365 * 86_400_000), 3000);
  }

  private toEvent(
    record: OpenAgendaRecord,
    origin: Origin | undefined,
    from: Date,
    to: Date,
    descriptionLength = 600,
  ): DiscoveredEvent | null {
    const coordinates = record.location_coordinates;
    if (!record.uid || !record.title_fr || !coordinates) return null;
    const occurrence = this.nextOccurrence(record, from, to) ?? this.lastOccurrence(record);
    if (!occurrence) return null;

    const rawConditions = plainText(record.conditions_fr, 90);
    // Some organisers paste a booking link here instead of a price.
    const conditions = rawConditions && !/https?:\/\/|www\./i.test(rawConditions) ? rawConditions : null;
    const isFree = this.isFree(conditions);
    const page = record.canonicalurl ?? 'https://openagenda.com';
    const description = descriptionLength > 600
      ? plainText(record.longdescription_fr ?? record.description_fr, descriptionLength)
      : plainText(record.description_fr, descriptionLength);

    return {
      id: `openagenda:${record.uid}`,
      source: this.id,
      sourceName: record.originagenda_title ? `OpenAgenda · ${record.originagenda_title}` : this.name,
      title: plainText(record.title_fr, 200) ?? 'Event',
      description,
      start: occurrence.begin,
      end: occurrence.end,
      venue: record.location_name ?? null,
      address: record.location_address ?? null,
      city: record.location_city ?? null,
      latitude: coordinates.lat,
      longitude: coordinates.lon,
      distanceKm: origin ? distanceKm(origin.latitude, origin.longitude, coordinates.lat, coordinates.lon) : null,
      imageUrl: record.image ?? null,
      url: page,
      category: record.keywords_fr?.[0] ?? null,
      tags: (record.keywords_fr ?? []).slice(0, 5),
      priceLabel: isFree ? 'Free' : conditions,
      isFree,
      action: this.action(this.registrationUrl(record), isFree, page),
      affiliate: false,
    };
  }

  /** OpenAgenda prices are free text ("Entrée libre", "De 10 € à 25 €"): true, false, or null if unclear. */
  isFree(conditions: string | null): boolean | null {
    if (!conditions) return null;
    if (/(^|[^\d])[1-9]\d*([.,]\d+)?\s?€|€\s?[1-9]/.test(conditions)) return false;
    if (/gratuit|entrée libre|accès libre|libre accès|free|^\s*0\s?€/i.test(conditions)) return true;
    return null;
  }

  /** What going involves: book through the organiser's link, just turn up, or read more. */
  action(registrationUrl: string | null, isFree: boolean | null, page: string): EventAction {
    if (registrationUrl) {
      return {
        kind: 'register',
        label: isFree ? 'Register for free' : 'Book on the organiser’s site',
        url: registrationUrl,
      };
    }
    if (isFree) return { kind: 'free', label: 'Free, just turn up', url: page };
    return { kind: 'info', label: 'See details on OpenAgenda', url: page };
  }

  /** Picks the first session that hasn't finished yet and starts inside the window. */
  private nextOccurrence(record: OpenAgendaRecord, from: Date, to: Date): { begin: string; end: string | null } | null {
    const timings = this.timings(record);
    const upcoming = timings
      .filter((t) => Date.parse(t.end) >= from.getTime() && Date.parse(t.begin) <= to.getTime())
      .sort((a, b) => Date.parse(a.begin) - Date.parse(b.begin));
    if (upcoming.length) {
      return { begin: new Date(upcoming[0].begin).toISOString(), end: new Date(upcoming[0].end).toISOString() };
    }
    if (!timings.length && record.firstdate_begin) {
      return { begin: record.firstdate_begin, end: record.firstdate_end ?? null };
    }
    return null;
  }

  /** For a saved event that has finished, the last session it had. */
  private lastOccurrence(record: OpenAgendaRecord): { begin: string; end: string | null } | null {
    const last = this.timings(record).sort((a, b) => Date.parse(b.begin) - Date.parse(a.begin))[0];
    return last ? { begin: new Date(last.begin).toISOString(), end: new Date(last.end).toISOString() } : null;
  }

  private timings(record: OpenAgendaRecord): { begin: string; end: string }[] {
    try {
      const parsed: unknown = JSON.parse(record.timings ?? '[]');
      return Array.isArray(parsed)
        ? parsed.filter((t) => typeof t?.begin === 'string' && typeof t?.end === 'string')
        : [];
    } catch {
      return [];
    }
  }

  private registrationUrl(record: OpenAgendaRecord): string | null {
    try {
      const links: unknown = JSON.parse(record.registration ?? '[]');
      if (Array.isArray(links)) {
        const link = links.find((item) => item?.type === 'link' && typeof item.value === 'string');
        if (link && /^https?:\/\//.test(link.value)) return link.value;
      }
    } catch {
      // Registration is optional and free-form.
    }
    return null;
  }
}
