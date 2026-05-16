import { describe, it, expect } from 'vitest';
import { parse } from './parser';
import { tokenize } from './tokenizer';
import { BinaryOpNode, ExpressionNode, UnaryMinusNode, ValueNode } from '../models/expression.model';

function parseExpr(input: string): ExpressionNode {
  return parse(tokenize(input));
}

function binary(op: string, left: ExpressionNode, right: ExpressionNode): BinaryOpNode {
  return { kind: 'binary', operator: op as '+', left, right };
}

function value(amount: number): ValueNode {
  return { kind: 'value', amount, unit: null };
}

describe('parser', () => {
  it('PAR-01: single number', () => {
    const ast = parseExpr('42');
    expect(ast).toMatchObject({ kind: 'value', amount: 42 });
  });

  it('PAR-02: simple addition', () => {
    const ast = parseExpr('3 + 4');
    expect(ast).toMatchObject({
      kind: 'binary',
      operator: '+',
      left: { kind: 'value', amount: 3 },
      right: { kind: 'value', amount: 4 },
    });
  });

  it('PAR-03: operator precedence — * binds tighter than +', () => {
    const ast = parseExpr('2 + 3 * 4');
    expect(ast).toMatchObject({
      kind: 'binary',
      operator: '+',
      left: { kind: 'value', amount: 2 },
      right: {
        kind: 'binary',
        operator: '*',
        left: { kind: 'value', amount: 3 },
        right: { kind: 'value', amount: 4 },
      },
    });
  });

  it('PAR-04: parentheses override precedence', () => {
    const ast = parseExpr('(2 + 3) * 4');
    expect(ast).toMatchObject({
      kind: 'binary',
      operator: '*',
      left: {
        kind: 'binary',
        operator: '+',
        left: { kind: 'value', amount: 2 },
        right: { kind: 'value', amount: 3 },
      },
      right: { kind: 'value', amount: 4 },
    });
  });

  it('PAR-05: unary minus', () => {
    const ast = parseExpr('-3') as UnaryMinusNode;
    expect(ast).toMatchObject({
      kind: 'unary_minus',
      operand: { kind: 'value', amount: 3 },
    });
  });

  it('PAR-06: unary minus in expression', () => {
    const ast = parseExpr('-3 * 2');
    expect(ast).toMatchObject({
      kind: 'binary',
      operator: '*',
      left: { kind: 'unary_minus' },
    });
  });

  it('PAR-07: nested parentheses', () => {
    const ast = parseExpr('((2 + 3))');
    expect(ast).toMatchObject({ kind: 'binary', operator: '+' });
  });

  it('PAR-08: subtraction and division', () => {
    const ast = parseExpr('10 - 4 / 2');
    expect(ast).toMatchObject({
      kind: 'binary',
      operator: '-',
      right: { kind: 'binary', operator: '/' },
    });
  });

  it('PAR-09: value with unit is parsed as ValueNode with unit', () => {
    const ast = parseExpr('2 GB') as ValueNode;
    expect(ast.kind).toBe('value');
    expect(ast.amount).toBe(2);
    expect(ast.unit?.symbol).toBe('GB');
  });

  it('PAR-10: mixed unit expression', () => {
    const ast = parseExpr('2 GB + 500 MB');
    expect(ast).toMatchObject({
      kind: 'binary',
      operator: '+',
      left: { kind: 'value', amount: 2 },
      right: { kind: 'value', amount: 500 },
    });
  });

  it('PAR-11: error on unclosed parenthesis', () => {
    expect(() => parseExpr('(3 + 4')).toThrow(/paréntesis|parenthesis|\)/i);
  });

  it('PAR-12: error on trailing operator', () => {
    expect(() => parseExpr('3 +')).toThrow();
  });

  it('PAR-13: left-associativity of same-precedence operators', () => {
    // 10 - 3 - 2 should be (10 - 3) - 2 = 5, not 10 - (3 - 2) = 9
    const ast = parseExpr('10 - 3 - 2');
    expect(ast).toMatchObject({
      kind: 'binary',
      operator: '-',
      left: {
        kind: 'binary',
        operator: '-',
        left: { kind: 'value', amount: 10 },
        right: { kind: 'value', amount: 3 },
      },
      right: { kind: 'value', amount: 2 },
    });
  });
});
