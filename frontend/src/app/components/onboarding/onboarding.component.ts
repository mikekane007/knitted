import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIf, NgFor, CommonModule } from '@angular/common';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="onboarding-page-container">
      <!-- Header Area (Logo and Steps indicator) -->
      <header class="onboarding-header">
        <div class="logo">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" class="logo-svg">
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
        <div class="steps-indicator" *ngIf="currentStep > 1">
          STEP {{ currentStep }} OF 3
        </div>
      </header>

      <!-- Step 1: Welcome Splash -->
      <div class="step-container step-1-container" *ngIf="currentStep === 1">
        <div class="logo-box">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
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
        </div>
        <span class="welcome-badge">WELCOME TO KNITTED</span>
        
        <h1 class="onboarding-title">Weave real human connection.</h1>
        <p class="onboarding-subtitle">
          A home for self-organized gatherings, intimate circles, and real-world experiences without the noise.
        </p>

        <button class="btn-black-pill" (click)="nextStep()">
          Choose Your Threads <i class="fa-solid fa-arrow-right arrow-icon"></i>
        </button>

        <footer class="step-footer">
          Step 1 of 3 • Designed for authentic offline gatherings
        </footer>
      </div>

      <!-- Step 2: What threads pull you in? -->
      <div class="step-container step-2-container" *ngIf="currentStep === 2">
        <h1 class="onboarding-title-left">What threads pull you in?</h1>
        <p class="onboarding-subtitle-left">
          Select at least 2 interests to weave your personalized discovery radar.
        </p>

        <div class="interests-grid">
          <div 
            *ngFor="let item of interests" 
            class="interest-card" 
            [class.selected]="item.selected" 
            (click)="toggleInterest(item)"
          >
            <div class="interest-icon">{{ item.icon }}</div>
            <div class="interest-info">
              <div class="interest-title">{{ item.title }}</div>
              <div class="interest-desc">{{ item.desc }}</div>
            </div>
            <div class="checkbox-circle" *ngIf="item.selected">
              <i class="fa-solid fa-check"></i>
            </div>
          </div>
        </div>

        <div class="action-row">
          <button class="btn-back" (click)="prevStep()">Back</button>
          <button 
            class="btn-black-pill-full" 
            [disabled]="selectedCount < 2" 
            (click)="nextStep()"
          >
            Continue ({{ selectedCount }} selected) <i class="fa-solid fa-arrow-right arrow-icon"></i>
          </button>
        </div>
      </div>

      <!-- Step 3: Introduce yourself to hosts -->
      <div class="step-container step-3-container" *ngIf="currentStep === 3">
        <h1 class="onboarding-title-left">Introduce yourself to hosts</h1>
        <p class="onboarding-subtitle-left">
          Knitted gatherings are intimate and friendly. Let others know who's pulling up a chair.
        </p>

        <!-- Profile Sync Box -->
        <div class="profile-sync-box">
          <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150" alt="Avatar" class="avatar-img" />
          <div class="profile-text">
            <div class="profile-name">{{ fullName || 'Alex Rivera' }}</div>
            <div class="profile-location">{{ city || 'New York, NY' }}</div>
            <div class="sync-status"><i class="fa-solid fa-circle-check"></i> Avatar synced</div>
          </div>
        </div>

        <!-- Form fields -->
        <div class="form-group">
          <label class="form-label">FULL NAME</label>
          <input type="text" [(ngModel)]="fullName" placeholder="Alex Rivera" class="onboarding-input" />
        </div>

        <div class="form-group">
          <label class="form-label">CITY / NEIGHBORHOOD</label>
          <input type="text" [(ngModel)]="city" placeholder="New York, NY" class="onboarding-input" />
        </div>

        <div class="form-group">
          <label class="form-label">ONE-SENTENCE BIO</label>
          <input type="text" [(ngModel)]="bio" placeholder="Architecture enthusiast, sourdough experimenter, vinyl collector." class="onboarding-input" />
        </div>

        <div class="action-row">
          <button class="btn-back" (click)="prevStep()">Back</button>
          <button class="btn-green-pill" (click)="completeOnboarding()">
            <i class="fa-solid fa-wand-magic-sparkles sparkle-icon"></i> Complete Setup & Explore Events
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .onboarding-page-container {
      background-color: #f5f6f5; /* Light grey background */
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 32px 24px;
      box-sizing: border-box;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    /* Header styling */
    .onboarding-header {
      width: 100%;
      max-width: 820px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 60px;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .logo-text {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 1.45rem;
      font-weight: 700;
      color: #1c1917;
      letter-spacing: -0.01em;
    }

    .logo-text .dot {
      color: #00c285;
    }

    .steps-indicator {
      font-size: 0.72rem;
      font-weight: 700;
      color: rgba(0, 0, 0, 0.42);
      letter-spacing: 0.08em;
    }

    /* Container layouts */
    .step-container {
      width: 100%;
      max-width: 600px;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
    }

    .step-1-container {
      align-items: center;
      text-align: center;
      max-width: 580px;
      margin-top: 40px;
    }

    /* Center Badge & Icons for Step 1 */
    .logo-box {
      width: 64px;
      height: 64px;
      background-color: #e6f9f3;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 24px;
      box-shadow: 0 4px 12px rgba(0, 194, 133, 0.04);
    }

    .welcome-badge {
      background-color: #e6f9f3;
      color: #00c285;
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      padding: 6px 14px;
      border-radius: 20px;
      border: 1px solid rgba(0, 194, 133, 0.15);
      margin-bottom: 28px;
    }

    /* Typography */
    .onboarding-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 2.8rem;
      font-weight: 700;
      color: #1c1917;
      line-height: 1.15;
      margin-bottom: 16px;
      letter-spacing: -0.01em;
    }

    .onboarding-subtitle {
      font-size: 1.05rem;
      color: rgba(0, 0, 0, 0.52);
      line-height: 1.5;
      margin-bottom: 40px;
      max-width: 520px;
    }

    .onboarding-title-left {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 2.4rem;
      font-weight: 700;
      color: #1c1917;
      line-height: 1.2;
      margin-bottom: 12px;
      letter-spacing: -0.01em;
    }

    .onboarding-subtitle-left {
      font-size: 0.95rem;
      color: rgba(0, 0, 0, 0.52);
      line-height: 1.45;
      margin-bottom: 36px;
    }

    /* Step 2 Interest Grid styling */
    .step-2-container {
      max-width: 820px;
    }

    .interests-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-bottom: 40px;
    }

    .interest-card {
      background-color: #ffffff;
      border: 1.5px solid rgba(0, 0, 0, 0.05);
      border-radius: 14px;
      padding: 18px;
      display: flex;
      align-items: center;
      gap: 14px;
      cursor: pointer;
      position: relative;
      transition: all 0.25s ease;
    }

    .interest-card:hover {
      border-color: rgba(0, 0, 0, 0.12);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
    }

    .interest-card.selected {
      border-color: #00c285;
      background-color: rgba(0, 194, 133, 0.03);
    }

    .interest-icon {
      font-size: 1.6rem;
      flex-shrink: 0;
    }

    .interest-info {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .interest-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: #1c1917;
    }

    .interest-desc {
      font-size: 0.78rem;
      color: rgba(0, 0, 0, 0.45);
      line-height: 1.35;
    }

    .checkbox-circle {
      position: absolute;
      top: 18px;
      right: 18px;
      width: 18px;
      height: 18px;
      background-color: #00c285;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-size: 0.65rem;
    }

    /* Buttons & Actions */
    .btn-black-pill {
      background-color: #1c1917;
      color: #ffffff;
      border: none;
      padding: 14px 28px;
      border-radius: 30px;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
      transition: all 0.2s ease;
    }

    .btn-black-pill:hover {
      background-color: #2d2926;
      transform: translateY(-1px);
    }

    .btn-black-pill-full {
      background-color: #1c1917;
      color: #ffffff;
      border: none;
      padding: 14px 28px;
      border-radius: 30px;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.2s ease;
      flex: 1;
    }

    .btn-black-pill-full:hover:not(:disabled) {
      background-color: #2d2926;
    }

    .btn-black-pill-full:disabled {
      background-color: rgba(0, 0, 0, 0.05);
      color: rgba(0, 0, 0, 0.25);
      cursor: not-allowed;
    }

    .btn-green-pill {
      background-color: #0d633b; /* Premium Forest/Mint Green */
      color: #ffffff;
      border: none;
      padding: 14px 28px;
      border-radius: 30px;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.2s ease;
      flex: 1;
    }

    .btn-green-pill:hover {
      background-color: #09472a;
    }

    .btn-back {
      background-color: #ffffff;
      border: 1px solid rgba(0, 0, 0, 0.1);
      color: #1c1917;
      padding: 14px 24px;
      border-radius: 30px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-back:hover {
      background-color: rgba(0, 0, 0, 0.02);
      border-color: rgba(0, 0, 0, 0.18);
    }

    .action-row {
      display: flex;
      gap: 16px;
      margin-top: 20px;
    }

    .arrow-icon {
      transition: transform 0.2s ease;
    }

    .btn-black-pill:hover .arrow-icon,
    .btn-black-pill-full:hover .arrow-icon {
      transform: translateX(3px);
    }

    .sparkle-icon {
      font-size: 0.9rem;
    }

    .step-footer {
      margin-top: 80px;
      font-size: 0.78rem;
      color: rgba(0, 0, 0, 0.38);
    }

    /* Step 3 Profile styling */
    .profile-sync-box {
      background-color: #ffffff;
      border: 1px solid rgba(0, 0, 0, 0.05);
      border-radius: 16px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 32px;
    }

    .avatar-img {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      object-fit: cover;
    }

    .profile-text {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .profile-name {
      font-size: 1.05rem;
      font-weight: 700;
      color: #1c1917;
    }

    .profile-location {
      font-size: 0.82rem;
      color: rgba(0, 0, 0, 0.45);
    }

    .sync-status {
      font-size: 0.72rem;
      font-weight: 600;
      color: #00c285;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    /* Onboarding Input Fields */
    .form-group {
      margin-bottom: 24px;
    }

    .form-label {
      font-size: 0.7rem;
      font-weight: 700;
      color: rgba(0, 0, 0, 0.45);
      letter-spacing: 0.08em;
      margin-bottom: 8px;
      display: block;
    }

    .onboarding-input {
      width: 100%;
      background-color: #ffffff;
      border: 1px solid rgba(0, 0, 0, 0.1);
      border-radius: 10px;
      padding: 14px 16px;
      font-size: 0.92rem;
      color: #1c1917;
      outline: none;
      box-sizing: border-box;
      transition: all 0.2s ease;
    }

    .onboarding-input:focus {
      border-color: #00c285;
      box-shadow: 0 0 0 3px rgba(0, 194, 133, 0.06);
    }

    /* Responsive Grid for mobile viewports */
    @media (max-width: 600px) {
      .interests-grid {
        grid-template-columns: 1fr;
      }
      .onboarding-title {
        font-size: 2.2rem;
      }
      .onboarding-title-left {
        font-size: 1.9rem;
      }
    }
  `]
})
export class OnboardingComponent {
  currentStep = 1;
  fullName = '';
  city = '';
  bio = '';

  interests = [
    { id: 'art', icon: '🎨', title: 'Art & Design', desc: 'Sketching, riso, ceramics & studio tours', selected: false },
    { id: 'food', icon: '🍷', title: 'Food & Wine', desc: 'Natural pet-nats, supper clubs & tastings', selected: false },
    { id: 'outdoors', icon: '🧗', title: 'Active & Outdoors', desc: 'Bouldering, trail runs & sunrise cycles', selected: false },
    { id: 'tech', icon: '⚡', title: 'Indie Tech & Craft', desc: 'Founders, deep work & creative coding', selected: false },
    { id: 'music', icon: '📻', title: 'Music & Sound', desc: 'Hi-fi vinyl listening, acoustic jams & modular', selected: false },
    { id: 'mind', icon: '🌿', title: 'Mind & Movement', desc: 'Tea ceremonies, breathwork & quiet spaces', selected: false },
    { id: 'literature', icon: '📚', title: 'Literature & Salons', desc: 'Book discussions & thoughtful essays', selected: false },
    { id: 'nightlife', icon: '🌙', title: 'Nightlife & Underground', desc: 'Warehouse sound, loft dancing & social clubs', selected: false },
  ];

  private router = inject(Router);

  get selectedCount(): number {
    return this.interests.filter(i => i.selected).length;
  }

  toggleInterest(item: any): void {
    item.selected = !item.selected;
  }

  nextStep(): void {
    if (this.currentStep < 3) {
      this.currentStep++;
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  completeOnboarding(): void {
    // Save onboarding details in local storage for access across components
    const profile = {
      fullName: this.fullName || 'Alex Rivera',
      city: this.city || 'New York, NY',
      bio: this.bio || 'Architecture enthusiast, sourdough experimenter, vinyl collector.',
      interests: this.interests.filter(i => i.selected).map(i => i.title),
      onboarded: true
    };
    
    localStorage.setItem('knitted_user_profile', JSON.stringify(profile));
    
    // Redirect to list of events
    this.router.navigate(['/events']);
  }
}
