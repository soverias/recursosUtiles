import { UnitCategory, UnitCategoryMeta, UnitDefinition } from '../models/unit.model';

function makeUnit(
  symbol: string,
  name: string,
  category: UnitCategory,
  toBase: (v: number) => number,
  fromBase: (v: number) => number,
): UnitDefinition {
  return { symbol, name, category, toBase, fromBase };
}

// ── Data (base: B) ──────────────────────────────────────────────────────────
const B = makeUnit('B', 'Bytes', 'data', v => v, v => v);
const KB = makeUnit('KB', 'Kilobytes', 'data', v => v * 1024, v => v / 1024);
const MB = makeUnit('MB', 'Megabytes', 'data', v => v * 1024 ** 2, v => v / 1024 ** 2);
const GB = makeUnit('GB', 'Gigabytes', 'data', v => v * 1024 ** 3, v => v / 1024 ** 3);
const TB = makeUnit('TB', 'Terabytes', 'data', v => v * 1024 ** 4, v => v / 1024 ** 4);

// ── Weight (base: g) ────────────────────────────────────────────────────────
const g = makeUnit('g', 'Gramos', 'weight', v => v, v => v);
const kg = makeUnit('kg', 'Kilogramos', 'weight', v => v * 1000, v => v / 1000);
const lb = makeUnit('lb', 'Libras', 'weight', v => v * 453.592, v => v / 453.592);
const oz = makeUnit('oz', 'Onzas', 'weight', v => v * 28.3495, v => v / 28.3495);

// ── Volume (base: mL) ───────────────────────────────────────────────────────
const mL = makeUnit('mL', 'Mililitros', 'volume', v => v, v => v);
const L = makeUnit('L', 'Litros', 'volume', v => v * 1000, v => v / 1000);
const gal = makeUnit('gal', 'Galones (US)', 'volume', v => v * 3785.41, v => v / 3785.41);
const floz = makeUnit('floz', 'Onzas fluidas', 'volume', v => v * 29.5735, v => v / 29.5735);

// ── Length (base: mm) ───────────────────────────────────────────────────────
const mm = makeUnit('mm', 'Milímetros', 'length', v => v, v => v);
const cm = makeUnit('cm', 'Centímetros', 'length', v => v * 10, v => v / 10);
const m = makeUnit('m', 'Metros', 'length', v => v * 1000, v => v / 1000);
const km = makeUnit('km', 'Kilómetros', 'length', v => v * 1_000_000, v => v / 1_000_000);
const inch = makeUnit('in', 'Pulgadas', 'length', v => v * 25.4, v => v / 25.4);
const ft = makeUnit('ft', 'Pies', 'length', v => v * 304.8, v => v / 304.8);
const mi = makeUnit('mi', 'Millas', 'length', v => v * 1_609_344, v => v / 1_609_344);

// ── Temperature (base: K) ───────────────────────────────────────────────────
const K = makeUnit('K', 'Kelvin', 'temperature', v => v, v => v);
const C = makeUnit('C', 'Celsius', 'temperature',
  v => v + 273.15,
  v => v - 273.15,
);
const F = makeUnit('F', 'Fahrenheit', 'temperature',
  v => (v - 32) * 5 / 9 + 273.15,
  v => (v - 273.15) * 9 / 5 + 32,
);

// ── Category definitions ────────────────────────────────────────────────────
export const UNIT_CATEGORIES: readonly UnitCategoryMeta[] = [
  {
    category: 'numeric',
    label: 'Numérico',
    baseUnit: '',
    units: [],
  },
  {
    category: 'data',
    label: 'Datos',
    baseUnit: 'B',
    units: [B, KB, MB, GB, TB],
  },
  {
    category: 'weight',
    label: 'Peso',
    baseUnit: 'g',
    units: [g, kg, lb, oz],
  },
  {
    category: 'volume',
    label: 'Volumen',
    baseUnit: 'mL',
    units: [mL, L, gal, floz],
  },
  {
    category: 'length',
    label: 'Longitud',
    baseUnit: 'mm',
    units: [mm, cm, m, km, inch, ft, mi],
  },
  {
    category: 'temperature',
    label: 'Temperatura',
    baseUnit: 'K',
    units: [K, C, F],
  },
];

// ── Lookup map (symbol → UnitDefinition) ───────────────────────────────────
export const UNIT_MAP: ReadonlyMap<string, UnitDefinition> = new Map(
  UNIT_CATEGORIES.flatMap(cat => cat.units).map(u => [u.symbol, u]),
);

// Also accept °C and °F as aliases
(UNIT_MAP as Map<string, UnitDefinition>).set('°C', C);
(UNIT_MAP as Map<string, UnitDefinition>).set('°F', F);

export function findUnit(symbol: string): UnitDefinition | null {
  return UNIT_MAP.get(symbol) ?? null;
}
