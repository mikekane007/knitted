import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { AuthShellComponent } from '../../shared/auth-shell.component';
import { GoogleButtonComponent } from '../../shared/google-button.component';
import { apiErrorMessage } from '../../shared/event-utils';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, AuthShellComponent, GoogleButtonComponent],
  template: `
    <app-auth-shell heading="Welcome back" subheading="Log in to book events and see your tickets.">
      <app-google-button (pressed)="loginWithGoogle()" [disabled]="isLoading()" />

      <div class="divider"><span>or</span></div>

      <form #form="ngForm" (ngSubmit)="onSubmit(form)" novalidate>
        @if (errorMessage()) {
          <div class="alert alert-error" role="alert">
            <i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i>
            <span>{{ errorMessage() }}</span>
          </div>
        }

        <div class="field">
          <label class="label" for="email">Email</label>
          <input id="email" name="email" type="email" class="input" autocomplete="email" required email
                 [(ngModel)]="email" #emailInput="ngModel" placeholder="you@example.com" />
          @if (emailInput.invalid && emailInput.touched) {
            <span class="field-error">Enter a valid email address.</span>
          }
        </div>

        <div class="field">
          <label class="label" for="password">Password</label>
          <div class="password">
            <input id="password" name="password" [type]="showPassword() ? 'text' : 'password'" class="input"
                   autocomplete="current-password" required [(ngModel)]="password" #passwordInput="ngModel" />
            <button type="button" class="reveal" (click)="showPassword.set(!showPassword())" [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'">
              <i class="fa-regular" [class.fa-eye]="!showPassword()" [class.fa-eye-slash]="showPassword()" aria-hidden="true"></i>
            </button>
          </div>
          @if (passwordInput.invalid && passwordInput.touched) {
            <span class="field-error">Enter your password.</span>
          }
        </div>

        <button type="submit" class="btn btn-primary btn-block btn-lg submit" [disabled]="isLoading()">
          @if (isLoading()) { <span class="spinner"></span> Logging in… } @else { Log in }
        </button>
      </form>

      <p class="switch">New to Knitted? <a routerLink="/register" [queryParamsHandling]="'preserve'">Create an account</a></p>
    </app-auth-shell>
  `,
  styles: [`
    .divider {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 22px 0;
      color: var(--muted);
      font-size: 0.85rem;
    }
    .divider::before,
    .divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--line);
    }
    form .alert {
      margin-bottom: 18px;
    }
    .password {
      position: relative;
    }
    .password .input {
      padding-right: 48px;
    }
    .reveal {
      position: absolute;
      right: 6px;
      top: 50%;
      transform: translateY(-50%);
      width: 36px;
      height: 36px;
      border-radius: var(--radius-sm);
      color: var(--muted);
    }
    .reveal:hover {
      color: var(--ink);
    }
    .submit {
      margin-top: 24px;
    }
    .switch {
      margin-top: 24px;
      text-align: center;
      color: var(--muted);
    }
    .switch a {
      color: var(--brand-strong);
      font-weight: 600;
    }
    .switch a:hover {
      text-decoration: underline;
    }
  `]
})
export class LoginComponent implements OnInit {
  email = '';
  password = '';
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly showPassword = signal(false);

  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    this.authService.rememberReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl'));
    if (this.authService.isLoggedIn()) {
      this.router.navigateByUrl(this.authService.consumeReturnUrl());
    }
  }

  onSubmit(form: NgForm): void {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.login(this.email.trim(), this.password).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigateByUrl(this.authService.consumeReturnUrl());
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error?.status === 401
          ? 'That email and password don’t match. Try again or continue with Google.'
          : apiErrorMessage(error, 'We couldn’t log you in. Please try again.'));
      }
    });
  }

  loginWithGoogle(): void {
    this.authService.redirectToGoogle(this.route.snapshot.queryParamMap.get('returnUrl') ?? undefined);
  }
}
