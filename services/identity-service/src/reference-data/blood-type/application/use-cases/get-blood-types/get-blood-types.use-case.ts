import { Injectable } from '@nestjs/common'
import { IBloodTypeRepository } from '../../../domain/repositories/blood-type.repository.js'
import { BloodTypeEntity } from '../../../domain/entities/blood-type.entity.js'
import { PaginatedResponse } from '../../../../../shared/domain/interfaces/repository.interface.js'
import type { ListBloodTypesInput } from './get-blood-types.input.js'

@Injectable()
export class GetBloodTypesUseCase {
  constructor(private readonly repository: IBloodTypeRepository) {}

  async execute(
    input: ListBloodTypesInput,
  ): Promise<PaginatedResponse<BloodTypeEntity>> {
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
