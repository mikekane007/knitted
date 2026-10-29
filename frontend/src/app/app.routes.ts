import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

/** Routes with `data.bare` render without the site header and footer (auth flows). */
export const routes: Routes = [
  {
    path: '',
    title: 'Knitted · Discover and book community events',
    loadComponent: () => import('./components/landing/landing.component').then(m => m.LandingComponent),
  },
  {
    path: 'events',
    title: 'Explore events · Knitted',
    loadComponent: () => import('./components/event-list/event-list.component').then(m => m.EventListComponent),
  },
  {
    path: 'events/:id',
    title: 'Event · Knitted',
    loadComponent: () => import('./components/event-detail/event-detail.component').then(m => m.EventDetailComponent),
  },
  {
    path: 'categories',
    title: 'Categories · Knitted',
    loadComponent: () => import('./components/interest-hubs/interest-hubs.component').then(m => m.InterestHubsComponent),
  },
  {
    path: 'host',
    title: 'Host an event · Knitted',
    canActivate: [authGuard],
    loadComponent: () => import('./components/event-create/event-create.component').then(m => m.EventCreateComponent),
  },
  {
    path: 'tickets',
    title: 'My tickets · Knitted',
    canActivate: [authGuard],
    loadComponent: () => import('./components/my-bookings/my-bookings.component').then(m => m.MyBookingsComponent),
  },
  {
    path: 'profile',
    title: 'Profile · Knitted',
    canActivate: [authGuard],
    loadComponent: () => import('./components/profile/profile.component').then(m => m.ProfileComponent),
  },
  {
    path: 'login',
    title: 'Log in · Knitted',
    data: { bare: true },
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'register',
    title: 'Create your account · Knitted',
    data: { bare: true },
    loadComponent: () => import('./components/register/register.component').then(m => m.RegisterComponent),
  },
  {
    path: 'onboarding',
    title: 'Welcome · Knitted',
    data: { bare: true },
    canActivate: [authGuard],
    loadComponent: () => import('./components/onboarding/onboarding.component').then(m => m.OnboardingComponent),
  },
  {
    path: 'oauth-callback',
    title: 'Signing you in · Knitted',
    data: { bare: true },
    loadComponent: () => import('./components/oauth-callback/oauth-callback.component').then(m => m.OAuthCallbackComponent),
  },
  // Earlier URLs kept working for existing links and bookmarks.
  { path: 'hubs', redirectTo: 'categories' },
  { path: 'publish', redirectTo: 'host' },
  { path: 'my-bookings', redirectTo: 'tickets' },
  {
    path: '**',
    title: 'Page not found · Knitted',
    loadComponent: () => import('./components/not-found/not-found.component').then(m => m.NotFoundComponent),
  },
];
