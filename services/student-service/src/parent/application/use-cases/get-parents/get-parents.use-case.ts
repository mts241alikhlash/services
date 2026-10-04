import { Injectable } from '@nestjs/common'
import { ParentListWithDetails } from '../../../domain/entities/parent.entity.js'
import { IParentRepository } from '../../../domain/repositories/parent.repository.js'
import { PaginatedResponse } from '../../../../shared/domain/interfaces/repository.interface.js'
import type { ListParentsInput } from './get-parents.input.js'

@Injectable()
export class GetParentsUseCase {
  constructor(private readonly parentRepository: IParentRepository) {}

  async execute(
    input: ListParentsInput,
  ): Promise<PaginatedResponse<ParentListWithDetails>> {
    const { data, total, page, limit } = await this.parentRepository.findAll({
      page: input.page,
      limit: input.limit,
      search: input.search,
      occupationId: input.occupationId,
    })
    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }
}
