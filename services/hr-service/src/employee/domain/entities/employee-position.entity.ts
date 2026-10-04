import type {
  CodedRef,
  NamedRef,
} from '../../../shared/domain/entities/index.js'

export interface EmployeePositionEntity {
  id: string
  employeeId: string
  positionId: string
  hireDate: Date
  isPrimary: boolean
  deletedAt?: Date | null
}

export interface PositionWithCategoryRef extends NamedRef {
  isActive: boolean
  category: CodedRef
}

export interface EmployeePositionWithDetails {
  id: string
  employeeId: string
  positionId: string
  isPrimary: boolean
  hireDate: Date
  position?: PositionWithCategoryRef | null
}
