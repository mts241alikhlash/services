import { Injectable, NotFoundException } from '@nestjs/common'
import { AssessmentType } from '../../../../shared/domain/enums/assessment-type.enum.js'
import { IAcademicLookupPort } from '../../../../platform/academic-lookup/academic-lookup.port.js'
import {
  AssessmentWeightEntity,
  IAssessmentWeightRepository,
} from '../../../domain/repositories/assessment-weight.repository.js'

@Injectable()
export class GetAssessmentWeightsUseCase {
  constructor(
    private readonly assessmentWeightRepository: IAssessmentWeightRepository,
    private readonly academicLookup: IAcademicLookupPort,
  ) {}

  async execute(
    teachingAssignmentId: string,
  ): Promise<AssessmentWeightEntity[]> {
    const assignment =
      await this.academicLookup.teachingAssignmentExists(teachingAssignmentId)
    if (!assignment) {
      throw new NotFoundException(
        `Teaching assignment with ID ${teachingAssignmentId} not found`,
      )
    }

    const stored =
      await this.assessmentWeightRepository.findByTeachingAssignment(
        teachingAssignmentId,
      )
    const byType = new Map(stored.map((row) => [row.type, row.weight]))

    return Object.values(AssessmentType).map((type) => ({
      type,
      weight: byType.get(type) ?? 0,
    }))
  }
}
