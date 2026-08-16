import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { KnittedEvent } from '../interfaces/event.interface';
import { Booking } from '../interfaces/booking.interface';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private http = inject(HttpClient);
  private eventsUrl = `${API_BASE_URL}/events`;
  private bookingsUrl = `${API_BASE_URL}/bookings`;

  getEvents(): Observable<KnittedEvent[]> {
    return this.http.get<KnittedEvent[]>(this.eventsUrl);
  }

  getEvent(id: number): Observable<KnittedEvent> {
    return this.http.get<KnittedEvent>(`${this.eventsUrl}/${id}`);
  }

  bookEvent(eventId: number): Observable<any> {
    return this.http.post<any>(this.bookingsUrl, { eventId });
  }

  getMyBookings(): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.bookingsUrl}/my-bookings`);
  }

  seedEvents(): Observable<any> {
    return this.http.post<any>(`${this.eventsUrl}/seed`, {});
  }
}
