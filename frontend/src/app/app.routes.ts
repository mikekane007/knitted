import { Routes } from '@angular/router';
import { LandingComponent } from './components/landing/landing.component';
import { EventListComponent } from './components/event-list/event-list.component';
import { EventDetailComponent } from './components/event-detail/event-detail.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { OAuthCallbackComponent } from './components/oauth-callback/oauth-callback.component';
import { MyBookingsComponent } from './components/my-bookings/my-bookings.component';
import { OnboardingComponent } from './components/onboarding/onboarding.component';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'events', component: EventListComponent },
  { path: 'events/:id', component: EventDetailComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'onboarding', component: OnboardingComponent },
  { path: 'oauth-callback', component: OAuthCallbackComponent },
  { path: 'my-bookings', component: MyBookingsComponent },
  { path: '**', redirectTo: 'events' }
];
