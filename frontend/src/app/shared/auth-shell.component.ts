import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LogoComponent } from './logo.component';

/** Split-screen frame shared by the log-in, sign-up and onboarding pages. */
@Component({
  selector: 'app-auth-shell',
  standalone: true,
  imports: [RouterLink, LogoComponent],
  template: `
    <div class="shell">
      <div class="panel">
        <a routerLink="/" class="brand" aria-label="Knitted home"><app-logo /></a>
        <div class="content">
          <h1>{{ heading }}</h1>
          @if (subheading) {
            <p class="sub">{{ subheading }}</p>
          }
          <ng-content />
        </div>
        <p class="legal">© Knitted · <a routerLink="/events">Browse events</a></p>
      </div>
      <div class="art" aria-hidden="true">
        <div class="quote">
          <p>“I moved to the city knowing nobody. Three supper clubs later, I have a group chat that won’t stop buzzing.”</p>
          <span>— What we want every guest to say</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .shell {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      min-height: 100vh;
    }
    .panel {
      display: flex;
      flex-direction: column;
      padding: 32px 48px;
    }
    .brand {
      align-self: flex-start;
    }
    .content {
      width: 100%;
      max-width: 420px;
      margin: auto;
      padding: 48px 0;
    }
    h1 {
      font-size: 2rem;
      font-weight: 800;
    }
    .sub {
      margin-top: 8px;
      margin-bottom: 28px;
      color: var(--muted);
    }
    .legal {
      font-size: 0.82rem;
      color: var(--muted);
    }
    .legal a {
      text-decoration: underline;
    }
    .art {
      position: relative;
      display: flex;
      align-items: flex-end;
      padding: 48px;
      background:
        linear-gradient(to top, rgba(5, 40, 28, 0.85), rgba(5, 40, 28, 0.1) 60%),
        url('https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=1400') center / cover;
    }
    .quote {
      max-width: 460px;
      color: #fff;
    }
    .quote p {
      font-family: var(--font-display);
      font-size: 1.5rem;
      font-weight: 700;
      line-height: 1.35;
    }
    .quote span {
      display: block;
      margin-top: 12px;
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.7);
    }
    @media (max-width: 900px) {
      .shell {
        grid-template-columns: 1fr;
      }
      .art {
        display: none;
      }
      .panel {
        padding: 24px 20px;
      }
    }
  `],
})
export class AuthShellComponent {
  @Input({ required: true }) heading!: string;
  @Input() subheading = '';
}
