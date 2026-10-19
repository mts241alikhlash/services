import { UserGender } from '../../../../shared/domain/enums/user-gender.enum.js'
import { CreateAddressRepositoryInput } from '../../../../shared/domain/entities/address.entity.js'
import { ParentRelation } from '../../../../shared/domain/enums/parent-relation.enum.js'
import { IncomeRange } from '../../../../shared/domain/enums/income-range.enum.js'

export interface EnrollProfileInput {
  name: string
  nik: string
  gender: UserGender
  birthPlace: string
  birthDate: string
  email?: string | null
  phone?: string | null
  religionId?: string | null
}

export interface EnrollParentInput {
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

export interface EnrollExistingAccountInput {
  applicationId?: string
  userId: string
  nis: string
  nisn: string
  gradeId?: string
  classroomId?: string
  profile: EnrollProfileInput
  parents?: EnrollParentInput[]
  address?: CreateAddressRepositoryInput
}
