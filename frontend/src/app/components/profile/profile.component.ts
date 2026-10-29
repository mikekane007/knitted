import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { EventService } from '../../services/event.service';
import { ToastService } from '../../services/toast.service';
import { KnittedEvent } from '../../interfaces/event.interface';
import { UserProfile } from '../../interfaces/user.interface';
import { EventCardComponent } from '../../shared/event-card.component';
import { apiErrorMessage, initials, isPast, splitTags } from '../../shared/event-utils';

export const INTERESTS = ['Art & Design', 'Food & Wine', 'Active & Outdoors', 'Indie Tech & Craft', 'Music & Sound', 'Mind & Movement', 'Literature & Salons'];

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe, EventCardComponent],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  readonly profile = signal<UserProfile | null>(null);
  readonly isLoading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly isEditing = signal(false);
  readonly isSaving = signal(false);
  readonly hosted = signal<KnittedEvent[]>([]);
  readonly hostedLoading = signal(true);

  readonly interests = computed(() => splitTags(this.profile()?.wovenThreads));
  readonly upcomingHosted = computed(() => this.hosted().filter((event) => !isPast(event.date)));
  readonly pastHosted = computed(() => this.hosted().filter((event) => isPast(event.date)));

  readonly allInterests = INTERESTS;
  readonly initials = initials;

  editModel = { name: '', location: '', bio: '', avatarUrl: '' };
  selectedInterests = new Set<string>();

  private auth = inject(AuthService);
  private eventService = inject(EventService);
  private toast = inject(ToastService);

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.isLoading.set(true);
    this.loadError.set(null);
    this.auth.getProfile().subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.isLoading.set(false);
        this.loadHosted(profile.id);
      },
      error: (error) => {
        this.loadError.set(apiErrorMessage(error, 'We couldn’t load your profile.'));
        this.isLoading.set(false);
      }
    });
  }

  loadHosted(userId: number): void {
    this.hostedLoading.set(true);
    this.eventService.getEvents(undefined, undefined, undefined, { sortBy: 'date' }).subscribe({
      next: (events) => {
        this.hosted.set(events.filter((event) => event.hostId === userId));
        this.hostedLoading.set(false);
      },
      error: () => this.hostedLoading.set(false),
    });
  }

  startEditing(): void {
    const profile = this.profile();
    if (!profile) return;
    this.editModel = {
      name: profile.name ?? '',
      location: profile.location ?? '',
      bio: profile.bio ?? '',
      avatarUrl: profile.avatarUrl ?? '',
    };
    this.selectedInterests = new Set(this.interests());
    this.isEditing.set(true);
  }

  toggleInterest(interest: string): void {
    if (this.selectedInterests.has(interest)) this.selectedInterests.delete(interest);
    else this.selectedInterests.add(interest);
  }

  save(form: NgForm): void {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }
    this.isSaving.set(true);
    this.auth.updateProfile({
      name: this.editModel.name.trim(),
      location: this.editModel.location.trim() || null,
      bio: this.editModel.bio.trim() || null,
      avatarUrl: this.editModel.avatarUrl.trim() || null,
      wovenThreads: [...this.selectedInterests].join(', ') || null,
    }).subscribe({
      next: (updated) => {
        this.profile.set(updated);
        this.isSaving.set(false);
        this.isEditing.set(false);
        this.toast.success('Profile saved');
      },
      error: (error) => {
        this.isSaving.set(false);
        this.toast.error(apiErrorMessage(error, 'We couldn’t save your profile.'));
      }
    });
  }
}
