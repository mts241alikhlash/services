import { BadRequestException, Injectable } from '@nestjs/common'
import { IAssessmentItemRepository } from '../../../domain/repositories/assessment-item.repository.js'
import { IEnrollmentLookupPort } from '../../../../platform/enrollment-lookup/enrollment-lookup.port.js'
import { IStudentScoreRepository } from '../../../domain/repositories/student-score.repository.js'
import { assertScoreInRange } from '../../../domain/policies/assert-score-in-range.policy.js'
import type { BulkUpsertStudentScoresInput } from './bulk-upsert-student-scores.input.js'

@Injectable()
export class BulkUpsertStudentScoresUseCase {
  constructor(
    private readonly studentScoreRepository: IStudentScoreRepository,
    private readonly assessmentItemRepository: IAssessmentItemRepository,
    private readonly enrollmentLookup: IEnrollmentLookupPort,
  ) {}

  async execute(
    input: BulkUpsertStudentScoresInput,
    correctedById: string | null = null,
  ) {
    const assessmentItem = await this.assessmentItemRepository.findById(
      input.assessmentItemId,
    )
    if (!assessmentItem) {
      throw new BadRequestException('Assessment item not found')
    }

    const enrollmentIds = Array.from(
      new Set(input.records.map((r) => r.enrollmentId)),
    )
    const enrollments = await this.enrollmentLookup.listByIds(enrollmentIds)

    if (enrollments.length !== enrollmentIds.length) {
      throw new BadRequestException(
        'Some enrollments were not found or are not active',
      )
    }

    const teachingAssignment = assessmentItem.teachingAssignment
    if (!teachingAssignment) {
      throw new BadRequestException(
        'Teaching assignment for this assessment item could not be resolved',
      )
    }

    const targetClassroomId = teachingAssignment.classroomId
    const invalidClassroom = enrollments.some(
      (e) => e.classroomId !== targetClassroomId,
    )
    if (invalidClassroom) {
      throw new BadRequestException(
        'Some enrollments do not belong to the assessment item classroom',
      )
    }

    for (const record of input.records) {
      assertScoreInRange(record.score, assessmentItem.maxScore)
    }

    return this.studentScoreRepository.bulkUpsert(
      input.assessmentItemId,
      input.records,
      correctedById,
    )
  }
}
