import { ForbiddenException, Injectable } from '@nestjs/common'
import { IGradingScopeReadPort } from '../../../domain/repositories/grading-scope-read.port.js'
import { IEmployeeIdentityReadPort } from '../../../../platform/employee-identity/employee-identity.port.js'
import { BulkUpsertStudentScoresUseCase } from '../bulk-upsert-student-scores/bulk-upsert-student-scores.use-case.js'
import type { BulkUpsertStudentScoresInput } from '../bulk-upsert-student-scores/bulk-upsert-student-scores.input.js'

@Injectable()
export class GradeAssignedStudentScoresUseCase {
  constructor(
    private readonly bulkUpsert: BulkUpsertStudentScoresUseCase,
    private readonly employeeIdentity: IEmployeeIdentityReadPort,
    private readonly gradingScope: IGradingScopeReadPort,
  ) {}

  async execute(input: BulkUpsertStudentScoresInput, userId: string) {
    const refused = new ForbiddenException(
      'You can only grade the classes you teach or the class you supervise',
    )

    const employeeId =
      await this.employeeIdentity.findEmployeeIdByUserId(userId)

    if (!employeeId) throw refused

    const teaches = await this.gradingScope.teachesAssessmentItem(
      employeeId,
      input.assessmentItemId,
    )

    if (teaches) {
      return this.bulkUpsert.execute(input)
    }

    for (const record of input.records) {
      const supervises = await this.gradingScope.supervisesEnrollment(
        employeeId,
        record.enrollmentId,
      )
      if (!supervises) throw refused
    }

    return this.bulkUpsert.execute(input, userId)
  }
}
