import type { NamedRef } from '../../../shared/domain/entities/index.js'

export interface EmployeePositionEntity {
  id: string
  employeeId: string
  positionId: string
  hireDate: Date
  isPrimary: boolean
  deletedAt?: Date | null
}

export interface EmployeePositionWithDetails {
  id: string
  employeeId: string
  positionId: string
  isPrimary: boolean
  hireDate?: Date | null
  position?: NamedRef | null
}
