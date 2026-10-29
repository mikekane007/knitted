import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="container page">
      <div class="empty-state">
        <span class="empty-icon"><i class="fa-solid fa-map-signs" aria-hidden="true"></i></span>
        <h3>We can’t find that page</h3>
        <p>The link may be broken or the page may have moved.</p>
        <a routerLink="/events" class="btn btn-primary">Explore events</a>
      </div>
    </div>
  `,
})
export class NotFoundComponent {}
