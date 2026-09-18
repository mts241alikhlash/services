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
  return {
    ...application,
    ...(application.wave && {
      wave: {
        ...application.wave,
        registrationFee: toNumericValue(application.wave.registrationFee),
      },
    }),
    ...(application.payment && {
      payment: serializePayment(application.payment),
    }),
  }
}

export type SerializedDecimal = DecimalValue
