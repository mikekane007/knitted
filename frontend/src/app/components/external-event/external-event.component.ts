import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Observable } from 'rxjs';
import { DiscoveryService } from '../../services/discovery.service';
import { ToastService } from '../../services/toast.service';
import { DiscoveredEvent, SavedStatus } from '../../interfaces/discovery.interface';
import { apiErrorMessage } from '../../shared/event-utils';
import { CalendarEvent, downloadIcs, googleCalendarUrl } from '../../shared/calendar';

/** An event from another platform, shown inside Knitted with "I'm going", calendar and booking buttons. */
@Component({
  selector: 'app-external-event',
  standalone: true,
  imports: [DatePipe, RouterLink],
  templateUrl: './external-event.component.html',
  styleUrls: ['./external-event.component.css'],
})
export class ExternalEventComponent implements OnInit {
  readonly event = signal<DiscoveredEvent | null>(null);
  readonly saved = signal<SavedStatus | null>(null);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly error = signal<string | null>(null);

  readonly mapUrl = computed<SafeResourceUrl | null>(() => {
    const event = this.event();
    if (!event) return null;
    const pad = 0.008;
    const bbox = [event.longitude - pad, event.latitude - pad / 1.6, event.longitude + pad, event.latitude + pad / 1.6].join(',');
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${event.latitude},${event.longitude}`,
    );
  });

  readonly directionsUrl = computed(() => {
    const event = this.event();
    return event
      ? `https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`
      : null;
  });

  readonly calendarEvent = computed<CalendarEvent | null>(() => {
    const event = this.event();
    if (!event) return null;
    return {
      title: event.title,
      start: event.start,
      end: event.end,
      location: [event.venue, event.address, event.city].filter(Boolean).join(', ') || null,
      description: event.description,
      url: event.action.url,
    };
  });

  readonly googleCalendar = computed(() => {
    const calendar = this.calendarEvent();
    return calendar ? googleCalendarUrl(calendar) : null;
  });

  readonly isPast = computed(() => {
    const event = this.event();
    return event ? Date.parse(event.end ?? event.start) < Date.now() : false;
  });

  readonly endsSameDay = computed(() => {
    const event = this.event();
    return Boolean(event?.end) && new Date(event!.end!).toDateString() === new Date(event!.start).toDateString();
  });

  /** Back to the search the user came from, if we know it. */
  readonly backParams = signal<Record<string, string>>({});

  private route = inject(ActivatedRoute);
  private discovery = inject(DiscoveryService);
  private toast = inject(ToastService);
  private sanitizer = inject(DomSanitizer);
  private id = '';

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') ?? '';
    const query = this.route.snapshot.queryParamMap;
    const lat = Number(query.get('lat'));
    const lng = Number(query.get('lng'));
    const origin = query.get('lat') && query.get('lng') && Number.isFinite(lat) && Number.isFinite(lng)
      ? { lat, lng }
      : undefined;
    if (origin) this.backParams.set({ lat: lat.toFixed(4), lng: lng.toFixed(4) });
    this.load(origin);
  }

  load(origin?: { lat: number; lng: number }): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.discovery.getEvent(this.id, origin).subscribe({
      next: (detail) => {
        this.event.set(detail.event);
        this.saved.set(detail.saved);
        this.isLoading.set(false);
        document.title = `${detail.event.title} · Knitted`;
      },
      error: (error) => {
        this.error.set(apiErrorMessage(error, 'We couldn’t load this event. Please try again.'));
        this.isLoading.set(false);
      },
    });
  }

  /** Tapping the active status again clears it. */
  setStatus(status: SavedStatus): void {
    if (this.isSaving()) return;
    const clearing = this.saved() === status;
    this.isSaving.set(true);
    const request: Observable<unknown> = clearing ? this.discovery.unsave(this.id) : this.discovery.save(this.id, status);
    request.subscribe({
      next: () => {
        this.saved.set(clearing ? null : status);
        this.isSaving.set(false);
        this.toast.success(clearing
          ? 'Removed from My tickets.'
          : status === 'going' ? 'You’re going! It’s in My tickets.' : 'Saved to My tickets.');
      },
      error: (error: unknown) => {
        this.isSaving.set(false);
        this.toast.error(apiErrorMessage(error, 'We couldn’t save that. Please try again.'));
      },
    });
  }

  addToAppleCalendar(): void {
    const calendar = this.calendarEvent();
    if (calendar) downloadIcs(calendar, this.id.replace(/[^\w-]/g, '-'));
  }

  distanceLabel(km: number): string {
    return km < 1 ? `${Math.round(km * 1000)} m away` : `${km.toFixed(km < 10 ? 1 : 0)} km away`;
  }

  hideBrokenImage(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }
}
