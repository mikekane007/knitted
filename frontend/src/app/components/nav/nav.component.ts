import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NgIf, CommonModule } from '@angular/common';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgIf, CommonModule],
  template: `
    <nav class="navbar">
      <div class="nav-container">
        <!-- Logo and Location -->
        <div class="brand-section">
          <a routerLink="/" class="brand">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" class="brand-svg">
              <path d="M12 16C12 14.5 20 14.5 20 16C20 17.5 12 17.5 12 16Z" fill="#00c285" />
              <path d="M16 16C13 16 10 20 8 23" stroke="#00c285" stroke-width="3.2" stroke-linecap="round"/>
              <path d="M16 16C19 16 22 20 24 23" stroke="#00c285" stroke-width="3.2" stroke-linecap="round"/>
              <path d="M16 16C13 16 10 12 8 9" stroke="#00c285" stroke-width="3.2" stroke-linecap="round"/>
              <path d="M16 16C19 16 22 12 24 9" stroke="#00c285" stroke-width="3.2" stroke-linecap="round"/>
              <circle cx="8" cy="9" r="2.8" fill="#00c285" />
              <circle cx="24" cy="9" r="2.8" fill="#00c285" />
              <circle cx="8" cy="23" r="2.8" fill="#00c285" />
              <circle cx="24" cy="23" r="2.8" fill="#00c285" />
            </svg>
            <span class="brand-text">Knitted<span class="dot">.</span></span>
          </a>

          <div class="location-pill">
            <i class="fa-solid fa-location-dot location-icon"></i>
            <span>{{ userCity }}</span>
          </div>
        </div>

        <!-- Search and Action Buttons -->
        <div class="action-section">
          <!-- Search box -->
          <div class="search-box">
            <i class="fa-solid fa-magnifying-glass search-icon"></i>
            <input type="text" placeholder="Find gatherings..." class="search-input" />
          </div>

          <!-- + Host button -->
          <button class="btn-host" routerLink="/events">
            <i class="fa-solid fa-plus"></i> Host
          </button>

          <!-- User profile or login/register links -->
          <div class="auth-box">
            <ng-container *ngIf="isLoggedIn; else loginButtons">
              <div class="user-profile-menu" (click)="toggleDropdown()">
                <img [src]="avatarUrl" alt="Avatar" class="avatar-img" />
                
                <div class="dropdown-menu" *ngIf="showDropdown">
                  <div class="dropdown-header">{{ userEmail }}</div>
                  <a routerLink="/my-bookings" class="dropdown-item">My Bookings</a>
                  <button (click)="logout()" class="dropdown-item logout-btn">Logout</button>
                </div>
              </div>
            </ng-container>
            
            <ng-template #loginButtons>
              <a routerLink="/login" class="btn-login-light">Login</a>
              <a routerLink="/register" class="btn-register-light">Register</a>
            </ng-template>
          </div>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      background: #ffffff;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
      position: sticky;
      top: 0;
      z-index: 100;
      padding: 12px 0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    .nav-container {
      max-width: 1600px;
      margin: 0 auto;
      padding: 0 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .brand-section {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
    }

    .brand-svg {
      flex-shrink: 0;
    }

    .brand-text {
      font-family: 'Playfair Display', Georgia, serif;
      font-weight: 700;
      font-size: 1.55rem;
      color: #1c1917;
      letter-spacing: -0.01em;
    }

    .brand-text .dot {
      color: #00c285;
    }

    .location-pill {
      display: flex;
      align-items: center;
      gap: 6px;
      background-color: #f5f6f5;
      border: 1px solid rgba(0, 0, 0, 0.04);
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
      color: rgba(0, 0, 0, 0.65);
    }

    .location-icon {
      color: #00c285;
      font-size: 0.85rem;
    }

    .action-section {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .search-box {
      display: flex;
      align-items: center;
      background-color: #f5f6f5;
      padding: 8px 16px;
      border-radius: 20px;
      width: 240px;
      gap: 10px;
    }

    .search-icon {
      color: rgba(0, 0, 0, 0.38);
      font-size: 0.9rem;
    }

    .search-input {
      border: none;
      background: transparent;
      outline: none;
      font-size: 0.85rem;
      color: #1c1917;
      width: 100%;
    }

    .search-input::placeholder {
      color: rgba(0, 0, 0, 0.38);
    }

    .btn-host {
      background-color: #0d633b;
      color: #ffffff;
      border: none;
      padding: 8px 20px;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s ease;
    }

    .btn-host:hover {
      background-color: #09472a;
    }

    .auth-box {
      position: relative;
      display: flex;
      align-items: center;
    }

    .user-profile-menu {
      cursor: pointer;
      position: relative;
    }

    .avatar-img {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      object-fit: cover;
      border: 1.5px solid rgba(0, 0, 0, 0.08);
      transition: border-color 0.2s ease;
    }

    .avatar-img:hover {
      border-color: #00c285;
    }

    .dropdown-menu {
      position: absolute;
      top: 44px;
      right: 0;
      background: #ffffff;
      border: 1px solid rgba(0, 0, 0, 0.08);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
      border-radius: 12px;
      width: 200px;
      padding: 8px 0;
      display: flex;
      flex-direction: column;
      z-index: 100;
    }

    .dropdown-header {
      padding: 8px 16px;
      font-size: 0.78rem;
      font-weight: 600;
      color: rgba(0, 0, 0, 0.45);
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
      margin-bottom: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .dropdown-item {
      padding: 10px 16px;
      font-size: 0.88rem;
      color: #1c1917;
      text-decoration: none;
      background: transparent;
      border: none;
      text-align: left;
      cursor: pointer;
      transition: background 0.15s ease;
    }

    .dropdown-item:hover {
      background: rgba(0, 0, 0, 0.03);
    }

    .logout-btn {
      color: #ef4444;
      border-top: 1px solid rgba(0, 0, 0, 0.05);
      margin-top: 4px;
    }

    .btn-login-light {
      color: rgba(0, 0, 0, 0.65);
      text-decoration: none;
      font-size: 0.85rem;
      font-weight: 600;
      padding: 8px 16px;
      transition: color 0.2s ease;
    }

    .btn-login-light:hover {
      color: #00c285;
    }

    .btn-register-light {
      background-color: #f5f6f5;
      color: #1c1917;
      border: 1px solid rgba(0, 0, 0, 0.06);
      text-decoration: none;
      padding: 8px 20px;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
      transition: all 0.2s ease;
    }

    .btn-register-light:hover {
      background-color: rgba(0, 0, 0, 0.02);
      border-color: rgba(0, 0, 0, 0.12);
    }
  `]
})
export class NavComponent {
  authService = inject(AuthService);
  private router = inject(Router);

  showDropdown = false;

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  get userEmail(): string {
    return this.authService.getUserEmail() || 'Guest';
  }

  get userCity(): string {
    try {
      const profileStr = localStorage.getItem('knitted_user_profile');
      if (profileStr) {
        const profile = JSON.parse(profileStr);
        return profile.city || 'New York City';
      }
    } catch {}
    return 'New York City';
  }

  get avatarUrl(): string {
    return 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=80&h=80';
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
  }

  logout(): void {
    this.authService.logout();
    this.showDropdown = false;
    this.router.navigate(['/events']);
  }
}
