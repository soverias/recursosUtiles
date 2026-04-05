import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { signal } from '@angular/core';
import { HeaderComponent } from './header.component';
import { PwaInstallService } from '../../services/pwa-install.service';

function createMockPwaService(canInstall: boolean) {
  const canInstallSignal = signal(canInstall);
  return {
    canInstall: canInstallSignal.asReadonly(),
    promptInstall: vi.fn().mockResolvedValue(undefined),
  };
}

function createComponent(canInstall = false): {
  fixture: ComponentFixture<HeaderComponent>;
  mockService: ReturnType<typeof createMockPwaService>;
} {
  const mockService = createMockPwaService(canInstall);
  TestBed.overrideProvider(PwaInstallService, { useValue: mockService });
  const fixture = TestBed.createComponent(HeaderComponent);
  fixture.detectChanges();
  return { fixture, mockService };
}

describe('HeaderComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
    }).compileComponents();
  });

  it('HDR-04: renders the app name', () => {
    const { fixture } = createComponent();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Store');
  });

  it('HDR-01: install button is NOT visible when canInstall is false', () => {
    const { fixture } = createComponent(false);
    const el = fixture.nativeElement as HTMLElement;
    const button = el.querySelector('button');
    expect(button).toBeNull();
  });

  it('HDR-02: install button IS visible when canInstall is true', () => {
    const { fixture } = createComponent(true);
    const el = fixture.nativeElement as HTMLElement;
    const button = el.querySelector('button');
    expect(button).not.toBeNull();
    expect(button?.textContent?.trim()).toContain('Instalar');
  });

  it('HDR-03: clicking install button calls promptInstall()', async () => {
    const { fixture, mockService } = createComponent(true);
    const el = fixture.nativeElement as HTMLElement;
    const button = el.querySelector('button') as HTMLButtonElement;
    button.click();
    expect(mockService.promptInstall).toHaveBeenCalledOnce();
  });
});
