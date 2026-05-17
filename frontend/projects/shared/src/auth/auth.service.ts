import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { randomUUID } from '@shared/util';
import { AuthState, User } from './models';
import { AUTH_API_BASE } from './tokens';

export const AUTH_TOKEN_KEY = 'auth_token';
export const AUTH_USER_KEY = 'auth_user';
export const AUTH_GUEST_ID_KEY = 'auth_guest_id';

function restoreFromStorage(): AuthState {
  const raw = localStorage.getItem(AUTH_USER_KEY);
  if (raw) {
    try {
      const user: User = JSON.parse(raw);
      return { kind: 'authenticated', user };
    } catch {
      localStorage.removeItem(AUTH_USER_KEY);
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  }
  return { kind: 'anonymous' };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = inject(AUTH_API_BASE);

  readonly currentUser = signal<AuthState>(restoreFromStorage());

  isAuthenticated(): boolean {
    return this.currentUser().kind === 'authenticated';
  }

  playAsGuest(): void {
    let id = sessionStorage.getItem(AUTH_GUEST_ID_KEY);
    if (!id) {
      id = randomUUID();
      sessionStorage.setItem(AUTH_GUEST_ID_KEY, id);
    }
    const suffix = id.slice(0, 4).toUpperCase();
    this.currentUser.set({ kind: 'guest', user: { id, username: `Invitado_${suffix}` } });
  }

  login(username: string, password: string): Observable<User> {
    return this.http.post<User>(`${this.apiBase}/auth/login`, { username, password }).pipe(
      tap(user => this.setAuthenticated(user)),
    );
  }

  register(username: string, password: string): Observable<User> {
    return this.http.post<User>(`${this.apiBase}/auth/register`, { username, password }).pipe(
      tap(user => this.setAuthenticated(user)),
    );
  }

  logout(): void {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    sessionStorage.removeItem(AUTH_GUEST_ID_KEY);
    this.currentUser.set({ kind: 'anonymous' });
  }

  private setAuthenticated(user: User): void {
    localStorage.setItem(AUTH_TOKEN_KEY, user.token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    this.currentUser.set({ kind: 'authenticated', user });
  }
}
