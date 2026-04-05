import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { EntryPage } from './entry.page';
import { AuthService } from '../../core/services/auth.service';

const makeAuthStub = () => ({
  currentUser: signal({ kind: 'anonymous' } as const),
  login: vi.fn().mockReturnValue(of({ id: 'u1', username: 'alice', token: 'jwt' })),
  register: vi.fn().mockReturnValue(of({ id: 'u1', username: 'alice', token: 'jwt' })),
  playAsGuest: vi.fn(),
});

describe('EntryPage', () => {
  let fixture: ComponentFixture<EntryPage>;
  let auth: ReturnType<typeof makeAuthStub>;
  let router: Router;

  beforeEach(() => {
    auth = makeAuthStub();
    TestBed.configureTestingModule({
      imports: [EntryPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
      ],
    });
    fixture = TestBed.createComponent(EntryPage);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('renders "Jugar como invitado" button', () => {
    expect(fixture.nativeElement.querySelector('[data-guest-btn]')).not.toBeNull();
  });

  it('renders login form by default', () => {
    expect(fixture.nativeElement.querySelector('[data-login-form]')).not.toBeNull();
  });

  it('renders register form when tab is switched', () => {
    fixture.nativeElement.querySelector('[data-tab-register]').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-register-form]')).not.toBeNull();
  });

  it('playAsGuest is called and navigates to /lobby when guest button clicked', async () => {
    const spy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.nativeElement.querySelector('[data-guest-btn]').click();
    expect(auth.playAsGuest).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith(['/lobby']);
  });

  it('login is called with username and password and navigates to /lobby on success', async () => {
    const spy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const form = fixture.nativeElement.querySelector('[data-login-form]');
    form.querySelector('[data-username]').value = 'alice';
    form.querySelector('[data-username]').dispatchEvent(new Event('input'));
    form.querySelector('[data-password]').value = 'pass123';
    form.querySelector('[data-password]').dispatchEvent(new Event('input'));
    fixture.detectChanges();
    form.querySelector('[data-login-btn]').click();
    expect(auth.login).toHaveBeenCalledWith('alice', 'pass123');
    expect(spy).toHaveBeenCalledWith(['/lobby']);
  });

  it('register shows error when username is taken (HTTP 409)', async () => {
    auth.register.mockReturnValue(throwError(() => ({ status: 409 })));
    fixture.nativeElement.querySelector('[data-tab-register]').click();
    fixture.detectChanges();

    const form = fixture.nativeElement.querySelector('[data-register-form]');
    form.querySelector('[data-username]').value = 'alice';
    form.querySelector('[data-username]').dispatchEvent(new Event('input'));
    form.querySelector('[data-password]').value = 'pass';
    form.querySelector('[data-password]').dispatchEvent(new Event('input'));
    fixture.detectChanges();
    form.querySelector('[data-register-btn]').click();
    fixture.detectChanges();

    const error = fixture.nativeElement.querySelector('[data-error]');
    expect(error).not.toBeNull();
    expect(error.textContent).toContain('Username no disponible');
  });
});
