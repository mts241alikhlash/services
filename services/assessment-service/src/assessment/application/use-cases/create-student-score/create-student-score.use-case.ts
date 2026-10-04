import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common'
import { IAssessmentItemRepository } from '../../../domain/repositories/assessment-item.repository.js'
import { IEnrollmentLookupPort } from '../../../../platform/enrollment-lookup/enrollment-lookup.port.js'
import { IStudentScoreRepository } from '../../../domain/repositories/student-score.repository.js'
import { assertScoreInRange } from '../../../domain/policies/assert-score-in-range.policy.js'
import type { CreateStudentScoreInput } from './create-student-score.input.js'

@Injectable()
export class CreateStudentScoreUseCase {
  constructor(
    private readonly studentScoreRepository: IStudentScoreRepository,
    private readonly assessmentItemRepository: IAssessmentItemRepository,
    private readonly enrollmentLookup: IEnrollmentLookupPort,
  ) {}
  async execute(input: CreateStudentScoreInput) {
    const assessmentItem = await this.assessmentItemRepository.findById(
      input.assessmentItemId,
    )
    if (!assessmentItem) {
      throw new BadRequestException('Assessment item not found')
    }

    assertScoreInRange(input.score, assessmentItem.maxScore)

    const enrollment = await this.enrollmentLookup.findSummary(
      input.enrollmentId,
    )
    if (enrollment?.status !== 'ACTIVE') {
      throw new BadRequestException('Enrollment not found or is not active')
    }

    const teachingAssignment = assessmentItem.teachingAssignment
    if (!teachingAssignment) {
      throw new BadRequestException(
        'Teaching assignment for this assessment item could not be resolved',
      )
    }

    if (enrollment.classroomId !== teachingAssignment.classroomId) {
      throw new BadRequestException(
        'Student enrollment classroom does not match assessment item classroom',
      )
    }

    const dup = await this.studentScoreRepository.findDuplicate(
      input.enrollmentId,
      input.assessmentItemId,
    )
    if (dup)
      throw new ConflictException(
        'Score already exists for this enrollment and assessment',
      )

    const softDeleted = await this.studentScoreRepository.findSoftDeleted(
      input.enrollmentId,
      input.assessmentItemId,
    )
    if (softDeleted) {
      return this.studentScoreRepository.restore(softDeleted.id, {
        score: input.score,
        note: input.note,
      })
    }

    return this.studentScoreRepository.create({
      enrollmentId: input.enrollmentId,
      assessmentItemId: input.assessmentItemId,
      score: input.score,
      note: input.note,
    })
  }
}
