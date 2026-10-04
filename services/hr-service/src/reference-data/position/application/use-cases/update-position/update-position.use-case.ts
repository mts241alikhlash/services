import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { PositionWithCategory } from '../../../domain/entities/position.entity.js'
import { IPositionRepository } from '../../../domain/repositories/position.repository.js'
import type { UpdatePositionInput } from './update-position.input.js'

@Injectable()
export class UpdatePositionUseCase {
  private readonly logger = new Logger(UpdatePositionUseCase.name)

  constructor(private readonly positionRepository: IPositionRepository) {}

  async execute(
    id: string,
    input: UpdatePositionInput,
  ): Promise<PositionWithCategory> {
    const existing = await this.positionRepository.findById(id)
    if (!existing) {
      throw new NotFoundException(`Position with ID ${id} not found`)
    }

    if (input.name) {
      const duplicate = await this.positionRepository.findByName(input.name, id)
      if (duplicate) {
        throw new ConflictException(
          `Position name "${input.name}" is already taken`,
        )
      }
    }

    const position = await this.positionRepository.update(id, {
      name: input.name,
      categoryId: input.categoryId,
      isActive: input.isActive,
    })
    this.logger.log(`Position updated: ${id}`)
    return position
  }
}
