import { Injectable } from '@nestjs/common'
import { IStudentScoreRepository } from '../../../domain/repositories/student-score.repository.js'
import type { GetStudentScoresInput } from './get-student-scores.input.js'

@Injectable()
export class GetStudentScoresUseCase {
  constructor(
    private readonly studentScoreRepository: IStudentScoreRepository,
  ) {}

  async execute(input: GetStudentScoresInput, scope?: { studentId: string }) {
    return this.studentScoreRepository.findAll({
      page: input.page,
      limit: input.limit,
      assessmentItemId: input.assessmentItemId,
      enrollmentId: input.enrollmentId,
      semesterId: input.semesterId,
      ...(scope && { studentId: scope.studentId }),
    })
  }
}
