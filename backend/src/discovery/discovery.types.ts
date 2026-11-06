/** An event found on another platform, normalised so every source looks the same to the app. */
export interface DiscoveredEvent {
  /** Stable id, prefixed by source, e.g. `openagenda:68608065`. */
  id: string;
  source: DiscoverySourceId;
  sourceName: string;
  title: string;
  description: string | null;
  /** ISO start of the next occurrence. */
  start: string;
  end: string | null;
  venue: string | null;
  address: string | null;
  city: string | null;
  latitude: number;
  longitude: number;
  /** Distance from the search point, or null when looked up without one. */
  distanceKm: number | null;
  imageUrl: string | null;
  /** Where the user can read more or get tickets. */
  url: string;
  category: string | null;
  tags: string[];
  /** Free text such as "Free", "€12 – €25", or null when the source doesn't say. */
  priceLabel: string | null;
  isFree: boolean | null;
  /** What attending involves, and the button that does it. */
  action: EventAction;
  /** True when the action link earns Knitted a commission (shown as a disclosure). */
  affiliate: boolean;
}

export interface EventAction {
  kind: 'tickets' | 'register' | 'free' | 'info';
  label: string;
  url: string;
}

export type DiscoverySourceId = 'openagenda' | 'ticketmaster';

export interface DiscoverySearch {
  latitude: number;
  longitude: number;
  radiusKm: number;
  from: Date;
  to: Date;
}

export interface DiscoverySourceStatus {
  id: DiscoverySourceId;
  name: string;
  status: 'ok' | 'disabled' | 'error';
  count: number;
  message?: string;
}

export interface DiscoverySource {
  readonly id: DiscoverySourceId;
  readonly name: string;
  /** False when the source needs configuration that isn't present (e.g. an API key). */
  isEnabled(): boolean;
  search(query: DiscoverySearch): Promise<DiscoveredEvent[]>;
  /** Looks up one event by its id within this source (without the `source:` prefix). */
  getById(sourceId: string, origin?: { latitude: number; longitude: number }): Promise<DiscoveredEvent | null>;
}
