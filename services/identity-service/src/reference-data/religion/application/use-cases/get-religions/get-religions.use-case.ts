import { Injectable } from '@nestjs/common'
import { IReligionRepository } from '../../../domain/repositories/religion.repository.js'
import { ReligionEntity } from '../../../domain/entities/religion.entity.js'
import { PaginatedResponse } from '../../../../../shared/domain/interfaces/repository.interface.js'
import type { ListReligionsInput } from './get-religions.input.js'

@Injectable()
export class GetReligionsUseCase {
  constructor(private readonly repository: IReligionRepository) {}

  async execute(
    input: ListReligionsInput,
  ): Promise<PaginatedResponse<ReligionEntity>> {
    const { data, total, page, limit } = await this.repository.findAll({
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
