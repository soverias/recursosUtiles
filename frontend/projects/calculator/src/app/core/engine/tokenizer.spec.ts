import { describe, it, expect } from 'vitest';
import { tokenize } from './tokenizer';
import { Token, TokenType } from '../models/expression.model';

function types(tokens: Token[]): TokenType[] {
  return tokens.map(t => t.type);
}

function vals(tokens: Token[]): string[] {
  return tokens.map(t => t.value);
}

describe('tokenizer', () => {
  it('TOK-01: integer number', () => {
    const tokens = tokenize('42');
    expect(tokens).toHaveLength(2);
    expect(tokens[0]).toMatchObject({ type: 'NUMBER', value: '42', position: 0 });
    expect(tokens[1].type).toBe('EOF');
  });

  it('TOK-02: decimal number', () => {
    const tokens = tokenize('3.14');
    expect(tokens[0]).toMatchObject({ type: 'NUMBER', value: '3.14' });
    expect(tokens[1].type).toBe('EOF');
  });

  it('TOK-03: number with unit (with space)', () => {
    const tokens = tokenize('2 GB');
    expect(types(tokens)).toEqual(['NUMBER', 'UNIT', 'EOF']);
    expect(vals(tokens)).toEqual(['2', 'GB', '']);
  });

  it('TOK-04: number with unit (no space)', () => {
    const tokens = tokenize('2GB');
    expect(types(tokens)).toEqual(['NUMBER', 'UNIT', 'EOF']);
    expect(tokens[1].value).toBe('GB');
  });

  it('TOK-05: expression 2 GB + 500 MB has correct tokens', () => {
    const toks = tokenize('2 GB + 500 MB');
    expect(types(toks)).toEqual(['NUMBER', 'UNIT', 'OPERATOR', 'NUMBER', 'UNIT', 'EOF']);
    expect(toks[2].value).toBe('+');
  });

  it('TOK-06: expression with parentheses', () => {
    const toks = tokenize('(3 + 4) * 2');
    expect(types(toks)).toEqual([
      'PAREN_OPEN', 'NUMBER', 'OPERATOR', 'NUMBER', 'PAREN_CLOSE', 'OPERATOR', 'NUMBER', 'EOF',
    ]);
  });

  it('TOK-07: all four operators', () => {
    const toks = tokenize('1 + 2 - 3 * 4 / 5');
    const ops = toks.filter(t => t.type === 'OPERATOR').map(t => t.value);
    expect(ops).toEqual(['+', '-', '*', '/']);
  });

  it('TOK-08: whitespace is ignored', () => {
    const toks = tokenize('  2  +  3  ');
    expect(types(toks)).toEqual(['NUMBER', 'OPERATOR', 'NUMBER', 'EOF']);
  });

  it('TOK-09: empty input returns EOF only', () => {
    expect(types(tokenize(''))).toEqual(['EOF']);
  });

  it('TOK-10: whitespace-only input returns EOF only', () => {
    expect(types(tokenize('   '))).toEqual(['EOF']);
  });

  it('TOK-11: temperature unit C', () => {
    const toks = tokenize('20 C');
    expect(types(toks)).toEqual(['NUMBER', 'UNIT', 'EOF']);
    expect(toks[1].value).toBe('C');
  });

  it('TOK-12: temperature unit °C', () => {
    const toks = tokenize('20 °C');
    expect(types(toks)).toEqual(['NUMBER', 'UNIT', 'EOF']);
    expect(toks[1].value).toBe('°C');
  });

  it('TOK-13: unknown symbol after number throws with position info', () => {
    expect(() => tokenize('5 XYZ')).toThrow(/XYZ/);
  });

  it('TOK-14: unit is case-sensitive — lowercase gb throws', () => {
    expect(() => tokenize('2 gb')).toThrow();
  });

  it('TOK-15: longest-match for km', () => {
    const toks = tokenize('5 km');
    expect(toks[1]).toMatchObject({ type: 'UNIT', value: 'km' });
  });

  it('TOK-16: floz as single token', () => {
    const toks = tokenize('2 floz');
    expect(toks[1]).toMatchObject({ type: 'UNIT', value: 'floz' });
  });

  it('TOK-17: °F recognized', () => {
    const toks = tokenize('100 °F');
    expect(toks[1]).toMatchObject({ type: 'UNIT', value: '°F' });
  });

  it('TOK-18: unary minus is an operator token', () => {
    const toks = tokenize('-3');
    expect(types(toks)).toEqual(['OPERATOR', 'NUMBER', 'EOF']);
    expect(toks[0].value).toBe('-');
  });

  it('TOK-19: records correct position for second token', () => {
    const toks = tokenize('2 + 3');
    expect(toks[0].position).toBe(0);
    expect(toks[2].position).toBe(4);
  });
});
