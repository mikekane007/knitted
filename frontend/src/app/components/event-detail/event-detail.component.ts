import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { EventService } from '../../services/event.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { Attendee, ChatMessage, KnittedEvent } from '../../interfaces/event.interface';
import { Pass } from '../../interfaces/booking.interface';
import {
  DEFAULT_COVER,
  apiErrorMessage,
  formatPrice,
  googleCalendarUrl,
  icsFile,
  initials,
  isPast,
  splitTags,
  spotsLabel,
} from '../../shared/event-utils';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [RouterLink, DatePipe, FormsModule],
  templateUrl: './event-detail.component.html',
  styleUrls: ['./event-detail.component.css']
})
export class EventDetailComponent implements OnInit {
  readonly event = signal<KnittedEvent | null>(null);
  readonly isLoading = signal(true);
  readonly notFound = signal(false);
  readonly isBooking = signal(false);
  readonly pass = signal<Pass | null>(null);
  readonly attendees = signal<Attendee[]>([]);
  readonly chatMessages = signal<ChatMessage[]>([]);
  readonly isPosting = signal(false);
  readonly calendarOpen = signal(false);
  chatMessageText = '';

  readonly defaultCover = DEFAULT_COVER;
  readonly initials = initials;

  readonly price = computed(() => formatPrice(this.event()?.price ?? 0));
  readonly tags = computed(() => splitTags(this.event()?.tags));
  readonly spots = computed(() => (this.event() ? spotsLabel(this.event()!) : null));
  readonly isPastEvent = computed(() => (this.event() ? isPast(this.event()!.date) : false));
  readonly soldOut = computed(() => (this.event()?.availableTickets ?? 0) <= 0);
  readonly guests = computed(() => this.attendees().filter((attendee) => attendee.id !== this.event()?.hostId));
  readonly fillPercent = computed(() => {
    const event = this.event();
    if (!event?.totalCapacity) return 0;
    return Math.min(100, Math.round(((event.totalCapacity - event.availableTickets) / event.totalCapacity) * 100));
  });
  readonly mapUrl = computed(() =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(this.event()?.location ?? '')}`);

  readonly auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private eventService = inject(EventService);
  private toast = inject(ToastService);
  private title = inject(Title);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(id) || id <= 0) {
      this.notFound.set(true);
      this.isLoading.set(false);
      return;
    }
    this.loadEvent(id);
    this.loadAttendees(id);
    this.loadChat(id);
  }

  get pageUrl(): string {
    return window.location.href.split('?')[0];
  }

  get loginLink(): { returnUrl: string } {
    return { returnUrl: this.router.url };
  }

  loadEvent(id: number): void {
    this.isLoading.set(true);
    this.eventService.getEvent(id).subscribe({
      next: (event) => {
        this.event.set(event);
        this.title.setTitle(`${event.title} · Knitted`);
        this.isLoading.set(false);
        this.loadPass(id);
      },
      error: () => {
        this.notFound.set(true);
        this.isLoading.set(false);
      }
    });
  }

  loadPass(eventId: number): void {
    if (!this.auth.isLoggedIn()) return;
    this.eventService.getMyPasses().subscribe({
      next: (passes) => this.pass.set(passes.find((pass) => pass.eventId === eventId) ?? null),
    });
  }

  loadAttendees(eventId: number): void {
    this.eventService.getEventAttendees(eventId).subscribe({
      next: (attendees) => this.attendees.set(attendees),
    });
  }

  loadChat(eventId: number): void {
    this.eventService.getEventChat(eventId).subscribe({
      next: (messages) => this.chatMessages.set(messages),
    });
  }

  bookTicket(): void {
    const event = this.event();
    if (!event || this.isBooking()) return;
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login'], { queryParams: this.loginLink });
      return;
    }

    this.isBooking.set(true);
    this.eventService.bookEvent(event.id).subscribe({
      next: () => {
        this.isBooking.set(false);
        this.event.set({ ...event, availableTickets: Math.max(0, event.availableTickets - 1) });
        this.toast.success('You’re going! Your ticket is in My tickets.');
        this.loadPass(event.id);
        this.loadAttendees(event.id);
      },
      error: (error) => {
        this.isBooking.set(false);
        if (error?.status === 409) this.loadPass(event.id);
        this.toast.error(apiErrorMessage(error, 'We couldn’t reserve your spot. Please try again.'));
        if (error?.status === 400) this.loadEvent(event.id);
      }
    });
  }

  postChatMessage(): void {
    const event = this.event();
    const message = this.chatMessageText.trim();
    if (!event || !message || this.isPosting()) return;

    this.isPosting.set(true);
    this.eventService.postEventChat(event.id, message).subscribe({
      next: (posted) => {
        this.chatMessages.update((messages) => [...messages, posted]);
        this.chatMessageText = '';
        this.isPosting.set(false);
      },
      error: (error) => {
        this.isPosting.set(false);
        this.toast.error(apiErrorMessage(error, 'Your message wasn’t sent. Please try again.'));
      }
    });
  }

  handleChatKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.postChatMessage();
    }
  }

  async share(): Promise<void> {
    const event = this.event();
    if (!event) return;
    const data = { title: event.title, text: `${event.title} on Knitted`, url: this.pageUrl };
    try {
      if (navigator.share) {
        await navigator.share(data);
        return;
      }
      await navigator.clipboard.writeText(this.pageUrl);
      this.toast.success('Link copied to clipboard');
    } catch (error) {
      if ((error as DOMException)?.name !== 'AbortError') {
        this.toast.error('Couldn’t share this event. Copy the address from your browser instead.');
      }
    }
  }

  googleCalendarLink(): string {
    return this.event() ? googleCalendarUrl(this.event()!, this.pageUrl) : '#';
  }

  downloadIcs(): void {
    const event = this.event();
    if (!event) return;
    const blob = new Blob([icsFile(event, this.pageUrl)], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.ics`;
    link.click();
    URL.revokeObjectURL(url);
    this.calendarOpen.set(false);
  }

  onImageError(error: Event): void {
    const image = error.target as HTMLImageElement;
    if (image.src !== DEFAULT_COVER) image.src = DEFAULT_COVER;
  }
}
