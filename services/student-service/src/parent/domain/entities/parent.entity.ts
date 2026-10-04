import { NamedRef, UserRef } from '../../../shared/domain/entities/index.js'

export interface ParentEntity {
  id: string
  userId?: string
  nik?: string | null
  name?: string
  occupationId?: string | null
  educationId?: string | null
  deletedAt?: Date | null
  birthPlace?: string
  birthDate?: Date
  email?: string | null
  phone?: string | null
  income?:
    | 'BELOW_500K'
    | 'BETWEEN_500K_1M'
    | 'BETWEEN_1M_2M'
    | 'BETWEEN_2M_3M'
    | 'ABOVE_3M'
    | null
}

export interface ParentWithDetails extends ParentEntity {
  user?: UserRef | null
  occupation?: NamedRef | null
  education?: NamedRef | null
  students?: { studentId: string; isPrimary: boolean }[]
  _count?: { studentParents: number }
}

export type ParentListWithDetails = ParentWithDetails
