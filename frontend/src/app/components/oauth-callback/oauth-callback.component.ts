import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  template: `
    <div class="callback-container animated-fade-in">
      <div class="glass-card loading-card">
        <i class="fa-solid fa-circle-notch fa-spin loading-spinner"></i>
        <h2>Completing Sign In...</h2>
        <p>Authenticating your session with Google. Please hold on.</p>
      </div>
    </div>
  `,
  styles: [`
    .callback-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: calc(100vh - 80px);
      padding: 20px;
    }

    .loading-card {
      text-align: center;
      max-width: 400px;
      width: 100%;
      padding: 40px;
    }

    .loading-spinner {
      font-size: 3rem;
      color: var(--color-primary);
      margin-bottom: 24px;
    }

    h2 {
      font-family: var(--font-title);
      font-weight: 700;
      margin-bottom: 8px;
    }

    p {
      color: var(--text-secondary);
      font-size: 0.95rem;
    }
  `]
})
export class OAuthCallbackComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      if (token) {
        this.authService.saveToken(token);
        this.router.navigate(['/events']);
      } else {
        this.router.navigate(['/login']);
      }
    });
  }
}
