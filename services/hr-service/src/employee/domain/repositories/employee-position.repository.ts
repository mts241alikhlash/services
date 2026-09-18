import { EmployeePositionWithDetails } from '../entities/employee-position.entity.js'

export interface PositionRow {
  id: string
  name: string
  categoryId?: string | null
  isActive?: boolean
}

export interface CreateEmployeePositionRepositoryInput {
  positionId: string
  hireDate: Date
  isPrimary?: boolean
}

export type UpdateEmployeePositionRepositoryInput =
  Partial<CreateEmployeePositionRepositoryInput>

export abstract class IEmployeePositionRepository {
  abstract findByEmployeeId(
    employeeId: string,
  ): Promise<EmployeePositionWithDetails[]>
  abstract findById(
    employeeId: string,
    positionId: string,
  ): Promise<EmployeePositionWithDetails | null>
  abstract findByEmployeeAndPosition(
    employeeId: string,
    positionId: string,
  ): Promise<EmployeePositionWithDetails | null>
  abstract findPositionById(positionId: string): Promise<PositionRow | null>
  abstract create(
    employeeId: string,
    input: CreateEmployeePositionRepositoryInput,
  ): Promise<EmployeePositionWithDetails>
  abstract update(
    employeeId: string,
    positionId: string,
    input: UpdateEmployeePositionRepositoryInput,
  ): Promise<EmployeePositionWithDetails>
  abstract softDelete(
    employeeId: string,
    positionId: string,
  ): Promise<EmployeePositionWithDetails>
}
