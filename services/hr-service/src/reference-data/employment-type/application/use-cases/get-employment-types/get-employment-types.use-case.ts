import { Injectable } from '@nestjs/common'
import { EmploymentTypeEntity } from '../../../domain/entities/employment-type.entity.js'
import { IEmploymentTypeRepository } from '../../../domain/repositories/employment-type.repository.js'
import { PaginatedResponse } from '../../../../../shared/domain/interfaces/repository.interface.js'
import type { ListEmploymentTypesInput } from './get-employment-types.input.js'

@Injectable()
export class GetEmploymentTypesUseCase {
  constructor(
    private readonly employmentTypeRepository: IEmploymentTypeRepository,
  ) {}

  async execute(
    input: ListEmploymentTypesInput,
  ): Promise<PaginatedResponse<EmploymentTypeEntity>> {
    const { data, total, page, limit } =
      await this.employmentTypeRepository.findAll({
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
