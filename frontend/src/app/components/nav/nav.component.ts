import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NgIf, CommonModule } from '@angular/common';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgIf, CommonModule],
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css']
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
    try {
      const profileStr = localStorage.getItem('knitted_user_profile');
      if (profileStr) {
        const profile = JSON.parse(profileStr);
        if (profile.avatarUrl) {
          return profile.avatarUrl;
        }
      }
    } catch {}
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
