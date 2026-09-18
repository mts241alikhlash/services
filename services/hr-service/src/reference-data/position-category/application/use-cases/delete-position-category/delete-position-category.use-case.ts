import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { PositionCategoryEntity } from '../../../domain/entities/position-category.entity.js'
import { IPositionCategoryRepository } from '../../../domain/repositories/position-category.repository.js'

@Injectable()
export class DeletePositionCategoryUseCase {
  private readonly logger = new Logger(DeletePositionCategoryUseCase.name)

  constructor(
    private readonly positionCategoryRepository: IPositionCategoryRepository,
  ) {}

  async execute(id: string): Promise<PositionCategoryEntity> {
    const existing = await this.positionCategoryRepository.findById(id)
    if (!existing) {
      throw new NotFoundException(`Position category with ID ${id} not found`)
    }

    const inUseCount =
      await this.positionCategoryRepository.countPositionsWithCategory(id)
    if (inUseCount > 0) {
      throw new ConflictException(
        `Position category is in use by ${inUseCount} positions and cannot be deleted`,
      )
    }

    const deleted = await this.positionCategoryRepository.remove(id)
    this.logger.log(`Position category deleted: ${id}`)
    return deleted
  }
}
