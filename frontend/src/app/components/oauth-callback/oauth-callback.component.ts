import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  template: `
    <div class="callback" role="status">
      <span class="spinner"></span>
      <p>Signing you in…</p>
    </div>
  `,
  styles: [`
    .callback {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      min-height: 100vh;
      color: var(--brand);
    }
    .spinner {
      width: 32px;
      height: 32px;
    }
    p {
      color: var(--muted);
    }
  `]
})
export class OAuthCallbackComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private toast = inject(ToastService);

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.toast.error('Google sign-in didn’t complete. Please try again.');
      this.router.navigate(['/login'], { replaceUrl: true });
      return;
    }

    this.authService.saveToken(token);
    // New Google accounts start without a name; send them through onboarding once.
    this.authService.getProfile().subscribe({
      next: (profile) => this.router.navigateByUrl(
        profile.name ? this.authService.consumeReturnUrl() : '/onboarding', { replaceUrl: true }),
      error: () => this.router.navigateByUrl(this.authService.consumeReturnUrl(), { replaceUrl: true }),
    });
  }
}
