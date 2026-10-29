import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { ProfileUpdate, UserProfile } from '../interfaces/user.interface';

interface TokenPayload {
  sub?: string;
  email?: string;
  exp?: number;
  [claim: string]: unknown;
}

const EMAIL_CLAIM = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress';
const RETURN_URL_KEY = 'knitted_return_url';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private baseUrl = `${API_BASE_URL}/auth`;
  private tokenKey = 'knitted_jwt_token';

  /** The signed-in user's profile, loaded lazily and shared across the app. */
  readonly profile = signal<UserProfile | null>(null);

  register(email: string, password: string): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`${this.baseUrl}/register`, { email, password }).pipe(
      tap(response => this.saveToken(response.token))
    );
  }

  login(email: string, password: string): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`${this.baseUrl}/login`, { email, password }).pipe(
      tap(response => this.saveToken(response.token))
    );
  }

  redirectToGoogle(returnUrl?: string): void {
    this.rememberReturnUrl(returnUrl);
    window.location.href = `${this.baseUrl}/google`;
  }

  saveToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
    this.profile.set(null);
  }

  getToken(): string | null {
    try {
      return localStorage.getItem(this.tokenKey);
    } catch {
      return null;
    }
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem('knitted_user_profile');
    this.profile.set(null);
  }

  isLoggedIn(): boolean {
    const payload = this.payload();
    return Boolean(payload?.exp && payload.exp * 1000 > Date.now());
  }

  getUserId(): number | null {
    const id = Number(this.payload()?.sub);
    return Number.isFinite(id) && id > 0 ? id : null;
  }

  getUserEmail(): string | null {
    const payload = this.payload();
    return (payload?.email as string) || (payload?.[EMAIL_CLAIM] as string) || null;
  }

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.baseUrl}/profile`).pipe(
      tap(profile => this.profile.set(profile))
    );
  }

  /** Returns the cached profile, fetching it once per session when needed. */
  ensureProfile(): Observable<UserProfile | null> {
    if (!this.isLoggedIn()) return of(null);
    const cached = this.profile();
    return cached ? of(cached) : this.getProfile();
  }

  updateProfile(profile: ProfileUpdate): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.baseUrl}/profile`, profile).pipe(
      tap(updated => this.profile.set(updated))
    );
  }

  rememberReturnUrl(url: string | null | undefined): void {
    if (url && url.startsWith('/') && !url.startsWith('//')) {
      sessionStorage.setItem(RETURN_URL_KEY, url);
    }
  }

  /** Reads and clears the page to return to after signing in. */
  consumeReturnUrl(fallback = '/events'): string {
    const url = sessionStorage.getItem(RETURN_URL_KEY);
    sessionStorage.removeItem(RETURN_URL_KEY);
    return url && url.startsWith('/') && !url.startsWith('//') ? url : fallback;
  }

  private payload(): TokenPayload | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(base64)) as TokenPayload;
    } catch {
      return null;
    }
  }
}
