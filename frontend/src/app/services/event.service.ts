import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { Attendee, ChatMessage, EventCategory, EventDraft, EventSearchFilters, KnittedEvent } from '../interfaces/event.interface';
import { Booking, Pass } from '../interfaces/booking.interface';

export interface BookingConfirmation {
  id: number;
  userId: number;
  eventId: number;
  bookedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private http = inject(HttpClient);
  private eventsUrl = `${API_BASE_URL}/events`;
  private bookingsUrl = `${API_BASE_URL}/bookings`;

  getEvents(
    search?: string,
    neighborhood?: string,
    price?: string,
    filters: EventSearchFilters = {},
  ): Observable<KnittedEvent[]> {
    let params = new HttpParams();
    if (search?.trim()) params = params.set('search', search.trim());
    if (neighborhood && neighborhood !== 'All NYC') params = params.set('neighborhood', neighborhood);
    if (price && price !== 'Any Price') params = params.set('price', price);
    if (filters.category) params = params.set('category', filters.category);
    if (filters.minPrice !== undefined) params = params.set('minPrice', filters.minPrice);
    if (filters.maxPrice !== undefined) params = params.set('maxPrice', filters.maxPrice);
    if (filters.dateFrom) params = params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params = params.set('dateTo', filters.dateTo);
    if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
    if (filters.limit !== undefined) params = params.set('limit', filters.limit);
    return this.http.get<KnittedEvent[]>(this.eventsUrl, { params });
  }

  getEvent(id: number): Observable<KnittedEvent> {
    return this.http.get<KnittedEvent>(`${this.eventsUrl}/${id}`);
  }

  getEventAttendees(id: number): Observable<Attendee[]> {
    return this.http.get<Attendee[]>(`${this.eventsUrl}/${id}/attendees`);
  }

  getEventChat(id: number): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`${this.eventsUrl}/${id}/chat`);
  }

  postEventChat(id: number, message: string): Observable<ChatMessage> {
    return this.http.post<ChatMessage>(`${this.eventsUrl}/${id}/chat`, { message });
  }

  bookEvent(eventId: number): Observable<BookingConfirmation> {
    return this.http.post<BookingConfirmation>(this.bookingsUrl, { eventId });
  }

  getMyBookings(): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.bookingsUrl}/my-bookings`);
  }

  getMyPasses(): Observable<Pass[]> {
    return this.http.get<Pass[]>(`${this.bookingsUrl}/my-passes`);
  }

  scanExternalEvents(): Observable<KnittedEvent[]> {
    return this.http.post<KnittedEvent[]>(`${this.eventsUrl}/scan-external`, {});
  }

  getCategoriesSummary(): Observable<EventCategory[]> {
    return this.http.get<EventCategory[]>(`${this.eventsUrl}/categories-summary`);
  }

  createEvent(event: EventDraft): Observable<KnittedEvent> {
    return this.http.post<KnittedEvent>(this.eventsUrl, event);
  }
}
