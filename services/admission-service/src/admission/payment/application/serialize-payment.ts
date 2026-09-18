import {
  toNumericValue,
  type DecimalValue,
} from '../../../shared/domain/types/decimal.type.js'

export function serializePayment<T extends { amount: DecimalValue }>(
  payment: T,
) {
  return { ...payment, amount: toNumericValue(payment.amount) }
}
