import { Injectable, NotFoundException } from '@nestjs/common'
import { IAssessmentItemRepository } from '../../../domain/repositories/assessment-item.repository.js'
import { IStudentScoreRepository } from '../../../domain/repositories/student-score.repository.js'

@Injectable()
export class GetStudentScoreRosterUseCase {
  constructor(
    private readonly studentScoreRepository: IStudentScoreRepository,
    private readonly assessmentItemRepository: IAssessmentItemRepository,
  ) {}
  async execute(assessmentItemId: string) {
    const assessmentItem =
      await this.assessmentItemRepository.findById(assessmentItemId)
    if (!assessmentItem) {
      throw new NotFoundException(
        `AssessmentItem ${assessmentItemId} not found`,
      )
    }

    const items = await this.studentScoreRepository.getRoster(
      assessmentItem.id,
      assessmentItem.teachingAssignment?.classroomId,
      assessmentItem.teachingAssignment?.semesterId,
    )

    return {
      assessmentItem: {
        id: assessmentItem.id,
        name: assessmentItem.name,
        type: assessmentItem.type,
        weight: assessmentItem.weight,
        maxScore: assessmentItem.maxScore,
      },
      items,
    }
  }
}
