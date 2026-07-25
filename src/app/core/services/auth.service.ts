import { Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';

declare const google: any;

export interface AppUser {
  idToken: string;
  email: string;
  name: string;
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

  initializeGoogleSignIn(onSignedIn: () => void): void {
    if (typeof google === 'undefined') {
      console.warn('Google Identity Services script not loaded yet.');
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

  renderSignInButton(parentElement: HTMLElement): void {
    if (typeof google === 'undefined') {
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
    const user: AppUser = { idToken, email: payload.email, name: payload.name };
    localStorage.setItem(AuthService.StorageKey, JSON.stringify(user));
    this.currentUser.set(user);
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
