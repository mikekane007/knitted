import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { EventDetail, GeocodeResult, NearbyResult, SavedEvent, SavedStatus } from '../interfaces/discovery.interface';

/** Events from across the web near a location (OpenAgenda, Ticketmaster…), via the Knitted API. */
@Injectable({ providedIn: 'root' })
export class DiscoveryService {
  private http = inject(HttpClient);
  private baseUrl = `${API_BASE_URL}/discover`;

  nearby(lat: number, lng: number, radiusKm: number, days: number): Observable<NearbyResult> {
    const params = new HttpParams()
      .set('lat', lat.toFixed(4))
      .set('lng', lng.toFixed(4))
      .set('radiusKm', radiusKm)
      .set('days', days);
    return this.http.get<NearbyResult>(`${this.baseUrl}/nearby`, { params });
  }

  geocode(query: string): Observable<GeocodeResult> {
    return this.http.get<GeocodeResult>(`${this.baseUrl}/geocode`, { params: { q: query.trim() } });
  }

  /** One external event; pass the search point to get its distance. */
  getEvent(id: string, origin?: { lat: number; lng: number }): Observable<EventDetail> {
    let params = new HttpParams();
    if (origin) params = params.set('lat', origin.lat.toFixed(4)).set('lng', origin.lng.toFixed(4));
    return this.http.get<EventDetail>(`${this.baseUrl}/events/${encodeURIComponent(id)}`, { params });
  }

  /** Events the user is going to or interested in, soonest first. */
  listSaved(): Observable<SavedEvent[]> {
    return this.http.get<SavedEvent[]>(`${this.baseUrl}/saved`);
  }

  save(id: string, status: SavedStatus): Observable<SavedEvent> {
    return this.http.put<SavedEvent>(`${this.baseUrl}/saved/${encodeURIComponent(id)}`, { status });
  }

  unsave(id: string): Observable<{ removed: boolean }> {
    return this.http.delete<{ removed: boolean }>(`${this.baseUrl}/saved/${encodeURIComponent(id)}`);
  }

  /** Browser location as a promise, with errors turned into messages people can act on. */
  currentPosition(): Promise<{ latitude: number; longitude: number }> {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        reject(new Error('Your browser can’t share your location. Search for a city instead.'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
        (error) => {
          const message = error.code === error.PERMISSION_DENIED
            ? 'Location access is blocked. Allow it in your browser, or search for a city instead.'
            : error.code === error.TIMEOUT
              ? 'Finding your location took too long. Try again, or search for a city.'
              : 'We couldn’t work out where you are. Search for a city instead.';
          reject(new Error(message));
        },
        { enableHighAccuracy: false, timeout: 12000, maximumAge: 10 * 60 * 1000 },
      );
    });
  }
}
