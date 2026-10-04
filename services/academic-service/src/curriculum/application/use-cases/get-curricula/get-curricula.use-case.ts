import { Injectable } from '@nestjs/common'
import { ICurriculumRepository } from '../../../domain/repositories/curriculum.repository.js'
import type { GetCurriculaInput } from './get-curricula.input.js'

@Injectable()
export class GetCurriculaUseCase {
  constructor(private readonly curriculumRepository: ICurriculumRepository) {}

  async execute(input: GetCurriculaInput) {
    const { data, total, page, limit } =
      await this.curriculumRepository.findAll({
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
