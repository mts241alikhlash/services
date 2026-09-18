import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { PositionCategoryEntity } from '../../../domain/entities/position-category.entity.js'
import { IPositionCategoryRepository } from '../../../domain/repositories/position-category.repository.js'
import type { UpdatePositionCategoryInput } from './update-position-category.input.js'

@Injectable()
export class UpdatePositionCategoryUseCase {
  private readonly logger = new Logger(UpdatePositionCategoryUseCase.name)

  constructor(
    private readonly positionCategoryRepository: IPositionCategoryRepository,
  ) {}

  async execute(
    id: string,
    input: UpdatePositionCategoryInput,
  ): Promise<PositionCategoryEntity> {
    const existing = await this.positionCategoryRepository.findById(id)
    if (!existing) {
      throw new NotFoundException(`Position category with ID ${id} not found`)
    }

    const category = await this.positionCategoryRepository.update(id, {
      name: input.name,
    })
    this.logger.log(`Position category updated: ${id}`)
    return category
  }
}
