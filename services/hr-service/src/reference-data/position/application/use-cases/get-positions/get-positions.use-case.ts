import { Injectable } from '@nestjs/common'
import { PositionWithCategory } from '../../../domain/entities/position.entity.js'
import { IPositionRepository } from '../../../domain/repositories/position.repository.js'
import { PaginatedResponse } from '../../../../../shared/domain/interfaces/repository.interface.js'
import type { ListPositionsInput } from './get-positions.input.js'

@Injectable()
export class GetPositionsUseCase {
  constructor(private readonly positionRepository: IPositionRepository) {}

  async execute(
    input: ListPositionsInput,
  ): Promise<PaginatedResponse<PositionWithCategory>> {
    const { data, total, page, limit } = await this.positionRepository.findAll({
      page: input.page,
      limit: input.limit,
      search: input.search,
      categoryId: input.categoryId,
      isActive: input.isActive,
    })
    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }
}
