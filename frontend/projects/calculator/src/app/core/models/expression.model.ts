import { UnitDefinition } from './unit.model';

export type TokenType =
  | 'NUMBER'
  | 'UNIT'
  | 'OPERATOR'
  | 'PAREN_OPEN'
  | 'PAREN_CLOSE'
  | 'EOF';

export interface Token {
  readonly type: TokenType;
  readonly value: string;
  readonly position: number;
}

export type ExpressionNode = BinaryOpNode | UnaryMinusNode | ValueNode;

export interface BinaryOpNode {
  readonly kind: 'binary';
  readonly operator: '+' | '-' | '*' | '/';
  readonly left: ExpressionNode;
  readonly right: ExpressionNode;
}

export interface UnaryMinusNode {
  readonly kind: 'unary_minus';
  readonly operand: ExpressionNode;
}

export interface ValueNode {
  readonly kind: 'value';
  readonly amount: number;
  readonly unit: UnitDefinition | null;
}

export interface EvalResult {
  readonly value: number;
  readonly unit: UnitDefinition | null;
  readonly formatted: string;
}

export interface HistoryEntry {
  readonly id: number;
  readonly expression: string;
  readonly result: EvalResult;
  readonly timestamp: number;
}
