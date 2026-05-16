export type UnitCategory =
  | 'data'
  | 'weight'
  | 'volume'
  | 'length'
  | 'temperature'
  | 'numeric';

export interface UnitDefinition {
  readonly symbol: string;
  readonly name: string;
  readonly category: UnitCategory;
  readonly toBase: (value: number) => number;
  readonly fromBase: (value: number) => number;
}

export interface UnitCategoryMeta {
  readonly category: UnitCategory;
  readonly label: string;
  readonly baseUnit: string;
  readonly units: readonly UnitDefinition[];
}
