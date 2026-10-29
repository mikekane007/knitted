import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { AuthShellComponent } from '../../shared/auth-shell.component';
import { apiErrorMessage } from '../../shared/event-utils';
import { INTERESTS } from '../profile/profile.component';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [FormsModule, AuthShellComponent],
  template: `
    <app-auth-shell heading="Tell us about you" subheading="Hosts and guests see your name on events you join. You can change this any time.">
      <form #form="ngForm" (ngSubmit)="save(form)" novalidate>
        <div class="field">
          <label class="label" for="name">Your name</label>
          <input id="name" name="name" class="input" autocomplete="name" required maxlength="120" [(ngModel)]="name" #nameInput="ngModel" />
          @if (nameInput.invalid && nameInput.touched) {
            <span class="field-error">Add your name so hosts know who’s coming.</span>
          }
        </div>
        <div class="field">
          <label class="label" for="location">Neighborhood <span class="optional">(optional)</span></label>
          <input id="location" name="location" class="input" maxlength="200" [(ngModel)]="location" placeholder="e.g. Williamsburg" />
        </div>
        <div class="field">
          <span class="label">What are you into? <span class="optional">(pick any)</span></span>
          <div class="chips">
            @for (interest of interests; track interest) {
              <button type="button" class="chip" [class.active]="selected.has(interest)" [attr.aria-pressed]="selected.has(interest)" (click)="toggle(interest)">
                {{ interest }}
              </button>
            }
          </div>
        </div>
        <div class="actions">
          <button type="button" class="btn btn-ghost" (click)="skip()" [disabled]="isSaving()">Skip for now</button>
          <button type="submit" class="btn btn-primary btn-lg" [disabled]="isSaving()">
            @if (isSaving()) { <span class="spinner"></span> } Continue
          </button>
        </div>
      </form>
    </app-auth-shell>
  `,
  styles: [`
    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .actions {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      margin-top: 28px;
    }
  `]
})
export class OnboardingComponent {
  name = '';
  location = '';
  readonly selected = new Set<string>();
  readonly interests = INTERESTS;
  readonly isSaving = signal(false);

  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);

  toggle(interest: string): void {
    if (this.selected.has(interest)) this.selected.delete(interest);
    else this.selected.add(interest);
  }

  save(form: NgForm): void {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }
    this.isSaving.set(true);
    this.auth.updateProfile({
      name: this.name.trim(),
      location: this.location.trim() || null,
      wovenThreads: [...this.selected].join(', ') || null,
    }).subscribe({
      next: () => this.router.navigateByUrl(this.auth.consumeReturnUrl()),
      error: (error) => {
        this.isSaving.set(false);
        this.toast.error(apiErrorMessage(error, 'We couldn’t save your details.'));
      }
    });
  }

  skip(): void {
    this.router.navigateByUrl(this.auth.consumeReturnUrl());
  }
}
