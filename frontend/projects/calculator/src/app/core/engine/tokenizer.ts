import { Token, TokenType } from '../models/expression.model';
import { UNIT_MAP } from './conversion';

// Sorted by length descending for longest-match
const UNIT_SYMBOLS: readonly string[] = [...UNIT_MAP.keys()].sort(
  (a, b) => b.length - a.length,
);

export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;

  while (pos < input.length) {
    // Skip whitespace
    if (/\s/.test(input[pos])) {
      pos++;
      continue;
    }

    // Number (integer or decimal)
    const numMatch = input.slice(pos).match(/^\d+(\.\d+)?/);
    if (numMatch) {
      const value = numMatch[0];
      tokens.push({ type: 'NUMBER', value, position: pos });
      pos += value.length;

      // Try to match a unit immediately after (with optional whitespace)
      let unitPos = pos;
      while (unitPos < input.length && /\s/.test(input[unitPos])) {
        unitPos++;
      }
      const rest = input.slice(unitPos);
      const matched = matchUnit(rest);
      if (matched) {
        tokens.push({ type: 'UNIT', value: matched, position: unitPos });
        pos = unitPos + matched.length;
      }
      continue;
    }

    // Operator
    if ('+-*/'.includes(input[pos])) {
      tokens.push({ type: 'OPERATOR', value: input[pos], position: pos });
      pos++;
      continue;
    }

    // Parentheses
    if (input[pos] === '(') {
      tokens.push({ type: 'PAREN_OPEN', value: '(', position: pos });
      pos++;
      continue;
    }
    if (input[pos] === ')') {
      tokens.push({ type: 'PAREN_CLOSE', value: ')', position: pos });
      pos++;
      continue;
    }

    // Degree sign — part of °C / °F
    if (input[pos] === '°') {
      const rest = input.slice(pos);
      const matched = matchUnit(rest);
      if (matched) {
        tokens.push({ type: 'UNIT', value: matched, position: pos });
        pos += matched.length;
        continue;
      }
    }

    // Unknown character — collect it for a helpful error
    const symbolMatch = input.slice(pos).match(/^[^\s+\-*/()]+/);
    const badSymbol = symbolMatch ? symbolMatch[0] : input[pos];
    throw new Error(`Unidad desconocida: '${badSymbol}' en posición ${pos}`);
  }

  tokens.push({ type: 'EOF', value: '', position: pos });
  return tokens;
}

function matchUnit(text: string): string | null {
  for (const sym of UNIT_SYMBOLS) {
    if (text.startsWith(sym)) {
      // Make sure it's not followed by more word chars (e.g. "km" vs "kms")
      const after = text[sym.length];
      if (after === undefined || /[\s+\-*/()]/.test(after)) {
        return sym;
      }
    }
  }
  return null;
}
