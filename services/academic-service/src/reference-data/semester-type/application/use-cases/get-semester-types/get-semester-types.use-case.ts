import { Injectable } from '@nestjs/common'
import {
  ISemesterTypeRepository,
  SemesterType,
} from '../../../domain/repositories/semester-type.repository.js'
import { PaginatedResponse } from '../../../../../shared/domain/interfaces/repository.interface.js'
import type { ListSemesterTypesInput } from './get-semester-types.input.js'

@Injectable()
export class GetSemesterTypesUseCase {
  constructor(
    private readonly semesterTypeRepository: ISemesterTypeRepository,
  ) {}

  async execute(
    input: ListSemesterTypesInput,
  ): Promise<PaginatedResponse<SemesterType>> {
    const { data, total, page, limit } =
      await this.semesterTypeRepository.findAll({
        page: input.page,
        limit: input.limit,
        search: input.search,
        isActive: input.isActive,
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
