export interface DiscoveredEvent {
  id: string;
  source: 'openagenda' | 'ticketmaster';
  sourceName: string;
  title: string;
  description: string | null;
  start: string;
  end: string | null;
  venue: string | null;
  address: string | null;
  city: string | null;
  latitude: number;
  longitude: number;
  distanceKm: number;
  imageUrl: string | null;
  url: string;
  category: string | null;
  tags: string[];
  priceLabel: string | null;
  isFree: boolean | null;
}

export interface DiscoverySourceStatus {
  id: string;
  name: string;
  status: 'ok' | 'disabled' | 'error';
  count: number;
  message?: string;
}

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
