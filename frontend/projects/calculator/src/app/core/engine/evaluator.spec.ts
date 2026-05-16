import { describe, it, expect } from 'vitest';
import { evaluate } from './evaluator';
import { parse } from './parser';
import { tokenize } from './tokenizer';
import { findUnit } from './conversion';
import { UnitDefinition } from '../models/unit.model';

function calc(input: string, outputUnit?: UnitDefinition) {
  return evaluate(parse(tokenize(input)), outputUnit);
}

describe('evaluator — pure arithmetic', () => {
  it('EVAL-01: addition', () => {
    expect(calc('3 + 4').value).toBe(7);
    expect(calc('3 + 4').unit).toBeNull();
  });

  it('EVAL-02: subtraction', () => {
    expect(calc('10 - 3').value).toBe(7);
  });

  it('EVAL-03: multiplication', () => {
    expect(calc('3 * 4').value).toBe(12);
  });

  it('EVAL-04: division', () => {
    expect(calc('10 / 4').value).toBeCloseTo(2.5);
  });

  it('EVAL-05: operator precedence', () => {
    expect(calc('2 + 3 * 4').value).toBe(14);
  });

  it('EVAL-06: parentheses override precedence', () => {
    expect(calc('(2 + 3) * 4').value).toBe(20);
  });

  it('EVAL-07: unary minus', () => {
    expect(calc('-(3 + 4)').value).toBe(-7);
  });

  it('EVAL-08: division by zero throws', () => {
    expect(() => calc('5 / 0')).toThrow(/cero|zero/i);
  });
});

describe('evaluator — same unit', () => {
  it('EVAL-09: adding same unit', () => {
    const r = calc('3 GB + 2 GB');
    expect(r.value).toBe(5);
    expect(r.unit?.symbol).toBe('GB');
  });

  it('EVAL-10: subtracting same unit', () => {
    const r = calc('5 MB - 2 MB');
    expect(r.value).toBe(3);
    expect(r.unit?.symbol).toBe('MB');
  });
});

describe('evaluator — cross-unit same category', () => {
  it('EVAL-11: 1 GB + 512 MB in MB', () => {
    const r = calc('1 GB + 512 MB', findUnit('MB')!);
    expect(r.value).toBeCloseTo(1536, 0);
    expect(r.unit?.symbol).toBe('MB');
  });

  it('EVAL-12: 1 GB + 512 MB in GB', () => {
    const r = calc('1 GB + 512 MB', findUnit('GB')!);
    expect(r.value).toBeCloseTo(1.5, 5);
    expect(r.unit?.symbol).toBe('GB');
  });

  it('EVAL-13: 1 kg - 200 g in g', () => {
    const r = calc('1 kg - 200 g', findUnit('g')!);
    expect(r.value).toBeCloseTo(800, 0);
    expect(r.unit?.symbol).toBe('g');
  });

  it('EVAL-14: 100 cm + 1 m in cm', () => {
    const r = calc('100 cm + 1 m', findUnit('cm')!);
    expect(r.value).toBeCloseTo(200, 0);
    expect(r.unit?.symbol).toBe('cm');
  });

  it('EVAL-15: no outputUnit — defaults to left operand unit', () => {
    const r = calc('1 GB + 512 MB');
    expect(r.unit?.symbol).toBe('GB');
    expect(r.value).toBeCloseTo(1.5, 5);
  });
});

describe('evaluator — scalar × unit', () => {
  it('EVAL-16: unit * scalar', () => {
    const r = calc('2 GB * 3');
    expect(r.value).toBe(6);
    expect(r.unit?.symbol).toBe('GB');
  });

  it('EVAL-17: scalar * unit', () => {
    const r = calc('3 * 2 GB');
    expect(r.value).toBe(6);
    expect(r.unit?.symbol).toBe('GB');
  });

  it('EVAL-18: unit / scalar', () => {
    const r = calc('6 GB / 2');
    expect(r.value).toBe(3);
    expect(r.unit?.symbol).toBe('GB');
  });
});

describe('evaluator — unit errors', () => {
  it('EVAL-19: incompatible categories throws', () => {
    expect(() => calc('2 GB + 3 kg')).toThrow(/GB.*kg|kg.*GB/);
  });

  it('EVAL-20: multiplying two unit values throws', () => {
    expect(() => calc('2 GB * 3 MB')).toThrow();
  });

  it('EVAL-21: dividing two unit values throws', () => {
    expect(() => calc('6 GB / 2 MB')).toThrow();
  });
});

describe('evaluator — temperature delta', () => {
  it('EVAL-22: adding two Celsius values', () => {
    const r = calc('20 C + 5 C');
    expect(r.value).toBeCloseTo(25, 5);
    expect(r.unit?.symbol).toBe('C');
  });

  it('EVAL-23: subtracting two Celsius values', () => {
    const r = calc('30 C - 10 C');
    expect(r.value).toBeCloseTo(20, 5);
    expect(r.unit?.symbol).toBe('C');
  });
});

describe('evaluator — formatting', () => {
  it('EVAL-24: result has a formatted string', () => {
    const r = calc('3 + 4');
    expect(typeof r.formatted).toBe('string');
    expect(r.formatted.length).toBeGreaterThan(0);
  });

  it('EVAL-25: single value with unit formats with unit symbol', () => {
    const r = calc('42 GB');
    expect(r.formatted).toContain('GB');
  });
});
