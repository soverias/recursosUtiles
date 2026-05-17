import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@shared/auth';

type Tab = 'login' | 'register';

@Component({
  selector: 'app-auth-sheet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <div class="auth-backdrop" (click)="close.emit()"></div>
    <section class="auth-sheet" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <button
        type="button"
        class="auth-close"
        (click)="close.emit()"
        aria-label="Cerrar"
      >×</button>

      <header class="auth-header">
        <h2 id="auth-title" class="serif text-3xl font-bold text-rose-200" style="font-variation-settings: 'opsz' 144;">
          Comprometerse
        </h2>
        <p class="text-sm text-[var(--c-muted)] mt-1.5 leading-snug">
          Identifícate para que te enviemos recordatorios.
          Tu cuenta solo se usa para eso — tus hábitos siguen 100% locales.
        </p>
      </header>

      <div class="auth-tabs">
        <button
          type="button"
          (click)="tab.set('login')"
          [class.active]="tab() === 'login'"
        >Iniciar sesión</button>
        <button
          type="button"
          (click)="tab.set('register')"
          [class.active]="tab() === 'register'"
        >Crear cuenta</button>
      </div>

      <form class="auth-form" (submit)="submit($event)">
        <label class="auth-field">
          <span>Usuario</span>
          <input
            type="text"
            [(ngModel)]="username"
            name="username"
            autocomplete="username"
            required
            minlength="3"
            maxlength="32"
            [disabled]="loading()"
          />
        </label>
        <label class="auth-field">
          <span>Contraseña</span>
          <input
            type="password"
            [(ngModel)]="password"
            name="password"
            [autocomplete]="tab() === 'login' ? 'current-password' : 'new-password'"
            required
            minlength="6"
            [disabled]="loading()"
          />
        </label>

        @if (error()) {
          <p class="auth-error">{{ error() }}</p>
        }

        <button type="submit" class="auth-submit" [disabled]="loading()">
          {{ loading() ? 'Un momento…' : (tab() === 'login' ? 'Entrar' : 'Crear cuenta') }}
        </button>
      </form>
    </section>
  `,
})
export class AuthSheetComponent {
  private readonly auth = inject(AuthService);

  protected readonly tab = signal<Tab>('login');
  protected username = '';
  protected password = '';
  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);

  readonly close = output<void>();
  readonly success = output<void>();

  protected submit(event: Event): void {
    event.preventDefault();
    if (this.loading()) return;
    if (!this.username.trim() || this.password.length < 6) {
      this.error.set('Usuario y contraseña (mín. 6 chars) son obligatorios');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const obs = this.tab() === 'login'
      ? this.auth.login(this.username.trim(), this.password)
      : this.auth.register(this.username.trim(), this.password);

    obs.subscribe({
      next: () => {
        this.loading.set(false);
        this.success.emit();
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err?.error?.error ?? (this.tab() === 'login' ? 'Credenciales inválidas' : 'No se pudo crear la cuenta');
        this.error.set(msg);
      },
    });
  }
}
