import { Injectable, NotFoundException } from '@nestjs/common'
import { IAssessmentItemRepository } from '../../../domain/repositories/assessment-item.repository.js'
import { IStudentScoreRepository } from '../../../domain/repositories/student-score.repository.js'
import { assertScoreInRange } from '../../../domain/policies/assert-score-in-range.policy.js'
import type { UpdateStudentScoreInput } from './update-student-score.input.js'

@Injectable()
export class UpdateStudentScoreUseCase {
  constructor(
    private readonly studentScoreRepository: IStudentScoreRepository,
    private readonly assessmentItemRepository: IAssessmentItemRepository,
  ) {}
  async execute(id: string, input: UpdateStudentScoreInput) {
    const r = await this.studentScoreRepository.findById(id)
    if (!r) throw new NotFoundException(`StudentScore ${id} not found`)

    const assessmentItem = r.assessmentItemId
      ? await this.assessmentItemRepository.findById(r.assessmentItemId)
      : null
    assertScoreInRange(input.score, assessmentItem?.maxScore)

    return this.studentScoreRepository.update(id, {
      score: input.score,
      note: input.note,
    })
  }
}
