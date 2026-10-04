import { Injectable, NotFoundException } from '@nestjs/common'
import { PositionCategoryEntity } from '../../../domain/entities/position-category.entity.js'
import { IPositionCategoryRepository } from '../../../domain/repositories/position-category.repository.js'

@Injectable()
export class GetPositionCategoryByIdUseCase {
  constructor(
    private readonly positionCategoryRepository: IPositionCategoryRepository,
  ) {}

  async execute(id: string): Promise<PositionCategoryEntity> {
    const category = await this.positionCategoryRepository.findById(id)
    if (!category) {
      throw new NotFoundException(`Position category with ID ${id} not found`)
    }
    return category
  }
}
