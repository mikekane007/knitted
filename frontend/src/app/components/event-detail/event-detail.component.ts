import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EventService } from '../../services/event.service';
import { KnittedEvent } from '../../interfaces/event.interface';
import { AuthService } from '../../services/auth.service';
import { NgIf, DatePipe, CommonModule } from '@angular/common';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [RouterLink, NgIf, DatePipe, CommonModule],
  template: `
    <div class="container animated-fade-in">
      <div class="navigation-bar">
        <a routerLink="/events" class="back-link">
          <i class="fa-solid fa-arrow-left"></i> Back to Catalog
        </a>
      </div>

      <div *ngIf="isLoading" class="loading-state">
        <i class="fa-solid fa-circle-notch fa-spin spinner"></i>
        <p>Loading event information...</p>
      </div>

      <div *ngIf="!isLoading && event" class="detail-container">
        <!-- Event Main Details -->
        <div class="glass-card detail-main">
          <span class="category-tag">Creative Workshop</span>
          <h1 class="event-title">{{ event.title }}</h1>
          <p class="event-description">{{ event.description }}</p>

          <div class="workshop-features">
            <div class="feature-card">
              <i class="fa-regular fa-calendar-check feature-icon"></i>
              <div>
                <h4>Date & Time</h4>
                <p>{{ event.date | date: 'fullDate' }}</p>
              </div>
            </div>
            <div class="feature-card">
              <i class="fa-solid fa-location-dot feature-icon"></i>
              <div>
                <h4>Location</h4>
                <p>Knitted Craft Studio & HQ</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Booking Actions Sidebar -->
        <div class="glass-card detail-sidebar">
          <h3>Ticket Reservation</h3>
          <p class="sidebar-description">Reserve your spot now. Capacity is limited to ensure quality instruction.</p>

          <div class="tickets-status">
            <div class="status-row">
              <span class="label">Total Capacity</span>
              <span class="value">{{ event.totalCapacity }} spots</span>
            </div>
            <div class="status-row">
              <span class="label">Available Spots</span>
              <span class="valueHighlight" [class.sold-out]="event.availableTickets === 0">
                {{ event.availableTickets > 0 ? event.availableTickets : 'Fully Booked' }}
              </span>
            </div>
          </div>

          <div *ngIf="successMessage" class="success-banner">
            <i class="fa-solid fa-circle-check"></i> {{ successMessage }}
          </div>

          <div *ngIf="errorMessage" class="error-banner">
            <i class="fa-solid fa-triangle-exclamation"></i> {{ errorMessage }}
          </div>

          <!-- User is Logged In -->
          <div *ngIf="authService.isLoggedIn(); else loginRequired">
            <button
              [disabled]="event.availableTickets === 0 || isBooking"
              (click)="bookTicket()"
              class="btn-primary w-full"
            >
              <span *ngIf="!isBooking">
                <i class="fa-solid fa-ticket-simple icon-margin"></i>Book Ticket Now
              </span>
              <span *ngIf="isBooking">
                <i class="fa-solid fa-spinner fa-spin"></i> Reserving...
              </span>
            </button>
          </div>

          <!-- User needs to Log In -->
          <ng-template #loginRequired>
            <div class="auth-notice">
              <p>You must be signed in to reserve a ticket.</p>
              <a [routerLink]="['/login']" class="btn-primary w-full mt-2">
                Sign In to Reserve
              </a>
            </div>
          </ng-template>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .navigation-bar {
      margin-bottom: 24px;
    }

    .back-link {
      color: var(--text-secondary);
      text-decoration: none;
      font-weight: 500;
      font-size: 0.95rem;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: var(--transition-smooth);
    }

    .back-link:hover {
      color: var(--color-primary);
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

    .detail-container {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 30px;
      align-items: start;
    }

    @media (max-width: 900px) {
      .detail-container {
        grid-template-columns: 1fr;
      }
    }

    .detail-main {
      padding: 40px;
    }

    .category-tag {
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-secondary);
      font-weight: 700;
      margin-bottom: 12px;
      display: inline-block;
    }

    .event-title {
      font-family: var(--font-title);
      font-size: 2.5rem;
      font-weight: 800;
      margin-bottom: 20px;
      line-height: 1.2;
    }

    .event-description {
      color: var(--text-secondary);
      font-size: 1.1rem;
      line-height: 1.6;
      margin-bottom: 36px;
    }

    .workshop-features {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      border-top: 1px solid var(--border-light);
      padding-top: 32px;
    }

    @media (max-width: 600px) {
      .workshop-features {
        grid-template-columns: 1fr;
      }
    }

    .feature-card {
      display: flex;
      gap: 16px;
      align-items: center;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--border-light);
      padding: 20px;
      border-radius: 12px;
    }

    .feature-icon {
      font-size: 1.8rem;
      color: var(--color-primary);
    }

    .feature-card h4 {
      font-family: var(--font-title);
      font-size: 0.95rem;
      margin-bottom: 4px;
    }

    .feature-card p {
      color: var(--text-secondary);
      font-size: 0.85rem;
    }

    /* Sidebar Styles */
    .detail-sidebar {
      padding: 32px;
    }

    .detail-sidebar h3 {
      font-family: var(--font-title);
      font-size: 1.3rem;
      margin-bottom: 8px;
    }

    .sidebar-description {
      color: var(--text-secondary);
      font-size: 0.9rem;
      line-height: 1.5;
      margin-bottom: 24px;
    }

    .tickets-status {
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--border-light);
      padding: 16px;
      border-radius: 10px;
      margin-bottom: 24px;
    }

    .status-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.9rem;
    }

    .status-row .label {
      color: var(--text-muted);
    }

    .status-row .value {
      font-weight: 600;
    }

    .status-row .valueHighlight {
      font-weight: 700;
      color: var(--color-success);
    }

    .status-row .valueHighlight.sold-out {
      color: var(--color-danger);
    }

    .success-banner {
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #a7f3d0;
      padding: 12px;
      border-radius: 10px;
      margin-bottom: 20px;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .error-banner {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #fca5a5;
      padding: 12px;
      border-radius: 10px;
      margin-bottom: 20px;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .auth-notice {
      background: rgba(255, 255, 255, 0.02);
      border: 1px dashed var(--border-hover);
      padding: 20px;
      border-radius: 10px;
      text-align: center;
    }

    .auth-notice p {
      font-size: 0.9rem;
      color: var(--text-secondary);
    }

    .mt-2 {
      margin-top: 8px;
    }

    .w-full {
      width: 100%;
    }

    .icon-margin {
      margin-right: 6px;
    }
  `]
})
export class EventDetailComponent implements OnInit {
  event: KnittedEvent | null = null;
  isLoading = true;
  isBooking = false;
  successMessage = '';
  errorMessage = '';

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private eventService = inject(EventService);
  authService = inject(AuthService);

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = parseInt(idParam, 10);
      this.loadEvent(id);
    } else {
      this.router.navigate(['/events']);
    }
  }

  loadEvent(id: number): void {
    this.isLoading = true;
    this.eventService.getEvent(id).subscribe({
      next: (data) => {
        this.event = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.router.navigate(['/events']);
      }
    });
  }

  bookTicket(): void {
    if (!this.event) return;
    this.isBooking = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.eventService.bookEvent(this.event.id).subscribe({
      next: () => {
        this.isBooking = false;
        this.successMessage = 'Ticket successfully booked! Check your dashboard.';
        if (this.event) {
          this.event.availableTickets = Math.max(0, this.event.availableTickets - 1);
        }
      },
      error: (err) => {
        this.isBooking = false;
        this.errorMessage = err.error || 'Failed to book ticket. Please try again.';
      }
    });
  }
}
