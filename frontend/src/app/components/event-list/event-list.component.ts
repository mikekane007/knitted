import { Component, OnInit, inject } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { EventService } from '../../services/event.service';
import { KnittedEvent } from '../../interfaces/event.interface';
import { NgIf, NgFor, DatePipe, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [RouterLink, NgIf, NgFor, CommonModule, FormsModule],
  templateUrl: './event-list.component.html',
  styleUrls: ['./event-list.component.css']
})
export class EventListComponent implements OnInit {
  events: KnittedEvent[] = [];
  isLoading = true;
  selectedView = 'list'; // 'list' or 'radar'

  selectedSearch = '';
  selectedNeighborhood = 'All NYC';
  selectedPrice = 'Any Price';

  neighborhoods = ['All NYC', 'DUMBO', 'East Village', 'Williamsburg', 'Greenpoint'];
  priceTiers = ['Any Price', 'Free', 'Under $20'];

  hoveredRadarEvent: KnittedEvent | null = null;
  isScanning = false;
  errorMessage: string | null = null;

  private eventService = inject(EventService);
  private router = inject(Router);

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents(): void {
    this.isLoading = true;
    this.eventService.getEvents(
      this.selectedSearch,
      this.selectedNeighborhood,
      this.selectedPrice
    ).subscribe({
      next: (data) => {
        this.events = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  scanExternalMeetups(): void {
    this.isScanning = true;
    this.errorMessage = null;
    this.eventService.scanExternalEvents().subscribe({
      next: (data) => {
        this.events = data;
        this.isScanning = false;
      },
      error: (err) => {
        console.error('Failed to scan external meetups:', err);
        this.errorMessage = err?.error?.message || err?.error?.Message || err?.message || 'Failed to connect to Apify API.';
        this.isScanning = false;
      }
    });
  }

  setNeighborhood(area: string): void {
    this.selectedNeighborhood = area;
    this.loadEvents();
  }

  setPrice(priceTier: string): void {
    this.selectedPrice = priceTier;
    this.loadEvents();
  }

  setView(view: string): void {
    this.selectedView = view;
  }

  clearSearch(): void {
    this.selectedSearch = '';
    this.loadEvents();
  }

  triggerDatabaseSeed(): void {
    this.isLoading = true;
    this.eventService.seedEvents().subscribe({
      next: () => {
        this.loadEvents();
      },
      error: (err) => {
        console.error('Failed to seed events:', err);
        this.isLoading = false;
      }
    });
  }

  // UI Date formatting helpers
  getMonthAbbreviation(dateStr: string): string {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    } catch {
      return 'AUG';
    }
  }

  getDayNumber(dateStr: string): string {
    try {
      const d = new Date(dateStr);
      return d.getDate().toString();
    } catch {
      return '15';
    }
  }

  getWeekdayAbbreviation(dateStr: string): string {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('en-US', { weekday: 'short' }).toUpperCase();
    } catch {
      return 'SAT';
    }
  }

  getFirstTag(tags: string): string {
    if (!tags) return '';
    return tags.split(',')[0].trim();
  }

  // Radar Map helpers
  getRadarCoordinates(index: number): { x: number, y: number } {
    // Generate distinct geographic points on the radar circle
    const coordinates = [
      { x: 30, y: 35 }, // Upper-left DUMBO
      { x: 68, y: 25 }, // Upper-right East Village
      { x: 25, y: 72 }, // Lower-left Heights
      { x: 75, y: 70 }, // Lower-right Williamsburg
      { x: 50, y: 20 }, // North Brooklyn
      { x: 18, y: 48 }  // West
    ];
    return coordinates[index % coordinates.length];
  }

  getRadarCategoryColor(category: string): string {
    if (category === 'Art & Design') return '#d97706';
    if (category === 'Food & Wine') return '#dc2626';
    if (category === 'Active & Outdoors') return '#059669';
    return '#2563eb';
  }

  // Dynamic popup coordinates based on hovered item
  get radarCardX(): string {
    if (!this.hoveredRadarEvent) return '0%';
    const index = this.events.indexOf(this.hoveredRadarEvent);
    const coord = this.getRadarCoordinates(index);
    // Offset card to the right of the blip
    return `calc(${coord.x}% + 15px)`;
  }

  get radarCardY(): string {
    if (!this.hoveredRadarEvent) return '0%';
    const index = this.events.indexOf(this.hoveredRadarEvent);
    const coord = this.getRadarCoordinates(index);
    // Align vertically
    return `calc(${coord.y}% - 60px)`;
  }
}
