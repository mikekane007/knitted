import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { EventService } from '../../services/event.service';
import { Pass } from '../../interfaces/booking.interface';
import { DEFAULT_COVER, apiErrorMessage, formatPrice, isPast } from '../../shared/event-utils';

type Tab = 'upcoming' | 'past';

@Component({
  selector: 'app-my-bookings',
  standalone: true,
  imports: [RouterLink, DatePipe],
  template: `
    <div class="container page">
      <header class="page-header head">
        <div>
          <h1 class="page-title">My tickets</h1>
          <p class="page-subtitle">Show your ticket code at the door to check in.</p>
        </div>
        <a routerLink="/events" class="btn btn-secondary">Find more events</a>
      </header>

      <div class="tabs no-print" role="tablist">
        <button type="button" role="tab" [attr.aria-selected]="tab() === 'upcoming'" [class.active]="tab() === 'upcoming'" (click)="tab.set('upcoming')">
          Upcoming <span class="tab-count">{{ upcoming().length }}</span>
        </button>
        <button type="button" role="tab" [attr.aria-selected]="tab() === 'past'" [class.active]="tab() === 'past'" (click)="tab.set('past')">
          Past <span class="tab-count">{{ past().length }}</span>
        </button>
      </div>

      @if (isLoading()) {
        <div class="ticket-list">
          @for (placeholder of [1, 2]; track placeholder) {
            <div class="skeleton ticket-skeleton"></div>
          }
        </div>
      } @else if (error()) {
        <div class="alert alert-error" role="alert">
          <i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i>
          <span>{{ error() }}</span>
          <button type="button" class="btn btn-secondary btn-sm retry" (click)="load()">Try again</button>
        </div>
      } @else if (visible().length === 0) {
        <div class="empty-state">
          <span class="empty-icon"><i class="fa-solid fa-ticket" aria-hidden="true"></i></span>
          @if (tab() === 'upcoming') {
            <h3>No upcoming tickets</h3>
            <p>When you reserve a spot at an event, your ticket shows up here.</p>
            <a routerLink="/events" class="btn btn-primary">Browse events</a>
          } @else {
            <h3>No past events yet</h3>
            <p>Events you’ve attended will be listed here.</p>
          }
        </div>
      } @else {
        <div class="ticket-list">
          @for (pass of visible(); track pass.bookingId) {
            <article class="ticket" [class.print-target]="printing() === pass.bookingId" [class.is-past]="tab() === 'past'">
              <div class="ticket-media">
                <img [src]="pass.coverImage || defaultCover" alt="" loading="lazy" />
              </div>
              <div class="ticket-main">
                <span class="ticket-date">{{ pass.date | date: 'EEE, MMM d, y' }} · {{ pass.startTime }}</span>
                <h2 class="ticket-title"><a [routerLink]="['/events', pass.eventId]">{{ pass.title }}</a></h2>
                <p class="ticket-meta"><i class="fa-solid fa-location-dot" aria-hidden="true"></i> {{ pass.location }}</p>
                <p class="ticket-meta"><i class="fa-regular fa-user" aria-hidden="true"></i> Hosted by {{ pass.hostName }}</p>
                <div class="ticket-actions no-print">
                  <a [routerLink]="['/events', pass.eventId]" class="btn btn-secondary btn-sm">Event details</a>
                  <button type="button" class="btn btn-ghost btn-sm" (click)="print(pass)">
                    <i class="fa-solid fa-print" aria-hidden="true"></i> Print
                  </button>
                </div>
              </div>
              <div class="ticket-stub">
                <span class="stub-label">Ticket code</span>
                <span class="stub-code">{{ pass.ticketCode }}</span>
                <span class="stub-label">Admission</span>
                <span class="stub-value">1 × {{ price(pass.price) }}</span>
                @if (pass.price > 0) {
                  <span class="stub-note">Pay at the door</span>
                }
              </div>
            </article>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .head {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }
    .tabs {
      display: flex;
      gap: 4px;
      margin-bottom: 24px;
      border-bottom: 1px solid var(--line);
    }
    .tabs button {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      margin-bottom: -1px;
      border-bottom: 2px solid transparent;
      font-weight: 600;
      color: var(--muted);
    }
    .tabs button.active {
      color: var(--ink);
      border-bottom-color: var(--brand);
    }
    .tab-count {
      padding: 1px 8px;
      border-radius: 999px;
      background: var(--surface-3);
      font-size: 0.78rem;
    }
    .retry {
      margin-left: auto;
    }
    .ticket-list {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }
    .ticket-skeleton {
      height: 170px;
      border-radius: var(--radius-lg);
    }
    .ticket {
      display: grid;
      grid-template-columns: 200px minmax(0, 1fr) 220px;
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: var(--radius-lg);
      overflow: hidden;
      box-shadow: var(--shadow-sm);
    }
    .ticket.is-past {
      opacity: 0.75;
    }
    .ticket-media img {
      width: 100%;
      height: 100%;
      min-height: 170px;
      object-fit: cover;
    }
    .ticket-main {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 20px 24px;
      min-width: 0;
    }
    .ticket-date {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--accent);
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .ticket-title {
      font-size: 1.2rem;
    }
    .ticket-title a:hover {
      text-decoration: underline;
    }
    .ticket-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.9rem;
      color: var(--muted);
    }
    .ticket-meta i {
      width: 14px;
      color: var(--subtle);
    }
    .ticket-actions {
      display: flex;
      gap: 8px;
      margin-top: auto;
      padding-top: 10px;
    }
    .ticket-stub {
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 2px;
      padding: 20px 24px;
      background: var(--surface-2);
      border-left: 2px dashed var(--line-strong);
    }
    .ticket-stub::before,
    .ticket-stub::after {
      content: '';
      position: absolute;
      left: -11px;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: var(--surface);
      border: 1px solid var(--line);
    }
    .ticket-stub::before {
      top: -11px;
    }
    .ticket-stub::after {
      bottom: -11px;
    }
    .stub-label {
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--muted);
    }
    .stub-code {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 1.15rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      margin-bottom: 10px;
    }
    .stub-value {
      font-weight: 600;
    }
    .stub-note {
      font-size: 0.8rem;
      color: var(--muted);
    }
    @media (max-width: 860px) {
      .ticket {
        grid-template-columns: 1fr;
      }
      .ticket-media img {
        min-height: 0;
        aspect-ratio: 16 / 7;
      }
      .ticket-stub {
        border-left: none;
        border-top: 2px dashed var(--line-strong);
      }
      .ticket-stub::before,
      .ticket-stub::after {
        display: none;
      }
    }
    @media print {
      .page-header,
      .tabs {
        display: none;
      }
      .ticket:not(.print-target) {
        display: none;
      }
      .ticket {
        box-shadow: none;
        opacity: 1;
      }
    }
  `]
})
export class MyBookingsComponent implements OnInit {
  readonly passes = signal<Pass[]>([]);
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);
  readonly tab = signal<Tab>('upcoming');
  readonly printing = signal<number | null>(null);

  readonly upcoming = computed(() =>
    this.passes().filter((pass) => !isPast(pass.date)).sort((a, b) => a.date.localeCompare(b.date)));
  readonly past = computed(() =>
    this.passes().filter((pass) => isPast(pass.date)).sort((a, b) => b.date.localeCompare(a.date)));
  readonly visible = computed(() => (this.tab() === 'upcoming' ? this.upcoming() : this.past()));

  readonly defaultCover = DEFAULT_COVER;
  readonly price = formatPrice;

  private eventService = inject(EventService);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.eventService.getMyPasses().subscribe({
      next: (passes) => {
        this.passes.set(passes);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.error.set(apiErrorMessage(error, 'We couldn’t load your tickets.'));
        this.isLoading.set(false);
      }
    });
  }

  print(pass: Pass): void {
    this.printing.set(pass.bookingId);
    setTimeout(() => {
      window.print();
      this.printing.set(null);
    }, 50);
  }
}
