import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { canActivateIdentity } from './identity.guard';
import { AuthService } from '../services/auth.service';
import { AuthState } from '../models/user.model';

const makeAuthStub = (state: AuthState) => ({
  currentUser: signal(state),
});

const makeRouterStub = () => ({ navigate: vi.fn() });

describe('identity.guard', () => {
  let router: ReturnType<typeof makeRouterStub>;

  beforeEach(() => {
    router = makeRouterStub();
  });

  it('returns true when user is authenticated', () => {
    const auth = makeAuthStub({ kind: 'authenticated', user: { id: 'u1', username: 'alice', token: 'jwt' } });
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
      ],
    });
    const result = TestBed.runInInjectionContext(() => canActivateIdentity());
    expect(result).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('returns true when user is guest', () => {
    const auth = makeAuthStub({ kind: 'guest', user: { id: 'g1', username: 'Invitado_AA' } });
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
      ],
    });
    const result = TestBed.runInInjectionContext(() => canActivateIdentity());
    expect(result).toBe(true);
  });

  it('redirects to /entry and returns false when anonymous', () => {
    const auth = makeAuthStub({ kind: 'anonymous' });
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
      ],
    });
    const result = TestBed.runInInjectionContext(() => canActivateIdentity());
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/entry']);
  });
});
