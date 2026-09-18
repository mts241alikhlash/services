import type { DecimalValue } from '../../../shared/domain/types/decimal.type.js'
import { toNumericValue } from '../../../shared/domain/types/decimal.type.js'

export function serializeWave<T extends { registrationFee: DecimalValue }>(
  wave: T,
) {
  return {
    ...wave,
    registrationFee: toNumericValue(wave.registrationFee),
  }
}
