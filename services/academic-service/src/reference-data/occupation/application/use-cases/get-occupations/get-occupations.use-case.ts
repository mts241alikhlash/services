import { Injectable } from '@nestjs/common'
import { IOccupationRepository } from '../../../domain/repositories/occupation.repository.js'
import { OccupationWithCount } from '../../../domain/entities/occupation.entity.js'
import { PaginatedResponse } from '../../../../../shared/domain/interfaces/repository.interface.js'
import type { ListOccupationsInput } from './get-occupations.input.js'

@Injectable()
export class GetOccupationsUseCase {
  constructor(private readonly occupationRepository: IOccupationRepository) {}

  async execute(
    input: ListOccupationsInput,
  ): Promise<PaginatedResponse<OccupationWithCount>> {
    const { data, total, page, limit } =
      await this.occupationRepository.findAll({
        page: input.page,
        limit: input.limit,
        search: input.search,
        isActive: input.isActive,
      })
    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }
}
