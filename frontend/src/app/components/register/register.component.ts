import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterLink, FormsModule, NgIf],
  template: `
    <div class="auth-page animated-fade-in">
      <div class="glass-card auth-card">
        <h2 class="auth-title"><span class="gradient-text">Create Account</span></h2>
        <p class="auth-subtitle">Join the Knitted community and start booking events</p>

        <form (ngSubmit)="onSubmit()" #registerForm="ngForm">
          <div *ngIf="errorMessage" class="error-banner">
            <i class="fa-solid fa-triangle-exclamation"></i> {{ errorMessage }}
          </div>

          <div class="form-group">
            <label class="form-label" for="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              [(ngModel)]="email"
              required
              email
              #emailInput="ngModel"
              class="form-input"
              placeholder="e.g. knitter@example.com"
            />
            <div *ngIf="emailInput.invalid && (emailInput.dirty || emailInput.touched)" class="validation-error">
              Please enter a valid email address.
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              [(ngModel)]="password"
              required
              minlength="6"
              #passwordInput="ngModel"
              class="form-input"
              placeholder="Min. 6 characters"
            />
            <div *ngIf="passwordInput.invalid && (passwordInput.dirty || passwordInput.touched)" class="validation-error">
              Password must be at least 6 characters long.
            </div>
          </div>

          <button type="submit" [disabled]="registerForm.invalid || isLoading" class="btn-primary w-full">
            <span *ngIf="!isLoading">
              <i class="fa-solid fa-user-plus icon-margin"></i>Create Account
            </span>
            <span *ngIf="isLoading"><i class="fa-solid fa-spinner fa-spin"></i> Creating Account...</span>
          </button>
        </form>

        <div class="divider">
          <span>or continue with</span>
        </div>

        <button (click)="loginWithGoogle()" class="btn-google">
          <i class="fa-brands fa-google google-icon"></i>
          Sign up with Google
        </button>

        <p class="switch-auth">
          Already have an account? <a routerLink="/login" class="auth-link">Sign In here</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: calc(100vh - 80px);
      padding: 20px;
    }

    .auth-card {
      width: 100%;
      max-width: 440px;
      padding: 40px 32px;
    }

    .auth-title {
      font-size: 2.2rem;
      text-align: center;
      margin-bottom: 8px;
    }

    .auth-subtitle {
      color: var(--text-secondary);
      font-size: 0.95rem;
      text-align: center;
      margin-bottom: 32px;
    }

    .error-banner {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #fc8181;
      padding: 12px;
      border-radius: 10px;
      margin-bottom: 24px;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .validation-error {
      color: var(--color-danger);
      font-size: 0.8rem;
      margin-top: 4px;
    }

    .w-full {
      width: 100%;
    }

    .icon-margin {
      margin-right: 8px;
    }

    .divider {
      display: flex;
      align-items: center;
      text-align: center;
      color: var(--text-muted);
      margin: 24px 0;
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .divider::before, .divider::after {
      content: '';
      flex: 1;
      border-bottom: 1px solid var(--border-light);
    }

    .divider:not(:empty)::before {
      margin-right: .5em;
    }

    .divider:not(:empty)::after {
      margin-left: .5em;
    }

    .btn-google {
      width: 100%;
      background: #ffffff;
      color: #1f2937;
      border: none;
      padding: 12px 24px;
      font-family: var(--font-title);
      font-weight: 600;
      font-size: 0.95rem;
      border-radius: 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      transition: var(--transition-smooth);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .btn-google:hover {
      background: #f3f4f6;
      transform: translateY(-2px);
      box-shadow: 0 6px 15px rgba(0, 0, 0, 0.2);
    }

    .google-icon {
      font-size: 1.2rem;
      color: #ea4335;
    }

    .switch-auth {
      text-align: center;
      margin-top: 28px;
      color: var(--text-secondary);
      font-size: 0.95rem;
    }

    .auth-link {
      color: var(--color-primary);
      text-decoration: none;
      font-weight: 600;
      transition: var(--transition-smooth);
    }

    .auth-link:hover {
      color: var(--color-secondary);
      text-decoration: underline;
    }
  `]
})
export class RegisterComponent {
  email = '';
  password = '';
  isLoading = false;
  errorMessage = '';

  private authService = inject(AuthService);
  private router = inject(Router);

  onSubmit(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.register(this.email, this.password).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/events']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Registration failed. Email might already exist.';
      }
    });
  }

  loginWithGoogle(): void {
    this.authService.redirectToGoogle();
  }
}
