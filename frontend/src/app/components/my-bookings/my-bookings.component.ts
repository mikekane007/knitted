import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { forkJoin, of, catchError } from 'rxjs';
import { EventService } from '../../services/event.service';
import { DiscoveryService } from '../../services/discovery.service';
import { ToastService } from '../../services/toast.service';
import { SavedEvent } from '../../interfaces/discovery.interface';
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
          Upcoming <span class="tab-count">{{ upcoming().length + savedUpcoming().length }}</span>
        </button>
        <button type="button" role="tab" [attr.aria-selected]="tab() === 'past'" [class.active]="tab() === 'past'" (click)="tab.set('past')">
          Past <span class="tab-count">{{ past().length + savedPast().length }}</span>
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
      } @else if (visible().length === 0 && visibleSaved().length === 0) {
        <div class="empty-state">
          <span class="empty-icon"><i class="fa-solid fa-ticket" aria-hidden="true"></i></span>
          @if (tab() === 'upcoming') {
            <h3>No upcoming tickets</h3>
            <p>When you reserve a spot at a Knitted event, or mark an event near you as going, it shows up here.</p>
            <div class="empty-actions">
              <a routerLink="/events" class="btn btn-primary">Browse events</a>
              <a routerLink="/nearby" class="btn btn-secondary"><i class="fa-solid fa-location-arrow" aria-hidden="true"></i> Events near me</a>
            </div>
          } @else {
            <h3>No past events yet</h3>
            <p>Events you’ve attended will be listed here.</p>
          }
        </div>
      } @else {
        @if (visible().length) {
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

        @if (visibleSaved().length) {
          <section class="saved no-print" aria-labelledby="saved-heading">
            <h2 id="saved-heading" class="saved-heading">
              Going &amp; interested
              <span class="muted">· events from across the web</span>
            </h2>
            <ul class="saved-list">
              @for (item of visibleSaved(); track item.event.id) {
                <li class="saved-item" [class.is-past]="tab() === 'past'">
                  <a [routerLink]="['/nearby/event', item.event.id]" class="saved-thumb" aria-hidden="true" tabindex="-1">
                    @if (item.event.imageUrl) {
                      <img [src]="item.event.imageUrl" alt="" loading="lazy" referrerpolicy="no-referrer" />
                    } @else {
                      <i class="fa-solid fa-calendar-day"></i>
                    }
                  </a>
                  <div class="saved-main">
                    <span class="ticket-date">{{ item.event.start | date: 'EEE, MMM d · h:mm a' }}</span>
                    <h3 class="saved-title"><a [routerLink]="['/nearby/event', item.event.id]">{{ item.event.title }}</a></h3>
                    <p class="ticket-meta">
                      <i class="fa-solid fa-location-dot" aria-hidden="true"></i>
                      {{ item.event.venue || item.event.city }}{{ item.event.venue && item.event.city ? ', ' + item.event.city : '' }}
                    </p>
                  </div>
                  <div class="saved-side">
                    <span class="badge" [class.badge-brand]="item.status === 'going'">
                      <i [class]="item.status === 'going' ? 'fa-solid fa-circle-check' : 'fa-solid fa-star'" aria-hidden="true"></i>
                      {{ item.status === 'going' ? 'Going' : 'Interested' }}
                    </span>
                    @if (tab() === 'upcoming') {
                      <a [href]="item.event.action.url" target="_blank" rel="noopener sponsored" class="btn btn-secondary btn-sm">
                        {{ item.event.action.kind === 'free' ? 'Event page' : item.event.action.kind === 'tickets' ? 'Get tickets' : 'Book' }}
                        <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>
                      </a>
                    }
                    <button type="button" class="btn btn-ghost btn-sm" (click)="removeSaved(item)" [attr.aria-label]="'Remove ' + item.event.title">
                      <i class="fa-regular fa-trash-can" aria-hidden="true"></i>
                    </button>
                  </div>
                </li>
              }
            </ul>
          </section>
        }
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
    .empty-actions {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 10px;
    }
    .saved {
      margin-top: 36px;
    }
    .saved-heading {
      font-size: 1.25rem;
      margin-bottom: 14px;
    }
    .saved-heading .muted {
      font-family: var(--font-body);
      font-size: 0.9rem;
      font-weight: 500;
    }
    .saved-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .saved-item {
      display: grid;
      grid-template-columns: 96px minmax(0, 1fr) auto;
      gap: 16px;
      align-items: center;
      padding: 12px;
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: var(--radius-lg);
    }
    .saved-item.is-past {
      opacity: 0.7;
    }
    .saved-thumb {
      display: flex;
      align-items: center;
      justify-content: center;
      aspect-ratio: 4 / 3;
      border-radius: var(--radius);
      overflow: hidden;
      background: var(--brand-soft);
      color: var(--brand);
    }
    .saved-thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .saved-main {
      min-width: 0;
    }
    .saved-title {
      font-size: 1.02rem;
      margin: 2px 0 4px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .saved-title a:hover {
      color: var(--brand);
    }
    .saved-side {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    @media (max-width: 640px) {
      .saved-item {
        grid-template-columns: 72px minmax(0, 1fr);
      }
      .saved-side {
        grid-column: 1 / -1;
        justify-content: flex-end;
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

  // Events from other platforms the user marked as going or interested.
  readonly saved = signal<SavedEvent[]>([]);
  readonly savedUpcoming = computed(() => this.saved().filter((item) => !this.savedIsPast(item)));
  readonly savedPast = computed(() => this.saved().filter((item) => this.savedIsPast(item)).reverse());
  readonly visibleSaved = computed(() => (this.tab() === 'upcoming' ? this.savedUpcoming() : this.savedPast()));

  readonly defaultCover = DEFAULT_COVER;
  readonly price = formatPrice;

  private eventService = inject(EventService);
  private discovery = inject(DiscoveryService);
  private toast = inject(ToastService);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.error.set(null);
    forkJoin({
      passes: this.eventService.getMyPasses(),
      // Saved external events are a bonus; don't fail the whole page if that lookup fails.
      saved: this.discovery.listSaved().pipe(catchError(() => of([] as SavedEvent[]))),
    }).subscribe({
      next: ({ passes, saved }) => {
        this.passes.set(passes);
        this.saved.set(saved);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.error.set(apiErrorMessage(error, 'We couldn’t load your tickets.'));
        this.isLoading.set(false);
      }
    });
  }

  removeSaved(item: SavedEvent): void {
    const before = this.saved();
    this.saved.set(before.filter((entry) => entry.event.id !== item.event.id));
    this.discovery.unsave(item.event.id).subscribe({
      next: () => this.toast.success('Removed from My tickets.'),
      error: (error) => {
        this.saved.set(before);
        this.toast.error(apiErrorMessage(error, 'We couldn’t remove that. Please try again.'));
      },
    });
  }

  private savedIsPast(item: SavedEvent): boolean {
    return Date.parse(item.event.end ?? item.event.start) < Date.now();
  }

  print(pass: Pass): void {
    this.printing.set(pass.bookingId);
    setTimeout(() => {
      window.print();
      this.printing.set(null);
    }, 50);
  }
}
