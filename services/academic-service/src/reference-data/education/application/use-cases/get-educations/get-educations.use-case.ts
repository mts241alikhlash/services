import { Injectable } from '@nestjs/common'
import { IEducationRepository } from '../../../domain/repositories/education.repository.js'
import { EducationEntity } from '../../../domain/entities/education.entity.js'
import { PaginatedResponse } from '../../../../../shared/domain/interfaces/repository.interface.js'
import type { ListEducationsInput } from './get-educations.input.js'

@Injectable()
export class GetEducationsUseCase {
  constructor(private readonly educationRepository: IEducationRepository) {}

  async execute(
    input: ListEducationsInput,
  ): Promise<PaginatedResponse<EducationEntity>> {
    const { data, total, page, limit } = await this.educationRepository.findAll(
      {
        page: input.page,
        limit: input.limit,
        search: input.search,
        isActive: input.isActive,
      },
    )
    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }
}
