import { Component, Input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { KnittedEvent } from '../interfaces/event.interface';
import { DEFAULT_COVER, formatPrice, spotsLabel } from './event-utils';

@Component({
  selector: 'app-event-card',
  standalone: true,
  imports: [RouterLink, DatePipe],
  template: `
    <a class="event-card" [routerLink]="['/events', event.id]" [attr.aria-label]="event.title">
      <div class="media">
        <img [src]="event.coverImage || defaultCover" [alt]="" loading="lazy" (error)="onImageError($event)" />
        <span class="date-chip" aria-hidden="true">
          <span class="month">{{ event.date | date: 'MMM' }}</span>
          <span class="day">{{ event.date | date: 'd' }}</span>
        </span>
        @if (spots; as label) {
          <span class="status-chip" [class.sold-out]="event.availableTickets <= 0">{{ label }}</span>
        }
      </div>
      <div class="body">
        <span class="category">{{ event.category || 'Community' }}</span>
        <h3 class="title">{{ event.title }}</h3>
        <p class="meta">
          <i class="fa-regular fa-calendar" aria-hidden="true"></i>
          {{ event.date | date: 'EEE, MMM d' }} · {{ event.startTime }}
        </p>
        <p class="meta">
          <i class="fa-solid fa-location-dot" aria-hidden="true"></i>
          <span class="truncate">{{ event.location }}</span>
        </p>
        <div class="footer">
          <span class="price" [class.free]="!event.price">{{ price }}</span>
          @if (event.host?.name) {
            <span class="host">by {{ event.host?.name }}</span>
          }
        </div>
      </div>
    </a>
  `,
  styles: [`
    :host {
      display: block;
    }
    .event-card {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: var(--radius-lg);
      overflow: hidden;
      transition: box-shadow 0.2s var(--ease), transform 0.2s var(--ease), border-color 0.2s var(--ease);
    }
    .event-card:hover {
      box-shadow: var(--shadow-lg);
      transform: translateY(-3px);
      border-color: transparent;
    }
    .event-card:hover img {
      transform: scale(1.04);
    }
    .media {
      position: relative;
      aspect-ratio: 16 / 9;
      overflow: hidden;
      background: var(--surface-3);
    }
    .media img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.4s var(--ease);
    }
    .date-chip {
      position: absolute;
      top: 12px;
      left: 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 48px;
      padding: 6px 8px;
      background: #fff;
      border-radius: 10px;
      box-shadow: var(--shadow);
      line-height: 1.1;
    }
    .month {
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--accent);
    }
    .day {
      font-family: var(--font-display);
      font-size: 1.2rem;
      font-weight: 800;
      color: var(--ink);
    }
    .status-chip {
      position: absolute;
      top: 12px;
      right: 12px;
      padding: 4px 10px;
      border-radius: 999px;
      background: var(--accent);
      color: #fff;
      font-size: 0.75rem;
      font-weight: 700;
    }
    .status-chip.sold-out {
      background: var(--ink);
    }
    .body {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 16px 18px 18px;
      flex: 1;
    }
    .category {
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--brand);
    }
    .title {
      font-size: 1.08rem;
      line-height: 1.3;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      margin-bottom: 4px;
    }
    .meta {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.875rem;
      color: var(--muted);
      min-width: 0;
    }
    .meta i {
      width: 14px;
      text-align: center;
      color: var(--subtle);
    }
    .truncate {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-top: auto;
      padding-top: 12px;
    }
    .price {
      font-weight: 700;
      color: var(--ink);
    }
    .price.free {
      color: var(--brand);
    }
    .host {
      font-size: 0.8rem;
      color: var(--muted);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `],
})
export class EventCardComponent {
  @Input({ required: true }) event!: KnittedEvent;

  readonly defaultCover = DEFAULT_COVER;

  get price(): string {
    return formatPrice(this.event.price);
  }

  get spots(): string | null {
    return spotsLabel(this.event);
  }

  onImageError(error: Event): void {
    const image = error.target as HTMLImageElement;
    if (image.src !== DEFAULT_COVER) image.src = DEFAULT_COVER;
  }
}
