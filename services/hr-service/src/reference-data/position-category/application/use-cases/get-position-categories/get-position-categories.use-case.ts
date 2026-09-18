import { Injectable } from '@nestjs/common'
import { PositionCategoryEntity } from '../../../domain/entities/position-category.entity.js'
import { IPositionCategoryRepository } from '../../../domain/repositories/position-category.repository.js'
import { PaginatedResponse } from '../../../../../shared/domain/interfaces/repository.interface.js'
import type { ListPositionCategoriesInput } from './get-position-categories.input.js'

@Injectable()
export class GetPositionCategoriesUseCase {
  constructor(
    private readonly positionCategoryRepository: IPositionCategoryRepository,
  ) {}

  async execute(
    input: ListPositionCategoriesInput,
  ): Promise<PaginatedResponse<PositionCategoryEntity>> {
    const { data, total, page, limit } =
      await this.positionCategoryRepository.findAll({
        page: input.page,
        limit: input.limit,
        search: input.search,
      })
    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }
}
