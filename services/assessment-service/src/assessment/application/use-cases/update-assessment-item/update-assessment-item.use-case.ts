import { Injectable, NotFoundException } from '@nestjs/common'
import {
  AssessmentItemWithDetails,
  IAssessmentItemRepository,
} from '../../../domain/repositories/assessment-item.repository.js'
import type { UpdateAssessmentItemInput } from './update-assessment-item.input.js'

@Injectable()
export class UpdateAssessmentItemUseCase {
  constructor(
    private readonly assessmentItemRepository: IAssessmentItemRepository,
  ) {}

  async execute(
    id: string,
    input: UpdateAssessmentItemInput,
  ): Promise<AssessmentItemWithDetails> {
    const item = await this.assessmentItemRepository.findById(id)
    if (!item) {
      throw new NotFoundException('Assessment item not found')
    }

    return this.assessmentItemRepository.update(id, {
      name: input.name,
      type: input.type,
      weight: input.weight,
      maxScore: input.maxScore,
    })
  }
}
