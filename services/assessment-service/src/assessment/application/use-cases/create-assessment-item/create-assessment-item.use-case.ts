import { BadRequestException, Injectable } from '@nestjs/common'
import {
  AssessmentItemWithDetails,
  IAssessmentItemRepository,
} from '../../../domain/repositories/assessment-item.repository.js'
import { IAcademicLookupPort } from '../../../../platform/academic-lookup/academic-lookup.port.js'
import type { CreateAssessmentItemInput } from './create-assessment-item.input.js'

@Injectable()
export class CreateAssessmentItemUseCase {
  constructor(
    private readonly assessmentItemRepository: IAssessmentItemRepository,
    private readonly academicLookup: IAcademicLookupPort,
  ) {}

  async execute(
    input: CreateAssessmentItemInput,
  ): Promise<AssessmentItemWithDetails> {
    const exists = await this.academicLookup.teachingAssignmentExists(
      input.teachingAssignmentId,
    )
    if (!exists) {
      throw new BadRequestException('Teaching assignment not found')
    }
    return this.assessmentItemRepository.create({
      teachingAssignmentId: input.teachingAssignmentId,
      name: input.name,
      type: input.type,
      weight: input.weight,
      maxScore: input.maxScore,
    })
  }
}
