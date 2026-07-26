import { Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { ApiService } from './api.service';

declare const google: any;

export interface AppUser {
  idToken: string;
  email: string;
  name: string;
  role: 'Patient' | 'Doctor' | 'Admin';
}

/// <summary>
/// Wraps Google Identity Services: renders the "Sign in with Google" button,
/// receives the ID token via callback, and stores it for the HTTP interceptor
/// to attach as a Bearer token on every API call. The backend validates this
/// same ID token directly against Google's OIDC discovery document — no
/// separate auth server round trip is needed.
/// </summary>
@Injectable({ providedIn: 'root' })
export class AuthService {
  private static readonly StorageKey = 'bms.idToken';

  readonly currentUser = signal<AppUser | null>(this.loadStoredUser());

  private gsiReadyPromise: Promise<void> | null = null;

  constructor(private readonly api: ApiService) {}

  /// <summary>
  /// The GSI script tag in index.html is loaded with async/defer, so it may not
  /// have executed yet when Angular components initialize. This polls for the
  /// global `google` object instead of assuming it's already present.
  /// </summary>
  private waitForGsi(): Promise<void> {
    if (this.gsiReadyPromise) {
      return this.gsiReadyPromise;
    }

    this.gsiReadyPromise = new Promise((resolve, reject) => {
      const timeoutMs = 10000;
      const intervalMs = 50;
      let elapsed = 0;

      const check = () => {
        if (typeof google !== 'undefined' && google?.accounts?.id) {
          resolve();
          return;
        }
        elapsed += intervalMs;
        if (elapsed >= timeoutMs) {
          reject(new Error('Google Identity Services script failed to load in time.'));
          return;
        }
        setTimeout(check, intervalMs);
      };

      check();
    });

    return this.gsiReadyPromise;
  }

  async initializeGoogleSignIn(onSignedIn: () => void): Promise<void> {
    try {
      await this.waitForGsi();
    } catch (err) {
      console.error(err);
      return;
    }

    google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (response: { credential: string }) => {
        this.handleCredential(response.credential);
        onSignedIn();
      }
    });
  }

  async renderSignInButton(parentElement: HTMLElement): Promise<void> {
    try {
      await this.waitForGsi();
    } catch (err) {
      console.error(err);
      return;
    }
    google.accounts.id.renderButton(parentElement, { theme: 'outline', size: 'large' });
  }

  signOut(): void {
    localStorage.removeItem(AuthService.StorageKey);
    this.currentUser.set(null);
    if (typeof google !== 'undefined') {
      google.accounts.id.disableAutoSelect();
    }
  }

  getIdToken(): string | null {
    return this.currentUser()?.idToken ?? null;
  }

  private handleCredential(idToken: string): void {
    const payload = this.decodeJwtPayload(idToken);
    const user: AppUser = { idToken, email: payload.email, name: payload.name, role: 'Patient' };
    localStorage.setItem(AuthService.StorageKey, JSON.stringify(user));
    this.currentUser.set(user);
    this.refreshRole();
  }

  /// <summary>
  /// The Google ID token has no concept of our app roles, so once signed in we
  /// ask the backend (which resolves Patient/Doctor/Admin from its own tables)
  /// and patch the cached user with the real role.
  /// </summary>
  private refreshRole(): void {
    this.api.getMe().subscribe({
      next: me => {
        const current = this.currentUser();
        if (!current) {
          return;
        }
        const updated: AppUser = { ...current, role: me.role };
        localStorage.setItem(AuthService.StorageKey, JSON.stringify(updated));
        this.currentUser.set(updated);
      },
      error: err => console.error('Failed to resolve app role', err)
    });
  }

  private loadStoredUser(): AppUser | null {
    const raw = localStorage.getItem(AuthService.StorageKey);
    return raw ? (JSON.parse(raw) as AppUser) : null;
  }

  private decodeJwtPayload(token: string): any {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  }
}
