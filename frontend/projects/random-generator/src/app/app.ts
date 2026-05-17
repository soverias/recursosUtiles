import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

export type RandomMode = 'coin' | 'd6' | 'd20';
export type CoinFace = 'heads' | 'tails';

interface HistoryEntry {
  mode: RandomMode;
  label: string;
}

const COIN_DURATION_MS = 1200;
const DICE_DURATION_MS = 1000;
const D20_TICK_MS = 70;
const HISTORY_SIZE = 5;

const D6_ROTATIONS: Record<number, { x: number; y: number }> = {
  1: { x:   0, y:   0 },
  2: { x:   0, y: -90 },
  3: { x:  90, y:   0 },
  4: { x: -90, y:   0 },
  5: { x:   0, y:  90 },
  6: { x:   0, y: 180 },
};

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly modes: ReadonlyArray<{ id: RandomMode; label: string; icon: string }> = [
    { id: 'coin', label: 'Moneda', icon: '🪙' },
    { id: 'd6',   label: 'Dado',   icon: '🎲' },
    { id: 'd20',  label: 'D20',    icon: '🔮' },
  ];

  protected readonly mode = signal<RandomMode>('coin');
  protected readonly rolling = signal<boolean>(false);
  protected readonly history = signal<ReadonlyArray<HistoryEntry>>([]);

  protected readonly coinFace = signal<CoinFace>('heads');
  protected readonly coinSpins = signal<number>(0);

  protected readonly d6Value = signal<number>(1);
  protected readonly d6Spins = signal<number>(0);

  protected readonly d20Value = signal<number>(20);

  protected readonly coinRotation = computed<string>(() => {
    const base = this.coinSpins() * 360;
    const finalAngle = this.coinFace() === 'heads' ? 0 : 180;
    return `${base + finalAngle}deg`;
  });

  protected readonly d6Rotation = computed<{ x: string; y: string }>(() => {
    const r = D6_ROTATIONS[this.d6Value()];
    const base = this.d6Spins() * 360;
    return { x: `${base + r.x - 20}deg`, y: `${base + r.y - 30}deg` };
  });

  protected readonly d6Dots = computed<ReadonlyArray<ReadonlyArray<number>>>(() => [
    [5],
    [1, 9],
    [1, 5, 9],
    [1, 3, 7, 9],
    [1, 3, 5, 7, 9],
    [1, 3, 4, 6, 7, 9],
  ]);

  private d20Interval: ReturnType<typeof setInterval> | null = null;
  private d20Timeout: ReturnType<typeof setTimeout> | null = null;

  protected setMode(m: RandomMode): void {
    if (this.rolling()) return;
    this.mode.set(m);
  }

  protected roll(): void {
    if (this.rolling()) return;
    this.rolling.set(true);
    this.vibrate(30);

    const m = this.mode();
    if (m === 'coin') this.rollCoin();
    else if (m === 'd6') this.rollD6();
    else this.rollD20();
  }

  private rollCoin(): void {
    const result: CoinFace = Math.random() < 0.5 ? 'heads' : 'tails';
    this.coinSpins.update(s => s + 5);
    this.coinFace.set(result);
    window.setTimeout(() => this.finish(result === 'heads' ? 'Cara' : 'Cruz'), COIN_DURATION_MS);
  }

  private rollD6(): void {
    const result = 1 + Math.floor(Math.random() * 6);
    this.d6Spins.update(s => s + 2);
    this.d6Value.set(result);
    window.setTimeout(() => this.finish(String(result)), DICE_DURATION_MS);
  }

  private rollD20(): void {
    const result = 1 + Math.floor(Math.random() * 20);
    this.d20Interval = window.setInterval(() => {
      this.d20Value.set(1 + Math.floor(Math.random() * 20));
    }, D20_TICK_MS);
    this.d20Timeout = window.setTimeout(() => {
      if (this.d20Interval !== null) {
        clearInterval(this.d20Interval);
        this.d20Interval = null;
      }
      this.d20Timeout = null;
      this.d20Value.set(result);
      this.finish(String(result));
    }, DICE_DURATION_MS);
  }

  private finish(label: string): void {
    this.history.update(h => [{ mode: this.mode(), label }, ...h].slice(0, HISTORY_SIZE));
    this.rolling.set(false);
    this.vibrate(60);
  }

  private vibrate(ms: number): void {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(ms);
    }
  }
}
