import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgIf],
  template: `
    <nav class="navbar">
      <div class="nav-container">
        <a routerLink="/" class="brand">
          <i class="fa-solid fa-yarn brand-icon"></i>
          <span class="brand-text">Knitted</span>
        </a>

        <div class="nav-links">
          <a routerLink="/events" routerLinkActive="active" class="nav-link">
            <i class="fa-solid fa-calendar-days icon-margin"></i>Events
          </a>
          <a *ngIf="authService.isLoggedIn()" routerLink="/my-bookings" routerLinkActive="active" class="nav-link">
            <i class="fa-solid fa-ticket icon-margin"></i>My Bookings
          </a>
        </div>

        <div class="auth-buttons">
          <ng-container *ngIf="!authService.isLoggedIn(); else loggedIn">
            <a routerLink="/login" class="btn-login">Login</a>
            <a routerLink="/register" class="btn-register">Register</a>
          </ng-container>
          <ng-template #loggedIn>
            <span class="user-email">
              <i class="fa-solid fa-user-circle"></i>
              {{ authService.getUserEmail() }}
            </span>
            <button (click)="logout()" class="btn-logout">
              <i class="fa-solid fa-sign-out-alt"></i>
            </button>
          </ng-template>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      background: rgba(11, 15, 23, 0.8);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      position: sticky;
      top: 0;
      z-index: 100;
      padding: 16px 0;
    }

    .nav-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      color: #fff;
    }

    .brand-icon {
      font-size: 1.8rem;
      background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      filter: drop-shadow(0 2px 8px rgba(139, 92, 246, 0.4));
    }

    .brand-text {
      font-family: var(--font-title);
      font-weight: 800;
      font-size: 1.5rem;
      letter-spacing: -0.02em;
    }

    .nav-links {
      display: flex;
      gap: 24px;
    }

    .nav-link {
      text-decoration: none;
      color: var(--text-secondary);
      font-family: var(--font-title);
      font-weight: 500;
      font-size: 0.95rem;
      transition: var(--transition-smooth);
      display: flex;
      align-items: center;
    }

    .icon-margin {
      margin-right: 8px;
    }

    .nav-link:hover, .nav-link.active {
      color: var(--text-primary);
      text-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
    }

    .nav-link.active {
      color: var(--color-primary);
    }

    .auth-buttons {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .btn-login {
      color: var(--text-primary);
      text-decoration: none;
      font-family: var(--font-title);
      font-weight: 600;
      font-size: 0.95rem;
      transition: var(--transition-smooth);
      padding: 8px 16px;
    }

    .btn-login:hover {
      color: var(--color-primary);
    }

    .btn-register {
      background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
      color: #fff;
      text-decoration: none;
      padding: 8px 20px;
      border-radius: 8px;
      font-family: var(--font-title);
      font-weight: 600;
      font-size: 0.95rem;
      box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);
      transition: var(--transition-smooth);
    }

    .btn-register:hover {
      transform: scale(1.02);
      box-shadow: 0 6px 20px rgba(139, 92, 246, 0.5);
    }

    .user-email {
      color: var(--text-secondary);
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 14px;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 20px;
      border: 1px solid var(--border-light);
    }

    .btn-logout {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 1.15rem;
      transition: var(--transition-smooth);
      padding: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
    }

    .btn-logout:hover {
      color: var(--color-danger);
      background: rgba(239, 68, 68, 0.1);
    }
  `]
})
export class NavComponent {
  authService = inject(AuthService);
  private router = inject(Router);

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/events']);
  }
}
