export interface DecimalLike {
  toNumber(): number
  toFixed(decimalPlaces?: number): string
  toString(): string
}

export type DecimalValue = number | string | DecimalLike

export function toNumericValue(value: DecimalValue): number {
  return typeof value === 'number' ? value : Number(value)
}
