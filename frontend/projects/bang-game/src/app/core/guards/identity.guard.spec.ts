import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { canActivateIdentity } from './identity.guard';
import { AuthService } from '../services/auth.service';
import { AuthState } from '../models/user.model';

const makeAuthStub = (state: AuthState) => ({
  currentUser: signal(state),
  playAsGuest: vi.fn(),
});

describe('identity.guard', () => {
  it('returns true when user is authenticated', () => {
    const auth = makeAuthStub({ kind: 'authenticated', user: { id: 'u1', username: 'alice', token: 'jwt' } });
    TestBed.configureTestingModule({ providers: [{ provide: AuthService, useValue: auth }] });
    const result = TestBed.runInInjectionContext(() => canActivateIdentity());
    expect(result).toBe(true);
    expect(auth.playAsGuest).not.toHaveBeenCalled();
  });

  it('returns true when user is guest', () => {
    const auth = makeAuthStub({ kind: 'guest', user: { id: 'g1', username: 'Invitado_AA' } });
    TestBed.configureTestingModule({ providers: [{ provide: AuthService, useValue: auth }] });
    const result = TestBed.runInInjectionContext(() => canActivateIdentity());
    expect(result).toBe(true);
    expect(auth.playAsGuest).not.toHaveBeenCalled();
  });

  it('auto-asigna invitado y devuelve true cuando el usuario es anónimo', () => {
    const auth = makeAuthStub({ kind: 'anonymous' });
    TestBed.configureTestingModule({ providers: [{ provide: AuthService, useValue: auth }] });
    const result = TestBed.runInInjectionContext(() => canActivateIdentity());
    expect(result).toBe(true);
    expect(auth.playAsGuest).toHaveBeenCalledOnce();
  });
});
