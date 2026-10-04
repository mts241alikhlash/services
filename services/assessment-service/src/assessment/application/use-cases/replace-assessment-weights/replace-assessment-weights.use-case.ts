import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { IAcademicLookupPort } from '../../../../platform/academic-lookup/academic-lookup.port.js'
import { ASSESSMENT_WEIGHT_TOTAL } from '../../../constants/assessment.constants.js'
import {
  AssessmentWeightEntity,
  IAssessmentWeightRepository,
} from '../../../domain/repositories/assessment-weight.repository.js'
import type { ReplaceAssessmentWeightsInput } from './replace-assessment-weights.input.js'

@Injectable()
export class ReplaceAssessmentWeightsUseCase {
  constructor(
    private readonly assessmentWeightRepository: IAssessmentWeightRepository,
    private readonly academicLookup: IAcademicLookupPort,
  ) {}

  async execute(
    input: ReplaceAssessmentWeightsInput,
  ): Promise<AssessmentWeightEntity[]> {
    const assignment = await this.academicLookup.teachingAssignmentExists(
      input.teachingAssignmentId,
    )
    if (!assignment) {
      throw new NotFoundException(
        `Teaching assignment with ID ${input.teachingAssignmentId} not found`,
      )
    }

    const seen = new Set<string>()
    for (const record of input.weights) {
      if (seen.has(record.type)) {
        throw new BadRequestException(
          `Assessment type ${record.type} is listed more than once`,
        )
      }
      seen.add(record.type)
    }

    const total = input.weights.reduce((sum, record) => sum + record.weight, 0)
    if (Math.round(total * 100) / 100 !== ASSESSMENT_WEIGHT_TOTAL) {
      throw new BadRequestException(
        `Assessment weights must total ${ASSESSMENT_WEIGHT_TOTAL}, received ${total}`,
      )
    }

    return this.assessmentWeightRepository.replaceForTeachingAssignment({
      teachingAssignmentId: input.teachingAssignmentId,
      weights: input.weights.filter((record) => record.weight > 0),
    })
  }
}
