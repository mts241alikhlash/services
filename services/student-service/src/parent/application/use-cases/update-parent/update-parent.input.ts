import { IncomeRange } from '../../../../shared/domain/enums/income-range.enum.js'

export interface UpdateParentInput {
  name?: string
  nik?: string
  birthPlace?: string
  birthDate?: string | Date
  email?: string
  phone?: string
  occupationId?: string
  income?: IncomeRange
}
