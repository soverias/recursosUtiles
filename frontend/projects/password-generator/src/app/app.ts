import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PasswordGeneratorService, buildCharset } from './core/services/password-generator.service';
import { HistoryService } from './core/services/history.service';
import { DEFAULT_OPTIONS, GenerateOptions } from './core/models/options.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
})
export class App {
  private readonly gen = inject(PasswordGeneratorService);
  protected readonly history = inject(HistoryService);

  protected readonly length         = signal(DEFAULT_OPTIONS.length);
  protected readonly uppercase      = signal(DEFAULT_OPTIONS.uppercase);
  protected readonly lowercase      = signal(DEFAULT_OPTIONS.lowercase);
  protected readonly numbers        = signal(DEFAULT_OPTIONS.numbers);
  protected readonly symbols        = signal(DEFAULT_OPTIONS.symbols);
  protected readonly excludeSimilar = signal(DEFAULT_OPTIONS.excludeSimilar);

  protected readonly password = signal<string>('');
  protected readonly copied   = signal<boolean>(false);
  protected readonly showHistory = signal<boolean>(false);

  protected readonly options = computed<GenerateOptions>(() => ({
    length: this.length(),
    uppercase: this.uppercase(),
    lowercase: this.lowercase(),
    numbers: this.numbers(),
    symbols: this.symbols(),
    excludeSimilar: this.excludeSimilar(),
  }));

  protected readonly charsetEmpty = computed(() => buildCharset(this.options()).length === 0);

  constructor() {
    // Auto-regenerate whenever any option changes
    effect(() => {
      const opts = this.options();
      this.password.set(this.gen.generate(opts));
    });
  }

  protected regenerate(): void {
    this.password.set(this.gen.generate(this.options()));
  }

  protected onLengthInput(event: Event): void {
    const v = +(event.target as HTMLInputElement).value;
    if (Number.isFinite(v)) this.length.set(Math.max(4, Math.min(64, v)));
  }

  protected async copy(value: string = this.password()): Promise<void> {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      this.history.add(value);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch {
      // Fallback: silently no-op. Modern browsers support clipboard API
      // in both secure and insecure contexts for user-initiated events.
    }
  }

  protected toggleHistory(): void {
    this.showHistory.update(v => !v);
  }

  protected formatTime(ts: number): string {
    return new Date(ts).toLocaleString('es-ES', {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  }
}
