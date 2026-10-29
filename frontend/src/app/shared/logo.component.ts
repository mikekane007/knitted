import { Component, Input } from '@angular/core';

/** The Knitted stitch mark and wordmark, as on the splash screen. */
@Component({
  selector: 'app-logo',
  standalone: true,
  template: `
    <span class="logo" [class.light]="light">
      <svg [attr.width]="size" [attr.height]="size" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <path d="M12 16C12 14.5 20 14.5 20 16C20 17.5 12 17.5 12 16Z" fill="#00c285" />
        <path d="M16 16C13 16 10 20 8 23" stroke="#00c285" stroke-width="3.2" stroke-linecap="round" />
        <path d="M16 16C19 16 22 20 24 23" stroke="#00c285" stroke-width="3.2" stroke-linecap="round" />
        <path d="M16 16C13 16 10 12 8 9" stroke="#00c285" stroke-width="3.2" stroke-linecap="round" />
        <path d="M16 16C19 16 22 12 24 9" stroke="#00c285" stroke-width="3.2" stroke-linecap="round" />
        <circle cx="8" cy="9" r="2.8" fill="#00c285" />
        <circle cx="24" cy="9" r="2.8" fill="#00c285" />
        <circle cx="8" cy="23" r="2.8" fill="#00c285" />
        <circle cx="24" cy="23" r="2.8" fill="#00c285" />
      </svg>
      @if (!markOnly) {
        <span class="wordmark">Knitted<span class="dot">.</span></span>
      }
    </span>
  `,
  styles: [`
    .logo {
      display: inline-flex;
      align-items: center;
      gap: 10px;
    }
    .wordmark {
      font-family: 'Playfair Display', Georgia, serif;
      font-weight: 700;
      font-size: 1.6rem;
      letter-spacing: -0.02em;
      line-height: 1;
      color: var(--ink);
    }
    .dot {
      color: #00c285;
    }
    .light .wordmark {
      color: #fff;
    }
  `],
})
export class LogoComponent {
  @Input() size = 28;
  @Input() light = false;
  @Input() markOnly = false;
}
