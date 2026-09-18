import { CreateStudentInput } from '../create-student/create-student.input.js'
import { CreateAddressRepositoryInput } from '../../../../shared/domain/entities/address.entity.js'
import { ParentRelation } from '../../../../shared/domain/enums/parent-relation.enum.js'
import { IncomeRange } from '../../../../shared/domain/enums/income-range.enum.js'

export interface StudentParentSeedInputDto {
  name: string
  nik: string
  birthPlace: string
  birthDate: string
  email?: string
  phone?: string
  occupationId: string
  income?: IncomeRange
  relation: ParentRelation
  isPrimary?: boolean
}

export interface CreateStudentWithRelationsInput extends CreateStudentInput {
  address?: CreateAddressRepositoryInput
  parents?: StudentParentSeedInputDto[]
}
