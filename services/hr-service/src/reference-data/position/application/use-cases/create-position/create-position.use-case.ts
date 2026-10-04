import { ConflictException, Injectable, Logger } from '@nestjs/common'
import { PositionWithCategory } from '../../../domain/entities/position.entity.js'
import { IPositionRepository } from '../../../domain/repositories/position.repository.js'
import type { CreatePositionInput } from './create-position.input.js'

@Injectable()
export class CreatePositionUseCase {
  private readonly logger = new Logger(CreatePositionUseCase.name)

  constructor(private readonly positionRepository: IPositionRepository) {}

  async execute(input: CreatePositionInput): Promise<PositionWithCategory> {
    const existing = await this.positionRepository.findByName(input.name)
    if (existing) {
      throw new ConflictException(
        `Position name "${input.name}" is already taken`,
      )
    }

    const position = await this.positionRepository.create({
      name: input.name,
      categoryId: input.categoryId,
      isActive: input.isActive,
    })
    this.logger.log(`Position created: ${position.name}`)
    return position
  }
}
