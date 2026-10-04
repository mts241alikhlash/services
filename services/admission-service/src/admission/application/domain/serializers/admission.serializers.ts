import {
  DecimalValue,
  toNumericValue,
} from '../../../../shared/domain/types/decimal.type.js'

function serializePayment<T extends { amount: DecimalValue }>(payment: T) {
  return { ...payment, amount: toNumericValue(payment.amount) }
}

export function serializeApplicationDetail<
  T extends {
    wave?: { registrationFee: DecimalValue } | null
    payment?: { amount: DecimalValue } | null
  },
>(application: T) {
  const { wave, payment } = application
  return {
    ...application,
    wave: wave
      ? { ...wave, registrationFee: toNumericValue(wave.registrationFee) }
      : wave,
    payment: payment ? serializePayment(payment) : payment,
  }
}

export type SerializedDecimal = DecimalValue
