import { Injectable } from '@nestjs/common'
import {
  AssessmentItemWithDetails,
  IAssessmentItemRepository,
} from '../../../domain/repositories/assessment-item.repository.js'
import { PaginatedResult } from '../../../../shared/domain/interfaces/repository.interface.js'
import type { GetAssessmentItemsInput } from './get-assessment-items.input.js'

@Injectable()
export class GetAssessmentItemsUseCase {
  constructor(
    private readonly assessmentItemRepository: IAssessmentItemRepository,
  ) {}

  async execute(
    input: GetAssessmentItemsInput,
  ): Promise<PaginatedResult<AssessmentItemWithDetails>> {
    return this.assessmentItemRepository.findAll({
      page: input.page,
      limit: input.limit,
      type: input.type,
      teachingAssignmentId: input.teachingAssignmentId,
    })
  }
}
