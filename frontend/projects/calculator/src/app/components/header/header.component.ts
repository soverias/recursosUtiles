import { ChangeDetectionStrategy, Component, output, signal } from '@angular/core';

@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="calc-header">
      <div class="w-full max-w-2xl mx-auto flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button data-hamburger class="calc-hamburger" (click)="menuToggle.emit()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" class="w-5 h-5">
              <path d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
          <h1>Calculadora</h1>
        </div>

        @if (canInstall()) {
          <button class="calc-install-btn" (click)="install()">Instalar</button>
        }
      </div>
    </header>
  `,
})
export class HeaderComponent {
  readonly menuToggle = output<void>();
  readonly canInstall = signal(false);
  private deferredPrompt: BeforeInstallPromptEvent | null = null;

  constructor() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e as BeforeInstallPromptEvent;
      this.canInstall.set(true);
    });
  }

  install(): void {
    this.deferredPrompt?.prompt();
    this.deferredPrompt = null;
    this.canInstall.set(false);
  }
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): void;
}
