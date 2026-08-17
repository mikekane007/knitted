import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { EventService } from '../../services/event.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-event-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './event-create.component.html',
  styleUrls: ['./event-create.component.css']
})
export class EventCreateComponent implements OnInit {
  authService = inject(AuthService);
  private eventService = inject(EventService);
  private router = inject(Router);

  // Form Model
  eventModel = {
    title: '',
    description: '',
    category: 'Art & Design',
    date: '',
    startTime: '07:00 PM',
    endTime: '09:30 PM',
    location: '',
    price: 0,
    totalCapacity: 15,
    coverImage: ''
  };

  categories = ['Art & Design', 'Food & Wine', 'Active & Outdoors'];
  
  // Preset cover images that match our brand aesthetic
  presetCovers = [
    { name: 'Coffee & Drawing', url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=800' },
    { name: 'Vinyl Records', url: 'https://images.unsplash.com/photo-1539628399213-d6aa89c93074?auto=format&fit=crop&q=80&w=800' },
    { name: 'Natural Wine', url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&q=80&w=800' },
    { name: 'Active Bouldering', url: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&q=80&w=800' }
  ];

  // Wizard Steps: 1, 2, 3
  currentStep = 1;
  isSubmitting = false;
  successMessage = '';
  errorMessage = '';

  ngOnInit(): void {
    // Select default cover image
    this.eventModel.coverImage = this.presetCovers[0].url;
  }

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  nextStep(): void {
    if (this.currentStep < 3) {
      this.currentStep++;
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  selectCover(url: string): void {
    this.eventModel.coverImage = url;
  }

  onSubmit(): void {
    if (!this.eventModel.title || !this.eventModel.location || !this.eventModel.date) {
      this.errorMessage = 'Please fill out all required fields.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    // Map model date to DateTime iso string
    const payload = {
      ...this.eventModel,
      date: new Date(this.eventModel.date).toISOString()
    };

    this.eventService.createEvent(payload).subscribe({
      next: (createdEvent) => {
        this.isSubmitting = false;
        this.successMessage = 'Gathering successfully published!';
        setTimeout(() => {
          this.router.navigate(['/events', createdEvent.id]);
        }, 1500);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err.error || 'Failed to publish gathering. Make sure all fields are valid.';
      }
    });
  }
}
