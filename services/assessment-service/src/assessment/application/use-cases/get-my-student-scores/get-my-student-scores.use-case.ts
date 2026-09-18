import { Injectable } from '@nestjs/common'
import { IStudentIdentityReadPort } from '../../../../platform/student-identity/student-identity.port.js'
import { GetStudentScoresUseCase } from '../get-student-scores/get-student-scores.use-case.js'
import type { GetStudentScoresInput } from '../get-student-scores/get-student-scores.input.js'

@Injectable()
export class GetMyStudentScoresUseCase {
  constructor(
    private readonly getStudentScores: GetStudentScoresUseCase,
    private readonly studentIdentity: IStudentIdentityReadPort,
  ) {}

  async execute(input: GetStudentScoresInput, userId: string) {
    const studentId = await this.studentIdentity.findStudentIdByUserId(userId)

    if (!studentId) {
      return {
        data: [],
        total: 0,
        page: input.page ?? 1,
        limit: input.limit ?? 10,
      }
    }

    return this.getStudentScores.execute(input, { studentId })
  }
}
