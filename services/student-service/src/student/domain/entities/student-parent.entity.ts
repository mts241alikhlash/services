import { ParentRelation } from '../../../shared/domain/enums/parent-relation.enum.js'
import { NamedRef, PersonRef } from '../../../shared/domain/entities/index.js'

export interface StudentParentEntity {
  id: string
  studentId: string
  parentId: string
  relation: `${ParentRelation}`
  isPrimary: boolean
  deletedAt?: Date | null
}

export interface LinkedParentRef {
  id: string
  name: string
  nik: string
  birthPlace: string
  birthDate: Date
  email: string | null
  phone: string | null
  occupationId: string
  educationId: string | null
  occupation?: NamedRef | null
  education?: NamedRef | null
}

export interface StudentParentWithDetails extends StudentParentEntity {
  parent?: LinkedParentRef
  student?: PersonRef
}
