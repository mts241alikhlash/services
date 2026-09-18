import { ConflictException, Injectable, Logger } from '@nestjs/common'
import { PositionCategoryEntity } from '../../../domain/entities/position-category.entity.js'
import { IPositionCategoryRepository } from '../../../domain/repositories/position-category.repository.js'
import type { CreatePositionCategoryInput } from './create-position-category.input.js'

@Injectable()
export class CreatePositionCategoryUseCase {
  private readonly logger = new Logger(CreatePositionCategoryUseCase.name)

  constructor(
    private readonly positionCategoryRepository: IPositionCategoryRepository,
  ) {}

  async execute(
    input: CreatePositionCategoryInput,
  ): Promise<PositionCategoryEntity> {
    const existing = await this.positionCategoryRepository.findByCode(
      input.code,
    )
    if (existing) {
      throw new ConflictException(
        `Position category code "${input.code}" already exists`,
      )
    }

    const category = await this.positionCategoryRepository.create({
      code: input.code,
      name: input.name,
    })
    this.logger.log(`Position category created: ${category.code}`)
    return category
  }
}
