import { Injectable } from '@nestjs/common'
import { IEmployeeIdentityReadPort } from '../../../../platform/employee-identity/employee-identity.port.js'
import { GetTeachingAssignmentsUseCase } from '../get-teaching-assignments/get-teaching-assignments.use-case.js'
import type { GetMyTeachingAssignmentsInput } from './get-my-teaching-assignments.input.js'

@Injectable()
export class GetMyTeachingAssignmentsUseCase {
  constructor(
    private readonly getTeachingAssignments: GetTeachingAssignmentsUseCase,
    private readonly employeeIdentity: IEmployeeIdentityReadPort,
  ) {}

  async execute(input: GetMyTeachingAssignmentsInput, userId: string) {
    const employeeId =
      await this.employeeIdentity.findEmployeeIdByUserId(userId)

    if (!employeeId) {
      return {
        data: [],
        total: 0,
        page: input.page ?? 1,
        limit: input.limit ?? 10,
      }
    }

    return this.getTeachingAssignments.execute({ ...input, employeeId })
  }
}
