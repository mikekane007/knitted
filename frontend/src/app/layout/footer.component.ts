import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LogoComponent } from '../shared/logo.component';
import { EVENT_CATEGORIES } from '../shared/event-utils';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, LogoComponent],
  template: `
    <footer class="site-footer">
      <div class="container grid">
        <div class="about">
          <app-logo [light]="true" />
          <p>Discover workshops, supper clubs and meetups hosted by people in your city — and book your spot in seconds.</p>
        </div>
        <div>
          <h4>Discover</h4>
          <a routerLink="/events">All events</a>
          <a routerLink="/events" [queryParams]="{ price: 'Free' }">Free events</a>
          @for (category of categories; track category) {
            <a routerLink="/events" [queryParams]="{ category }">{{ category }}</a>
          }
        </div>
        <div>
          <h4>Host</h4>
          <a routerLink="/host">Create an event</a>
          <a routerLink="/profile">Your hosted events</a>
        </div>
        <div>
          <h4>Account</h4>
          <a routerLink="/tickets">My tickets</a>
          <a routerLink="/profile">Profile</a>
          <a routerLink="/login">Log in</a>
        </div>
      </div>
      <div class="container legal">
        <span>© {{ year }} Knitted. All rights reserved.</span>
        <span>Made for real-world communities.</span>
      </div>
    </footer>
  `,
  styles: [`
    .site-footer {
      background: var(--ink);
      color: rgba(255, 255, 255, 0.7);
      padding: 56px 0 28px;
      margin-top: auto;
    }
    .grid {
      display: grid;
      grid-template-columns: 2fr repeat(3, 1fr);
      gap: 40px;
    }
    .about p {
      margin-top: 14px;
      max-width: 340px;
      font-size: 0.92rem;
    }
    h4 {
      color: #fff;
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 14px;
    }
    .grid a {
      display: block;
      padding: 4px 0;
      font-size: 0.92rem;
      transition: color 0.15s var(--ease);
    }
    .grid a:hover {
      color: #fff;
    }
    .legal {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
      margin-top: 44px;
      padding-top: 22px;
      border-top: 1px solid rgba(255, 255, 255, 0.12);
      font-size: 0.82rem;
      color: rgba(255, 255, 255, 0.5);
    }
    @media (max-width: 800px) {
      .grid {
        grid-template-columns: 1fr 1fr;
      }
      .about {
        grid-column: 1 / -1;
      }
    }
  `],
})
export class FooterComponent {
  readonly categories = EVENT_CATEGORIES;
  readonly year = new Date().getFullYear();
}
