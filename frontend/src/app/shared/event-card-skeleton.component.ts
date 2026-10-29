import { Component } from '@angular/core';

@Component({
  selector: 'app-event-card-skeleton',
  standalone: true,
  template: `
    <div class="card-skeleton" aria-hidden="true">
      <div class="skeleton media"></div>
      <div class="lines">
        <div class="skeleton line short"></div>
        <div class="skeleton line"></div>
        <div class="skeleton line mid"></div>
        <div class="skeleton line short"></div>
      </div>
    </div>
  `,
  styles: [`
    .card-skeleton {
      border: 1px solid var(--line);
      border-radius: var(--radius-lg);
      overflow: hidden;
    }
    .media {
      aspect-ratio: 16 / 9;
      border-radius: 0;
    }
    .lines {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 18px;
    }
    .line {
      height: 12px;
    }
    .short {
      width: 35%;
    }
    .mid {
      width: 70%;
    }
  `],
})
export class EventCardSkeletonComponent {}
