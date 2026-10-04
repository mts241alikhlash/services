import { Injectable } from '@nestjs/common'
import { SemesterWithDetails } from '../../../domain/entities/semester.entity.js'
import { ISemesterRepository } from '../../../domain/repositories/semester.repository.js'
import { PaginatedResponse } from '../../../../shared/domain/interfaces/repository.interface.js'
import type { ListSemestersInput } from './get-semesters.input.js'

@Injectable()
export class GetSemestersUseCase {
  constructor(private readonly semesterRepository: ISemesterRepository) {}

  async execute(
    input: ListSemestersInput,
  ): Promise<PaginatedResponse<SemesterWithDetails>> {
    const { data, total, page, limit } = await this.semesterRepository.findAll({
      page: input.page,
      limit: input.limit,
      search: input.search,
      academicYearId: input.academicYearId,
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
