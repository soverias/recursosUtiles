import { EvalResult, ExpressionNode } from '../models/expression.model';
import { UnitDefinition } from '../models/unit.model';

const fmt = new Intl.NumberFormat('es-ES', { maximumSignificantDigits: 10 });

function format(value: number, unit: UnitDefinition | null): string {
  const num = fmt.format(value);
  return unit ? `${num} ${unit.symbol}` : num;
}

export function evaluate(
  node: ExpressionNode,
  outputUnit?: UnitDefinition,
): EvalResult {
  const { value, unit } = evalNode(node, outputUnit);
  return { value, unit: unit ?? null, formatted: format(value, unit ?? null) };
}

function evalNode(
  node: ExpressionNode,
  outputUnit?: UnitDefinition,
): { value: number; unit: UnitDefinition | undefined } {
  if (node.kind === 'value') {
    return { value: node.amount, unit: node.unit ?? undefined };
  }

  if (node.kind === 'unary_minus') {
    const { value, unit } = evalNode(node.operand, outputUnit);
    return { value: -value, unit };
  }

  // Binary operation
  const left = evalNode(node.left, outputUnit);
  const right = evalNode(node.right, outputUnit);
  const op = node.operator;

  const result = applyOp(op, left, right, outputUnit);
  return result;
}

function applyOp(
  op: '+' | '-' | '*' | '/',
  left: { value: number; unit: UnitDefinition | undefined },
  right: { value: number; unit: UnitDefinition | undefined },
  outputUnit?: UnitDefinition,
): { value: number; unit: UnitDefinition | undefined } {
  const lUnit = left.unit;
  const rUnit = right.unit;

  // Division by zero
  if ((op === '/') && right.value === 0 && !rUnit) {
    throw new Error('División por cero');
  }

  // Both numeric (no units)
  if (!lUnit && !rUnit) {
    return { value: operate(op, left.value, right.value), unit: undefined };
  }

  // For * and /, at most ONE operand may have a unit
  if ((op === '*' || op === '/') && lUnit && rUnit) {
    throw new Error(
      `La multiplicación/división requiere al menos un operando numérico (encontrado: ${lUnit.symbol} y ${rUnit.symbol})`,
    );
  }

  // One has unit, other is numeric — numeric adopts the unit
  if (lUnit && !rUnit) {
    const result = operate(op, left.value, right.value);
    const unit = outputUnit?.category === lUnit.category ? outputUnit : lUnit;
    return { value: result, unit };
  }
  if (!lUnit && rUnit) {
    if (op === '/') {
      throw new Error(
        `La división requiere al menos un operando numérico a la izquierda`,
      );
    }
    const result = operate(op, left.value, right.value);
    const unit = outputUnit?.category === rUnit.category ? outputUnit : rUnit;
    return { value: result, unit };
  }

  // Both have units
  const lu = lUnit!;
  const ru = rUnit!;

  if (lu.category !== ru.category) {
    throw new Error(`No se puede operar ${lu.symbol} con ${ru.symbol}`);
  }

  // Temperature: treat right operand as a delta for + and -
  if (lu.category === 'temperature' && (op === '+' || op === '-')) {
    const targetUnit = outputUnit?.category === 'temperature' ? outputUnit : lu;
    // Convert left to Kelvin as absolute, right as delta (1 C-delta = 1 K-delta, 1 F-delta = 5/9 K-delta)
    const lK = lu.toBase(left.value);
    const rDeltaK = temperatureDeltaToKelvin(ru, right.value);
    const resultK = op === '+' ? lK + rDeltaK : lK - rDeltaK;
    const resultValue = targetUnit.fromBase(resultK);
    return { value: resultValue, unit: targetUnit };
  }

  // Same-category conversion: convert both to base, operate, convert back
  const targetUnit = outputUnit?.category === lu.category ? outputUnit : lu;
  const lBase = lu.toBase(left.value);
  const rBase = ru.toBase(right.value);
  const resultBase = operate(op, lBase, rBase);
  const resultValue = targetUnit.fromBase(resultBase);
  return { value: resultValue, unit: targetUnit };
}

function temperatureDeltaToKelvin(unit: UnitDefinition, delta: number): number {
  // A temperature delta in Celsius = 1 K
  // A temperature delta in Fahrenheit = 5/9 K
  if (unit.symbol === 'C' || unit.symbol === '°C') return delta;
  if (unit.symbol === 'F' || unit.symbol === '°F') return delta * 5 / 9;
  return delta; // Kelvin delta = Kelvin delta
}

function operate(op: string, a: number, b: number): number {
  switch (op) {
    case '+': return a + b;
    case '-': return a - b;
    case '*': return a * b;
    case '/':
      if (b === 0) throw new Error('División por cero');
      return a / b;
    default: throw new Error(`Operador desconocido: ${op}`);
  }
}
