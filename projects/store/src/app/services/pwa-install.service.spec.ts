import { TestBed } from '@angular/core/testing';
import { PwaInstallService } from './pwa-install.service';

function makePromptEvent(): BeforeInstallPromptEvent {
  const event = new Event('beforeinstallprompt') as BeforeInstallPromptEvent;
  (event as any).prompt = vi.fn().mockResolvedValue({ outcome: 'accepted' });
  return event;
}

describe('PwaInstallService', () => {
  let service: PwaInstallService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PwaInstallService);
  });

  it('PWA-01: canInstall is false by default', () => {
    expect(service.canInstall()).toBe(false);
  });

  it('PWA-02: canInstall becomes true after beforeinstallprompt fires', () => {
    const event = makePromptEvent();
    window.dispatchEvent(event);
    expect(service.canInstall()).toBe(true);
  });

  it('PWA-03: promptInstall calls prompt() on the captured event', async () => {
    const event = makePromptEvent();
    window.dispatchEvent(event);
    await service.promptInstall();
    expect((event as any).prompt).toHaveBeenCalledOnce();
  });

  it('PWA-04: promptInstall is a no-op when canInstall is false', async () => {
    await expect(service.promptInstall()).resolves.toBeUndefined();
    expect(service.canInstall()).toBe(false);
  });

  it('PWA-05: canInstall becomes false after promptInstall resolves', async () => {
    const event = makePromptEvent();
    window.dispatchEvent(event);
    expect(service.canInstall()).toBe(true);
    await service.promptInstall();
    expect(service.canInstall()).toBe(false);
  });
});
