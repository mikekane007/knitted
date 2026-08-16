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
      <!-- Ambient Glow Effect -->
      <div class="ambient-glow"></div>

      <!-- Top Navigation Header -->
      <header class="landing-header">
        <div class="logo">
          <!-- Stylized Knitting Loops Loop SVG Logo -->
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" class="logo-svg">
            <path d="M6 18c0-4.5 3-6 6-6s6-1.5 6-6M18 18c0-4.5-3-6-6-6s-6-1.5-6-6" />
          </svg>
          <span class="logo-text">Knitted<span class="dot">.</span></span>
        </div>
        <div class="nav-actions">
          <a *ngIf="!authService.isLoggedIn()" routerLink="/login" class="btn-signin">Sign In</a>
          <a *ngIf="authService.isLoggedIn()" routerLink="/events" class="btn-signin">Dashboard</a>
        </div>
      </header>

      <!-- Hero Section -->
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
            <i class="fa-solid fa-compass compass"></i> Browse without account
          </a>
        </div>
      </main>

      <!-- Footer Section -->
      <footer class="landing-footer">
        <div class="footer-left">
          <div class="avatar-stack">
            <div class="avatar av-1">MK</div>
            <div class="avatar av-2">JD</div>
            <div class="avatar av-3">AL</div>
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
      background-color: #0b0e0c;
      color: #ffffff;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
      font-family: 'Inter', sans-serif;
    }

    /* Ambient green glow in bottom-left */
    .ambient-glow {
      position: absolute;
      bottom: -150px;
      left: -150px;
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, rgba(0,0,0,0) 70%);
      pointer-events: none;
      z-index: 1;
    }

    /* Header styling */
    .landing-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px 5%;
      z-index: 10;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .logo-svg {
      color: #10b981;
    }

    .logo-text {
      font-family: 'Outfit', sans-serif;
      font-size: 1.4rem;
      font-weight: 700;
      letter-spacing: -0.02em;
    }

    .logo-text .dot {
      color: #10b981;
    }

    .btn-signin {
      text-decoration: none;
      color: #ffffff;
      font-size: 0.9rem;
      font-weight: 500;
      background-color: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      padding: 10px 20px;
      border-radius: 30px;
      transition: all 0.25s ease;
    }

    .btn-signin:hover {
      background-color: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.2);
    }

    /* Hero main styling */
    .hero-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 40px 20px;
      max-width: 800px;
      margin: 0 auto;
      z-index: 5;
    }

    .tag-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      background-color: rgba(16, 185, 129, 0.06);
      border: 1px solid rgba(16, 185, 129, 0.25);
      color: #10b981;
      padding: 6px 14px;
      border-radius: 30px;
      font-size: 0.72rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      margin-bottom: 32px;
    }

    .sparkle-icon {
      font-size: 0.8rem;
    }

    .hero-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 5rem;
      font-weight: 400;
      line-height: 1.1;
      letter-spacing: -0.01em;
      margin-bottom: 24px;
    }

    .hero-title .gradient-text {
      font-family: 'Playfair Display', Georgia, serif;
      font-style: italic;
      background: linear-gradient(135deg, #10b981 30%, #059669 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      font-weight: 400;
    }

    .hero-subtitle {
      font-size: 1.15rem;
      line-height: 1.6;
      color: rgba(255, 255, 255, 0.65);
      margin-bottom: 40px;
      font-weight: 300;
    }

    .cta-buttons {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    @media (max-width: 600px) {
      .hero-title {
        font-size: 3.5rem;
      }
      .cta-buttons {
        flex-direction: column;
        width: 100%;
        gap: 12px;
      }
      .btn-get-started, .btn-browse {
        width: 100%;
        justify-content: center;
      }
    }

    .btn-get-started {
      background-color: #059669;
      color: #ffffff;
      border: none;
      padding: 14px 28px;
      border-radius: 30px;
      font-size: 0.95rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      transition: all 0.25s ease;
      box-shadow: 0 4px 20px rgba(5, 150, 105, 0.2);
    }

    .btn-get-started:hover {
      background-color: #10b981;
      transform: translateY(-1px);
      box-shadow: 0 6px 24px rgba(16, 185, 129, 0.35);
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
      border: 1px solid rgba(255, 255, 255, 0.15);
      padding: 14px 28px;
      border-radius: 30px;
      font-size: 0.95rem;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.25s ease;
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
      padding: 32px 5%;
      border-top: 1px solid rgba(255, 255, 255, 0.04);
      z-index: 10;
    }

    @media (max-width: 768px) {
      .landing-footer {
        flex-direction: column;
        gap: 16px;
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
      width: 30px;
      height: 30px;
      border-radius: 50%;
      border: 2px solid #0b0e0c;
      font-size: 0.7rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: -10px;
      color: #ffffff;
    }

    .av-1 {
      background: linear-gradient(135deg, #10b981, #059669);
    }

    .av-2 {
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    }

    .av-3 {
      background: linear-gradient(135deg, #8b5cf6, #6d28d9);
    }

    .members-count {
      font-size: 0.82rem;
      color: rgba(255, 255, 255, 0.5);
      font-weight: 500;
      margin-left: 12px;
    }

    .footer-right {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 0.82rem;
      color: rgba(255, 255, 255, 0.5);
    }

    .footer-right .bullet {
      color: rgba(255, 255, 255, 0.2);
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
