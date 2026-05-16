import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthState, User } from '../models/user.model';
import { API_BASE } from '../config/api.config';
import { randomUUID } from '@shared/util';

const TOKEN_KEY = 'bang_token';
const USER_KEY = 'bang_user';
const GUEST_ID_KEY = 'bang_guest_id';

function restoreFromStorage(): AuthState {
  const raw = localStorage.getItem(USER_KEY);
  if (raw) {
    try {
      const user: User = JSON.parse(raw);
      return { kind: 'authenticated', user };
    } catch {
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_KEY);
    }
  }
  return { kind: 'anonymous' };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  readonly currentUser = signal<AuthState>(restoreFromStorage());

  playAsGuest(): void {
    let id = sessionStorage.getItem(GUEST_ID_KEY);
    if (!id) {
      id = randomUUID();
      sessionStorage.setItem(GUEST_ID_KEY, id);
    }
    const suffix = id.slice(0, 4).toUpperCase();
    this.currentUser.set({ kind: 'guest', user: { id, username: `Invitado_${suffix}` } });
  }

  login(username: string, password: string): Observable<User> {
    return this.http.post<User>(`${API_BASE}/auth/login`, { username, password }).pipe(
      tap(user => this.setAuthenticated(user)),
    );
  }

  register(username: string, password: string): Observable<User> {
    return this.http.post<User>(`${API_BASE}/auth/register`, { username, password }).pipe(
      tap(user => this.setAuthenticated(user)),
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(GUEST_ID_KEY);
    this.currentUser.set({ kind: 'anonymous' });
  }

  private setAuthenticated(user: User): void {
    localStorage.setItem(TOKEN_KEY, user.token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.currentUser.set({ kind: 'authenticated', user });
  }
}
