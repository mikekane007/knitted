import { Component, inject } from '@angular/core';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-toast-host',
  standalone: true,
  template: `
    <div class="toast-stack" aria-live="polite" aria-atomic="false">
      @for (toast of toasts.toasts(); track toast.id) {
        <div class="toast" [class]="'toast toast-' + toast.tone" role="status">
          <i class="fa-solid"
             [class.fa-circle-check]="toast.tone === 'success'"
             [class.fa-circle-exclamation]="toast.tone === 'error'"
             [class.fa-circle-info]="toast.tone === 'info'"
             aria-hidden="true"></i>
          <span>{{ toast.message }}</span>
          <button type="button" class="close" (click)="toasts.dismiss(toast.id)" aria-label="Dismiss notification">
            <i class="fa-solid fa-xmark" aria-hidden="true"></i>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-stack {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      flex-direction: column;
      gap: 10px;
      z-index: 1000;
      width: min(440px, calc(100vw - 32px));
    }
    .toast {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      background: var(--ink);
      color: #fff;
      border-radius: var(--radius);
      box-shadow: var(--shadow-lg);
      font-size: 0.92rem;
      animation: rise 0.25s var(--ease) both;
    }
    .toast-success i:first-child {
      color: #4ade80;
    }
    .toast-error i:first-child {
      color: #f87171;
    }
    .toast-info i:first-child {
      color: #93c5fd;
    }
    .toast span {
      flex: 1;
    }
    .close {
      color: rgba(255, 255, 255, 0.6);
      padding: 4px;
    }
    .close:hover {
      color: #fff;
    }
    @keyframes rise {
      from {
        opacity: 0;
        transform: translateY(8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `],
})
export class ToastHostComponent {
  readonly toasts = inject(ToastService);
}
