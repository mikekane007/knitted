import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, FormsModule, NgIf],
  template: `
    <div class="auth-page-container">
      <div class="auth-card">
        <!-- Card Header Logo & Title -->
        <header class="auth-header">
          <div class="logo">
            <svg width="30" height="30" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" class="logo-svg">
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
          <p class="subtitle">Welcome back to your gathering circle</p>
        </header>

        <!-- Tab Switcher -->
        <div class="tab-switcher">
          <button class="tab-btn active">Sign In</button>
          <a routerLink="/register" class="tab-btn inactive">Create Account</a>
        </div>

        <!-- Form -->
        <form (ngSubmit)="onSubmit()" #loginForm="ngForm">
          <div *ngIf="errorMessage" class="error-banner">
            <i class="fa-solid fa-triangle-exclamation"></i> {{ errorMessage }}
          </div>

          <!-- Email Address Input -->
          <div class="form-group">
            <label class="form-label" for="email">EMAIL ADDRESS</label>
            <div class="input-wrapper">
              <i class="fa-regular fa-envelope input-icon"></i>
              <input
                type="email"
                id="email"
                name="email"
                [(ngModel)]="email"
                required
                email
                #emailInput="ngModel"
                placeholder="alex@studio.com"
                class="form-input"
              />
            </div>
            <div *ngIf="emailInput.invalid && (emailInput.dirty || emailInput.touched)" class="validation-error">
              Please enter a valid email address.
            </div>
          </div>

          <!-- Password Input -->
          <div class="form-group">
            <label class="form-label" for="password">PASSWORD</label>
            <div class="input-wrapper">
              <i class="fa-solid fa-lock input-icon"></i>
              <input
                type="password"
                id="password"
                name="password"
                [(ngModel)]="password"
                required
                minlength="6"
                #passwordInput="ngModel"
                placeholder="••••••••"
                class="form-input"
              />
            </div>
            <div *ngIf="passwordInput.invalid && (passwordInput.dirty || passwordInput.touched)" class="validation-error">
              Password must be at least 6 characters.
            </div>
          </div>

          <button type="submit" [disabled]="loginForm.invalid || isLoading" class="btn-submit">
            <span *ngIf="!isLoading">
              Continue with Password <i class="fa-solid fa-arrow-right arrow-icon"></i>
            </span>
            <span *ngIf="isLoading"><i class="fa-solid fa-spinner fa-spin"></i> Signing In...</span>
          </button>
        </form>

        <!-- Divider -->
        <div class="divider-container">
          <div class="divider-line"></div>
          <span class="divider-text">OR CONTINUE WITH</span>
        </div>

        <!-- Social logins -->
        <div class="social-grid">
          <button (click)="loginWithGoogle()" class="social-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84c-.87-2.6-3.3-4.53-6.16-4.53z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            Google
          </button>
          <button (click)="loginWithGoogle()" class="social-btn">
            <i class="fa-brands fa-apple apple-icon"></i> Apple
          </button>
        </div>

        <!-- Card Footer -->
        <footer class="auth-footer">
          <div class="footer-left">
            <i class="fa-solid fa-shield-halved security-icon"></i>
            <span>Encrypted & ad-free</span>
          </div>
          <a routerLink="/events" class="skip-link">Skip for now</a>
        </footer>
      </div>
    </div>
  `,
  styles: [`
    .auth-page-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: calc(100vh - 80px);
      background-color: #f5f6f5; /* Light grey/off-white background */
      padding: 40px 20px;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    /* White rounded card */
    .auth-card {
      position: relative;
      width: 100%;
      max-width: 440px;
      background-color: #ffffff;
      border-radius: 20px;
      padding: 40px 36px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.035);
      border: 1px solid rgba(0, 0, 0, 0.04);
      box-sizing: border-box;
    }

    /* Top border gradient line */
    .auth-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(to right, #00c285 20%, rgba(0, 194, 133, 0.1) 100%);
      border-top-left-radius: 20px;
      border-top-right-radius: 20px;
    }

    /* Header styling */
    .auth-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      margin-bottom: 24px;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
    }

    .logo-text {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 1.55rem;
      font-weight: 700;
      color: #1c1917;
      letter-spacing: -0.01em;
    }

    .logo-text .dot {
      color: #00c285;
    }

    .subtitle {
      font-size: 0.9rem;
      color: rgba(0, 0, 0, 0.48);
      font-weight: 400;
      margin: 0;
    }

    /* Tab switcher */
    .tab-switcher {
      display: flex;
      background-color: #f1f0ef;
      padding: 4px;
      border-radius: 12px;
      margin-bottom: 28px;
    }

    .tab-btn {
      flex: 1;
      text-align: center;
      border: none;
      padding: 10px;
      font-size: 0.88rem;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      border-radius: 9px;
      transition: all 0.2s ease;
      display: inline-block;
    }

    .tab-btn.active {
      background-color: #ffffff;
      color: #1c1917;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
    }

    .tab-btn.inactive {
      background-color: transparent;
      color: rgba(0, 0, 0, 0.42);
    }

    /* Form inputs */
    .form-group {
      margin-bottom: 20px;
    }

    .form-label {
      font-size: 0.7rem;
      font-weight: 700;
      color: rgba(0, 0, 0, 0.5);
      letter-spacing: 0.08em;
      margin-bottom: 8px;
      display: block;
    }

    .input-wrapper {
      display: flex;
      align-items: center;
      border: 1px solid rgba(0, 0, 0, 0.1);
      border-radius: 10px;
      padding: 0 14px;
      background-color: #ffffff;
      transition: all 0.25s ease;
    }

    .input-wrapper:focus-within {
      border-color: #00c285;
      box-shadow: 0 0 0 3px rgba(0, 194, 133, 0.06);
    }

    .input-icon {
      color: rgba(0, 0, 0, 0.3);
      font-size: 1rem;
    }

    .form-input {
      border: none;
      background-color: transparent;
      padding: 13px 12px;
      font-size: 0.92rem;
      color: #1c1917;
      outline: none;
      width: 100%;
    }

    .form-input::placeholder {
      color: rgba(0, 0, 0, 0.3);
    }

    .validation-error {
      color: #ef4444;
      font-size: 0.78rem;
      margin-top: 6px;
    }

    /* Submit button */
    .btn-submit {
      width: 100%;
      background-color: #1c1917;
      color: #ffffff;
      border: none;
      padding: 14px;
      border-radius: 10px;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: all 0.2s ease;
      margin-top: 24px;
    }

    .btn-submit:hover {
      background-color: #2d2926;
    }

    .arrow-icon {
      transition: transform 0.2s ease;
    }

    .btn-submit:hover .arrow-icon {
      transform: translateX(3px);
    }

    /* Divider */
    .divider-container {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 28px 0;
    }

    .divider-line {
      width: 100%;
      border-top: 1px solid rgba(0, 0, 0, 0.06);
    }

    .divider-text {
      position: absolute;
      background-color: #ffffff;
      padding: 0 14px;
      font-size: 0.7rem;
      font-weight: 600;
      color: rgba(0, 0, 0, 0.38);
      letter-spacing: 0.05em;
    }

    /* Social grid */
    .social-grid {
      display: flex;
      gap: 14px;
    }

    .social-btn {
      flex: 1;
      background-color: #ffffff;
      border: 1px solid rgba(0, 0, 0, 0.08);
      color: #1c1917;
      padding: 12px;
      border-radius: 10px;
      font-size: 0.88rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.2s ease;
    }

    .social-btn:hover {
      background-color: rgba(0, 0, 0, 0.02);
      border-color: rgba(0, 0, 0, 0.16);
    }

    .google-icon {
      color: #ea4335;
    }

    .apple-icon {
      color: #000000;
    }

    /* Footer security details */
    .auth-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid rgba(0, 0, 0, 0.05);
      margin-top: 36px;
      padding-top: 18px;
      font-size: 0.78rem;
      color: rgba(0, 0, 0, 0.45);
    }

    .footer-left {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .security-icon {
      color: #00c285;
    }

    .skip-link {
      color: rgba(0, 0, 0, 0.45);
      text-decoration: underline;
    }

    .skip-link:hover {
      color: #00c285;
    }

    .error-banner {
      background: rgba(239, 68, 68, 0.05);
      border: 1px solid rgba(239, 68, 68, 0.15);
      color: #ef4444;
      padding: 12px;
      border-radius: 10px;
      margin-bottom: 20px;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      gap: 8px;
    }
  `]
})
export class LoginComponent {
  email = '';
  password = '';
  isLoading = false;
  errorMessage = '';

  private authService = inject(AuthService);
  private router = inject(Router);

  onSubmit(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.email, this.password).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/events']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Login failed. Please verify your credentials.';
      }
    });
  }

  loginWithGoogle(): void {
    this.authService.redirectToGoogle();
  }
}
