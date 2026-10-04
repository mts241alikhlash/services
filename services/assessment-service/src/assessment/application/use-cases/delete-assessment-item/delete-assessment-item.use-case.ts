import { Injectable, NotFoundException } from '@nestjs/common'
import { AssessmentItemEntity } from '../../../domain/entities/assessment-item.entity.js'
import { IAssessmentItemRepository } from '../../../domain/repositories/assessment-item.repository.js'

@Injectable()
export class DeleteAssessmentItemUseCase {
  constructor(
    private readonly assessmentItemRepository: IAssessmentItemRepository,
  ) {}

  async execute(id: string): Promise<AssessmentItemEntity> {
    const item = await this.assessmentItemRepository.findById(id)
    if (!item) {
      throw new NotFoundException('Assessment item not found')
    }
    return this.assessmentItemRepository.remove(id)
  }
}
