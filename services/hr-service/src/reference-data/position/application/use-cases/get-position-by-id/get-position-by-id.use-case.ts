import { Injectable, NotFoundException } from '@nestjs/common'
import { PositionWithCategory } from '../../../domain/entities/position.entity.js'
import { IPositionRepository } from '../../../domain/repositories/position.repository.js'

@Injectable()
export class GetPositionByIdUseCase {
  constructor(private readonly positionRepository: IPositionRepository) {}

  async execute(id: string): Promise<PositionWithCategory> {
    const position = await this.positionRepository.findById(id)
    if (!position) {
      throw new NotFoundException(`Position with ID ${id} not found`)
    }
    return position
  }
}
