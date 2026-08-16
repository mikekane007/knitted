import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EventService } from '../../services/event.service';
import { Booking } from '../../interfaces/booking.interface';
import { NgIf, NgFor, DatePipe, CommonModule } from '@angular/common';

@Component({
  selector: 'app-my-bookings',
  standalone: true,
  imports: [RouterLink, NgIf, NgFor, DatePipe, CommonModule],
  template: `
    <div class="container animated-fade-in">
      <header class="bookings-header">
        <h1 class="page-title"><span class="gradient-text">My Reserved Spots</span></h1>
        <p class="page-subtitle">Manage your booked events and workshops</p>
      </header>

      <div *ngIf="isLoading" class="loading-state">
        <i class="fa-solid fa-circle-notch fa-spin spinner"></i>
        <p>Retrieving your bookings...</p>
      </div>

      <div *ngIf="!isLoading && bookings.length === 0" class="empty-state glass-card">
        <i class="fa-solid fa-ticket empty-icon"></i>
        <h3>No Reserved Tickets</h3>
        <p>You haven't reserved any workshops yet. Browse the catalog to find your next project.</p>
        <a routerLink="/events" class="btn-primary mt-4">
          <i class="fa-solid fa-compass icon-margin"></i>Browse Events
        </a>
      </div>

      <div *ngIf="!isLoading && bookings.length > 0" class="bookings-list">
        <div *ngFor="let booking of bookings" class="booking-card glass-card">
          <div class="booking-info">
            <span class="booking-date">
              <i class="fa-solid fa-receipt icon-margin"></i>
              Booked on {{ booking.bookedAt | date: 'short' }}
            </span>
            <h2 class="event-title">{{ booking.event.title }}</h2>
            <p class="event-description">{{ booking.event.description }}</p>
            
            <div class="event-date">
              <i class="fa-regular fa-calendar-check meta-icon"></i>
              <span>Workshop Date: <strong>{{ booking.event.date | date: 'fullDate' }}</strong></span>
            </div>
          </div>

          <div class="booking-actions">
            <span class="ticket-badge"><i class="fa-solid fa-check-circle"></i> Confirmed Ticket</span>
            <a [routerLink]="['/events', booking.event.id]" class="btn-secondary">
              View Workshop
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .bookings-header {
      margin-bottom: 40px;
    }

    .page-title {
      font-size: 2.5rem;
      margin-bottom: 6px;
    }

    .page-subtitle {
      color: var(--text-secondary);
      font-size: 1.1rem;
    }

    .loading-state {
      text-align: center;
      padding: 60px 0;
    }

    .spinner {
      font-size: 2.5rem;
      color: var(--color-primary);
      margin-bottom: 16px;
    }

    .empty-state {
      text-align: center;
      max-width: 500px;
      margin: 40px auto;
      padding: 48px 32px;
    }

    .empty-icon {
      font-size: 4rem;
      color: var(--text-muted);
      margin-bottom: 20px;
      display: inline-block;
      animation: bounce 2s infinite ease-in-out;
    }

    .empty-state h3 {
      font-family: var(--font-title);
      font-size: 1.5rem;
      margin-bottom: 8px;
    }

    .empty-state p {
      color: var(--text-secondary);
      font-size: 0.95rem;
    }

    .mt-4 {
      margin-top: 16px;
      text-decoration: none;
    }

    .bookings-list {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .booking-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 30px;
    }

    @media (max-width: 768px) {
      .booking-card {
        flex-direction: column;
        align-items: flex-start;
        gap: 20px;
      }
      .booking-actions {
        width: 100%;
        align-items: flex-start;
      }
    }

    .booking-info {
      flex: 1;
    }

    .booking-date {
      font-size: 0.8rem;
      color: var(--text-muted);
      display: block;
      margin-bottom: 8px;
    }

    .event-title {
      font-family: var(--font-title);
      font-size: 1.3rem;
      font-weight: 700;
      margin-bottom: 8px;
    }

    .event-description {
      color: var(--text-secondary);
      font-size: 0.95rem;
      line-height: 1.5;
      margin-bottom: 12px;
    }

    .event-date {
      font-size: 0.9rem;
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .meta-icon {
      color: var(--color-primary);
    }

    .booking-actions {
      display: flex;
      flex-direction: column;
      gap: 12px;
      align-items: flex-end;
    }

    .ticket-badge {
      background: rgba(16, 185, 129, 0.1);
      color: #a7f3d0;
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .icon-margin {
      margin-right: 6px;
    }

    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
    }
  `]
})
export class MyBookingsComponent implements OnInit {
  bookings: Booking[] = [];
  isLoading = true;

  private eventService = inject(EventService);

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {
    this.isLoading = true;
    this.eventService.getMyBookings().subscribe({
      next: (data) => {
        this.bookings = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }
}
