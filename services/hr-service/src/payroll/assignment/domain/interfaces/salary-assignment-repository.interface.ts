import {
  EffectiveAssignment,
  SalaryAssignmentEntity,
  SalaryAssignmentWithComponent,
} from '../entities/salary-assignment.entity.js'

export type { EffectiveAssignment, SalaryAssignmentWithComponent }

export interface CreateSalaryAssignmentInput {
  userId: string
  componentId: string
  amount?: string | null
  rate?: string | null
  effectiveFrom: Date
  createdBy: string
}

export abstract class ISalaryAssignmentRepository {
  abstract findAll(userId?: string): Promise<SalaryAssignmentWithComponent[]>
  abstract findById(id: string): Promise<SalaryAssignmentEntity | null>

  abstract findEffectiveOn(
    userIds: string[],
    date: Date,
  ): Promise<EffectiveAssignment[]>

  abstract create(
    input: CreateSalaryAssignmentInput,
  ): Promise<SalaryAssignmentWithComponent>
  abstract softDelete(id: string): Promise<SalaryAssignmentEntity>
}
