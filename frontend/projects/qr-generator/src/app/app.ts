import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { copyToClipboard, EccLevel, generateQrSvg } from '@shared/util';

const ECC_LEVELS: ReadonlyArray<{ value: EccLevel; label: string; recovery: string }> = [
  { value: 'L', label: 'L', recovery: '~7%' },
  { value: 'M', label: 'M', recovery: '~15%' },
  { value: 'Q', label: 'Q', recovery: '~25%' },
  { value: 'H', label: 'H', recovery: '~30%' },
];

const PNG_SIZE = 1024;

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, NgClass],
})
export class App {
  private readonly sanitizer = inject(DomSanitizer);

  protected readonly text = signal<string>('https://recursosutiles.local');
  protected readonly ecc  = signal<EccLevel>('M');
  protected readonly copied = signal<boolean>(false);

  protected readonly eccLevels = ECC_LEVELS;
  protected readonly canShareFiles = typeof navigator !== 'undefined'
    && typeof navigator.canShare === 'function';

  protected readonly svgRaw = computed<{ ok: true; svg: string } | { ok: false; error: string }>(() => {
    const value = this.text().trim();
    if (!value) return { ok: false, error: 'Escribe algo para generar tu QR' };
    try {
      return { ok: true, svg: generateQrSvg({ text: value, ecc: this.ecc() }) };
    } catch {
      return { ok: false, error: 'Texto demasiado largo para este nivel ECC. Prueba a bajarlo o acorta el texto.' };
    }
  });

  protected readonly svgSafe = computed<SafeHtml | null>(() => {
    const v = this.svgRaw();
    return v.ok ? this.sanitizer.bypassSecurityTrustHtml(v.svg) : null;
  });

  protected setEcc(level: EccLevel): void {
    this.ecc.set(level);
  }

  protected async copyText(): Promise<void> {
    const ok = await copyToClipboard(this.text());
    if (!ok) return;
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2000);
  }

  protected downloadSvg(): void {
    const v = this.svgRaw();
    if (!v.ok) return;
    const blob = new Blob([v.svg], { type: 'image/svg+xml' });
    this.downloadBlob(blob, `qr-${Date.now()}.svg`);
  }

  protected async downloadPng(): Promise<void> {
    const blob = await this.renderPngBlob();
    if (!blob) return;
    this.downloadBlob(blob, `qr-${Date.now()}.png`);
  }

  protected async share(): Promise<void> {
    if (!this.canShareFiles) return;
    const blob = await this.renderPngBlob();
    if (!blob) return;
    const file = new File([blob], 'qr.png', { type: 'image/png' });
    if (!navigator.canShare({ files: [file] })) return;
    try {
      await navigator.share({ files: [file], title: 'Código QR' });
    } catch {
      // User cancelled or share unavailable — silent
    }
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  private renderPngBlob(): Promise<Blob | null> {
    const v = this.svgRaw();
    if (!v.ok) return Promise.resolve(null);

    return new Promise<Blob | null>(resolve => {
      const img = new Image();
      const svgBlob = new Blob([v.svg], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = PNG_SIZE;
        canvas.height = PNG_SIZE;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(svgUrl);
          resolve(null);
          return;
        }
        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, PNG_SIZE, PNG_SIZE);
        ctx.drawImage(img, 0, 0, PNG_SIZE, PNG_SIZE);
        URL.revokeObjectURL(svgUrl);
        canvas.toBlob(blob => resolve(blob), 'image/png');
      };
      img.onerror = () => {
        URL.revokeObjectURL(svgUrl);
        resolve(null);
      };
      img.src = svgUrl;
    });
  }
}
