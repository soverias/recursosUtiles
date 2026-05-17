import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

export type RandomMode = 'coin' | 'd6' | 'd20' | 'slot' | 'wheel' | 'magic8';
export type CoinFace = 'heads' | 'tails';

interface HistoryEntry {
  mode: RandomMode;
  label: string;
}

interface WheelSlice {
  index: number;
  path: string;
  color: string;
  label: string;
  labelX: number;
  labelY: number;
  labelRotation: number;
}

const COIN_DURATION_MS = 1200;
const DICE_DURATION_MS = 1000;
const SLOT_DURATION_MS = 1500;
const WHEEL_DURATION_MS = 3600;
const MAGIC8_REVEAL_MS = 1500;
const D20_TICK_MS = 70;
const HISTORY_SIZE = 5;
const WHEEL_RADIUS = 100;
const WHEEL_CENTER = 110;
const WHEEL_LABEL_RADIUS = 65;
const WHEEL_PALETTE: ReadonlyArray<string> = ['#f59e0b', '#b45309'];

const D6_ROTATIONS: Record<number, { x: number; y: number }> = {
  1: { x:   0, y:   0 },
  2: { x:   0, y: -90 },
  3: { x:  90, y:   0 },
  4: { x: -90, y:   0 },
  5: { x:   0, y:  90 },
  6: { x:   0, y: 180 },
};

const MAGIC8_ANSWERS: ReadonlyArray<string> = [
  'Sin duda',
  'Definitivamente sí',
  'Es seguro',
  'Cuenta con ello',
  'Sí',
  'Las señales apuntan a sí',
  'Pregunta más tarde',
  'Mejor no contestar ahora',
  'No puedo predecirlo ahora',
  'Concéntrate y pregunta',
  'No cuentes con ello',
  'Mi respuesta es no',
  'Mis fuentes dicen que no',
  'Muy dudoso',
];

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
})
export class App {
  protected readonly modes: ReadonlyArray<{ id: RandomMode; label: string; icon: string }> = [
    { id: 'coin',   label: 'Moneda', icon: '🪙' },
    { id: 'd6',     label: 'Dado',   icon: '🎲' },
    { id: 'd20',    label: 'D20',    icon: '🔮' },
    { id: 'slot',   label: 'Rango',  icon: '🎰' },
    { id: 'wheel',  label: 'Ruleta', icon: '🎡' },
    { id: 'magic8', label: 'Bola 8', icon: '🎱' },
  ];

  protected readonly mode = signal<RandomMode>('coin');
  protected readonly rolling = signal<boolean>(false);
  protected readonly history = signal<ReadonlyArray<HistoryEntry>>([]);

  // ─── Coin ─────────────────────────────────────────────────────────────
  protected readonly coinFace = signal<CoinFace>('heads');
  protected readonly coinSpins = signal<number>(0);
  protected readonly coinRotation = computed<string>(() => {
    const base = this.coinSpins() * 360;
    return `${base + (this.coinFace() === 'heads' ? 0 : 180)}deg`;
  });

  // ─── D6 ───────────────────────────────────────────────────────────────
  protected readonly d6Value = signal<number>(1);
  protected readonly d6Spins = signal<number>(0);
  protected readonly d6Rotation = computed<{ x: string; y: string }>(() => {
    const r = D6_ROTATIONS[this.d6Value()];
    const base = this.d6Spins() * 360;
    return { x: `${base + r.x - 20}deg`, y: `${base + r.y - 30}deg` };
  });
  protected readonly d6Dots: ReadonlyArray<ReadonlyArray<number>> = [
    [5],
    [1, 9],
    [1, 5, 9],
    [1, 3, 7, 9],
    [1, 3, 5, 7, 9],
    [1, 3, 4, 6, 7, 9],
  ];
  protected readonly cellRange = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  protected readonly digitStrip = Array.from({ length: 100 }, (_, i) => i % 10);

  // ─── D20 ──────────────────────────────────────────────────────────────
  protected readonly d20Value = signal<number>(20);
  private d20Interval: ReturnType<typeof setInterval> | null = null;
  private d20Timeout: ReturnType<typeof setTimeout> | null = null;

  // ─── Slot ─────────────────────────────────────────────────────────────
  protected readonly slotMin = signal<number>(1);
  protected readonly slotMax = signal<number>(100);
  protected readonly slotValue = signal<number>(1);
  protected readonly slotSpins = signal<number>(0);
  protected readonly slotSnap = signal<boolean>(false);
  protected readonly slotDigitCount = computed<number>(() =>
    String(Math.max(1, this.slotMax())).length,
  );
  protected readonly slotDigits = computed<ReadonlyArray<number>>(() => {
    const padded = String(this.slotValue()).padStart(this.slotDigitCount(), '0');
    return padded.split('').map(Number);
  });

  // ─── Wheel ────────────────────────────────────────────────────────────
  protected readonly wheelItems = signal<ReadonlyArray<string>>(['Sí', 'No', 'Tal vez']);
  protected readonly wheelInput = signal<string>('');
  protected readonly wheelRotation = signal<number>(0);
  protected readonly wheelWinner = signal<string | null>(null);
  protected readonly wheelSlices = computed<ReadonlyArray<WheelSlice>>(() => {
    const items = this.wheelItems();
    const n = items.length;
    if (n === 0) return [];
    const sliceAngle = 360 / n;
    return items.map((label, i) => {
      const startRad = ((i * sliceAngle) - 90) * Math.PI / 180;
      const endRad = (((i + 1) * sliceAngle) - 90) * Math.PI / 180;
      const x1 = WHEEL_CENTER + WHEEL_RADIUS * Math.cos(startRad);
      const y1 = WHEEL_CENTER + WHEEL_RADIUS * Math.sin(startRad);
      const x2 = WHEEL_CENTER + WHEEL_RADIUS * Math.cos(endRad);
      const y2 = WHEEL_CENTER + WHEEL_RADIUS * Math.sin(endRad);
      const largeArc = sliceAngle > 180 ? 1 : 0;
      const midDeg = (i + 0.5) * sliceAngle - 90;
      const midRad = midDeg * Math.PI / 180;
      const labelX = WHEEL_CENTER + WHEEL_LABEL_RADIUS * Math.cos(midRad);
      const labelY = WHEEL_CENTER + WHEEL_LABEL_RADIUS * Math.sin(midRad);
      return {
        index: i,
        path: n === 1
          ? `M ${WHEEL_CENTER - WHEEL_RADIUS} ${WHEEL_CENTER} a ${WHEEL_RADIUS} ${WHEEL_RADIUS} 0 1 1 ${WHEEL_RADIUS * 2} 0 a ${WHEEL_RADIUS} ${WHEEL_RADIUS} 0 1 1 ${-WHEEL_RADIUS * 2} 0`
          : `M ${WHEEL_CENTER} ${WHEEL_CENTER} L ${x1} ${y1} A ${WHEEL_RADIUS} ${WHEEL_RADIUS} 0 ${largeArc} 1 ${x2} ${y2} Z`,
        color: WHEEL_PALETTE[i % WHEEL_PALETTE.length],
        label,
        labelX,
        labelY,
        labelRotation: midDeg + 90,
      };
    });
  });

  // ─── Magic 8 ──────────────────────────────────────────────────────────
  protected readonly magic8Question = signal<string>('');
  protected readonly magic8Answer = signal<string | null>(null);
  protected readonly magic8Shaking = signal<boolean>(false);

  protected setMode(m: RandomMode): void {
    if (this.rolling()) return;
    this.mode.set(m);
  }

  protected addWheelItem(): void {
    const raw = this.wheelInput().trim();
    if (!raw) return;
    if (this.wheelItems().length >= 12) return;
    this.wheelItems.update(items => [...items, raw]);
    this.wheelInput.set('');
    this.wheelWinner.set(null);
  }

  protected removeWheelItem(index: number): void {
    if (this.rolling()) return;
    this.wheelItems.update(items => items.filter((_, i) => i !== index));
    this.wheelWinner.set(null);
  }

  protected updateSlotMin(value: number): void {
    if (this.rolling()) return;
    const v = Math.floor(Math.max(0, Math.min(value, 99_999)));
    this.slotMin.set(v);
    if (v > this.slotMax()) this.slotMax.set(v);
  }

  protected updateSlotMax(value: number): void {
    if (this.rolling()) return;
    const v = Math.floor(Math.max(0, Math.min(value, 99_999)));
    this.slotMax.set(v);
    if (v < this.slotMin()) this.slotMin.set(v);
  }

  protected roll(): void {
    if (this.rolling()) return;
    this.rolling.set(true);
    this.vibrate(30);

    const m = this.mode();
    if (m === 'coin')        this.rollCoin();
    else if (m === 'd6')     this.rollD6();
    else if (m === 'd20')    this.rollD20();
    else if (m === 'slot')   this.rollSlot();
    else if (m === 'wheel')  this.rollWheel();
    else                     this.rollMagic8();
  }

  protected canRoll(): boolean {
    if (this.rolling()) return false;
    const m = this.mode();
    if (m === 'slot')   return this.slotMin() < this.slotMax() || this.slotMin() === this.slotMax();
    if (m === 'wheel')  return this.wheelItems().length >= 2;
    if (m === 'magic8') return this.magic8Question().trim().length > 0;
    return true;
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

  private rollSlot(): void {
    const min = this.slotMin();
    const max = this.slotMax();
    const range = max - min + 1;
    const result = min + Math.floor(Math.random() * range);
    this.slotSpins.update(s => s + 6);
    this.slotValue.set(result);
    window.setTimeout(() => {
      // Snap reset so the strip offset stays bounded across many rolls.
      // Same digit shows at any offset that is a multiple of 10 away, so the snap is invisible.
      this.slotSnap.set(true);
      this.slotSpins.set(0);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => this.slotSnap.set(false));
      });
      this.finish(String(result));
    }, SLOT_DURATION_MS);
  }

  private rollWheel(): void {
    const items = this.wheelItems();
    const n = items.length;
    const winner = Math.floor(Math.random() * n);
    const sliceAngle = 360 / n;
    // Place the centre of the winning slice under the pointer (top, 0°).
    // Current orientation: each slice i is drawn starting at i*sliceAngle - 90°.
    // To bring slice winner's centre to top, we need wheelRotation ≡ -((winner+0.5)*sliceAngle) mod 360
    const targetMod = ((-(winner + 0.5) * sliceAngle) % 360 + 360) % 360;
    const currentMod = ((this.wheelRotation() % 360) + 360) % 360;
    let delta = (targetMod - currentMod + 360) % 360;
    const baseSpins = 1080;
    this.wheelRotation.update(r => r + baseSpins + delta);
    this.wheelWinner.set(null);
    window.setTimeout(() => {
      const label = items[winner];
      this.wheelWinner.set(label);
      this.finish(label);
    }, WHEEL_DURATION_MS);
  }

  private rollMagic8(): void {
    this.magic8Answer.set(null);
    this.magic8Shaking.set(true);
    const answer = MAGIC8_ANSWERS[Math.floor(Math.random() * MAGIC8_ANSWERS.length)];
    window.setTimeout(() => {
      this.magic8Shaking.set(false);
      this.magic8Answer.set(answer);
      this.finish(answer);
    }, MAGIC8_REVEAL_MS);
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
