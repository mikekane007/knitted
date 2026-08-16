import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EventService } from '../../services/event.service';
import { KnittedEvent } from '../../interfaces/event.interface';
import { NgIf, NgFor, DatePipe, CommonModule } from '@angular/common';

interface MockEventDetail {
  id: number;
  month: string;
  day: string;
  weekday: string;
  category: string;
  isHot: boolean;
  title: string;
  description: string;
  time: string;
  location: string;
  wovenCount: string;
  price: string;
  isFree: boolean;
  hostName: string;
  hostAvatar: string;
  eventImage: string;
  attendees: string[];
}

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [RouterLink, NgIf, NgFor, DatePipe, CommonModule],
  template: `
    <div class="discovery-container">
      <!-- Active Host Circles Section -->
      <section class="host-circles-section">
        <div class="section-header">
          <h3 class="section-title">ACTIVE HOST CIRCLES</h3>
          <a routerLink="/events" class="explore-link">Explore all threads <i class="fa-solid fa-chevron-right"></i></a>
        </div>
        <div class="hosts-row">
          <div *ngFor="let host of activeHosts" class="host-avatar-card">
            <div class="host-ring">
              <img [src]="host.avatarUrl" [alt]="host.name" class="host-img" />
            </div>
            <span class="host-name">{{ host.name }}</span>
            <span class="host-role" [style.color]="host.roleColor">{{ host.role }}</span>
          </div>
        </div>
      </section>

      <!-- Featured Gathering Banner -->
      <section class="featured-section" [style.background-image]="'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.85)), url(' + featured.eventImage + ')'">
        <div class="featured-content">
          <div class="featured-badge-row">
            <span class="featured-badge">FEATURED GATHERING</span>
            <span class="featured-meta">{{ featured.category }}</span>
          </div>
          <h2 class="featured-title">{{ featured.title }}</h2>
          <p class="featured-desc">{{ featured.description }}</p>
        </div>
        <div class="featured-price-action">
          <span class="featured-price">{{ featured.price }}</span>
          <a [routerLink]="['/events', getDatabaseEventId(featured.id)]" class="btn-view-pass">
            View Pass <i class="fa-solid fa-arrow-up-right-from-square arrow-icon"></i>
          </a>
        </div>
      </section>

      <!-- Upcoming Gatherings Header & Filters -->
      <section class="upcoming-header-section">
        <div class="upcoming-titles">
          <h2 class="upcoming-title">Upcoming Gatherings</h2>
          <p class="upcoming-subtitle">Real gatherings curated for quality conversations & offline human connection.</p>
        </div>
        
        <div class="filters-row">
          <button 
            *ngFor="let filter of filters" 
            class="filter-pill" 
            [class.active]="selectedFilter === filter" 
            (click)="selectFilter(filter)"
          >
            {{ filter }}
          </button>
        </div>
      </section>

      <!-- Upcoming Events List -->
      <div class="events-list-stack">
        <div *ngFor="let event of filteredEvents" class="event-feed-card">
          <!-- Left Column: Date Badge -->
          <div class="event-date-column">
            <span class="date-month">{{ event.month }}</span>
            <span class="date-day">{{ event.day }}</span>
            <span class="date-weekday">{{ event.weekday }}</span>
          </div>

          <!-- Middle Column: Details -->
          <div class="event-details-column">
            <div class="badge-row">
              <span class="category-badge" [class.art]="event.category === 'ART & DESIGN'" [class.food]="event.category === 'FOOD & WINE'" [class.active-out]="event.category === 'ACTIVE & OUTDOORS'" [class.tech]="event.category === 'INDIE TECH & CRAFT'" [class.mind]="event.category === 'MIND & MOVEMENT'">
                {{ event.category }}
              </span>
              <span *ngIf="event.isHot" class="hot-badge">
                <i class="fa-solid fa-fire"></i> Hot Gathering
              </span>
            </div>

            <h3 class="event-title">{{ event.title }}</h3>
            <p class="event-desc">{{ event.description }}</p>

            <!-- Metadata Pills -->
            <div class="metadata-pills-row">
              <div class="meta-pill">
                <i class="fa-regular fa-clock"></i> {{ event.time }}
              </div>
              <div class="meta-pill">
                <i class="fa-solid fa-location-dot"></i> {{ event.location }}
              </div>
              <div class="meta-pill attendees-pill">
                <div class="attendee-avatars">
                  <img *ngFor="let att of event.attendees" [src]="att" alt="Attendee" class="attendee-avatar-img" />
                </div>
                <span>{{ event.wovenCount }}</span>
              </div>
              <div class="meta-pill price-pill" [class.free]="event.isFree">
                {{ event.price }}
              </div>
            </div>

            <!-- Host info & View pass link -->
            <div class="host-row">
              <img [src]="event.hostAvatar" [alt]="event.hostName" class="host-avatar-small" />
              <span class="host-label">Host: <strong>{{ event.hostName }}</strong></span>
              <a [routerLink]="['/events', getDatabaseEventId(event.id)]" class="view-pass-link">
                View pass <i class="fa-solid fa-arrow-right"></i>
              </a>
            </div>
          </div>

          <!-- Right Column: Card Image -->
          <div class="event-image-column">
            <img [src]="event.eventImage" [alt]="event.title" class="event-card-img" />
            <span class="image-price-badge">{{ event.price }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .discovery-container {
      max-width: 1600px;
      margin: 0 auto;
      padding: 32px 40px;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: #ffffff;
    }

    /* Active Host Circles */
    .host-circles-section {
      margin-bottom: 40px;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .section-title {
      font-size: 0.72rem;
      font-weight: 700;
      color: rgba(0, 0, 0, 0.45);
      letter-spacing: 0.08em;
    }

    .explore-link {
      font-size: 0.85rem;
      font-weight: 600;
      color: #00c285;
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .hosts-row {
      display: flex;
      gap: 20px;
      overflow-x: auto;
      padding-bottom: 10px;
    }

    .hosts-row::-webkit-scrollbar {
      display: none; /* Hide scrollbars for editorial look */
    }

    .host-avatar-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      min-width: 76px;
      cursor: pointer;
    }

    .host-ring {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      border: 2px solid #00c285;
      padding: 2px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 8px;
      transition: transform 0.2s ease;
    }

    .host-avatar-card:hover .host-ring {
      transform: scale(1.05);
    }

    .host-img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
    }

    .host-name {
      font-size: 0.78rem;
      font-weight: 700;
      color: #1c1917;
      margin-bottom: 2px;
    }

    .host-role {
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.02em;
    }

    /* Featured Banner Card */
    .featured-section {
      height: 440px;
      border-radius: 24px;
      background-size: cover;
      background-position: center;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding: 40px;
      color: #ffffff;
      margin-bottom: 56px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
      box-sizing: border-box;
      position: relative;
    }

    .featured-content {
      max-width: 62%;
    }

    .featured-badge-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }

    .featured-badge {
      background-color: #00c285;
      color: #ffffff;
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      padding: 6px 12px;
      border-radius: 20px;
    }

    .featured-meta {
      font-size: 0.85rem;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.85);
    }

    .featured-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 2.2rem;
      font-weight: 700;
      line-height: 1.2;
      margin-bottom: 12px;
    }

    .featured-desc {
      font-size: 0.95rem;
      color: rgba(255, 255, 255, 0.85);
      line-height: 1.45;
      margin: 0;
    }

    .featured-price-action {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 16px;
    }

    .featured-price {
      font-size: 2.2rem;
      font-weight: 700;
      line-height: 1;
    }

    .btn-view-pass {
      background-color: #ffffff;
      color: #1c1917;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 30px;
      font-size: 0.9rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transition: all 0.2s ease;
    }

    .btn-view-pass:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(0,0,0,0.2);
    }

    /* Upcoming Gatherings Section */
    .upcoming-header-section {
      margin-bottom: 32px;
    }

    .upcoming-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 2rem;
      font-weight: 700;
      color: #1c1917;
      margin-bottom: 6px;
    }

    .upcoming-subtitle {
      font-size: 0.95rem;
      color: rgba(0, 0, 0, 0.52);
      margin-bottom: 24px;
    }

    .filters-row {
      display: flex;
      gap: 10px;
      overflow-x: auto;
      padding-bottom: 8px;
    }

    .filters-row::-webkit-scrollbar {
      display: none;
    }

    .filter-pill {
      background-color: #ffffff;
      border: 1px solid rgba(0, 0, 0, 0.08);
      color: rgba(0, 0, 0, 0.65);
      padding: 8px 18px;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s ease;
    }

    .filter-pill:hover {
      border-color: rgba(0, 0, 0, 0.18);
    }

    .filter-pill.active {
      background-color: #1c1917;
      color: #ffffff;
      border-color: #1c1917;
    }

    /* Events List Stack */
    .events-list-stack {
      display: flex;
      flex-direction: column;
      gap: 28px;
    }

    .event-feed-card {
      display: flex;
      background-color: #ffffff;
      border: 1px solid rgba(0, 0, 0, 0.05);
      border-radius: 20px;
      padding: 24px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.01);
      gap: 24px;
      transition: all 0.25s ease;
    }

    .event-feed-card:hover {
      border-color: rgba(0, 0, 0, 0.08);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
    }

    /* Left Column Date */
    .event-date-column {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      min-width: 56px;
      padding-top: 4px;
    }

    .date-month {
      font-size: 0.68rem;
      font-weight: 800;
      color: #00c285;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .date-day {
      font-size: 2.2rem;
      font-weight: 800;
      color: #1c1917;
      line-height: 1;
      margin: 4px 0;
    }

    .date-weekday {
      font-size: 0.68rem;
      font-weight: 700;
      color: rgba(0, 0, 0, 0.38);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    /* Middle Column Details */
    .event-details-column {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .badge-row {
      display: flex;
      gap: 8px;
      align-items: center;
      margin-bottom: 12px;
    }

    .category-badge {
      font-size: 0.65rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      padding: 4px 10px;
      border-radius: 12px;
    }

    .category-badge.art {
      background-color: rgba(245, 158, 11, 0.08);
      color: #d97706;
    }

    .category-badge.food {
      background-color: rgba(239, 68, 68, 0.08);
      color: #dc2626;
    }

    .category-badge.active-out {
      background-color: rgba(16, 185, 129, 0.08);
      color: #059669;
    }

    .category-badge.tech {
      background-color: rgba(59, 130, 246, 0.08);
      color: #2563eb;
    }

    .category-badge.mind {
      background-color: rgba(139, 92, 246, 0.08);
      color: #7c3aed;
    }

    .hot-badge {
      background-color: #fef3c7;
      color: #d97706;
      font-size: 0.65rem;
      font-weight: 800;
      letter-spacing: 0.04em;
      padding: 4px 10px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .event-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 1.55rem;
      font-weight: 700;
      color: #1c1917;
      margin: 0 0 10px 0;
      line-height: 1.25;
    }

    .event-desc {
      font-size: 0.88rem;
      color: rgba(0, 0, 0, 0.52);
      line-height: 1.45;
      margin: 0 0 18px 0;
    }

    /* Metadata pills */
    .metadata-pills-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 20px;
    }

    .meta-pill {
      background-color: #f5f6f5;
      color: rgba(0, 0, 0, 0.72);
      font-size: 0.78rem;
      font-weight: 600;
      padding: 6px 14px;
      border-radius: 20px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .attendees-pill {
      padding-left: 8px;
    }

    .attendee-avatars {
      display: flex;
      align-items: center;
      margin-right: 4px;
    }

    .attendee-avatar-img {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 1.5px solid #ffffff;
      margin-left: -6px;
      object-fit: cover;
    }

    .attendee-avatar-img:first-child {
      margin-left: 0;
    }

    .price-pill {
      font-weight: 700;
      color: #1c1917;
    }

    .price-pill.free {
      color: #00c285;
    }

    /* Host info */
    .host-row {
      display: flex;
      align-items: center;
      gap: 10px;
      border-top: 1px solid rgba(0,0,0,0.04);
      padding-top: 16px;
      margin-top: auto;
    }

    .host-avatar-small {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      object-fit: cover;
    }

    .host-label {
      font-size: 0.8rem;
      color: rgba(0, 0, 0, 0.45);
    }

    .host-label strong {
      color: #1c1917;
    }

    .view-pass-link {
      margin-left: auto;
      font-size: 0.82rem;
      font-weight: 700;
      color: #00c285;
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .view-pass-link:hover {
      text-decoration: underline;
    }

    /* Right Column Image */
    .event-image-column {
      position: relative;
      width: 240px;
      height: 180px;
      flex-shrink: 0;
    }

    .event-card-img {
      width: 100%;
      height: 100%;
      border-radius: 16px;
      object-fit: cover;
    }

    .image-price-badge {
      position: absolute;
      top: 10px;
      right: 10px;
      background-color: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
      color: #ffffff;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 4px 8px;
      border-radius: 8px;
    }

    /* Responsive adjustments */
    @media (max-width: 820px) {
      .event-feed-card {
        flex-direction: column;
      }
      .event-image-column {
        width: 100%;
        height: 180px;
        order: -1;
      }
      .featured-section {
        height: auto;
        flex-direction: column;
        align-items: flex-start;
        padding: 30px 20px;
        gap: 20px;
      }
      .featured-content {
        max-width: 100%;
      }
      .featured-price-action {
        align-items: flex-start;
      }
    }
  `]
})
export class EventListComponent implements OnInit {
  events: KnittedEvent[] = [];
  isLoading = true;
  selectedFilter = 'All Threads';

  private eventService = inject(EventService);

  activeHosts = [
    { name: 'Sarah', role: 'Creative', roleColor: '#d97706', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150' },
    { name: 'David', role: 'Tech', roleColor: '#2563eb', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150' },
    { name: 'Elena', role: 'Nightlife', roleColor: '#dc2626', avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150&h=150' },
    { name: 'Marcus', role: 'Active', roleColor: '#059669', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150&h=150' },
    { name: 'Amina', role: 'Literature', roleColor: '#7c3aed', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150' },
    { name: 'Liam', role: 'Music', roleColor: '#4f46e5', avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=150&h=150' },
    { name: 'Alex', role: 'Creative', roleColor: '#d97706', avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=150&h=150' },
  ];

  featured = {
    id: 2,
    category: 'Food & Wine • East Village',
    title: 'Natural Wine & High-Fidelity Vinyl Listening',
    description: "An intimate evening dedicated to low-intervention skin-contact wines and warm analog sound. We're spinning Japanese ambient, late-70s jazz fusion, and dub records through...",
    price: '$22',
    eventImage: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&q=80&w=1200&h=600'
  };

  filters = ['All Threads', 'This Weekend', 'Art & Design', 'Food & Wine', 'Active', 'Tech'];

  mockEvents: MockEventDetail[] = [
    {
      id: 1,
      month: 'AUG',
      day: '16',
      weekday: 'SUN',
      category: 'ART & DESIGN',
      isHot: true,
      title: 'Morning Coffee & Urban Sketching',
      description: "Join us for a slow Sunday morning. We'll grab pour-overs at The Roastery and spend an hour sketching the historic cobblestone facades and ironwork. No formal experience...",
      time: '09:00 AM',
      location: 'The Roastery, DUMBO',
      wovenCount: '5 woven',
      price: 'Free',
      isFree: true,
      hostName: 'Sarah Jenkins',
      hostAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=80&h=80',
      eventImage: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=400&h=300',
      attendees: [
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=40&h=40',
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=40&h=40',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=40&h=40'
      ]
    },
    {
      id: 2,
      month: 'AUG',
      day: '18',
      weekday: 'TUE',
      category: 'FOOD & WINE',
      isHot: true,
      title: 'Natural Wine & High-Fidelity Vinyl Listening',
      description: "An intimate evening dedicated to low-intervention skin-contact wines and warm analog sound. We're spinning Japanese ambient, late-70s jazz fusion, and dub records through...",
      time: '07:30 PM',
      location: 'Cellar Door, East Village',
      wovenCount: '5 woven',
      price: '$22',
      isFree: false,
      hostName: 'Elena Rossi',
      hostAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=80&h=80',
      eventImage: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&q=80&w=400&h=300',
      attendees: [
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=40&h=40',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=40&h=40',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=40&h=40'
      ]
    },
    {
      id: 3,
      month: 'AUG',
      day: '22',
      weekday: 'SAT',
      category: 'ACTIVE & OUTDOORS',
      isHot: false,
      title: 'Sunrise Bouldering & Fresh Pastries',
      description: "Beat the summer heat and the crowd. We'll hit the riverside boulders at dawn for crisp friction, followed by warm cardamom buns and espresso from Tartine across the park.",
      time: '06:15 AM',
      location: 'Riverside Park Boulders',
      wovenCount: '3 woven',
      price: 'Free',
      isFree: true,
      hostName: 'Marcus Johnson',
      hostAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=80&h=80',
      eventImage: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&q=80&w=400&h=300',
      attendees: [
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=40&h=40',
        'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=40&h=40'
      ]
    },
    {
      id: 4,
      month: 'AUG',
      day: '26',
      weekday: 'WED',
      category: 'INDIE TECH & CRAFT',
      isHot: false,
      title: 'Indie Hackers & Founders Co-Working',
      description: 'A structured, no-fluff afternoon for solo developers, designers, and creators building products. We do 2 focused 90-minute deep work blocks separated by warm product...',
      time: '01:30 PM',
      location: 'Nexus Workspace Atelier',
      wovenCount: '6 woven',
      price: 'Free',
      isFree: true,
      hostName: 'David Kim',
      hostAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=80&h=80',
      eventImage: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=400&h=300',
      attendees: [
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=40&h=40',
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=40&h=40',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=40&h=40'
      ]
    },
    {
      id: 5,
      month: 'AUG',
      day: '28',
      weekday: 'FRI',
      category: 'MIND & MOVEMENT',
      isHot: false,
      title: 'Underground Tea Ceremony & Ambient Soundscape',
      description: 'Step away from urban noise into a candlelit loft. We will brew wild ancient-tree Pu-erh and Taiwanese Oolongs accompanied by live generative synthesizer drone and singing...',
      time: '08:00 PM',
      location: 'Greenpoint Tea Loft',
      wovenCount: '4 woven',
      price: '$18',
      isFree: false,
      hostName: "Liam O'Connor",
      hostAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=80&h=80',
      eventImage: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&q=80&w=400&h=300',
      attendees: [
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=40&h=40',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=40&h=40'
      ]
    },
    {
      id: 6,
      month: 'AUG',
      day: '29',
      weekday: 'SAT',
      category: 'ART & DESIGN',
      isHot: true,
      title: 'Late Night Printmaking & Risograph Jam',
      description: 'An open studio session experimenting with two-drum Risograph printing, letterpress block printing, and custom zine assembly. All inks and cotton paper provided.',
      time: '06:30 PM',
      location: 'Press House Collective',
      wovenCount: '4 woven',
      price: '$15',
      isFree: false,
      hostName: 'Amina Al-Mansoor',
      hostAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=80&h=80',
      eventImage: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=400&h=300',
      attendees: [
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=40&h=40',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=40&h=40',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=40&h=40'
      ]
    }
  ];

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents(): void {
    this.isLoading = true;
    this.eventService.getEvents().subscribe({
      next: (data) => {
        this.events = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  get filteredEvents(): MockEventDetail[] {
    if (this.selectedFilter === 'All Threads') {
      return this.mockEvents;
    }
    if (this.selectedFilter === 'This Weekend') {
      // Return hot/featured events
      return this.mockEvents.filter(e => e.isHot);
    }
    return this.mockEvents.filter(e => e.category.toLowerCase().includes(this.selectedFilter.toLowerCase().split(' ')[0]));
  }

  selectFilter(filter: string): void {
    this.selectedFilter = filter;
  }

  getDatabaseEventId(mockId: number): number {
    // Dynamically map mock IDs to database IDs if they exist
    if (this.events.length > 0) {
      const dbIndex = (mockId - 1) % this.events.length;
      return this.events[dbIndex].id;
    }
    return mockId;
  }
}
