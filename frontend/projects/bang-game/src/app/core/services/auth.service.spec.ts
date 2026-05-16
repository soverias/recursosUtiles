import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [AuthService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
    sessionStorage.clear();
  });

  // --- Estado inicial ---

  it('currentUser starts as anonymous', () => {
    expect(service.currentUser().kind).toBe('anonymous');
  });

  // --- playAsGuest ---

  it('playAsGuest sets currentUser to guest with a username', () => {
    service.playAsGuest();
    const state = service.currentUser();
    expect(state.kind).toBe('guest');
    if (state.kind === 'guest') {
      expect(state.user.username).toMatch(/^Invitado_/);
      expect(state.user.id).toBeTruthy();
    }
  });

  it('playAsGuest persists guest id in sessionStorage', () => {
    service.playAsGuest();
    const state = service.currentUser();
    if (state.kind === 'guest') {
      const stored = sessionStorage.getItem('bang_guest_id');
      expect(stored).toBe(state.user.id);
    }
  });

  it('playAsGuest called twice keeps same id', () => {
    service.playAsGuest();
    const idFirst = service.currentUser().kind === 'guest'
      ? (service.currentUser() as any).user.id
      : null;
    service.playAsGuest();
    const idSecond = service.currentUser().kind === 'guest'
      ? (service.currentUser() as any).user.id
      : null;
    expect(idFirst).toBe(idSecond);
  });

  // --- login ---

  it('login sends POST http://localhost:5000/auth/login and sets authenticated state', () => {
    service.login('alice', 'pass123').subscribe();

    const req = http.expectOne('http://localhost:5000/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ username: 'alice', password: 'pass123' });
    req.flush({ id: 'u1', username: 'alice', token: 'jwt-token' });

    const state = service.currentUser();
    expect(state.kind).toBe('authenticated');
    if (state.kind === 'authenticated') {
      expect(state.user.username).toBe('alice');
      expect(state.user.token).toBe('jwt-token');
    }
  });

  it('login stores JWT in localStorage', () => {
    service.login('alice', 'pass123').subscribe();
    const req = http.expectOne('http://localhost:5000/auth/login');
    req.flush({ id: 'u1', username: 'alice', token: 'jwt-token' });

    expect(localStorage.getItem('bang_token')).toBe('jwt-token');
  });

  // --- register ---

  it('register sends POST http://localhost:5000/auth/register and sets authenticated state', () => {
    service.register('bob', 'pass456').subscribe();

    const req = http.expectOne('http://localhost:5000/auth/register');
    expect(req.request.method).toBe('POST');
    req.flush({ id: 'u2', username: 'bob', token: 'jwt-bob' });

    expect(service.currentUser().kind).toBe('authenticated');
  });

  it('register with duplicate username propagates HTTP error', () => {
    let errorReceived = false;
    service.register('alice', 'pass').subscribe({ error: () => (errorReceived = true) });

    const req = http.expectOne('http://localhost:5000/auth/register');
    req.flush({ message: 'Username no disponible' }, { status: 409, statusText: 'Conflict' });

    expect(errorReceived).toBe(true);
    expect(service.currentUser().kind).toBe('anonymous');
  });

  // --- logout ---

  it('logout resets currentUser to anonymous and clears storage', () => {
    service.login('alice', 'pass').subscribe();
    http.expectOne('http://localhost:5000/auth/login').flush({ id: 'u1', username: 'alice', token: 'jwt' });

    service.logout();

    expect(service.currentUser().kind).toBe('anonymous');
    expect(localStorage.getItem('bang_token')).toBeNull();
  });

  // --- TRIANGULATE: restore from localStorage ---

  it('restores authenticated state from localStorage on init', () => {
    localStorage.setItem('bang_token', 'persisted-token');
    localStorage.setItem('bang_user', JSON.stringify({ id: 'u1', username: 'alice', token: 'persisted-token' }));

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [AuthService, provideHttpClient(), provideHttpClientTesting()],
    });
    const fresh = TestBed.inject(AuthService);
    const state = fresh.currentUser();
    expect(state.kind).toBe('authenticated');
    if (state.kind === 'authenticated') {
      expect(state.user.username).toBe('alice');
    }
  });
});
