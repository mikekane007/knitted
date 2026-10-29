import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { EventService } from '../../services/event.service';
import { KnittedEvent } from '../../interfaces/event.interface';
import { EventCardComponent } from '../../shared/event-card.component';
import { EventCardSkeletonComponent } from '../../shared/event-card-skeleton.component';
import { CATEGORY_ICONS, EVENT_CATEGORIES, toDateInput } from '../../shared/event-utils';

const CATEGORY_IMAGES: Record<string, string> = {
  'Art & Design': 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=800',
  'Food & Wine': 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&q=80&w=800',
  'Active & Outdoors': 'https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&q=80&w=800',
};

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, FormsModule, EventCardComponent, EventCardSkeletonComponent],
  template: `
    <section class="hero">
      <div class="hero-bg" aria-hidden="true"></div>
      <div class="container hero-inner">
        <span class="hero-kicker"><i class="fa-solid fa-location-dot" aria-hidden="true"></i> Happening around New York</span>
        <h1>Find your people.<br /><span>Offline.</span></h1>
        <p class="lede">Workshops, supper clubs, run clubs and studio sessions hosted by locals. Browse what's on, grab a spot, and show up.</p>

        <form class="search" role="search" (ngSubmit)="search()">
          <label class="search-field">
            <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
            <span class="sr-only">Search events</span>
            <input type="search" name="query" [(ngModel)]="query" placeholder="Search events, topics or hosts" autocomplete="off" />
          </label>
          <label class="search-field category">
            <i class="fa-solid fa-shapes" aria-hidden="true"></i>
            <span class="sr-only">Category</span>
            <select name="category" [(ngModel)]="category">
              <option value="">All categories</option>
              @for (item of categories; track item) {
                <option [value]="item">{{ item }}</option>
              }
            </select>
          </label>
          <button type="submit" class="btn btn-primary btn-lg">Find events</button>
        </form>

        <div class="quick-links">
          <span>Popular:</span>
          <a routerLink="/events" [queryParams]="{ when: 'weekend' }">This weekend</a>
          <a routerLink="/events" [queryParams]="{ price: 'Free' }">Free</a>
          <a routerLink="/events" [queryParams]="{ price: 'Under $20' }">Under $20</a>
          <a routerLink="/events" [queryParams]="{ when: 'week' }">This week</a>
        </div>
      </div>
    </section>

    <section class="section container">
      <div class="section-head">
        <div>
          <span class="eyebrow">Browse by interest</span>
          <h2 class="section-title">What are you into?</h2>
        </div>
        <a routerLink="/categories" class="see-all">All categories <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>
      </div>
      <div class="category-grid">
        @for (item of categories; track item) {
          <a class="category-tile" routerLink="/events" [queryParams]="{ category: item }">
            <img [src]="categoryImages[item]" alt="" loading="lazy" />
            <span class="tile-overlay"></span>
            <span class="tile-label">
              <i class="fa-solid {{ categoryIcons[item] }}" aria-hidden="true"></i>
              {{ item }}
            </span>
          </a>
        }
      </div>
    </section>

    <section class="section container">
      <div class="section-head">
        <div>
          <span class="eyebrow">Coming up</span>
          <h2 class="section-title">Upcoming events</h2>
        </div>
        <a routerLink="/events" class="see-all">See all events <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>
      </div>

      @if (loading()) {
        <div class="event-grid">
          @for (placeholder of [1, 2, 3, 4]; track placeholder) {
            <app-event-card-skeleton />
          }
        </div>
      } @else if (events().length > 0) {
        <div class="event-grid">
          @for (event of events(); track event.id) {
            <app-event-card [event]="event" />
          }
        </div>
      } @else {
        <div class="empty-state">
          <span class="empty-icon"><i class="fa-regular fa-calendar-plus" aria-hidden="true"></i></span>
          <h3>{{ failed() ? 'Events are taking a moment to load' : 'No upcoming events yet' }}</h3>
          <p>{{ failed() ? 'Refresh the page in a few seconds to try again.' : 'Be the first to put something on the calendar — it takes two minutes.' }}</p>
          <a routerLink="/host" class="btn btn-primary">Host an event</a>
        </div>
      }
    </section>

    <section class="section how">
      <div class="container">
        <div class="section-head centered">
          <div>
            <span class="eyebrow">How it works</span>
            <h2 class="section-title">From scrolling to showing up</h2>
          </div>
        </div>
        <ol class="steps">
          <li>
            <span class="step-icon"><i class="fa-solid fa-compass" aria-hidden="true"></i></span>
            <h3>Discover</h3>
            <p>Filter by category, date and price to find something worth leaving the house for.</p>
          </li>
          <li>
            <span class="step-icon"><i class="fa-solid fa-ticket" aria-hidden="true"></i></span>
            <h3>Reserve</h3>
            <p>Book in one tap. Your ticket lands in My tickets, ready to add to your calendar.</p>
          </li>
          <li>
            <span class="step-icon"><i class="fa-solid fa-people-group" aria-hidden="true"></i></span>
            <h3>Show up</h3>
            <p>Chat with the host and other guests beforehand, then show your ticket code at the door.</p>
          </li>
        </ol>
      </div>
    </section>

    <section class="section container">
      <div class="host-band">
        <div>
          <h2>Got something to share?</h2>
          <p>Host a workshop, tasting or meetup. Set your price and capacity — we handle sign-ups and tickets.</p>
        </div>
        <div class="host-actions">
          <a routerLink="/host" class="btn btn-lg host-primary">Start hosting</a>
          @if (!auth.isLoggedIn()) {
            <a routerLink="/register" class="btn btn-lg host-secondary">Create a free account</a>
          }
        </div>
      </div>
    </section>
  `,
  styles: [`
    .hero {
      position: relative;
      overflow: hidden;
      color: #fff;
      background: #0b1f18;
    }
    .hero-bg {
      position: absolute;
      inset: 0;
      background:
        linear-gradient(100deg, rgba(6, 24, 18, 0.94) 0%, rgba(6, 24, 18, 0.78) 45%, rgba(6, 24, 18, 0.35) 100%),
        url('https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&q=80&w=2000') center / cover;
    }
    .hero-inner {
      position: relative;
      padding-top: 96px;
      padding-bottom: 88px;
    }
    .hero-kicker {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.18);
      font-size: 0.85rem;
      font-weight: 500;
    }
    .hero-kicker i {
      color: #4ade80;
    }
    h1 {
      margin-top: 22px;
      color: #fff;
      font-size: clamp(2.6rem, 6vw, 4.4rem);
      font-weight: 800;
      letter-spacing: -0.035em;
      line-height: 1.04;
    }
    h1 span {
      color: #4ade80;
    }
    .lede {
      margin-top: 18px;
      max-width: 560px;
      font-size: 1.15rem;
      color: rgba(255, 255, 255, 0.82);
    }
    .search {
      display: flex;
      gap: 8px;
      margin-top: 36px;
      padding: 8px;
      max-width: 760px;
      background: #fff;
      border-radius: 999px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
    }
    .search-field {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: 1;
      min-width: 0;
      padding: 0 16px;
      color: var(--muted);
    }
    .search-field.category {
      flex: 0 0 210px;
      border-left: 1px solid var(--line);
    }
    .search-field input,
    .search-field select {
      width: 100%;
      height: 48px;
      border: none;
      outline: none;
      background: transparent;
      color: var(--ink);
      font-size: 1rem;
    }
    .search-field select {
      cursor: pointer;
    }
    .quick-links {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px 16px;
      margin-top: 22px;
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.65);
    }
    .quick-links a {
      color: #fff;
      text-decoration: underline;
      text-decoration-color: rgba(255, 255, 255, 0.35);
      text-underline-offset: 4px;
    }
    .quick-links a:hover {
      text-decoration-color: #4ade80;
    }
    .section {
      padding-top: 72px;
    }
    .section-head {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 28px;
    }
    .section-head.centered {
      justify-content: center;
      text-align: center;
    }
    .section-head .eyebrow {
      margin-bottom: 6px;
    }
    .see-all {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      color: var(--brand-strong);
      white-space: nowrap;
    }
    .see-all:hover {
      text-decoration: underline;
    }
    .category-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }
    .category-tile {
      position: relative;
      display: block;
      aspect-ratio: 4 / 3;
      border-radius: var(--radius-lg);
      overflow: hidden;
    }
    .category-tile img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.5s var(--ease);
    }
    .category-tile:hover img {
      transform: scale(1.06);
    }
    .tile-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, rgba(0, 0, 0, 0.72), rgba(0, 0, 0, 0) 60%);
    }
    .tile-label {
      position: absolute;
      left: 20px;
      bottom: 18px;
      display: flex;
      align-items: center;
      gap: 10px;
      color: #fff;
      font-family: var(--font-display);
      font-size: 1.25rem;
      font-weight: 700;
    }
    .how {
      margin-top: 72px;
      padding-bottom: 72px;
      background: var(--surface-2);
      border-top: 1px solid var(--line);
      border-bottom: 1px solid var(--line);
    }
    .steps {
      list-style: none;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
    }
    .steps li {
      padding: 28px;
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: var(--radius-lg);
    }
    .step-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: 14px;
      background: var(--brand-soft);
      color: var(--brand-strong);
      font-size: 1.2rem;
      margin-bottom: 16px;
    }
    .steps h3 {
      font-size: 1.15rem;
      margin-bottom: 6px;
    }
    .steps p {
      color: var(--muted);
    }
    .host-band {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 32px;
      margin-bottom: 80px;
      padding: 48px;
      border-radius: var(--radius-xl);
      background: linear-gradient(120deg, var(--brand-strong), #0f9f6e);
      color: #fff;
    }
    .host-band h2 {
      color: #fff;
      font-size: clamp(1.6rem, 3vw, 2.2rem);
    }
    .host-band p {
      margin-top: 8px;
      max-width: 520px;
      color: rgba(255, 255, 255, 0.85);
    }
    .host-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
    .host-primary {
      background: #fff;
      color: var(--brand-ink);
    }
    .host-primary:hover {
      background: #f0fdf4;
    }
    .host-secondary {
      border-color: rgba(255, 255, 255, 0.5);
      color: #fff;
    }
    .host-secondary:hover {
      background: rgba(255, 255, 255, 0.12);
    }
    @media (max-width: 860px) {
      .category-grid,
      .steps {
        grid-template-columns: 1fr;
      }
      .category-tile {
        aspect-ratio: 16 / 7;
      }
      .host-band {
        flex-direction: column;
        align-items: flex-start;
        padding: 32px 24px;
      }
    }
    @media (max-width: 640px) {
      .hero-inner {
        padding-top: 64px;
        padding-bottom: 56px;
      }
      .search {
        flex-direction: column;
        border-radius: var(--radius-lg);
      }
      .search-field.category {
        flex-basis: auto;
        border-left: none;
        border-top: 1px solid var(--line);
      }
      .search .btn {
        width: 100%;
      }
      .section-head {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `]
})
export class LandingComponent implements OnInit {
  readonly auth = inject(AuthService);
  readonly categories = EVENT_CATEGORIES;
  readonly categoryIcons = CATEGORY_ICONS;
  readonly categoryImages = CATEGORY_IMAGES;
  readonly events = signal<KnittedEvent[]>([]);
  readonly loading = signal(true);
  readonly failed = signal(false);

  query = '';
  category = '';

  private eventService = inject(EventService);
  private router = inject(Router);

  ngOnInit(): void {
    this.eventService.getEvents(undefined, undefined, undefined, {
      dateFrom: toDateInput(new Date()),
      sortBy: 'date',
      limit: 8,
    }).subscribe({
      next: (events) => {
        this.events.set(events);
        this.loading.set(false);
      },
      error: () => {
        this.failed.set(true);
        this.loading.set(false);
      },
    });
  }

  search(): void {
    const queryParams: Record<string, string> = {};
    if (this.query.trim()) queryParams['q'] = this.query.trim();
    if (this.category) queryParams['category'] = this.category;
    this.router.navigate(['/events'], { queryParams });
  }
}
