import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Params, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription, debounceTime } from 'rxjs';
import { EventService } from '../../services/event.service';
import { EventSearchFilters, KnittedEvent } from '../../interfaces/event.interface';
import { EventCardComponent } from '../../shared/event-card.component';
import { EventCardSkeletonComponent } from '../../shared/event-card-skeleton.component';
import { EVENT_CATEGORIES, apiErrorMessage, toDateInput } from '../../shared/event-utils';

type When = 'upcoming' | 'today' | 'weekend' | 'week' | 'month' | 'custom' | 'all';
type SortOption = NonNullable<EventSearchFilters['sortBy']>;

const WHEN_OPTIONS: { value: When; label: string }[] = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'today', label: 'Today' },
  { value: 'weekend', label: 'This weekend' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: 'custom', label: 'Pick dates' },
  { value: 'all', label: 'Any date' },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'date', label: 'Soonest' },
  { value: 'newest', label: 'Recently added' },
  { value: 'price', label: 'Price: low to high' },
  { value: 'priceDesc', label: 'Price: high to low' },
];

/** Date window for a quick "when" option, as local YYYY-MM-DD strings. */
export function dateRangeFor(when: When, today = new Date()): { from?: string; to?: string } {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const addDays = (days: number) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + days);
  const day = start.getDay();
  switch (when) {
    case 'upcoming':
      return { from: toDateInput(start) };
    case 'today':
      return { from: toDateInput(start), to: toDateInput(start) };
    case 'weekend': {
      const saturday = day === 0 ? start : addDays(6 - day);
      const sunday = day === 0 ? start : addDays(7 - day);
      return { from: toDateInput(day === 6 || day === 0 ? start : saturday), to: toDateInput(sunday) };
    }
    case 'week':
      return { from: toDateInput(start), to: toDateInput(addDays(day === 0 ? 0 : 7 - day)) };
    case 'month':
      return { from: toDateInput(start), to: toDateInput(new Date(start.getFullYear(), start.getMonth() + 1, 0)) };
    default:
      return {};
  }
}

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [RouterLink, FormsModule, EventCardComponent, EventCardSkeletonComponent],
  templateUrl: './event-list.component.html',
  styleUrls: ['./event-list.component.css']
})
export class EventListComponent implements OnInit {
  readonly events = signal<KnittedEvent[]>([]);
  readonly isLoading = signal(true);
  readonly eventsError = signal<string | null>(null);
  showMoreFilters = false;

  // Filter state, mirrored in the URL query string.
  search = '';
  category = '';
  price = 'Any Price';
  neighborhood = 'All NYC';
  when: When = 'upcoming';
  dateFrom = '';
  dateTo = '';
  minPrice: number | null = null;
  maxPrice: number | null = null;
  sortBy: SortOption = 'date';

  readonly categories = EVENT_CATEGORIES;
  readonly whenOptions = WHEN_OPTIONS;
  readonly sortOptions = SORT_OPTIONS;
  readonly priceTiers = ['Any Price', 'Free', 'Under $20'];
  readonly neighborhoods = ['All NYC', 'DUMBO', 'East Village', 'Williamsburg', 'Greenpoint'];

  private eventService = inject(EventService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private searchChanges = new Subject<void>();
  private request?: Subscription;

  ngOnInit(): void {
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        this.readParams(params);
        this.loadEvents();
      });

    this.searchChanges
      .pipe(debounceTime(350), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.applyFilters());
  }

  loadEvents(): void {
    this.request?.unsubscribe();
    this.isLoading.set(true);
    this.eventsError.set(null);

    const range = this.when === 'custom'
      ? { from: this.dateFrom || undefined, to: this.dateTo || undefined }
      : dateRangeFor(this.when);

    this.request = this.eventService.getEvents(this.search, this.neighborhood, this.price, {
      category: this.category || undefined,
      minPrice: this.minPrice ?? undefined,
      maxPrice: this.maxPrice ?? undefined,
      dateFrom: range.from,
      dateTo: range.to,
      sortBy: this.sortBy,
    }).subscribe({
      next: (events) => {
        this.events.set(events);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.eventsError.set(apiErrorMessage(error, 'We couldn’t load events. Please try again.'));
        this.isLoading.set(false);
      },
    });
  }

  searchChanged(): void {
    this.searchChanges.next();
  }

  setWhen(when: When): void {
    this.when = when;
    if (when !== 'custom') {
      this.dateFrom = '';
      this.dateTo = '';
      this.applyFilters();
    }
  }

  setCategory(category: string): void {
    this.category = this.category === category ? '' : category;
    this.applyFilters();
  }

  /** Writes the current filters to the URL; the query-param subscription reloads results. */
  applyFilters(): void {
    const queryParams: Params = {
      q: this.search.trim() || null,
      category: this.category || null,
      price: this.price !== 'Any Price' ? this.price : null,
      area: this.neighborhood !== 'All NYC' ? this.neighborhood : null,
      when: this.when !== 'upcoming' ? this.when : null,
      from: this.when === 'custom' && this.dateFrom ? this.dateFrom : null,
      to: this.when === 'custom' && this.dateTo ? this.dateTo : null,
      min: this.minPrice ?? null,
      max: this.maxPrice ?? null,
      sort: this.sortBy !== 'date' ? this.sortBy : null,
    };
    this.router.navigate([], { relativeTo: this.route, queryParams, replaceUrl: true });
  }

  clearFilters(): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
  }

  get activeFilterCount(): number {
    return [
      this.search.trim(),
      this.category,
      this.price !== 'Any Price',
      this.neighborhood !== 'All NYC',
      this.when !== 'upcoming',
      this.minPrice !== null || this.maxPrice !== null,
    ].filter(Boolean).length;
  }

  get resultsLabel(): string {
    const count = this.events().length;
    return `${count} ${count === 1 ? 'event' : 'events'}`;
  }

  private readParams(params: Params): void {
    const number = (value: unknown) => {
      const parsed = value === undefined || value === null || value === '' ? NaN : Number(value);
      return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
    };
    this.search = params['q'] ?? params['search'] ?? '';
    this.category = this.categories.includes(params['category']) ? params['category'] : '';
    this.price = this.priceTiers.includes(params['price']) ? params['price'] : 'Any Price';
    this.neighborhood = this.neighborhoods.includes(params['area']) ? params['area'] : 'All NYC';
    const when = params['when'] as When;
    this.when = WHEN_OPTIONS.some((option) => option.value === when) ? when : 'upcoming';
    this.dateFrom = params['from'] ?? '';
    this.dateTo = params['to'] ?? '';
    this.minPrice = number(params['min']);
    this.maxPrice = number(params['max']);
    const sort = params['sort'] as SortOption;
    this.sortBy = SORT_OPTIONS.some((option) => option.value === sort) ? sort : 'date';
    if (this.minPrice !== null || this.maxPrice !== null || this.neighborhood !== 'All NYC') {
      this.showMoreFilters = true;
    }
  }
}
