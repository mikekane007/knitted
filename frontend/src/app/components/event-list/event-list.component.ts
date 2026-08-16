import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EventService, KnittedEvent } from '../../services/event.service';
import { NgIf, NgFor, DatePipe, CommonModule } from '@angular/common';

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [RouterLink, NgIf, NgFor, DatePipe, CommonModule],
  template: `
    <div class="container animated-fade-in">
      <header class="list-header">
        <div>
          <h1 class="page-title"><span class="gradient-text">Community Events</span></h1>
          <p class="page-subtitle">Learn, connect, and craft with fellow creators</p>
        </div>
        <button *ngIf="events.length === 0 && !isLoading" (click)="seedEvents()" class="btn-secondary">
          <i class="fa-solid fa-database icon-margin"></i>Seed Sample Events
        </button>
      </header>

      <div *ngIf="isLoading" class="loading-state">
        <i class="fa-solid fa-circle-notch fa-spin spinner"></i>
        <p>Fetching amazing workshops...</p>
      </div>

      <div *ngIf="!isLoading && events.length === 0" class="empty-state glass-card">
        <i class="fa-solid fa-yarn empty-icon"></i>
        <h3>No Events Available</h3>
        <p>We couldn't find any scheduled workshops. Click below to add sample events to the database.</p>
        <button (click)="seedEvents()" class="btn-primary mt-4">
          <i class="fa-solid fa-seedling icon-margin"></i>Seed Database
        </button>
      </div>

      <div *ngIf="!isLoading && events.length > 0" class="events-grid">
        <div *ngFor="let event of events" class="event-card glass-card">
          <div class="event-card-header">
            <span class="date-badge">
              <i class="fa-regular fa-calendar icon-margin"></i>
              {{ event.date | date: 'mediumDate' }}
            </span>
            <span *ngIf="event.availableTickets === 0" class="status-badge sold-out">Sold Out</span>
            <span *ngIf="event.availableTickets > 0 && event.availableTickets <= 5" class="status-badge filling-fast">
              Only {{ event.availableTickets }} left!
            </span>
          </div>

          <h2 class="event-title">{{ event.title }}</h2>
          <p class="event-description">{{ event.description }}</p>

          <div class="event-meta">
            <div class="meta-item">
              <i class="fa-solid fa-chair meta-icon"></i>
              <span>Capacity: {{ event.totalCapacity }}</span>
            </div>
            <div class="meta-item">
              <i class="fa-solid fa-ticket-simple meta-icon"></i>
              <span>Available: {{ event.availableTickets }}</span>
            </div>
          </div>

          <div class="card-action">
            <a [routerLink]="['/events', event.id]" class="btn-primary w-full">
              Details & Booking <i class="fa-solid fa-arrow-right arrow-icon"></i>
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 40px;
      gap: 20px;
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
      color: var(--text-secondary);
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
    }

    .events-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 30px;
    }

    .event-card {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .event-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .date-badge {
      font-size: 0.85rem;
      color: var(--color-primary);
      font-weight: 600;
      background: rgba(139, 92, 246, 0.1);
      padding: 6px 12px;
      border-radius: 20px;
      border: 1px solid rgba(139, 92, 246, 0.2);
    }

    .status-badge {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      padding: 4px 10px;
      border-radius: 6px;
    }

    .status-badge.sold-out {
      background: rgba(239, 68, 68, 0.15);
      color: #fc8181;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }

    .status-badge.filling-fast {
      background: rgba(245, 158, 11, 0.15);
      color: #fbd38d;
      border: 1px solid rgba(245, 158, 11, 0.3);
    }

    .event-title {
      font-family: var(--font-title);
      font-size: 1.4rem;
      font-weight: 700;
      margin-bottom: 12px;
      line-height: 1.3;
    }

    .event-description {
      color: var(--text-secondary);
      font-size: 0.95rem;
      line-height: 1.5;
      margin-bottom: 24px;
      flex-grow: 1;
    }

    .event-meta {
      display: flex;
      gap: 20px;
      border-top: 1px solid var(--border-light);
      padding-top: 16px;
      margin-bottom: 24px;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    .meta-icon {
      font-size: 0.95rem;
    }

    .w-full {
      width: 100%;
    }

    .icon-margin {
      margin-right: 6px;
    }

    .arrow-icon {
      transition: var(--transition-smooth);
    }

    .event-card:hover .arrow-icon {
      transform: translateX(4px);
    }

    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
    }
  `]
})
export class EventListComponent implements OnInit {
  events: KnittedEvent[] = [];
  isLoading = true;

  private eventService = inject(EventService);

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents(): void {
    this.isLoading = true;
    this.eventService.getEvents().subscribe({
      next: (data) => {
        this.events = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  seedEvents(): void {
    this.isLoading = true;
    this.eventService.seedEvents().subscribe({
      next: () => {
        this.loadEvents();
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }
}
