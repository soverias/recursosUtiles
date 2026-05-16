import { describe, it, expect } from 'vitest';
import { UNIT_CATEGORIES, findUnit, UNIT_MAP } from './conversion';

describe('conversion — round-trip accuracy', () => {
  it('CONV-01: round-trip for all units returns original value', () => {
    for (const cat of UNIT_CATEGORIES) {
      for (const unit of cat.units) {
        const original = 42;
        const result = unit.fromBase(unit.toBase(original));
        expect(result).toBeCloseTo(original, 6);
      }
    }
  });

  it('CONV-02: 1 GB = 1073741824 B', () => {
    const gb = findUnit('GB')!;
    expect(gb.toBase(1)).toBe(1073741824);
  });

  it('CONV-03: 1 TB = 1099511627776 B', () => {
    const tb = findUnit('TB')!;
    expect(tb.toBase(1)).toBe(1099511627776);
  });

  it('CONV-04: 1 MB = 1048576 B', () => {
    const mb = findUnit('MB')!;
    expect(mb.toBase(1)).toBe(1048576);
  });

  it('CONV-05: 1 KB = 1024 B', () => {
    const kb = findUnit('KB')!;
    expect(kb.toBase(1)).toBe(1024);
  });

  it('CONV-06: 1 kg = 1000 g', () => {
    const kg = findUnit('kg')!;
    expect(kg.toBase(1)).toBe(1000);
  });

  it('CONV-07: 1 lb ≈ 453.592 g', () => {
    const lb = findUnit('lb')!;
    expect(lb.toBase(1)).toBeCloseTo(453.592, 3);
  });

  it('CONV-08: 1 oz ≈ 28.3495 g', () => {
    const oz = findUnit('oz')!;
    expect(oz.toBase(1)).toBeCloseTo(28.3495, 4);
  });

  it('CONV-09: 1 L = 1000 mL', () => {
    const l = findUnit('L')!;
    expect(l.toBase(1)).toBe(1000);
  });

  it('CONV-10: 1 gal ≈ 3785.41 mL', () => {
    const gal = findUnit('gal')!;
    expect(gal.toBase(1)).toBeCloseTo(3785.41, 2);
  });

  it('CONV-11: 1 km = 1000000 mm', () => {
    const km = findUnit('km')!;
    expect(km.toBase(1)).toBe(1_000_000);
  });

  it('CONV-12: 1 m = 1000 mm', () => {
    const m = findUnit('m')!;
    expect(m.toBase(1)).toBe(1000);
  });

  it('CONV-13: 1 in = 25.4 mm', () => {
    const inch = findUnit('in')!;
    expect(inch.toBase(1)).toBe(25.4);
  });

  it('CONV-14: 1 ft = 304.8 mm', () => {
    const ft = findUnit('ft')!;
    expect(ft.toBase(1)).toBe(304.8);
  });

  it('CONV-15: 0 °C = 273.15 K', () => {
    const c = findUnit('C')!;
    expect(c.toBase(0)).toBeCloseTo(273.15, 5);
  });

  it('CONV-16: 32 °F ≈ 273.15 K', () => {
    const f = findUnit('F')!;
    expect(f.toBase(32)).toBeCloseTo(273.15, 5);
  });

  it('CONV-17: 273.15 K = 0 °C', () => {
    const k = findUnit('K')!;
    const c = findUnit('C')!;
    expect(c.fromBase(k.toBase(273.15))).toBeCloseTo(0, 5);
  });

  it('CONV-18: findUnit returns null for unknown symbol', () => {
    expect(findUnit('XYZ')).toBeNull();
  });

  it('CONV-19: UNIT_MAP contains all expected symbols', () => {
    const expectedSymbols = ['B', 'KB', 'MB', 'GB', 'TB', 'g', 'kg', 'lb', 'oz',
      'mL', 'L', 'gal', 'floz', 'mm', 'cm', 'm', 'km', 'in', 'ft', 'mi', 'K', 'C', 'F'];
    for (const sym of expectedSymbols) {
      expect(UNIT_MAP.has(sym), `Expected ${sym} in UNIT_MAP`).toBe(true);
    }
  });
});
