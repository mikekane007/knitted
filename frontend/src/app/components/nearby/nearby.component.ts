import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Params, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { DiscoveryService } from '../../services/discovery.service';
import { DiscoveredEvent, NearbyResult } from '../../interfaces/discovery.interface';
import { EventCardSkeletonComponent } from '../../shared/event-card-skeleton.component';
import { apiErrorMessage } from '../../shared/event-utils';

const RADIUS_OPTIONS = [5, 10, 25, 50, 100];
const DAY_OPTIONS = [
  { value: 1, label: 'Today' },
  { value: 3, label: 'Next 3 days' },
  { value: 7, label: 'This week' },
  { value: 30, label: 'Next 30 days' },
  { value: 90, label: 'Next 3 months' },
];
const LAST_PLACE_KEY = 'knitted.nearby.last';

interface Place {
  lat: number;
  lng: number;
  label: string | null;
}

/** "Find events near me": events from across the web, not only ones hosted on Knitted. */
@Component({
  selector: 'app-nearby',
  standalone: true,
  imports: [DatePipe, FormsModule, RouterLink, EventCardSkeletonComponent],
  templateUrl: './nearby.component.html',
  styleUrls: ['./nearby.component.css'],
})
export class NearbyComponent implements OnInit {
  readonly radiusOptions = RADIUS_OPTIONS;
  readonly dayOptions = DAY_OPTIONS;

  readonly place = signal<Place | null>(null);
  readonly result = signal<NearbyResult | null>(null);
  readonly isLocating = signal(false);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  radiusKm = 25;
  days = 30;
  cityQuery = '';

  // Client-side refinements over the fetched results.
  readonly textFilter = signal('');
  readonly freeOnly = signal(false);
  readonly topic = signal('');
  readonly sortBy = signal<'date' | 'distance'>('date');

  readonly topics = computed(() => {
    const counts = new Map<string, number>();
    for (const event of this.result()?.events ?? []) {
      const tag = event.category?.trim();
      if (tag) counts.set(this.titleCase(tag), (counts.get(this.titleCase(tag)) ?? 0) + 1);
    }
    return [...counts.entries()].filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([tag]) => tag);
  });

  readonly visibleEvents = computed(() => {
    const text = this.textFilter().trim().toLowerCase();
    const topic = this.topic().toLowerCase();
    const events = (this.result()?.events ?? []).filter((event) => {
      if (this.freeOnly() && event.isFree !== true) return false;
      if (topic && !event.tags.some((tag) => tag.toLowerCase() === topic) && event.category?.toLowerCase() !== topic) return false;
      if (!text) return true;
      return [event.title, event.description, event.venue, event.city, ...event.tags]
        .some((value) => value?.toLowerCase().includes(text));
    });
    return this.sortBy() === 'distance'
      ? [...events].sort((a, b) => a.distanceKm - b.distanceKm)
      : events;
  });

  readonly activeSources = computed(() => (this.result()?.sources ?? []).filter((source) => source.status === 'ok'));
  readonly sourceNames = computed(() => this.activeSources().map((source) => source.name).join(' and '));
  readonly hasTicketmaster = computed(() =>
    (this.result()?.sources ?? []).some((source) => source.id === 'ticketmaster' && source.status === 'ok'));

  private discovery = inject(DiscoveryService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private request?: Subscription;

  ngOnInit(): void {
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const place = this.readParams(params);
      if (place) {
        this.place.set(place);
        this.load(place);
      } else {
        const last = this.lastPlace();
        if (last) this.go(last, true);
      }
    });
  }

  async useMyLocation(): Promise<void> {
    this.error.set(null);
    this.isLocating.set(true);
    try {
      const position = await this.discovery.currentPosition();
      this.go({ lat: position.latitude, lng: position.longitude, label: null });
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'We couldn’t get your location.');
    } finally {
      this.isLocating.set(false);
    }
  }

  searchCity(): void {
    const query = this.cityQuery.trim();
    if (query.length < 2) return;
    this.error.set(null);
    this.isLocating.set(true);
    this.discovery.geocode(query).subscribe({
      next: (found) => {
        this.isLocating.set(false);
        this.cityQuery = '';
        this.go({ lat: found.latitude, lng: found.longitude, label: found.label });
      },
      error: (error) => {
        this.isLocating.set(false);
        this.error.set(apiErrorMessage(error, `We couldn’t find “${query}”.`));
      },
    });
  }

  setRadius(radius: number): void {
    this.radiusKm = radius;
    const place = this.place();
    if (place) this.go(place);
  }

  setDays(days: number): void {
    this.days = days;
    const place = this.place();
    if (place) this.go(place);
  }

  toggleTopic(topic: string): void {
    this.topic.set(this.topic() === topic ? '' : topic);
  }

  clearRefinements(): void {
    this.textFilter.set('');
    this.freeOnly.set(false);
    this.topic.set('');
  }

  retry(): void {
    const place = this.place();
    if (place) this.load(place);
  }

  isHappeningNow(event: DiscoveredEvent): boolean {
    const now = Date.now();
    return Date.parse(event.start) <= now && (!event.end || Date.parse(event.end) >= now);
  }

  distanceLabel(km: number): string {
    return km < 1 ? `${Math.round(km * 1000)} m away` : `${km.toFixed(km < 10 ? 1 : 0)} km away`;
  }

  hideBrokenImage(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }

  private go(place: Place, replaceUrl = false): void {
    this.router.navigate([], {
      relativeTo: this.route,
      replaceUrl,
      queryParams: {
        lat: place.lat.toFixed(4),
        lng: place.lng.toFixed(4),
        place: place.label || null,
        r: this.radiusKm !== 25 ? this.radiusKm : null,
        days: this.days !== 30 ? this.days : null,
      },
    });
  }

  private load(place: Place): void {
    this.request?.unsubscribe();
    this.isLoading.set(true);
    this.error.set(null);
    this.clearRefinements();
    this.request = this.discovery.nearby(place.lat, place.lng, this.radiusKm, this.days).subscribe({
      next: (result) => {
        this.result.set(result);
        this.isLoading.set(false);
        const label = place.label || result.place;
        this.place.set({ ...place, label });
        this.rememberPlace({ ...place, label });
      },
      error: (error) => {
        this.result.set(null);
        this.isLoading.set(false);
        this.error.set(apiErrorMessage(error, 'We couldn’t load events near you. Please try again.'));
      },
    });
  }

  private readParams(params: Params): Place | null {
    const lat = Number(params['lat']);
    const lng = Number(params['lng']);
    const radius = Number(params['r']);
    const days = Number(params['days']);
    this.radiusKm = RADIUS_OPTIONS.includes(radius) ? radius : 25;
    this.days = DAY_OPTIONS.some((option) => option.value === days) ? days : 30;
    if (!params['lat'] || !params['lng'] || !Number.isFinite(lat) || !Number.isFinite(lng)
      || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      return null;
    }
    return { lat, lng, label: typeof params['place'] === 'string' ? params['place'] : null };
  }

  private rememberPlace(place: Place): void {
    try {
      localStorage.setItem(LAST_PLACE_KEY, JSON.stringify(place));
    } catch {
      // Storage can be unavailable (private mode); remembering the place is only a convenience.
    }
  }

  private lastPlace(): Place | null {
    try {
      const saved = JSON.parse(localStorage.getItem(LAST_PLACE_KEY) ?? 'null') as Place | null;
      return saved && Number.isFinite(saved.lat) && Number.isFinite(saved.lng) ? saved : null;
    } catch {
      return null;
    }
  }

  private titleCase(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  }
}
