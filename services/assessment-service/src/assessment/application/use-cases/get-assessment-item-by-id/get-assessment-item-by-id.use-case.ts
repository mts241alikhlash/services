import { Injectable, NotFoundException } from '@nestjs/common'
import {
  AssessmentItemWithDetails,
  IAssessmentItemRepository,
} from '../../../domain/repositories/assessment-item.repository.js'

@Injectable()
export class GetAssessmentItemByIdUseCase {
  constructor(
    private readonly assessmentItemRepository: IAssessmentItemRepository,
  ) {}

  async execute(id: string): Promise<AssessmentItemWithDetails> {
    const item = await this.assessmentItemRepository.findById(id)
    if (!item) {
      throw new NotFoundException('Assessment item not found')
    }
    return item
  }
}
