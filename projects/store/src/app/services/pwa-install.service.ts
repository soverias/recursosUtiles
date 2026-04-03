import { Injectable, signal, computed, DestroyRef, inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PwaInstallService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly deferredPrompt = signal<BeforeInstallPromptEvent | null>(null);

  readonly canInstall = computed(() => this.deferredPrompt() !== null);

  constructor() {
    const handler = (event: BeforeInstallPromptEvent) => {
      event.preventDefault();
      this.deferredPrompt.set(event);
    };

    window.addEventListener('beforeinstallprompt', handler);

    this.destroyRef.onDestroy(() => {
      window.removeEventListener('beforeinstallprompt', handler);
    });
  }

  async promptInstall(): Promise<void> {
    const prompt = this.deferredPrompt();
    if (!prompt) return;

    this.deferredPrompt.set(null);
    await prompt.prompt();
  }
}
