import { Component, inject } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { NgIf } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, NgIf],
  template: `
    <div class="landing-container">
      <!-- Ambient green glow in bottom-left -->
      <div class="ambient-glow"></div>

      <!-- Top Navigation Header -->
      <header class="landing-header">
        <div class="logo">
          <!-- Custom interlaced stitch loop SVG with circular terminals -->
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" class="logo-svg">
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
          <span class="logo-text">Knitted<span class="dot">.</span></span>
        </div>
        <div class="nav-actions">
          <a *ngIf="!authService.isLoggedIn()" routerLink="/login" class="btn-signin">Sign In</a>
          <a *ngIf="authService.isLoggedIn()" routerLink="/events" class="btn-signin">Dashboard</a>
        </div>
      </header>

      <!-- Hero Content -->
      <main class="hero-section">
        <div class="tag-badge">
          <i class="fa-solid fa-sparkles sparkle-icon"></i>
          <span>REAL-WORLD GATHERINGS & COMMUNITY</span>
        </div>

        <h1 class="hero-title">
          Weave your <br>
          <span class="gradient-text">community.</span>
        </h1>

        <p class="hero-subtitle">
          From intimate rooftop vinyl sessions to dawn bouldering runs. <br>
          Discover thoughtfully curated gatherings hosted by curious people.
        </p>

        <div class="cta-buttons">
          <button (click)="onGetStarted()" class="btn-get-started">
            Get Started <i class="fa-solid fa-arrow-right arrow"></i>
          </button>
          <a routerLink="/events" class="btn-browse">
            <i class="fa-regular fa-compass compass"></i> Browse without account
          </a>
        </div>
      </main>

      <!-- Footer Section -->
      <footer class="landing-footer">
        <div class="footer-left">
          <div class="avatar-stack">
            <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&fit=crop&q=80" alt="User 1" class="avatar">
            <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&fit=crop&q=80" alt="User 2" class="avatar">
            <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&fit=crop&q=80" alt="User 3" class="avatar">
          </div>
          <span class="members-count">3,400+ curious minds in NYC</span>
        </div>
        <div class="footer-right">
          <span>Zero algorithm slop</span>
          <span class="bullet">•</span>
          <span>Verified host circles</span>
          <span class="bullet">•</span>
          <span>Privacy first</span>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .landing-container {
      position: relative;
      min-height: 100vh;
      background-color: #121613; /* Exact dark charcoal/green background color */
      color: #ffffff;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }

    /* Soft radial green glow in bottom-left */
    .ambient-glow {
      position: absolute;
      bottom: -180px;
      left: -180px;
      width: 550px;
      height: 550px;
      background: radial-gradient(circle, rgba(0, 194, 133, 0.08) 0%, rgba(0,0,0,0) 70%);
      pointer-events: none;
      z-index: 1;
    }

    /* Header styling */
    .landing-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 28px 4%;
      z-index: 10;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
    }

    .logo-text {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 1.6rem;
      font-weight: 700;
      letter-spacing: -0.01em;
    }

    .logo-text .dot {
      color: #00c285;
    }

    .btn-signin {
      text-decoration: none;
      color: rgba(255, 255, 255, 0.9);
      font-size: 0.9rem;
      font-weight: 500;
      background-color: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      padding: 10px 22px;
      border-radius: 30px;
      transition: all 0.2s ease-in-out;
    }

    .btn-signin:hover {
      background-color: rgba(255, 255, 255, 0.07);
      border-color: rgba(255, 255, 255, 0.18);
    }

    /* Hero main styling */
    .hero-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 30px 24px;
      max-width: 850px;
      margin: 0 auto;
      z-index: 5;
    }

    .tag-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      background-color: rgba(0, 194, 133, 0.04);
      border: 1px solid rgba(0, 194, 133, 0.22);
      color: #00c285;
      padding: 7px 15px;
      border-radius: 30px;
      font-size: 0.72rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      margin-bottom: 36px;
    }

    .sparkle-icon {
      font-size: 0.85rem;
    }

    .hero-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 5.5rem; /* Larger and bold title */
      font-weight: 700;
      line-height: 1.12;
      letter-spacing: -0.02em;
      margin-bottom: 28px;
    }

    .hero-title .gradient-text {
      font-family: 'Playfair Display', Georgia, serif;
      font-style: italic;
      background: linear-gradient(135deg, #00c285 20%, #009e6a 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      font-weight: 700;
    }

    .hero-subtitle {
      font-size: 1.25rem;
      line-height: 1.65;
      color: rgba(255, 255, 255, 0.7);
      margin-bottom: 44px;
      font-weight: 400;
      max-width: 680px;
    }

    .cta-buttons {
      display: flex;
      align-items: center;
      gap: 18px;
    }

    @media (max-width: 600px) {
      .hero-title {
        font-size: 3.5rem;
      }
      .hero-subtitle {
        font-size: 1.1rem;
      }
      .cta-buttons {
        flex-direction: column;
        width: 100%;
        gap: 14px;
      }
      .btn-get-started, .btn-browse {
        width: 100%;
        justify-content: center;
      }
    }

    .btn-get-started {
      background-color: #00c285;
      color: #ffffff;
      border: none;
      padding: 15px 30px;
      border-radius: 30px;
      font-size: 0.95rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      transition: all 0.2s ease-in-out;
      box-shadow: 0 4px 18px rgba(0, 194, 133, 0.22);
    }

    .btn-get-started:hover {
      background-color: #00d693;
      transform: translateY(-1px);
      box-shadow: 0 6px 24px rgba(0, 194, 133, 0.38);
    }

    .btn-get-started .arrow {
      transition: transform 0.2s ease;
    }

    .btn-get-started:hover .arrow {
      transform: translateX(4px);
    }

    .btn-browse {
      text-decoration: none;
      color: rgba(255, 255, 255, 0.85);
      background-color: transparent;
      border: 1px solid rgba(255, 255, 255, 0.14);
      padding: 15px 30px;
      border-radius: 30px;
      font-size: 0.95rem;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s ease-in-out;
    }

    .btn-browse:hover {
      background-color: rgba(255, 255, 255, 0.04);
      border-color: rgba(255, 255, 255, 0.3);
      color: #ffffff;
    }

    /* Footer styling */
    .landing-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 36px 4%;
      border-top: 1px solid rgba(255, 255, 255, 0.03);
      z-index: 10;
    }

    @media (max-width: 768px) {
      .landing-footer {
        flex-direction: column;
        gap: 20px;
        text-align: center;
      }
    }

    .footer-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .avatar-stack {
      display: flex;
      align-items: center;
    }

    .avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 2px solid #121613;
      object-fit: cover;
      margin-right: -10px;
    }

    .members-count {
      font-size: 0.82rem;
      color: rgba(255, 255, 255, 0.42);
      font-weight: 500;
      margin-left: 12px;
    }

    .footer-right {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 0.82rem;
      color: rgba(255, 255, 255, 0.42);
    }

    .footer-right .bullet {
      color: rgba(255, 255, 255, 0.15);
    }
  `]
})
export class LandingComponent {
  authService = inject(AuthService);
  private router = inject(Router);

  onGetStarted(): void {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/events']);
    } else {
      this.router.navigate(['/register']);
    }
  }
}
