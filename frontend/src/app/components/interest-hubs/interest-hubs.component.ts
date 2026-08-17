import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EventService } from '../../services/event.service';
import { KnittedEvent } from '../../interfaces/event.interface';

@Component({
  selector: 'app-interest-hubs',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './interest-hubs.component.html',
  styleUrls: ['./interest-hubs.component.css']
})
export class InterestHubsComponent implements OnInit {
  hubs: any[] = [];
  selectedHub: any | null = null;
  hubEvents: KnittedEvent[] = [];
  isLoadingHubs = true;
  isLoadingEvents = false;

  private eventService = inject(EventService);

  ngOnInit(): void {
    this.loadHubs();
  }

  loadHubs(): void {
    this.isLoadingHubs = true;
    this.eventService.getCategoriesSummary().subscribe({
      next: (data) => {
        this.hubs = data;
        this.isLoadingHubs = false;
      },
      error: () => {
        this.isLoadingHubs = false;
      }
    });
  }

  selectHub(hub: any): void {
    this.selectedHub = hub;
    this.isLoadingEvents = true;
    this.eventService.getEvents(undefined, undefined, undefined).subscribe({
      next: (events) => {
        this.hubEvents = events.filter(e => e.category === hub.name);
        this.isLoadingEvents = false;
      },
      error: () => {
        this.isLoadingEvents = false;
      }
    });
  }

  closeHubPanel(): void {
    this.selectedHub = null;
    this.hubEvents = [];
  }
}
