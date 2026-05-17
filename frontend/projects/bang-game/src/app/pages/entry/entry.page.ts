import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@shared/auth';

type Tab = 'login' | 'register';

@Component({
  selector: 'app-entry-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div class="w-full max-w-sm">
        <h1 class="text-4xl font-black text-white text-center mb-8 tracking-tight">BANG!</h1>

        <!-- Tabs -->
        <div class="flex mb-6 bg-gray-800 rounded-xl p-1">
          <button
            data-tab-login
            (click)="activeTab.set('login')"
            class="flex-1 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-colors"
            [class]="activeTab() === 'login' ? 'bg-white text-gray-900' : 'text-gray-400'"
          >Iniciar sesión</button>
          <button
            data-tab-register
            (click)="activeTab.set('register')"
            class="flex-1 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-colors"
            [class]="activeTab() === 'register' ? 'bg-white text-gray-900' : 'text-gray-400'"
          >Registrarse</button>
        </div>

        <!-- Login form -->
        @if (activeTab() === 'login') {
          <form data-login-form (ngSubmit)="onLogin()" class="space-y-3">
            <input data-username type="text" placeholder="Username"
              [value]="username()" (input)="username.set($any($event.target).value)"
              class="w-full px-4 py-3 rounded-xl bg-gray-800 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-yellow-400" />
            <input data-password type="password" placeholder="Contraseña"
              [value]="password()" (input)="password.set($any($event.target).value)"
              class="w-full px-4 py-3 rounded-xl bg-gray-800 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-yellow-400" />
            @if (error()) {
              <p data-error class="text-red-400 text-sm text-center">{{ error() }}</p>
            }
            <button data-login-btn type="button" (click)="onLogin()"
              class="w-full py-3 rounded-xl bg-yellow-400 text-gray-900 font-bold cursor-pointer hover:bg-yellow-300 active:scale-95 transition-all">
              Iniciar sesión
            </button>
          </form>
        }

        <!-- Register form -->
        @if (activeTab() === 'register') {
          <form data-register-form (ngSubmit)="onRegister()" class="space-y-3">
            <input data-username type="text" placeholder="Username"
              [value]="username()" (input)="username.set($any($event.target).value)"
              class="w-full px-4 py-3 rounded-xl bg-gray-800 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-yellow-400" />
            <input data-password type="password" placeholder="Contraseña"
              [value]="password()" (input)="password.set($any($event.target).value)"
              class="w-full px-4 py-3 rounded-xl bg-gray-800 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-yellow-400" />
            @if (error()) {
              <p data-error class="text-red-400 text-sm text-center">{{ error() }}</p>
            }
            <button data-register-btn type="button" (click)="onRegister()"
              class="w-full py-3 rounded-xl bg-yellow-400 text-gray-900 font-bold cursor-pointer hover:bg-yellow-300 active:scale-95 transition-all">
              Registrarse
            </button>
          </form>
        }

        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-700"></div>
          </div>
          <div class="relative flex justify-center">
            <span class="px-3 bg-gray-950 text-gray-500 text-sm">o</span>
          </div>
        </div>

        <button data-guest-btn (click)="onGuest()"
          class="w-full py-3 rounded-xl border border-gray-600 text-gray-300 font-semibold cursor-pointer hover:border-gray-400 active:scale-95 transition-all">
          Jugar como invitado
        </button>
      </div>
    </div>
  `,
})
export class EntryPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly activeTab = signal<Tab>('login');
  readonly username = signal('');
  readonly password = signal('');
  readonly error = signal('');

  onLogin(): void {
    this.error.set('');
    this.auth.login(this.username(), this.password()).subscribe({
      next: () => this.router.navigate(['/lobby']),
      error: () => this.error.set('Credenciales incorrectas'),
    });
  }

  onRegister(): void {
    this.error.set('');
    this.auth.register(this.username(), this.password()).subscribe({
      next: () => this.router.navigate(['/lobby']),
      error: (err) => {
        this.error.set(err?.status === 409 ? 'Username no disponible' : 'Error al registrarse');
      },
    });
  }

  onGuest(): void {
    this.auth.playAsGuest();
    this.router.navigate(['/lobby']);
  }
}
