import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';

export interface KnittedEvent {
  id: number;
  title: string;
  description: string;
  date: string;
  totalCapacity: number;
  availableTickets: number;
}

export interface Booking {
  id: number;
  bookedAt: string;
  event: {
    id: number;
    title: string;
    description: string;
    date: string;
  };
}

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
