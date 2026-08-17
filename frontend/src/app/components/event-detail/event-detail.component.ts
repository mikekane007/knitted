import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EventService } from '../../services/event.service';
import { KnittedEvent } from '../../interfaces/event.interface';
import { AuthService } from '../../services/auth.service';
import { NgIf, NgFor, DatePipe, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [RouterLink, NgIf, NgFor, DatePipe, CommonModule, FormsModule],
  templateUrl: './event-detail.component.html',
  styleUrls: ['./event-detail.component.css']
})
export class EventDetailComponent implements OnInit {
  event: KnittedEvent | null = null;
  isLoading = true;
  isBooking = false;
  isBooked = false;
  ticketId = '';
  successMessage = '';
  errorMessage = '';

  attendees: any[] = [];
  chatMessages: any[] = [];
  chatMessageText = '';

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private eventService = inject(EventService);
  authService = inject(AuthService);

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = parseInt(idParam, 10);
      this.loadEvent(id);
      this.loadAttendees(id);
      this.loadChat(id);
    } else {
      this.router.navigate(['/events']);
    }
  }

  loadEvent(id: number): void {
    this.isLoading = true;
    this.eventService.getEvent(id).subscribe({
      next: (data) => {
        this.event = data;
        this.isLoading = false;
        this.checkIfUserIsBooked(id);
      },
      error: () => {
        this.isLoading = false;
        this.router.navigate(['/events']);
      }
    });
  }

  checkIfUserIsBooked(eventId: number): void {
    if (!this.authService.isLoggedIn()) {
      this.isBooked = false;
      return;
    }

    this.eventService.getMyBookings().subscribe({
      next: (bookings) => {
        // Find if this event is booked by the user
        const booking = bookings.find((b: any) => b.eventId === eventId || (b.event && b.event.id === eventId));
        if (booking) {
          this.isBooked = true;
          // Format booking ID as KNT-{eventId}-SKT-like
          const codeSuffix = this.event?.category ? this.event.category.substring(0, 3).toUpperCase() : 'PASS';
          this.ticketId = `KNT-${1000 + eventId}-${codeSuffix}`;
        } else {
          this.isBooked = false;
        }
      }
    });
  }

  loadAttendees(eventId: number): void {
    this.eventService.getEventAttendees(eventId).subscribe({
      next: (data) => {
        this.attendees = data;
      }
    });
  }

  loadChat(eventId: number): void {
    this.eventService.getEventChat(eventId).subscribe({
      next: (data) => {
        this.chatMessages = data;
      }
    });
  }

  postChatMessage(): void {
    if (!this.event || !this.chatMessageText.trim()) return;

    this.eventService.postEventChat(this.event.id, this.chatMessageText).subscribe({
      next: (newMsg) => {
        this.chatMessages.push(newMsg);
        this.chatMessageText = '';
      },
      error: (err) => {
        console.error('Failed to post message:', err);
      }
    });
  }

  handleChatKeydown(event: any): void {
    // Send on enter without shift key
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.postChatMessage();
    }
  }

  bookTicket(): void {
    if (!this.event) return;
    const currentEvent = this.event;
    this.isBooking = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.eventService.bookEvent(currentEvent.id).subscribe({
      next: () => {
        this.isBooking = false;
        this.isBooked = true;
        this.successMessage = 'Spot successfully reserved! Pass generated below.';
        currentEvent.availableTickets = Math.max(0, currentEvent.availableTickets - 1);
        this.loadAttendees(currentEvent.id);
        const codeSuffix = currentEvent.category ? currentEvent.category.substring(0, 3).toUpperCase() : 'PASS';
        this.ticketId = `KNT-${1000 + currentEvent.id}-${codeSuffix}`;
      },
      error: (err) => {
        this.isBooking = false;
        this.errorMessage = err.error || 'Failed to reserve spot. Please try again.';
      }
    });
  }

  close(): void {
    this.router.navigate(['/events']);
  }

  getTagsList(tagsString: string): string[] {
    if (!tagsString) return [];
    return tagsString.split(',').map(t => t.trim());
  }
}
