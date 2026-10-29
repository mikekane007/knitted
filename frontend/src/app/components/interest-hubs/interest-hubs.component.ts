import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EventService } from '../../services/event.service';
import { EventCategory } from '../../interfaces/event.interface';
import { CATEGORY_ICONS, apiErrorMessage } from '../../shared/event-utils';

@Component({
  selector: 'app-interest-hubs',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './interest-hubs.component.html',
  styleUrls: ['./interest-hubs.component.css']
})
export class InterestHubsComponent implements OnInit {
  readonly categories = signal<EventCategory[]>([]);
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);
  readonly icons = CATEGORY_ICONS;

  private eventService = inject(EventService);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.eventService.getCategoriesSummary().subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.error.set(apiErrorMessage(error, 'We couldn’t load categories.'));
        this.isLoading.set(false);
      }
    });
  }
}
