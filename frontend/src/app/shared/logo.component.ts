import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-logo',
  standalone: true,
  template: `
    <span class="logo" [class.light]="light">
      <svg [attr.width]="size" [attr.height]="size" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect width="32" height="32" rx="9" fill="currentColor" class="mark-bg" />
        <path d="M16 16C13 16 11 19.5 9.5 22M16 16C19 16 21 19.5 22.5 22M16 16C13 16 11 12.5 9.5 10M16 16C19 16 21 12.5 22.5 10"
          stroke="#fff" stroke-width="2.6" stroke-linecap="round" />
        <circle cx="9.5" cy="10" r="2.2" fill="#fff" />
        <circle cx="22.5" cy="10" r="2.2" fill="#fff" />
        <circle cx="9.5" cy="22" r="2.2" fill="#fff" />
        <circle cx="22.5" cy="22" r="2.2" fill="#fff" />
      </svg>
      @if (!markOnly) {
        <span class="wordmark">Knitted</span>
      }
    </span>
  `,
  styles: [`
    .logo {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      color: var(--brand);
    }
    .wordmark {
      font-family: var(--font-display);
      font-weight: 800;
      font-size: 1.3rem;
      letter-spacing: -0.01em;
      color: var(--ink);
    }
    .light .wordmark {
      color: #fff;
    }
  `],
})
export class LogoComponent {
  @Input() size = 32;
  @Input() light = false;
  @Input() markOnly = false;
}
