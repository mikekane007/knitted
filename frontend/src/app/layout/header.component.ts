import { Component, DestroyRef, ElementRef, HostListener, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { LogoComponent } from '../shared/logo.component';
import { initials } from '../shared/event-utils';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LogoComponent],
  template: `
    <header class="site-header">
      <div class="container bar">
        <a routerLink="/" class="brand" aria-label="Knitted home">
          <app-logo />
        </a>

        <nav class="primary-nav" aria-label="Main">
          <a routerLink="/events" routerLinkActive="active">Explore events</a>
          <a routerLink="/categories" routerLinkActive="active">Categories</a>
          @if (auth.isLoggedIn()) {
            <a routerLink="/tickets" routerLinkActive="active">My tickets</a>
          }
        </nav>

        <div class="actions">
          <a routerLink="/host" class="btn btn-ghost btn-sm host-link">
            <i class="fa-solid fa-plus" aria-hidden="true"></i> Host an event
          </a>

          @if (auth.isLoggedIn()) {
            <div class="account">
              <button type="button" class="avatar-button" (click)="toggleMenu()" [attr.aria-expanded]="menuOpen()" aria-haspopup="menu" aria-label="Account menu">
                @if (auth.profile()?.avatarUrl) {
                  <img [src]="auth.profile()?.avatarUrl" alt="" class="avatar" width="36" height="36" />
                } @else {
                  <span class="avatar-initials" style="width:36px;height:36px;font-size:0.85rem">{{ userInitials }}</span>
                }
                <i class="fa-solid fa-chevron-down caret" aria-hidden="true"></i>
              </button>

              @if (menuOpen()) {
                <div class="menu" role="menu">
                  <div class="menu-header">
                    <strong>{{ auth.profile()?.name || 'Your account' }}</strong>
                    <span>{{ auth.getUserEmail() }}</span>
                  </div>
                  <a routerLink="/tickets" role="menuitem"><i class="fa-solid fa-ticket" aria-hidden="true"></i> My tickets</a>
                  <a routerLink="/profile" role="menuitem"><i class="fa-regular fa-user" aria-hidden="true"></i> Profile & hosting</a>
                  <a routerLink="/host" role="menuitem"><i class="fa-solid fa-plus" aria-hidden="true"></i> Host an event</a>
                  <button type="button" role="menuitem" (click)="logout()"><i class="fa-solid fa-arrow-right-from-bracket" aria-hidden="true"></i> Sign out</button>
                </div>
              }
            </div>
          } @else {
            <a routerLink="/login" class="btn btn-ghost btn-sm auth-link">Log in</a>
            <a routerLink="/register" class="btn btn-primary btn-sm auth-link">Sign up</a>
          }

          <button type="button" class="icon-btn menu-toggle" (click)="mobileOpen.set(!mobileOpen())" [attr.aria-expanded]="mobileOpen()" aria-label="Open menu">
            <i class="fa-solid" [class.fa-bars]="!mobileOpen()" [class.fa-xmark]="mobileOpen()" aria-hidden="true"></i>
          </button>
        </div>
      </div>

      @if (mobileOpen()) {
        <nav class="mobile-nav container" aria-label="Mobile">
          <a routerLink="/events">Explore events</a>
          <a routerLink="/categories">Categories</a>
          <a routerLink="/host">Host an event</a>
          @if (auth.isLoggedIn()) {
            <a routerLink="/tickets">My tickets</a>
            <a routerLink="/profile">Profile & hosting</a>
            <button type="button" (click)="logout()">Sign out</button>
          } @else {
            <div class="mobile-auth">
              <a routerLink="/login" class="btn btn-secondary">Log in</a>
              <a routerLink="/register" class="btn btn-primary">Sign up</a>
            </div>
          }
        </nav>
      }
    </header>
  `,
  styles: [`
    .site-header {
      position: sticky;
      top: 0;
      z-index: 100;
      background: rgba(255, 255, 255, 0.92);
      backdrop-filter: saturate(180%) blur(12px);
      border-bottom: 1px solid var(--line);
    }
    .bar {
      display: flex;
      align-items: center;
      gap: 32px;
      height: var(--header-height);
    }
    .brand {
      display: flex;
      flex-shrink: 0;
    }
    .primary-nav {
      display: flex;
      align-items: center;
      gap: 4px;
      flex: 1;
    }
    .primary-nav a {
      padding: 8px 12px;
      border-radius: var(--radius-sm);
      font-size: 0.92rem;
      font-weight: 500;
      color: var(--ink-2);
      transition: background-color 0.15s var(--ease), color 0.15s var(--ease);
    }
    .primary-nav a:hover {
      background: var(--surface-3);
      color: var(--ink);
    }
    .primary-nav a.active {
      color: var(--brand-strong);
      background: var(--brand-soft);
    }
    .actions {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-left: auto;
    }
    .account {
      position: relative;
    }
    .avatar-button {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 3px 8px 3px 3px;
      border: 1px solid var(--line);
      border-radius: 999px;
      transition: box-shadow 0.15s var(--ease);
    }
    .avatar-button:hover {
      box-shadow: var(--shadow);
    }
    .caret {
      font-size: 0.7rem;
      color: var(--muted);
    }
    .menu {
      position: absolute;
      right: 0;
      top: calc(100% + 8px);
      width: 240px;
      padding: 6px;
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: var(--radius);
      box-shadow: var(--shadow-lg);
      animation: fadeIn 0.15s var(--ease) both;
    }
    .menu-header {
      display: flex;
      flex-direction: column;
      padding: 10px 12px 12px;
      border-bottom: 1px solid var(--line);
      margin-bottom: 6px;
      min-width: 0;
    }
    .menu-header strong {
      font-size: 0.92rem;
    }
    .menu-header span {
      font-size: 0.8rem;
      color: var(--muted);
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .menu a,
    .menu button {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 10px 12px;
      border-radius: var(--radius-sm);
      font-size: 0.9rem;
      color: var(--ink-2);
      text-align: left;
    }
    .menu a:hover,
    .menu button:hover {
      background: var(--surface-3);
      color: var(--ink);
    }
    .menu i {
      width: 16px;
      color: var(--muted);
    }
    .menu-toggle {
      display: none;
    }
    .mobile-nav {
      display: none;
    }
    @media (max-width: 900px) {
      .primary-nav,
      .host-link,
      .auth-link {
        display: none;
      }
      .menu-toggle {
        display: inline-flex;
      }
      .mobile-nav {
        display: flex;
        flex-direction: column;
        padding-top: 8px;
        padding-bottom: 16px;
        border-top: 1px solid var(--line);
      }
      .mobile-nav > a,
      .mobile-nav > button {
        padding: 12px 4px;
        font-weight: 500;
        text-align: left;
        border-bottom: 1px solid var(--surface-3);
      }
      .mobile-auth {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        padding-top: 14px;
      }
    }
  `],
})
export class HeaderComponent implements OnInit {
  readonly auth = inject(AuthService);
  readonly menuOpen = signal(false);
  readonly mobileOpen = signal(false);

  private router = inject(Router);
  private host = inject(ElementRef<HTMLElement>);
  private destroyRef = inject(DestroyRef);

  get userInitials(): string {
    return initials(this.auth.profile()?.name, this.auth.getUserEmail() ?? '?');
  }

  ngOnInit(): void {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.menuOpen.set(false);
        this.mobileOpen.set(false);
        if (this.auth.isLoggedIn() && !this.auth.profile()) {
          this.auth.ensureProfile().subscribe({ error: () => undefined });
        }
      });
  }

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/']);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.menuOpen() && !this.host.nativeElement.querySelector('.account')?.contains(event.target as Node)) {
      this.menuOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.menuOpen.set(false);
    this.mobileOpen.set(false);
  }
}
