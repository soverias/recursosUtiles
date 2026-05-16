import { Injectable, signal, computed, DestroyRef, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class PwaInstallService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly deferredPrompt = signal<BeforeInstallPromptEvent | null>(null);

  readonly canInstall = computed(() => this.deferredPrompt() !== null);

  constructor() {
    if (!isPlatformBrowser(this.platformId)) return;

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
