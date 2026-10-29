import { Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { EventService } from '../../services/event.service';
import { ToastService } from '../../services/toast.service';
import { KnittedEvent } from '../../interfaces/event.interface';
import { EventCardComponent } from '../../shared/event-card.component';
import { EVENT_CATEGORIES, apiErrorMessage, parseTime, splitTags, to12Hour, toDateInput } from '../../shared/event-utils';

const PRESET_COVERS = [
  { name: 'Studio', url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=1200' },
  { name: 'Records', url: 'https://images.unsplash.com/photo-1539628399213-d6aa89c93074?auto=format&fit=crop&q=80&w=1200' },
  { name: 'Wine', url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&q=80&w=1200' },
  { name: 'Climbing', url: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&q=80&w=1200' },
];

@Component({
  selector: 'app-event-create',
  standalone: true,
  imports: [FormsModule, RouterLink, EventCardComponent],
  templateUrl: './event-create.component.html',
  styleUrls: ['./event-create.component.css']
})
export class EventCreateComponent {
  readonly categories = EVENT_CATEGORIES;
  readonly presetCovers = PRESET_COVERS;
  readonly today = toDateInput(new Date());
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');

  model = {
    title: '',
    description: '',
    category: EVENT_CATEGORIES[0],
    date: '',
    startTime: '19:00',
    endTime: '21:00',
    location: '',
    price: 0,
    totalCapacity: 20,
    tags: '',
    coverImage: PRESET_COVERS[0].url,
  };

  private eventService = inject(EventService);
  private toast = inject(ToastService);
  private router = inject(Router);

  get timeError(): string | null {
    const start = parseTime(this.model.startTime);
    const end = parseTime(this.model.endTime);
    if (start === null || end === null) return null;
    return end <= start ? 'End time must be after the start time.' : null;
  }

  /** The event as it will appear in listings, for the live preview card. */
  get preview(): KnittedEvent {
    return {
      id: 0,
      title: this.model.title || 'Your event title',
      description: this.model.description,
      date: this.model.date ? new Date(`${this.model.date}T12:00:00`).toISOString() : new Date().toISOString(),
      startTime: to12Hour(this.model.startTime),
      endTime: to12Hour(this.model.endTime),
      location: this.model.location || 'Venue or neighborhood',
      price: Number(this.model.price) || 0,
      category: this.model.category,
      tags: this.model.tags,
      coverImage: this.model.coverImage,
      totalCapacity: Number(this.model.totalCapacity) || 1,
      availableTickets: Number(this.model.totalCapacity) || 1,
    };
  }

  selectCover(url: string): void {
    this.model.coverImage = url;
  }

  onSubmit(form: NgForm): void {
    if (form.invalid || this.timeError) {
      form.control.markAllAsTouched();
      this.errorMessage.set(this.timeError ?? 'Please complete the highlighted fields.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    this.eventService.createEvent({
      title: this.model.title.trim(),
      description: this.model.description.trim(),
      category: this.model.category,
      // Noon local time keeps the calendar day stable across time zones.
      date: new Date(`${this.model.date}T12:00:00`).toISOString(),
      startTime: to12Hour(this.model.startTime),
      endTime: to12Hour(this.model.endTime),
      location: this.model.location.trim(),
      price: Math.round(Number(this.model.price) * 100) / 100,
      totalCapacity: Math.floor(Number(this.model.totalCapacity)),
      tags: splitTags(this.model.tags).join(', '),
      coverImage: this.model.coverImage.trim(),
    }).subscribe({
      next: (created) => {
        this.isSubmitting.set(false);
        this.toast.success('Your event is live!');
        this.router.navigate(['/events', created.id]);
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(apiErrorMessage(error, 'We couldn’t publish your event. Check the details and try again.'));
      }
    });
  }
}
