import { Token } from '../models/expression.model';
import { ExpressionNode } from '../models/expression.model';
import { findUnit } from './conversion';

export function parse(tokens: Token[]): ExpressionNode {
  let pos = 0;

  function peek(): Token {
    return tokens[pos];
  }

  function consume(): Token {
    return tokens[pos++];
  }

  function expect(value: string): Token {
    const tok = peek();
    if (tok.value !== value) {
      throw new Error(
        `Se esperaba '${value}' pero se encontró '${tok.value || 'EOF'}' en posición ${tok.position}`,
      );
    }
    return consume();
  }

  function parseExpression(): ExpressionNode {
    let left = parseTerm();
    while (peek().type === 'OPERATOR' && (peek().value === '+' || peek().value === '-')) {
      const op = consume().value as '+' | '-';
      const right = parseTerm();
      left = { kind: 'binary', operator: op, left, right };
    }
    return left;
  }

  function parseTerm(): ExpressionNode {
    let left = parseFactor();
    while (peek().type === 'OPERATOR' && (peek().value === '*' || peek().value === '/')) {
      const op = consume().value as '*' | '/';
      const right = parseFactor();
      left = { kind: 'binary', operator: op, left, right };
    }
    return left;
  }

  function parseFactor(): ExpressionNode {
    if (peek().type === 'OPERATOR' && peek().value === '-') {
      consume();
      const operand = parsePrimary();
      return { kind: 'unary_minus', operand };
    }
    return parsePrimary();
  }

  function parsePrimary(): ExpressionNode {
    const tok = peek();

    if (tok.type === 'PAREN_OPEN') {
      consume();
      const expr = parseExpression();
      if (peek().type !== 'PAREN_CLOSE') {
        throw new Error(
          `Se esperaba ')' en posición ${peek().position}`,
        );
      }
      consume();
      return expr;
    }

    if (tok.type === 'NUMBER') {
      consume();
      const amount = parseFloat(tok.value);
      let unit = null;
      if (peek().type === 'UNIT') {
        const unitTok = consume();
        unit = findUnit(unitTok.value);
      }
      return { kind: 'value', amount, unit };
    }

    throw new Error(
      `Se esperaba un valor en posición ${tok.position} pero se encontró '${tok.value || tok.type}'`,
    );
  }

  const ast = parseExpression();
  if (peek().type !== 'EOF') {
    throw new Error(`Se esperaba un operador en posición ${peek().position}`);
  }
  return ast;
}
